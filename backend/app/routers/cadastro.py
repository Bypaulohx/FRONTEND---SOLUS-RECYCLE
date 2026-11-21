"""Cadastro com verificação, reenvio e redefinição de senha.

Porta de CadastroUserController, CadastroCompanyController,
CadastroVerificationController, ResendVerificationController e
PasswordResetController.
"""

from __future__ import annotations

import json
import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import hash_password
from ..config import get_settings
from ..database import get_db
from ..models import (
    Company,
    Endereco,
    HorarioFuncionamentoPonto,
    PasswordResetToken,
    PontoColeta,
    User,
    VerificationCode,
)
from ..services import geo_service
from ..schemas import (
    CompanyRegistration,
    MessageResponse,
    ResetRequest,
    UserRegistration,
    VerificationRequest,
)
from ..services import email_service
from ..utils import error_response

router = APIRouter(tags=["cadastro"])
settings = get_settings()

ACCOUNT_USER = "USER"
ACCOUNT_COMPANY = "COMPANY"


def _generate_code() -> str:
    return str(random.randint(100000, 999999))


def _normalize_document(value: str | None) -> tuple[str | None, str | None]:
    """Aceita CPF (11 dígitos) ou CNPJ (14) em qualquer uma das formas."""
    digits = "".join(ch for ch in (value or "") if ch.isdigit())
    if len(digits) not in (11, 14):
        return None, "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido."
    return digits, None


def _endereco_from_dto(data: dict | None) -> Endereco | None:
    if not data:
        return None
    return Endereco(
        cep=data.get("cep"),
        rua=data.get("rua") or data.get("logradouro"),
        numero=data.get("numero"),
        complemento=data.get("complemento"),
        bairro=data.get("bairro"),
        cidade=data.get("cidade") or data.get("localidade"),
        estado=data.get("estado") or data.get("uf"),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
    )


def _registration_to_json(payload: UserRegistration | CompanyRegistration, hashed: str) -> str:
    data = payload.model_dump(by_alias=True, exclude_none=False)
    data["senha"] = hashed
    data["id"] = None
    data["lastUpdateDate"] = None
    return json.dumps(data, ensure_ascii=False, default=str)


def _start_registration(
    db: Session, payload: UserRegistration | CompanyRegistration, role: str
):
    senha = payload.senha or ""
    if len(senha) < 8:
        return error_response(400, "Bad Request", "A senha deve ter no mínimo 8 dígitos.")

    documento = payload.cpf if role == ACCOUNT_USER else payload.cnpj
    normalized, doc_error = _normalize_document(documento)
    if doc_error:
        return error_response(400, "Bad Request", doc_error)
    if role == ACCOUNT_USER:
        payload.cpf = normalized
    else:
        payload.cnpj = normalized

    email = (payload.email or "").strip()
    exists = (
        db.query(User).filter(User.email == email).first() is not None
        or db.query(Company).filter(Company.email == email).first() is not None
    )
    if exists:
        return error_response(409, "Conflict", "E-mail já cadastrado.")
    if (
        db.query(User).filter(User.cpf == normalized).first() is not None
        or db.query(Company).filter(Company.cnpj == normalized).first() is not None
    ):
        return error_response(409, "Conflict", "CPF/CNPJ já cadastrado.")
    if db.query(VerificationCode).filter(VerificationCode.email == email).first():
        return error_response(
            409,
            "Verification Pending",
            "Verificação de conta já está pendente. Por favor, verifique sua caixa de entrada.",
        )

    hashed = hash_password(senha)
    registration_data = _registration_to_json(payload, hashed)
    code = _generate_code()
    verification = VerificationCode(
        email=email,
        code=code,
        account_type=role,
        registration_data=registration_data,
        expiry_date=datetime.now() + timedelta(minutes=10),
    )
    db.add(verification)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        message = "CPF já cadastrado." if role == ACCOUNT_USER else "CNPJ já cadastrado."
        return error_response(409, "Conflict", message)

    name = (
        payload.nome
        if role == ACCOUNT_USER
        else (payload.nome_fantasia or payload.razao_social)
    )
    try:
        email_service.send_verification_code(email, name or "Cliente", code)
    except Exception:  # noqa: BLE001
        return error_response(
            500, "Email Fail", "Falha ao enviar e-mail de verificação."
        )

    message = (
        "Código de verificação enviado com sucesso para o seu e-mail."
        if role == ACCOUNT_USER
        else "Código de verificação enviado com sucesso para o e-mail cadastrado."
    )
    return JSONResponse(
        status_code=202,
        content=MessageResponse(message=message).model_dump(by_alias=True),
    )


@router.post("/api/usuario")
def cadastrar_usuario(payload: UserRegistration, db: Session = Depends(get_db)):
    return _start_registration(db, payload, ACCOUNT_USER)


@router.post("/api/empresa")
def cadastrar_empresa(payload: CompanyRegistration, db: Session = Depends(get_db)):
    return _start_registration(db, payload, ACCOUNT_COMPANY)


