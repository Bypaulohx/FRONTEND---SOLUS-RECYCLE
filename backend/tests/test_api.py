"""Smoke test dos contratos principais portados do backend Java."""

import os
from urllib.parse import parse_qs, urlparse

import pytest

os.environ.setdefault("DB_URL", "sqlite://")
os.environ.setdefault("JWT_SECRET", "solus-recycle-secret-local-change-me-please-123456")

from fastapi.testclient import TestClient  # noqa: E402

from app.database import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models import VerificationCode  # noqa: E402
from app.services import geo_service  # noqa: E402


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client

USER = {
    "nome": "João Silva",
    "cpf": "00000000000",
    "email": "joao@teste.com",
    "senha": "senha1234",
    "telefone": "63999999999",
    "endereco": {
        "cep": "77000000",
        "rua": "Rua Exemplo",
        "numero": "10",
        "bairro": "Centro",
        "cidade": "Palmas",
        "estado": "TO",
    },
}


def test_fluxo_cadastro_login_e_blacklist(client):
    assert client.get("/health").text == "UP"

    response = client.post("/api/usuario", json=USER)
    assert response.status_code == 202, response.text
    assert response.json()["url"] is None

    with SessionLocal() as db:
        code = db.query(VerificationCode).first().code

    response = client.post(
        "/api/cadastro/verificar", json={"email": USER["email"], "code": code}
    )
    assert response.status_code == 201, response.text

    response = client.post(
        "/api/auth/login", json={"email": USER["email"], "password": USER["senha"]}
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["role"] == "USER"
    assert body["firstName"] == "João"
    headers = {"Authorization": f"Bearer {body['jwtToken']}"}

    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["nome"] == USER["nome"]
    assert "senha" in response.json()  # quirk preservado do Java

    assert (
        client.get("/api/auth/check/email", params={"value": USER["email"]}).status_code
        == 409
    )
    assert client.get("/api/auth/check/cpf", params={"value": "11111111111"}).status_code == 204
    assert client.get("/api/search").status_code == 400

    response = client.post(
        "/api/agendamentos",
        headers=headers,
        json={
            "companyId": 999,
            "tipoResiduo": "Vidro",
            "pesoEstimado": 10,
            "scheduleTime": "20/11/2026 14:30",
        },
    )
    assert response.status_code == 404
    assert response.json()["message"] == "Empresa selecionada não existe."

    assert client.post("/api/auth/logout", headers=headers).status_code == 200
    response = client.get("/api/agendamentos/meus-agendamentos", headers=headers)
    assert response.status_code == 401
    assert "Sessão encerrada" in response.json()["message"]


def test_login_social_demo_emite_jwt(client):
    response = client.get(
        "/api/auth/social/google/url",
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["demo"] is True
    assert body["url"].startswith("http://localhost:5173/oauth/callback?")

    state = parse_qs(urlparse(body["url"]).query)["state"][0]
    response = client.post("/api/auth/social/google/demo", params={"state": state})
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["role"] == "USER"
    assert payload["jwtToken"]

    # O state só pode ser consumido uma vez.
    assert (
        client.post("/api/auth/social/google/demo", params={"state": state}).status_code
        == 400
    )


def test_cep_e_pontos_de_coleta(client, monkeypatch):
    monkeypatch.setattr(
        geo_service,
        "get_address_from_cep",
        lambda cep: {
            "cep": "01310100",
            "rua": "Avenida Paulista",
            "bairro": "Bela Vista",
            "cidade": "São Paulo",
            "estado": "SP",
            "latitude": -23.5598,
            "longitude": -46.6574,
        },
    )
    response = client.get("/api/cep/01310100")
    assert response.status_code == 200, response.text
    assert response.json()["rua"] == "Avenida Paulista"

    empresa = {
        "nomeFantasia": "Solus Teste",
        "razaoSocial": "Solus Teste Ltda",
        "cnpj": "22333444000155",
        "email": "empresa@teste.com",
        "senha": "senha1234",
        "telefone": "1133334444",
        "tipoResiduo": "Papel, Plástico",
        "materiaisColeta": "Papel, Plástico",
        "fazColetaDomicilio": True,
        "pesoMinimoKg": 1,
        "pesoMaximoKg": 20,
        "endereco": {
            "cep": "01310100",
            "rua": "Avenida Paulista",
            "numero": "1000",
            "bairro": "Bela Vista",
            "cidade": "São Paulo",
            "estado": "SP",
        },
    }
    assert client.post("/api/empresa", json=empresa).status_code == 202
    with SessionLocal() as db:
        code = db.query(VerificationCode).filter_by(email=empresa["email"]).first().code
    assert (
        client.post(
            "/api/cadastro/verificar",
            json={"email": empresa["email"], "code": code},
        ).status_code
        == 201
    )

    login = client.post(
        "/api/auth/login", json={"email": empresa["email"], "password": empresa["senha"]}
    )
    assert login.status_code == 200, login.text
    assert login.json()["role"] == "COMPANY"
    headers = {"Authorization": f"Bearer {login.json()['jwtToken']}"}

    ponto = {
        "nome": "Ponto de teste",
        "tipoResiduo": "Metal",
        "endereco": "Av. Paulista, 1000",
        "latitude": -23.5598,
        "longitude": -46.6574,
    }
    response = client.post("/api/pontos-coleta", headers=headers, json=ponto)
    assert response.status_code == 200, response.text
    assert response.json()["companyNome"] == "Solus Teste"

    response = client.get("/api/pontos-coleta")
    assert response.status_code == 200
    assert any(ponto["nome"] == "Ponto de teste" for ponto in response.json())
