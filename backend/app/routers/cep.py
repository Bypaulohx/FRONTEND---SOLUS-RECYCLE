"""Consulta de CEP para preenchimento automático de endereços (ViaCEP)."""

from __future__ import annotations

from fastapi import APIRouter

from ..schemas import CepDTO
from ..services import geo_service
from ..utils import error_response

router = APIRouter(tags=["cep"])


@router.get("/api/cep/{cep}")
def consultar_cep(cep: str):
    endereco = geo_service.get_address_from_cep(cep)
    if endereco is None:
        return error_response(404, "Not Found", "CEP não encontrado.")
    return CepDTO(**endereco).model_dump(by_alias=True)