def _criar_ponto_inicial(db: Session, company: Company) -> None:
    """Publica no mapa o ponto de coleta da organização recém-verificada."""
    endereco = company.endereco
    if endereco is None:
        return
    dados_endereco = {
        "rua": endereco.rua,
        "numero": endereco.numero,
        "complemento": endereco.complemento,
        "bairro": endereco.bairro,
        "cidade": endereco.cidade,
        "estado": endereco.estado,
        "cep": endereco.cep,
    }
    latitude, longitude = endereco.latitude, endereco.longitude
    if latitude is None or longitude is None:
        texto = geo_service.format_address(dados_endereco) or (
            f"{endereco.cep or ''}, Brasil".strip()
        )
        coords = geo_service.geocode_address(texto)
        if coords is None:
            return
        latitude, longitude = coords
        endereco.latitude, endereco.longitude = latitude, longitude

    ponto = PontoColeta(
        nome=company.nome_fantasia or company.razao_social or "Ponto de coleta",
        tipo_residuo=company.materiais_coleta or company.tipo_residuo,
        endereco=geo_service.format_address(dados_endereco) or endereco.cep,
        latitude=latitude,
        longitude=longitude,
        company_id=company.id,
    )
    db.add(ponto)
    try:
        db.commit()
    except Exception:  # noqa: BLE001 - o cadastro não pode falhar por causa do mapa
        db.rollback()


@router.post("/api/cadastro/verificar")
def verificar_cadastro(body: dict, db: Session = Depends(get_db)):
    email = (body.get("email") or "").strip()
    code = body.get("code")
    verification = (
        db.query(VerificationCode)
        .filter(VerificationCode.email == email, VerificationCode.code == code)
        .first()
    )
    if verification is None:
        return error_response(
            404, "Not Found", "E-mail ou Código de verificação inválido."
        )
    if verification.is_expired():
        db.delete(verification)
        db.commit()
        return error_response(
            410,
            "Expired",
            "O Código de verificação expirou. Tente se cadastrar novamente.",
        )

    data = json.loads(verification.registration_data or "{}")
    try:
        endereco = _endereco_from_dto(data.get("endereco"))
        if verification.account_type == ACCOUNT_COMPANY:
            materiais = data.get("materiaisColeta") or ""
            if isinstance(materiais, list):
                materiais = ", ".join(str(item) for item in materiais)
            account = Company(
                razao_social=data.get("razaoSocial"),
                nome_fantasia=data.get("nomeFantasia"),
                cnpj=data.get("cnpj"),
                email=data.get("email"),
                senha=data.get("senha"),
                telefone=data.get("telefone"),
                descricao=data.get("descricao"),
                tipo_residuo=materiais or data.get("tipoResiduo"),
                faz_coleta_domicilio=bool(data.get("fazColetaDomicilio")),
                materiais_coleta=materiais or None,
                peso_minimo_kg=data.get("pesoMinimoKg"),
                peso_maximo_kg=data.get("pesoMaximoKg"),
                endereco=endereco,
                profile_picture=data.get("profilePicture"),
            )
            name = data.get("nomeFantasia") or data.get("razaoSocial")
        else:
            account = User(
                nome=data.get("nome"),
                cpf=data.get("cpf"),
                email=data.get("email"),
                senha=data.get("senha"),
                telefone=data.get("telefone"),
                endereco=endereco,
                profile_picture=data.get("profilePicture"),
            )
            name = data.get("nome")
        db.add(account)
        db.delete(verification)
        db.commit()
        if verification.account_type == ACCOUNT_COMPANY:
            _criar_ponto_inicial(db, account)
    except IntegrityError:
        db.rollback()
        db.delete(verification)
        db.commit()
        message = (
            "CPF já cadastrado."
            if verification.account_type == ACCOUNT_USER
            else "CNPJ já cadastrado."
        )
        return error_response(409, "Conflict", message)
    except Exception:  # noqa: BLE001
        db.rollback()
        if verification in db:
            db.delete(verification)
            db.commit()
        return error_response(
            500, "Internal Server Error", "Erro inesperado ao salvar os dados."
        )

    try:
        email_service.send_welcome(account.email, name or "Usuário(a)")
    except Exception:  # noqa: BLE001
        pass
    return JSONResponse(
        status_code=201,
        content=MessageResponse(
            message="Cadastro concluído com sucesso! Bem-vindo(a) ao Solus Recycle!"
        ).model_dump(by_alias=True),
    )


