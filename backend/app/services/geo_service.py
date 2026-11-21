"""Geocodificação por CEP (ViaCEP/CepAberto) e cálculo de distância haversine."""

from __future__ import annotations

import logging
import math

import httpx

from ..config import get_settings

logger = logging.getLogger("solus.geo")
settings = get_settings()

CEPABERTO_URL = "https://www.cepaberto.com/api/v3/cep"
VIACEP_URL = "https://viacep.com.br/ws/{cep}/json/"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


def get_from_cep(cep: str | None) -> tuple[float, float] | None:
    """Retorna (latitude, longitude) ou None, como no GeoService.getFromCEP."""
    if not cep or not settings.cepaberto_token:
        logger.info("CepAberto não configurado; CEP %s não geocodificado", cep)
        return None
    try:
        response = httpx.get(
            CEPABERTO_URL,
            params={"cep": cep},
            headers={"Authorization": f"Token token={settings.cepaberto_token}"},
            timeout=10,
        )
        if response.status_code in (401, 404):
            return None
        response.raise_for_status()
        data = response.json()
        return float(data["latitude"]), float(data["longitude"])
    except Exception as exc:  # noqa: BLE001 - Java engole exceções do CepAberto
        logger.warning("Falha ao consultar CepAberto (%s): %s", cep, exc)
        return None


def get_address_from_cep(cep: str | None) -> dict | None:
    """Busca endereço no ViaCEP e, quando possível, acrescenta coordenadas.

    O ViaCEP é público e não exige token; as coordenadas vêm do CepAberto
    quando configurado ou, em último caso, do Nominatim.
    """
    digits = "".join(ch for ch in (cep or "") if ch.isdigit())
    if len(digits) != 8:
        return None
    try:
        response = httpx.get(VIACEP_URL.format(cep=digits), timeout=8)
        response.raise_for_status()
        data = response.json()
        if data.get("erro"):
            return None
        endereco = {
            "cep": digits,
            "rua": data.get("logradouro") or None,
            "bairro": data.get("bairro") or None,
            "cidade": data.get("localidade") or None,
            "estado": data.get("uf") or None,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("Falha ao consultar ViaCEP (%s): %s", digits, exc)
        return None

    coords = get_from_cep(digits)
    if coords is None:
        coords = geocode_address(
            " ".join(
                filter(
                    None,
                    [
                        endereco.get("rua"),
                        endereco.get("bairro"),
                        endereco.get("cidade"),
                        endereco.get("estado"),
                        "Brasil",
                    ],
                )
            )
        )
    if coords is not None:
        endereco["latitude"], endereco["longitude"] = coords
    return endereco


def geocode_address(address: str | None) -> tuple[float, float] | None:
    """Geocodifica um texto de endereço com o Nominatim (OpenStreetMap)."""
    if not address or not address.strip():
        return None
    try:
        response = httpx.get(
            NOMINATIM_URL,
            params={"q": address, "format": "json", "limit": 1},
            headers={"User-Agent": "SolusRecycle/1.0 (contato@solusrecycle.app)"},
            timeout=10,
        )
        response.raise_for_status()
        results = response.json()
        if not results:
            return None
        return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception as exc:  # noqa: BLE001
        logger.warning("Falha ao geocodificar endereço (%s): %s", address, exc)
        return None


def format_address(endereco: dict | None) -> str | None:
    """Monta um texto legível de endereço a partir dos dados do ViaCEP."""
    if not endereco:
        return None
    rua = endereco.get("rua") or endereco.get("logradouro")
    if not rua:
        return None
    partes = [rua]
    if endereco.get("numero"):
        partes.append(endereco["numero"])
    if endereco.get("bairro"):
        partes.append(f"- {endereco['bairro']}")
    cidade_estado = " - ".join(
        filter(None, [endereco.get("cidade"), endereco.get("estado")])
    )
    if cidade_estado:
        partes.append(f", {cidade_estado}")
    return " ".join(partes)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0088
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return 2 * radius * math.asin(math.sqrt(a))
