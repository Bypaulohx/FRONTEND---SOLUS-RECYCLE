"""JWT, hashing de senha e resolução da conta autenticada.

Espelha JwtUtil / JwtRequestFilter / MyUserDetailsService do projeto Java:
o token contém apenas ``sub`` (e-mail), ``nome``, ``iat`` e ``exp``; o role é
resolvido no banco a cada requisição.
"""

from __future__ import annotations

import base64
import binascii
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from argon2 import PasswordHasher, Type
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from fastapi import Depends, HTTPException, Request
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .config import get_settings
from .database import get_db
from .models import Company, User

settings = get_settings()

# Argon2id com os mesmos parâmetros do Argon2PasswordEncoder(16, 32, 1, 65536, 3).
_password_hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=1,
    hash_len=32,
    salt_len=16,
    type=Type.ID,
)

# TokenBlacklist em memória: mesmo comportamento do projeto Java (limpa ao reiniciar).
token_blacklist: set[str] = set()


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, encoded: str | None) -> bool:
    if not encoded:
        return False
    if encoded.startswith("$argon2"):
        try:
            valid = _password_hasher.verify(encoded, password)
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            return False
        if _password_hasher.check_needs_rehash(encoded):
            # Mantido apenas para compatibilidade de parâmetros; não persistimos aqui.
            pass
        return bool(valid)
    if encoded.startswith("$2"):
        # Compatibilidade com hashes bcrypt do backend Node anterior.
        try:
            return bcrypt.checkpw(password.encode("utf-8"), encoded.encode("utf-8"))
        except (ValueError, TypeError):
            return False
    return False


def get_jwt_key() -> bytes:
    """O Java usa um secret Base64; aceitamos também um secret em texto simples."""
    secret = settings.jwt_secret
    try:
        decoded = base64.b64decode(secret, validate=True)
        if len(decoded) >= 32:
            return decoded
    except (binascii.Error, ValueError):
        pass
    return secret.encode("utf-8")


def create_jwt_token(account: User | Company, role: str) -> str:
    now = datetime.now(timezone.utc)
    name = getattr(account, "nome", None) or getattr(account, "nome_fantasia", None) or ""
    payload: dict[str, Any] = {
        "sub": account.email,
        "nome": name,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=settings.jwt_expiration)).timestamp()),
    }
    return jwt.encode(payload, get_jwt_key(), algorithm="HS256")


@dataclass
class AccountContext:
    account: User | Company
    role: str
    email: str
    token: str

    @property
    def first_name(self) -> str:
        if isinstance(self.account, User):
            return (self.account.nome or "").split(" ")[0]
        return self.account.nome_fantasia or ""

    @property
    def full_name(self) -> str:
        if isinstance(self.account, User):
            return self.account.nome or ""
        return self.account.nome_fantasia or ""


def extract_token(request: Request) -> str | None:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    token = header[7:].strip()
    if not token or token.lower() in {"undefined", "null"}:
        return None
    return token


def get_current_account(
    request: Request, db: Session = Depends(get_db)
) -> AccountContext:
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Credenciais de autenticação ausentes.")

    if token in token_blacklist:
        raise HTTPException(
            status_code=401,
            detail={"message": "Sessão encerrada. Faça login novamente."},
        )

    try:
        payload = jwt.decode(token, get_jwt_key(), algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Token inválido.")

    account = db.query(User).filter(User.email == email).first()
    role = "USER"
    if account is None:
        account = db.query(Company).filter(Company.email == email).first()
        role = "COMPANY"
    if account is None:
        raise HTTPException(status_code=401, detail="Conta não encontrada.")

    return AccountContext(account=account, role=role, email=email, token=token)


def require_roles(*roles: str):
    def dependency(ctx: AccountContext = Depends(get_current_account)) -> AccountContext:
        if ctx.role not in roles:
            raise HTTPException(status_code=403, detail="Acesso negado.")
        return ctx

    return dependency


def find_account_by_email(db: Session, email: str) -> tuple[User | Company | None, str | None]:
    account = db.query(User).filter(User.email == email).first()
    if account is not None:
        return account, "USER"
    account = db.query(Company).filter(Company.email == email).first()
    if account is not None:
        return account, "COMPANY"
    return None, None
