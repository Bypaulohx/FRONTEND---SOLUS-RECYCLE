"""AuthController + CheckController do backend Java."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import JSONResponse, PlainTextResponse
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from ..auth import (
    extract_token,
    find_account_by_email,
    get_jwt_key,
    get_current_account,
    token_blacklist,
    verify_password,
    create_jwt_token,
)
from ..database import get_db
from ..models import Company, User
from ..schemas import AuthRequest, AuthResponse, CheckResponse, MessageResponse
from ..utils import error_response

router = APIRouter(tags=["auth"])


@router.post("/api/auth/login")
def login(body: AuthRequest, db: Session = Depends(get_db)):
    email = (body.email or "").strip()
    account, role = find_account_by_email(db, email)
    if account is None or not verify_password(body.password or "", account.senha):
        return error_response(
            401, "Unauthorized", "Credenciais inválidas: E-mail ou senha incorretos."
        )

    account_id = account.id
    first_name = (
        (account.nome or "").split(" ")[0]
        if role == "USER"
        else (account.nome_fantasia or "")
    )
    full_name = account.nome if role == "USER" else account.nome_fantasia
    telefone = account.telefone
    cpf = account.cpf if role == "USER" else account.cnpj
    # Quirk preservado do Java: para USER, cnpj recebe o próprio CPF.
    cnpj = account.cpf if role == "USER" else account.cnpj

    if account_id is None or not all(
        value is not None
        for value in (first_name, full_name, telefone, cpf, cnpj)
    ):
        return error_response(
            500,
            "Internal Server Error",
            "Falha na sincronização da conta ou nome após o login.",
        )

    payload = AuthResponse(
        jwt_token=create_jwt_token(account, role),
        message="Login realizado com sucesso!",
        role=role,
        id=account_id,
        first_name=first_name,
        full_name=full_name,
        telefone=telefone,
        cpf=cpf,
        cnpj=cnpj,
    )
    return payload.model_dump(by_alias=True)


def _account_to_entity_dict(account: User | Company) -> dict:
    """Serialização bruta da entidade, como no /api/auth/me do Java."""
    endereco = account.endereco
    endereco_dict = None
    if endereco is not None:
        endereco_dict = {
            "id": endereco.id,
            "cep": endereco.cep,
            "rua": endereco.rua,
            "numero": endereco.numero,
            "bairro": endereco.bairro,
            "cidade": endereco.cidade,
            "estado": endereco.estado,
            "latitude": endereco.latitude,
            "longitude": endereco.longitude,
        }
    data = {
        "id": account.id,
        "email": account.email,
        "senha": account.senha,
        "telefone": account.telefone,
        "endereco": endereco_dict,
        "profilePicture": account.profile_picture,
        "lastUpdateDate": (
            account.last_update_date.isoformat() if account.last_update_date else None
        ),
    }
    if isinstance(account, User):
        data.update({"nome": account.nome, "cpf": account.cpf})
    else:
        data.update(
            {
                "razaoSocial": account.razao_social,
                "nomeFantasia": account.nome_fantasia,
                "cnpj": account.cnpj,
                "descricao": account.descricao,
                "tipoResiduo": account.tipo_residuo,
                "fazColetaDomicilio": account.faz_coleta_domicilio,
                "materiaisColeta": account.materiais_coleta,
                "pesoMinimoKg": account.peso_minimo_kg,
                "pesoMaximoKg": account.peso_maximo_kg,
                "diasFuncionamento": account.dias_funcionamento,
                "feriados": account.feriados,
                "imagemLocal": account.imagem_local,
            }
        )
    return data


@router.get("/api/auth/me")
def me(request: Request, db: Session = Depends(get_db)):
    token = extract_token(request)
    if not token:
        return PlainTextResponse("Conta não encontrada", status_code=404)
    try:
        payload = jwt.decode(token, get_jwt_key(), algorithms=["HS256"])
    except JWTError:
        return PlainTextResponse("Conta não encontrada", status_code=404)
    email = payload.get("sub") or ""
    account, _ = find_account_by_email(db, email)
    if account is None:
        return PlainTextResponse("Conta não encontrada", status_code=404)
    return _account_to_entity_dict(account)


@router.post("/api/auth/logout")
def logout(request: Request):
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return error_response(
            400,
            "Bad Request",
            "Token 'Bearer' não encontrado no cabeçalho 'Authorization'.",
        )
    token_blacklist.add(header[7:].strip())
    return MessageResponse(message="Logout realizado com sucesso.").model_dump(
        by_alias=True
    )


def _check_unique(db: Session, field: str, value: str | None):
    if field == "cpf":
        exists = db.query(User).filter(User.cpf == value).first() is not None
        message = "CPF já cadastrado."
    elif field == "cnpj":
        exists = db.query(Company).filter(Company.cnpj == value).first() is not None
        message = "CNPJ já cadastrado."
    else:
        exists = (
            db.query(User).filter(User.email == value).first() is not None
            or db.query(Company).filter(Company.email == value).first() is not None
        )
        message = "E-mail já cadastrado."
    if exists:
        body = CheckResponse(unique=False, message=message).model_dump(by_alias=True)
        return JSONResponse(status_code=409, content=body)
    return Response(status_code=204)


@router.get("/api/auth/check/cpf")
def check_cpf(value: str | None = None, db: Session = Depends(get_db)):
    return _check_unique(db, "cpf", value)


@router.get("/api/auth/check/cnpj")
def check_cnpj(value: str | None = None, db: Session = Depends(get_db)):
    return _check_unique(db, "cnpj", value)


@router.get("/api/auth/check/email")
def check_email(value: str | None = None, db: Session = Depends(get_db)):
    return _check_unique(db, "email", value)
