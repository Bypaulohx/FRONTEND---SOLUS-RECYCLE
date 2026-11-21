"""HealthController — resposta textual ``UP``."""

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_class=PlainTextResponse)
def health() -> str:
    return "UP"
