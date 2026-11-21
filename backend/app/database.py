"""Engine, sessão e inicialização do schema (ddl-auto=update do equivalente Java)."""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool

from .config import get_settings

settings = get_settings()

connect_args: dict = {}
engine_kwargs: dict = {}
if settings.db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
if settings.db_url == "sqlite://":
    # Banco em memória compartilhado entre conexões (usado nos testes).
    engine_kwargs["poolclass"] = StaticPool

engine = create_engine(
    settings.db_url, connect_args=connect_args, pool_pre_ping=True, **engine_kwargs
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    # Importa os modelos para registrar as tabelas antes do create_all.
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _ensure_new_columns()


def _ensure_new_columns() -> None:
    """ddl-auto=update: acrescenta colunas criadas depois da primeira versão.

    O ``create_all`` não altera tabelas existentes, então bancos locais criados
    antes das novas telas de cadastro precisam desta migração mínima.
    """
    colunas = {
        "endereco": {"complemento": "VARCHAR"},
        "tb_companies": {
            "faz_coleta_domicilio": "BOOLEAN DEFAULT 0",
            "materiais_coleta": "TEXT",
            "peso_minimo_kg": "FLOAT",
            "peso_maximo_kg": "FLOAT",
            "dias_funcionamento": "TEXT",
            "feriados": "TEXT",
            "imagem_local": "VARCHAR",
        },
        "ponto_coleta": {
            "endereco": "VARCHAR",
            "complemento": "VARCHAR",
            "raio_atendimento_km": "FLOAT DEFAULT 5",
            "materiais_coleta": "TEXT",
            "peso_minimo_kg": "FLOAT",
            "peso_maximo_kg": "FLOAT",
            "recebe_materiais": "BOOLEAN DEFAULT 1",
            "coleta_domicilio": "BOOLEAN DEFAULT 1",
            "telefone": "VARCHAR",
            "imagem_url": "VARCHAR",
        },
    }
    inspector = inspect(engine)
    tabelas = set(inspector.get_table_names())
    with engine.begin() as connection:
        for tabela, campos in colunas.items():
            if tabela not in tabelas:
                continue
            existentes = {col["name"] for col in inspector.get_columns(tabela)}
            for nome, tipo in campos.items():
                if nome not in existentes:
                    connection.execute(
                        text(f"ALTER TABLE {tabela} ADD COLUMN {nome} {tipo}")
                    )
