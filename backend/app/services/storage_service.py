"""Upload de foto de perfil.

Usa Supabase Storage quando configurado; caso contrário grava em
``backend/data/uploads`` e expõe a URL local via StaticFiles (stub equivalente
ao SupabaseStorageService do Java).
"""

from __future__ import annotations

import logging
import uuid

import httpx
from fastapi import HTTPException, UploadFile

from ..config import get_settings

logger = logging.getLogger("solus.storage")
settings = get_settings()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE = 2 * 1024 * 1024


def validate(file: UploadFile, content: bytes) -> None:
    if not content:
        raise HTTPException(status_code=400, detail="Arquivo está vazio")
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415, detail="Apenas JPG, PNG e WebP são permitidos"
        )
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="O arquivo não pode exceder 2MB")


def upload_file(file: UploadFile, content: bytes, folder: str) -> str:
    validate(file, content)
    filename = file.filename or "image"
    key = f"{folder}/{uuid.uuid4()}_{filename}"

    if not settings.supabase_url or not settings.supabase_key:
        target = settings.upload_dir / key
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        return f"/uploads/{key}"

    try:
        response = httpx.post(
            f"{settings.supabase_url}/storage/v1/object/{settings.supabase_bucket}/{key}",
            headers={
                "Authorization": f"Bearer {settings.supabase_key}",
                "apikey": settings.supabase_key,
                "Content-Type": file.content_type or "application/octet-stream",
            },
            content=content,
            timeout=20,
        )
        if not (200 <= response.status_code < 300):
            raise HTTPException(
                status_code=502,
                detail=f"Erro na comunicação com o Supabase: {response.text}",
            )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502, detail=f"Erro na comunicação com o Supabase: {exc}"
        )

    return (
        f"{settings.supabase_url}/storage/v1/object/public/"
        f"{settings.supabase_bucket}/{key}"
    )
