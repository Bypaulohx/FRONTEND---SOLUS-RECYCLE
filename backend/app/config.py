"""Configurações da API Solus Recycle (equivalentes ao application.properties do Java)."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    port: int = 8000
    jwt_secret: str = "solus-recycle-secret-local-change-me-please-123456"
    jwt_expiration: int = 3600  # segundos, como no Java

    db_url: str = Field(default="sqlite:///./data/solus.db", alias="DB_URL")

    cepaberto_token: str = ""
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_bucket: str = "fotos-perfil"
    brevo_api_key: str = ""

    # Login social (OAuth2). Sem credenciais configuradas o backend usa um
    # modo demonstração que emite JWTs reais para contas locais de teste.
    frontend_url: str = ""
    social_redirect_uri: str = ""
    google_client_id: str = ""
    google_client_secret: str = ""
    facebook_app_id: str = ""
    facebook_app_secret: str = ""
    apple_client_id: str = ""
    apple_client_secret: str = ""
    seed_demo_data: bool = True

    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://127.0.0.1:5500",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://127.0.0.1:5176",
            "https://solus-recycle-back-end.onrender.com",
        ],
        alias="CORS_ORIGINS",
    )

    @property
    def upload_dir(self) -> Path:
        return BASE_DIR / "data" / "uploads"


@lru_cache
def get_settings() -> Settings:
    settings = get_settings_from_env()
    # Garante que o diretório do SQLite local exista.
    if settings.db_url.startswith("sqlite:"):
        path = settings.db_url.split("///", 1)[-1]
        target = Path(path)
        if not target.is_absolute():
            target = BASE_DIR / target
        target.parent.mkdir(parents=True, exist_ok=True)
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    return settings


def get_settings_from_env() -> Settings:
    return Settings()
