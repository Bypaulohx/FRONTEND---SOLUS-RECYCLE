"""AgendamentoController — agendamentos de coleta e mudanças de status."""

from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends, Response
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from ..auth import AccountContext, get_current_account, require_roles
from ..database import get_db
from ..models import Agendamento, Company, User
from ..schemas import AgendamentoRequest
from ..services import email_service
from ..utils import (
    STATUS_DESCRIPTIONS,
    agendamento_to_dto,
    error_response,
    format_schedule_time,
    parse_schedule_time,
)

router = APIRouter(tags=["agendamentos"])

VALID_STATUSES = set(STATUS_DESCRIPTIONS)


@router.post("/api/agendamentos", status_code=201)
def criar_agendamento(
    body: AgendamentoRequest,
    ctx: AccountContext = Depends(require_roles("USER")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == ctx.email).first()
    if user is None:
        return error_response(403, "403 FORBIDDEN", "Usuário autenticado não encontrado.")

    company = db.query(Company).filter(Company.id == body.company_id).first()
    if company is None:
        return error_response(404, "404 NOT_FOUND", "Empresa selecionada não existe.")

    try:
        schedule_time = parse_schedule_time(body.schedule_time)
    except ValueError as exc:
        return error_response(400, "400 BAD_REQUEST", str(exc))

    inicio = schedule_time - timedelta(minutes=30)
    fim = schedule_time + timedelta(minutes=30)
    conflict = (
        db.query(Agendamento)
        .filter(
            Agendamento.company_id == company.id,
            Agendamento.schedule_time >= inicio,
            Agendamento.schedule_time <= fim,
        )
        .first()
    )
    if conflict is not None:
        return error_response(
            400, "400 BAD_REQUEST", "A empresa já possui um agendamento neste horário."
        )

    agendamento = Agendamento(
        user_id=user.id,
        company_id=company.id,
        tipo_residuo=body.tipo_residuo,
        peso_estimado=body.peso_estimado,
        schedule_time=schedule_time,
        status="PENDENTE",
    )
    db.add(agendamento)
    db.commit()
    db.refresh(agendamento)

    try:
        email_service.send_new_appointment(
            company.email,
            company.nome_fantasia or "",
            user.nome or "",
            format_schedule_time(schedule_time),
            body.tipo_residuo,
            body.peso_estimado,
        )
    except Exception:  # noqa: BLE001
        pass

    return agendamento_to_dto(agendamento).model_dump(by_alias=True)


@router.get("/api/agendamentos/meus-agendamentos")
def meus_agendamentos(
    ctx: AccountContext = Depends(get_current_account), db: Session = Depends(get_db)
):
    if not ctx.email:
        return PlainTextResponse(
            "Usuário não autenticado no sistema.", status_code=401
        )
    user = db.query(User).filter(User.email == ctx.email).first()
    if user is None:
        return []
    items = (
        db.query(Agendamento)
        .filter(Agendamento.user_id == user.id)
        .order_by(Agendamento.schedule_time)
        .all()
    )
    return [agendamento_to_dto(item).model_dump(by_alias=True) for item in items]


@router.get("/api/agendamentos/company/{company_id}")
def agendamentos_da_empresa(
    company_id: int,
    status: str | None = None,
    ctx: AccountContext = Depends(require_roles("COMPANY")),
    db: Session = Depends(get_db),
):
    company = db.query(Company).filter(Company.email == ctx.email).first()
    if company is None:
        return error_response(403, "403 FORBIDDEN", "Acesso negado.")
    if company.id != company_id:
        return error_response(
            403,
            "403 FORBIDDEN",
            "Você não tem permissão para acessar os dados desta empresa.",
        )

    query = db.query(Agendamento).filter(Agendamento.company_id == company_id)
    if status and status.strip():
        status_upper = status.strip().upper()
        if status_upper not in VALID_STATUSES:
            return error_response(400, "400 BAD_REQUEST", "Status inválido.")
        query = query.filter(Agendamento.status == status_upper)
    items = query.order_by(Agendamento.schedule_time).all()
    return [agendamento_to_dto(item).model_dump(by_alias=True) for item in items]


def _atualizar_status(
    agendamento_id: int,
    novo_status: str,
    ctx: AccountContext,
    db: Session,
):
    company = db.query(Company).filter(Company.email == ctx.email).first()
    if company is None:
        return error_response(403, "403 FORBIDDEN", "Acesso negado.")
    agendamento = db.query(Agendamento).filter(Agendamento.id == agendamento_id).first()
    if agendamento is None:
        return error_response(404, "404 NOT_FOUND", "Agendamento não encontrado.")
    if agendamento.company_id != company.id:
        return error_response(403, "403 FORBIDDEN", "Acesso negado.")

    agendamento.status = novo_status
    db.commit()
    db.refresh(agendamento)

    user = db.query(User).filter(User.id == agendamento.user_id).first()
    if user and user.email:
        try:
            email_service.send_appointment_status(
                user.email,
                user.nome or "",
                STATUS_DESCRIPTIONS.get(novo_status, novo_status),
                format_schedule_time(agendamento.schedule_time),
                company.nome_fantasia or "",
            )
        except Exception:  # noqa: BLE001
            pass
    return agendamento_to_dto(agendamento).model_dump(by_alias=True)


@router.put("/api/agendamentos/{agendamento_id}/cancelar")
def cancelar_pelo_usuario(
    agendamento_id: int,
    ctx: AccountContext = Depends(require_roles("USER")),
    db: Session = Depends(get_db),
):
    """Cancela um agendamento iniciado pelo próprio usuário."""
    user = db.query(User).filter(User.email == ctx.email).first()
    if user is None:
        return error_response(403, "403 FORBIDDEN", "Acesso negado.")
    agendamento = db.query(Agendamento).filter(Agendamento.id == agendamento_id).first()
    if agendamento is None:
        return error_response(404, "404 NOT_FOUND", "Agendamento não encontrado.")
    if agendamento.user_id != user.id:
        return error_response(403, "403 FORBIDDEN", "Acesso negado.")
    agendamento.status = "CANCELADO"
    db.commit()
    db.refresh(agendamento)
    return agendamento_to_dto(agendamento).model_dump(by_alias=True)


@router.put("/api/agendamentos/{agendamento_id}/confirmar")
def confirmar(
    agendamento_id: int,
    ctx: AccountContext = Depends(require_roles("COMPANY")),
    db: Session = Depends(get_db),
):
    return _atualizar_status(agendamento_id, "CONFIRMADO", ctx, db)


@router.put("/api/agendamentos/{agendamento_id}/recusar")
def recusar(
    agendamento_id: int,
    ctx: AccountContext = Depends(require_roles("COMPANY")),
    db: Session = Depends(get_db),
):
    return _atualizar_status(agendamento_id, "CANCELADO", ctx, db)


@router.put("/api/agendamentos/{agendamento_id}/concluir")
def concluir(
    agendamento_id: int,
    ctx: AccountContext = Depends(require_roles("COMPANY")),
    db: Session = Depends(get_db),
):
    return _atualizar_status(agendamento_id, "CONCLUIDO", ctx, db)
