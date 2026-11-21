"""Aplicação FastAPI — porta do backend Spring Boot Solus Recycle."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from http import HTTPStatus

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .database import init_db
from .routers import (
    agendamentos,
    auth,
    cadastro,
    cep,
    disponibilidade,
    empresas,
    feriados,
    health,
    pontos_coleta,
    profile,
    search,
    social_auth,
    uploads,
)
from .seed import seed_demo_data
from .utils import error_response

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("solus")

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    seed_demo_data()
    yield


app = FastAPI(
    title="Solus Recycle API",
    description="Backend Python (FastAPI) portado do backend Java Solus Recycle.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(settings.upload_dir)), name="uploads")

for module in (
    health,
    auth,
    cadastro,
    cep,
    empresas,
    feriados,
    agendamentos,
    social_auth,
    disponibilidade,
    pontos_coleta,
    profile,
    search,
    uploads,
):
    app.include_router(module.router)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        message = str(detail.get("message") or detail.get("detail") or detail)
    else:
        message = str(detail)
    error = f"{exc.status_code} {HTTPStatus(exc.status_code).name}"
    return error_response(exc.status_code, error, message)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    message = "; ".join(
        f"{'.'.join(str(part) for part in item.get('loc', []))}: {item.get('msg')}"
        for item in exc.errors()
    )
    return error_response(400, "400 BAD_REQUEST", message or "Requisição inválida.")


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    logger.exception("Erro não tratado: %s", exc)
    return error_response(
        500,
        "Internal Server Error",
        f"Ocorreu um erro inesperado no servidor: {exc}",
    )


@app.get("/", include_in_schema=False)
def root():
    return JSONResponse(
        content={
            "app": "Solus Recycle API",
            "docs": "/docs",
            "health": "/health",
        }
    )
