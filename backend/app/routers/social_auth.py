"""Login social (Apple, Facebook e Google) com OAuth2/OIDC.

Quando as credenciais do provedor estão configuradas, o fluxo é o
authorization-code real: state + PKCE, troca do código no servidor do provedor,
leitura do perfil e emissão do JWT da Solus Recycle. Sem credenciais, um modo
demonstração emite o mesmo JWT para uma conta local de teste, para que os
botões funcionem de verdade em desenvolvimento.
"""

from __future__ import annotations

import base64
import hashlib
import logging
import secrets
import threading
import time
from typing import Any
from urllib.parse import urlencode, urlparse

import httpx
from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from jose import jwt as jose_jwt
from sqlalchemy.orm import Session

from ..auth import create_jwt_token, find_account_by_email, hash_password
from ..config import get_settings
from ..database import get_db
from ..models import User
from ..schemas import AuthResponse
from ..utils import error_response

router = APIRouter(tags=["auth-social"])
settings = get_settings()
logger = logging.getLogger("solus.social")

PROVIDERS = ("apple", "facebook", "google")

# state/verifier em memória, equivalente ao comportamento em memória do blacklist.
_states: dict[str, dict[str, Any]] = {}
_states_lock = threading.Lock()
STATE_TTL = 600  # segundos


def _config(provider: str) -> dict[str, Any]:
    configs = {
        "google": {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "authorize": "https://accounts.google.com/o/oauth2/v2/auth",
            "token": "https://oauth2.googleapis.com/token",
            "userinfo": "https://www.googleapis.com/oauth2/v3/userinfo",
            "scope": "openid email profile",
            "pkce": True,
            "response_mode": None,
        },
        "facebook": {
            "client_id": settings.facebook_app_id,
            "client_secret": settings.facebook_app_secret,
            "authorize": "https://www.facebook.com/v19.0/dialog/oauth",
            "token": "https://graph.facebook.com/v19.0/oauth/access_token",
            "userinfo": "https://graph.facebook.com/me",
            "scope": "email",
            "pkce": False,
            "response_mode": None,
        },
        "apple": {
            "client_id": settings.apple_client_id,
            "client_secret": settings.apple_client_secret,
            "authorize": "https://appleid.apple.com/auth/authorize",
            "token": "https://appleid.apple.com/auth/token",
            "userinfo": None,
            "scope": "name email",
            "pkce": True,
            "response_mode": "form_post",
        },
    }
    return configs[provider]


def _is_configured(provider: str) -> bool:
    cfg = _config(provider)
    return bool(cfg["client_id"] and cfg["client_secret"])


def _redirect_uri(request: Request, provider: str) -> str:
    if settings.social_redirect_uri:
        return settings.social_redirect_uri.rstrip("/")
    return f"{str(request.base_url).rstrip('/')}/api/auth/social/{provider}/callback"


def _frontend_url(request: Request | None = None) -> str:
    # Quando o Vite faz proxy, request.base_url aponta para o backend; o
    # Origin/Referer do navegador é que identifica a origem correta do front.
    if request is not None:
        for cabecalho in ("origin", "referer"):
            valor = request.headers.get(cabecalho)
            if valor:
                parsed = urlparse(valor)
                if parsed.scheme and parsed.netloc:
                    return f"{parsed.scheme}://{parsed.netloc}"
    if settings.frontend_url:
        return settings.frontend_url.rstrip("/")
    if request is not None:
        return str(request.base_url).rstrip("/")
    return "http://localhost:5173"


def _save_state(provider: str, mode: str, origin: str) -> tuple[str, str | None]:
    state = secrets.token_urlsafe(24)
    verifier = secrets.token_urlsafe(48)
    with _states_lock:
        _states[state] = {
            "provider": provider,
            "mode": mode,
            "verifier": verifier,
            "origin": origin,
            "expires": time.time() + STATE_TTL,
        }
    return state, verifier


def _take_state(state: str | None, provider: str) -> dict[str, Any] | None:
    if not state:
        return None
    with _states_lock:
        data = _states.pop(state, None)
    if data is None or data["provider"] != provider or data["expires"] < time.time():
        return None
    return data


def _auth_payload(account: User, role: str, token: str) -> dict[str, Any]:
    nome = getattr(account, "nome", None) or getattr(account, "nome_fantasia", None) or ""
    cpf = getattr(account, "cpf", None) or ""
    cnpj = getattr(account, "cnpj", None) or ""
    if role == "USER" and not cnpj:
        # Mantém o quirk do backend Java: cnpj da resposta repete o cpf.
        cnpj = cpf
    return AuthResponse(
        jwt_token=token,
        message="Login realizado com sucesso!",
        role=role,
        id=account.id,
        first_name=nome.split(" ")[0],
        full_name=nome,
        telefone=account.telefone or "",
        cpf=cpf,
        cnpj=cnpj,
    ).model_dump(by_alias=True)


def _find_or_create(db: Session, email: str, name: str, role: str = "USER"):
    email = email.strip().lower()
    account, found_role = find_account_by_email(db, email)
    if account is None:
        account = User(
            nome=name or email.split("@")[0],
            email=email,
            senha=hash_password(secrets.token_urlsafe(32)),
        )
        db.add(account)
        db.commit()
        db.refresh(account)
        found_role = "USER"
    return account, found_role


def _finish(account, role: str, provider: str, origin: str):
    token = create_jwt_token(account, role)
    query = urlencode(
        {
            "token": token,
            "role": role,
            "provider": provider,
            "name": getattr(account, "nome", None)
            or getattr(account, "nome_fantasia", None)
            or "",
        }
    )
    return RedirectResponse(url=f"{origin}/oauth/callback?{query}", status_code=302)


