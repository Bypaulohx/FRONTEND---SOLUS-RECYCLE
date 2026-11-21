"""Consulta de feriados nacionais na BrasilAPI (sem chave)."""

from __future__ import annotations

import json
from datetime import datetime
from urllib.error import URLError
from urllib.request import Request, urlopen

from fastapi import APIRouter

from ..utils import error_response

router = APIRouter(tags=["feriados"])


@router.get("/api/feriados")
def listar_feriados(ano: int | None = None):
    ano = ano or datetime.now().year
    try:
        requisicao = Request(
            f"https://brasilapi.com.br/api/feriados/v1/{ano}",
            headers={"Accept": "application/json", "User-Agent": "Solus-Recycle/1.0"},
        )
        with urlopen(requisicao, timeout=8) as resposta:
            dados = json.load(resposta)
    except (URLError, TimeoutError, ValueError):
        return error_response(
            503, "503 SERVICE_UNAVAILABLE", "Não foi possível consultar os feriados agora."
        )
    return [
        {
            "data": item.get("date"),
            "motivo": item.get("name") or item.get("nome") or "Feriado",
            "tipo": "nacional",
        }
        for item in dados
        if item.get("date")
    ]
