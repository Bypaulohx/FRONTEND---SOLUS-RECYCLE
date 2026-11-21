"""ProfileController — alteração de senha, telefone e endereço (bloqueio de 30 dias)."""

from __future__ import annotations

import json
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import AccountContext, hash_password, get_current_account, verify_password
from ..database import get_db
from ..models import Agendamento, Company, Endereco, PontoColeta, User
from ..schemas import CompanyProfileUpdate, EnderecoDTO, MessageResponse, PasswordChangeRequest
from ..services import email_service
from ..utils import error_response

router = APIRouter(tags=["profile"])

RESTRICTION_DAYS = 30


def _find_account(db: Session, email: str) -> User | Company | None:
    account = db.query(User).filter(User.email == email).first()
    if account is not None:
        return account
    return db.query(Company).filter(Company.email == email).first()


def _lock_message(account: User | Company) -> str | None:
    last = account.last_update_date
    if last is None:
        return None
    elapsed_days = (datetime.now() - last).days
    if elapsed_days < RESTRICTION_DAYS:
        missing = RESTRICTION_DAYS - elapsed_days
        return (
            "Alteração bloqueada. Você só pode alterar seus dados a cada 30 dias. "
            f"Faltam {missing} dias."
        )
    return None


def _error(message: str):
    return error_response(400, "Erro", message)


@router.put("/api/profile/password")
def alterar_senha(
    body: PasswordChangeRequest,
    ctx: AccountContext = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    account = _find_account(db, ctx.email)
    if account is None:
        return _error("Conta não encontrada.")
    if not verify_password(body.current_password or "", account.senha):
        return _error("A senha atual fornecida está incorreta.")

    account.senha = hash_password(body.new_password or "")
    account.last_update_date = datetime.now()
    db.commit()

    name = (
        account.nome
        if isinstance(account, User)
        else (account.nome_fantasia or account.razao_social)
    ) or "Usuário(a)"
    try:
        email_service.send_password_changed(account.email, name)
    except Exception:  # noqa: BLE001
        pass
    return MessageResponse(message="Senha alterada com sucesso!").model_dump(
        by_alias=True
    )


@router.put("/api/profile/phone")
def alterar_telefone(
    newPhone: str | None = None,
    ctx: AccountContext = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    account = _find_account(db, ctx.email)
    if account is None:
        return _error("Conta não encontrada.")
    locked = _lock_message(account)
    if locked:
        return _error(locked)

    account.telefone = newPhone
    account.last_update_date = datetime.now()
    db.commit()

    name = (
        account.nome
        if isinstance(account, User)
        else (account.nome_fantasia or account.razao_social)
    ) or "Usuário(a)"
    try:
        email_service.send_phone_changed(account.email, name, newPhone or "")
    except Exception:  # noqa: BLE001
        pass
    return MessageResponse(message="Telefone atualizado com sucesso!").model_dump(
        by_alias=True
    )


@router.put("/api/profile/address")
def alterar_endereco(
    body: EnderecoDTO,
    ctx: AccountContext = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    account = _find_account(db, ctx.email)
    if account is None:
        return _error("Conta não encontrada.")
    locked = _lock_message(account)
    if locked:
        return _error(locked)

    if account.endereco is None:
        account.endereco = Endereco()
    fields = (
        "cep",
        "rua",
        "numero",
        "complemento",
        "bairro",
        "cidade",
        "estado",
        "latitude",
        "longitude",
    )
    for field in fields:
        setattr(account.endereco, field, getattr(body, field))
    account.last_update_date = datetime.now()
    db.commit()
    return MessageResponse(message="Endereço atualizado com sucesso!").model_dump(
        by_alias=True
    )


@router.put("/api/profile/company")
def atualizar_empresa(
    body: CompanyProfileUpdate,
    ctx: AccountContext = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    """Atualiza os dados operacionais da organização autenticada."""
    company = db.query(Company).filter(Company.email == ctx.email).first()
    if company is None:
        return _error("Organização não encontrada.")
    campos = (
        "nome_fantasia",
        "razao_social",
        "descricao",
        "telefone",
        "faz_coleta_domicilio",
        "peso_minimo_kg",
        "peso_maximo_kg",
        "imagem_local",
    )
    for campo in campos:
        valor = getattr(body, campo)
        if valor is not None:
            setattr(company, campo, valor)
    if body.materiais_coleta is not None:
        company.materiais_coleta = ",".join(body.materiais_coleta) or None
    if body.dias_funcionamento is not None:
        company.dias_funcionamento = ",".join(body.dias_funcionamento) or None
    if body.feriados is not None:
        company.feriados = json.dumps(
            [item.model_dump(by_alias=True) for item in body.feriados], ensure_ascii=False
        )
    company.last_update_date = datetime.now()
    db.commit()
    return MessageResponse(message="Dados da organização atualizados.").model_dump(by_alias=True)


@router.delete("/api/profile/account")
def excluir_conta(
    ctx: AccountContext = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    """Remove a conta e seus registros dependentes."""
    account = _find_account(db, ctx.email)
    if account is None:
        return _error("Conta não encontrada.")
    if isinstance(account, User):
        db.query(Agendamento).filter(Agendamento.user_id == account.id).delete(
            synchronize_session=False
        )
    else:
        db.query(Agendamento).filter(Agendamento.company_id == account.id).delete(
            synchronize_session=False
        )
        db.query(PontoColeta).filter(PontoColeta.company_id == account.id).delete(
            synchronize_session=False
        )
    endereco = account.endereco
    db.delete(account)
    if endereco is not None:
        db.delete(endereco)
    db.commit()
    return MessageResponse(message="Conta excluída com sucesso.").model_dump(by_alias=True)