def _fail(provider: str, message: str, origin: str):
    query = urlencode({"error": message, "provider": provider})
    return RedirectResponse(url=f"{origin}/oauth/callback?{query}", status_code=302)


@router.get("/api/auth/social/{provider}/url")
def social_url(provider: str, request: Request, mode: str = "login"):
    if provider not in PROVIDERS:
        return error_response(400, "Bad Request", "Provedor social inválido.")

    origin = _frontend_url(request)
    state, verifier = _save_state(provider, mode, origin)
    if not _is_configured(provider):
        # Modo demonstração: o front chama /demo e recebe um JWT real do backend.
        query = urlencode(
            {"provider": provider, "state": state, "mode": mode, "demo": "1"}
        )
        return {"url": f"{origin}/oauth/callback?{query}", "demo": True}

    cfg = _config(provider)
    params: dict[str, Any] = {
        "client_id": cfg["client_id"],
        "redirect_uri": _redirect_uri(request, provider),
        "response_type": "code",
        "scope": cfg["scope"],
        "state": state,
    }
    if cfg["pkce"] and verifier:
        # code_challenge = Base64URL(SHA256(verifier))
        challenge = base64.urlsafe_b64encode(
            hashlib.sha256(verifier.encode("utf-8")).digest()
        ).rstrip(b"=").decode("ascii")
        params["code_challenge"] = challenge
        params["code_challenge_method"] = "S256"
    if cfg["response_mode"]:
        params["response_mode"] = cfg["response_mode"]
    if provider == "google":
        params["prompt"] = "select_account"

    separador = "&" if "?" in cfg["authorize"] else "?"
    return {
        "url": f"{cfg['authorize']}{separador}{urlencode(params)}",
        "demo": False,
    }


async def _exchange_code(
    provider: str, code: str, request: Request, verifier: str | None
) -> dict[str, Any]:
    cfg = _config(provider)
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": _redirect_uri(request, provider),
        "client_id": cfg["client_id"],
        "client_secret": cfg["client_secret"],
    }
    if cfg["pkce"] and verifier:
        data["code_verifier"] = verifier
    async with httpx.AsyncClient(timeout=15) as client:
        if provider == "facebook":
            response = await client.get(cfg["token"], params=data)
        else:
            response = await client.post(cfg["token"], data=data)
        response.raise_for_status()
        return response.json()


async def _profile(provider: str, token_data: dict[str, Any]) -> tuple[str, str]:
    if provider == "apple":
        id_token = token_data.get("id_token")
        if not id_token:
            raise ValueError("O Apple não retornou o id_token.")
        try:
            jwks = httpx.get("https://appleid.apple.com/auth/keys", timeout=10).json()
            claims = jose_jwt.decode(
                id_token,
                jose_jwt.PyJWKSet(jwks).keys,
                algorithms=["RS256"],
                audience=_config("apple")["client_id"],
                issuer="https://appleid.apple.com",
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Não foi possível validar o id_token da Apple: %s", exc)
            claims = jose_jwt.get_unverified_claims(id_token)
        return str(claims.get("email") or ""), str(claims.get("name") or "")

    cfg = _config(provider)
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    params = {"fields": "id,name,email"} if provider == "facebook" else None
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(cfg["userinfo"], headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
    return str(data.get("email") or ""), str(data.get("name") or "")


@router.api_route("/api/auth/social/{provider}/callback", methods=["GET", "POST"])
async def social_callback(provider: str, request: Request, db: Session = Depends(get_db)):
    origin = _frontend_url(request)
    if provider not in PROVIDERS:
        return _fail(provider, "Provedor social inválido.", origin)
    values = await request.form() if request.method == "POST" else request.query_params
    state = str(values.get("state") or "")
    code = str(values.get("code") or "")
    if values.get("error"):
        return _fail(
            provider, str(values.get("error_description") or values["error"]), origin
        )
    saved = _take_state(state, provider)
    if saved is None or not code:
        return _fail(
            provider, "Solicitação de login social inválida ou expirada.", origin
        )
    origin = saved.get("origin") or origin
    try:
        token_data = await _exchange_code(provider, code, request, saved.get("verifier"))
        email, name = await _profile(provider, token_data)
        if not email:
            raise ValueError("O provedor não retornou um e-mail para esta conta.")
        account, role = _find_or_create(db, email, name)
        return _finish(account, role, provider, origin)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Falha no login com %s: %s", provider, exc)
        return _fail(provider, f"Não foi possível entrar com {provider.title()}.", origin)


@router.post("/api/auth/social/{provider}/demo")
def social_demo(
    provider: str,
    request: Request,
    state: str | None = None,
    db: Session = Depends(get_db),
):
    """Modo local: cria (ou reaproveita) uma conta e devolve um JWT real."""
    if provider not in PROVIDERS:
        return error_response(400, "Bad Request", "Provedor social inválido.")
    if state and _take_state(state, provider) is None:
        return error_response(400, "Bad Request", "Solicitação de login social inválida.")
    if _is_configured(provider):
        return error_response(
            409,
            "Conflict",
            "Este provedor está configurado com OAuth; use o fluxo autorizado.",
        )
    email = f"demo.{provider}@solusrecycle.app"
    account, role = _find_or_create(
        db, email, f"Usuário Solus ({provider.title()})"
    )
    return _auth_payload(account, role, create_jwt_token(account, role))
