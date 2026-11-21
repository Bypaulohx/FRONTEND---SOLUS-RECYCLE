"""AvailabilityController — agenda semanal de disponibilidade da empresa."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import AccountContext, get_current_account
from ..database import get_db
from ..models import Company, Disponibilidade, HorarioSlot
from ..schemas import DisponibilidadeDTO, MessageResponse
from ..utils import error_response

router = APIRouter(tags=["disponibilidade"])


@router.post("/api/empresa/disponibilidade")
def salvar_disponibilidade(
    body: list[DisponibilidadeDTO],
    ctx: AccountContext = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    company = db.query(Company).filter(Company.email == ctx.email).first()
    if company is None:
        return error_response(
            404, "404 NOT_FOUND", "Companhia associada ao e-mail logado não encontrada."
        )

    db.query(HorarioSlot).filter(
        HorarioSlot.disponibilidade_id.in_(
            db.query(Disponibilidade.id).filter(Disponibilidade.company_id == company.id)
        )
    ).delete(synchronize_session=False)
    db.query(Disponibilidade).filter(
        Disponibilidade.company_id == company.id
    ).delete(synchronize_session=False)

    for item in body:
        disponibilidade = Disponibilidade(
            dia_semana=item.dia_semana, company_id=company.id
        )
        for horario in item.horarios:
            disponibilidade.horarios.append(
                HorarioSlot(
                    horario_inicio=horario.inicio,
                    horario_fim=horario.fim,
                )
            )
        db.add(disponibilidade)
    db.commit()
    return MessageResponse(
        message="Agenda de horários atualizada com sucesso!"
    ).model_dump(by_alias=True)


@router.get("/api/empresa/disponibilidade/{company_id}")
def buscar_disponibilidade(company_id: int, db: Session = Depends(get_db)):
    itens = (
        db.query(Disponibilidade)
        .filter(Disponibilidade.company_id == company_id)
        .all()
    )
    return [
        DisponibilidadeDTO(
            id=item.id,
            dia_semana=item.dia_semana,
            horarios=[
                {"inicio": slot.horario_inicio, "fim": slot.horario_fim}
                for slot in item.horarios
            ],
        ).model_dump(by_alias=True)
        for item in itens
    ]
