"""Dados de demonstração para o mapa (executados apenas em bancos locais)."""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from .auth import hash_password
from .config import get_settings
from .database import SessionLocal
from .models import Company, Endereco, PontoColeta, User

logger = logging.getLogger("solus.seed")

DEMO_EMAIL = "demo.organizacao@solusrecycle.app"
DEMO_USER_EMAIL = "demo.usuario@solusrecycle.app"
DEMO_PASSWORD = "Solus@2026"

PONTOS = [
    (
        "ASCAS — Associação dos Catadores",
        "Papel, Plástico, Metal",
        "Av. Santos Dumont, 764 - Água Branca, São Paulo - SP",
        -23.5269,
        -46.6667,
        "Seg. a sex., 7h30 às 17h",
    ),
    (
        "Cooperativa Vitória de Reciclagem",
        "Papel, Vidro, Plástico",
        "Rua Batista de Castro, 37 - Vila Maria, São Paulo - SP",
        -23.5104,
        -46.6251,
        "Seg. a sáb., 8h às 18h",
    ),
    (
        "Ponto Verde — Praça da República",
        "Vidro, Metal, Eletrônicos",
        "Praça da República - República, São Paulo - SP",
        -23.5429,
        -46.6413,
        "Todos os dias, 9h às 16h",
    ),
]


def _seed_demo_user(db: Session) -> None:
    """Conta USER com senha conhecida para testar o fluxo sem login social."""
    if db.query(User).filter(User.email == DEMO_USER_EMAIL).first() is not None:
        return
    db.add(
        User(
            nome="Usuário Solus (demo)",
            cpf="00000000001",
            email=DEMO_USER_EMAIL,
            senha=hash_password(DEMO_PASSWORD),
            telefone="11988888888",
            endereco=Endereco(
                cep="01310100",
                rua="Av. Paulista",
                numero="1000",
                bairro="Bela Vista",
                cidade="São Paulo",
                estado="SP",
                latitude=-23.5615,
                longitude=-46.6560,
            ),
        )
    )
    db.commit()
    logger.info("Usuário demonstrativo criado: %s", DEMO_USER_EMAIL)


def seed_demo_data() -> None:
    settings = get_settings()
    if not settings.seed_demo_data or settings.db_url == "sqlite://":
        return

    db: Session = SessionLocal()
    try:
        _seed_demo_user(db)
        if db.query(Company).filter(Company.email == DEMO_EMAIL).first() is not None:
            return
        if db.query(PontoColeta).count() > 0:
            return

        company = Company(
            razao_social="Associação Solus de Reciclagem e Sustentabilidade",
            nome_fantasia="Solus Reciclagem — Organização Demonstrativa",
            cnpj="11222333000144",
            email=DEMO_EMAIL,
            senha=hash_password("Solus@2026"),
            telefone="11999999999",
            descricao="Organização demonstrativa com pontos de coleta no mapa.",
            tipo_residuo="Papel, Plástico, Vidro, Metal",
            faz_coleta_domicilio=True,
            materiais_coleta="Papel, Plástico, Vidro, Metal, Eletrônicos",
            peso_minimo_kg=1.0,
            peso_maximo_kg=50.0,
            endereco=Endereco(
                cep="01214030",
                rua="Av. Santos Dumont",
                numero="764",
                bairro="Água Branca",
                cidade="São Paulo",
                estado="SP",
                latitude=-23.5269,
                longitude=-46.6667,
            ),
        )
        db.add(company)
        db.flush()
        for nome, tipo, endereco, lat, lon, horario in PONTOS:
            db.add(
                PontoColeta(
                    nome=nome,
                    tipo_residuo=tipo,
                    endereco=endereco,
                    latitude=lat,
                    longitude=lon,
                    company_id=company.id,
                )
            )
        db.commit()
        logger.info("Pontos de coleta demonstrativos criados: %d", len(PONTOS))
    except Exception as exc:  # noqa: BLE001 - seeding nunca impede a API de subir
        db.rollback()
        logger.warning("Não foi possível criar os dados demonstrativos: %s", exc)
    finally:
        db.close()
