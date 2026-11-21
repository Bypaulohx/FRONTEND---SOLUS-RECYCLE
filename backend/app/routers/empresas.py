"""CompanyController — listagem resumida de empresas."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Company
from ..schemas import CompanySummaryDTO

router = APIRouter(tags=["empresas"])


@router.get("/api/empresas")
def listar_empresas(db: Session = Depends(get_db)):
    companies = db.query(Company).all()
    return [
        CompanySummaryDTO(
            id=company.id,
            nome_fantasia=company.nome_fantasia,
            razao_social=company.razao_social,
            tipo_residuo=company.tipo_residuo,
            cep=company.endereco.cep if company.endereco else None,
            profile_picture=company.profile_picture,
        ).model_dump(by_alias=True)
        for company in companies
    ]
