"""Funções auxiliares compartilhadas pelos routers."""

from __future__ import annotations

from datetime import datetime

from fastapi.responses import JSONResponse
from http import HTTPStatus

from .models import Agendamento
from .schemas import AgendamentoDTO, ErrorResponse


def error_response(status: int, error: str | None, message: str) -> JSONResponse:
    if error is None:
        error = f"{status} {HTTPStatus(status).name}" if status in HTTPStatus.__members__.values() else str(status)
    body = ErrorResponse(status=status, error=error, message=message)
    return JSONResponse(status_code=status, content=body.model_dump(by_alias=True))


def parse_schedule_time(value: str) -> datetime:
    """Converte ``dd/MM/yyyy HH:mm`` (formato do DTO Java) em datetime."""
    value = (value or "").strip()
    try:
        return datetime.strptime(value, "%d/%m/%Y %H:%M")
    except ValueError:
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
        except ValueError:
            raise ValueError("Formato de data inválido. Use dd/MM/yyyy HH:mm.")


def format_schedule_time(value: datetime) -> str:
    return value.strftime("%d/%m/%Y %H:%M")


def agendamento_to_dto(ag: Agendamento) -> AgendamentoDTO:
    status_description = {
        "PENDENTE": "Pendente de Confirmação",
        "CONFIRMADO": "Confirmado",
        "CANCELADO": "Cancelado",
        "CONCLUIDO": "Concluído",
    }
    endereco = ag.user.endereco if ag.user else None
    endereco_texto = None
    if endereco is not None:
        partes = [
            endereco.rua,
            endereco.numero,
            endereco.bairro,
            endereco.cidade,
            endereco.estado,
        ]
        endereco_texto = ", ".join(parte for parte in partes if parte) or None
    return AgendamentoDTO(
        id=ag.id,
        user_name=(ag.user.nome if ag.user else None),
        user_telefone=(ag.user.telefone if ag.user else None),
        user_endereco=endereco_texto,
        tipo_residuo=ag.tipo_residuo,
        company_nome_fantasia=(
            ag.company.nome_fantasia if ag.company else None
        ),
        company_telefone=(ag.company.telefone if ag.company else None),
        schedule_time=ag.schedule_time,
        status=ag.status,
        peso_estimado=ag.peso_estimado,
    )


STATUS_DESCRIPTIONS = {
    "PENDENTE": "Pendente de Confirmação",
    "CONFIRMADO": "Confirmado",
    "CANCELADO": "Cancelado",
    "CONCLUIDO": "Concluído",
}
