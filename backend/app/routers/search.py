"""SearchController — busca textual por empresas e pontos de coleta."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Company, PontoColeta

router = APIRouter(tags=["search"])


@router.get("/api/search")
def search(q: str | None = None, db: Session = Depends(get_db)):
    if not q or not q.strip():
        return Response(status_code=400)
    term = f"%{q.strip().lower()}%"

    results: list[dict] = []
    for company in db.query(Company).all():
        fields = [
            company.nome_fantasia or "",
            company.razao_social or "",
            company.tipo_residuo or "",
        ]
        if any(term[1:-1] in field.lower() for field in fields):
            endereco = company.endereco
            results.append(
                {
                    "id": company.id,
                    "nome": company.nome_fantasia or company.razao_social,
                    "tipo": "EMPRESA",
                    "tipoResiduo": company.tipo_residuo,
                    "latitude": endereco.latitude if endereco else None,
                    "longitude": endereco.longitude if endereco else None,
                    "telefone": company.telefone,
                }
            )

    for ponto in db.query(PontoColeta).all():
        fields = [ponto.nome or "", ponto.tipo_residuo or ""]
        if any(term[1:-1] in field.lower() for field in fields):
            results.append(
                {
                    "id": ponto.id,
                    "nome": ponto.nome,
                    "tipo": "PONTO_COLETA",
                    "tipoResiduo": ponto.tipo_residuo,
                    "latitude": ponto.latitude,
                    "longitude": ponto.longitude,
                    "telefone": None,
                }
            )
    return results