@router.post("/api/cadastro/reenviar")
def reenviar_verificacao(email: str | None = None, db: Session = Depends(get_db)):
    email = (email or "").strip()
    if (
        db.query(User).filter(User.email == email).first() is not None
        or db.query(Company).filter(Company.email == email).first() is not None
    ):
        return error_response(
            400, "Bad Request", "Esta conta já está ativa. Por favor, faça login."
        )
    verification = (
        db.query(VerificationCode).filter(VerificationCode.email == email).first()
    )
    if verification is None:
        return error_response(
            404,
            "Not Found",
            "Não há um cadastro pendente de verificação para este e-mail.",
        )

    code = _generate_code()
    verification.code = code
    verification.expiry_date = datetime.now() + timedelta(minutes=10)
    db.commit()
    name = "Usuário"
    if verification.registration_data:
        try:
            data = json.loads(verification.registration_data)
            name = data.get("nome") or data.get("nomeFantasia") or "Usuário"
        except ValueError:
            pass
    try:
        email_service.send_verification_code(email, name, code)
    except Exception:  # noqa: BLE001
        return error_response(
            500,
            "Email Fail",
            "Falha ao enviar o novo código de verificação. Tente novamente mais tarde.",
        )
    return MessageResponse(
        message="Um novo código de verificação foi enviado para o e-mail cadastrado."
    ).model_dump(by_alias=True)


@router.post("/api/password-reset/initiate")
def initiate_reset(body: ResetRequest, db: Session = Depends(get_db)):
    principal_type = (body.principal_type or "").upper()
    if principal_type not in (ACCOUNT_USER, ACCOUNT_COMPANY):
        return error_response(400, "Bad Request", "Tipo de principal inválido.")

    identifier = (body.identifier or "").strip()
    account = (
        db.query(User).filter(User.email == identifier).first()
        if principal_type == ACCOUNT_USER
        else db.query(Company).filter(Company.email == identifier).first()
    )
    if account is None:
        message = (
            "Usuário não encontrado. Certifique-se de usar seu endereço de e-mail."
            if principal_type == ACCOUNT_USER
            else "Empresa não encontrada. Certifique-se de usar o e-mail de cadastro."
        )
        return error_response(404, "Not Found", message)

    principal_id = str(account.id)
    db.query(PasswordResetToken).filter(
        PasswordResetToken.principal_id == principal_id
    ).delete(synchronize_session=False)
    code = _generate_code()
    token = PasswordResetToken(
        principal_id=principal_id,
        principal_type=principal_type,
        token=code,
        expiry_date=datetime.now() + timedelta(minutes=15),
        delivery_method="email",
        destination=identifier,
    )
    db.add(token)
    db.commit()

    name = (
        account.nome if principal_type == ACCOUNT_USER else account.nome_fantasia
    ) or "Usuário(a)"
    try:
        email_service.send_reset_code(identifier, name, code)
    except Exception as exc:  # noqa: BLE001
        return error_response(
            500,
            "Internal Server Error",
            f"Falha no serviço de e-mail. Verifique a configuração do servidor: {exc}",
        )
    return MessageResponse(
        message="Código de verificação enviado com sucesso para o seu email."
    ).model_dump(by_alias=True)


def _find_reset_token(db: Session, body: VerificationRequest):
    principal_type = (body.principal_type or "").upper()
    return (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token == body.code,
            PasswordResetToken.principal_type == principal_type,
        )
        .first()
    )


@router.post("/api/password-reset/verify-code-only")
def verify_code_only(body: VerificationRequest, db: Session = Depends(get_db)):
    token = _find_reset_token(db, body)
    if token is None:
        return error_response(400, "Bad Request", "Código de verificação inválido ou inexistente.")
    if token.expiry_date and datetime.now() > token.expiry_date:
        db.delete(token)
        db.commit()
        return error_response(
            400,
            "Bad Request",
            "Código de verificação expirado. Por favor, solicite um novo código.",
        )
    return MessageResponse(message="Código de verificação válido.").model_dump(
        by_alias=True
    )


@router.post("/api/password-reset/verify-and-reset")
def verify_and_reset(body: VerificationRequest, db: Session = Depends(get_db)):
    token = _find_reset_token(db, body)
    if token is None:
        return error_response(
            400,
            "Bad Request",
            "Código de verificação inválido ou inexistente para este tipo de conta.",
        )
    if token.expiry_date and datetime.now() > token.expiry_date:
        db.delete(token)
        db.commit()
        return error_response(
            400,
            "Bad Request",
            "Código de verificação expirado. Por favor, solicite um novo código.",
        )

    principal_type = (token.principal_type or "").upper()
    if principal_type == ACCOUNT_USER:
        account = db.query(User).filter(User.id == int(token.principal_id)).first()
        missing = "Usuário não encontrado."
    else:
        account = db.query(Company).filter(Company.id == int(token.principal_id)).first()
        missing = "Empresa não encontrada."
    if account is None:
        return error_response(400, "Bad Request", missing)

    account.senha = hash_password(body.new_password or "")
    db.delete(token)
    db.commit()
    name = (
        account.nome if principal_type == ACCOUNT_USER else account.nome_fantasia
    ) or "Usuário(a)"
    try:
        email_service.send_password_changed(account.email, name)
    except Exception:  # noqa: BLE001
        pass
    return MessageResponse(
        message="Senha redefinida com sucesso. Por favor, faça login com sua nova senha."
    ).model_dump(by_alias=True)
