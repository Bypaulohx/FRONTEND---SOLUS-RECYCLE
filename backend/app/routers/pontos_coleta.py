"""PontoColetaController — pontos de coleta e busca por proximidade."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import AccountContext, get_current_account, require_roles
from ..database import get_db
from ..models import Company, HorarioFuncionamentoPonto, PontoColeta
from ..schemas import (
    FuncionamentoDTO,
    PontoColetaCreate,
    PontoColetaDTO,
    PontoColetaProximoDTO,
)
from ..services import email_service, geo_service
from ..utils import error_response

router = APIRouter(tags=["pontos-coleta"])


def _funcionamento_dto(ponto: PontoColeta) -> list[FuncionamentoDTO] | None:
    if not ponto.funcionamento:
        return None
    return [
        FuncionamentoDTO(
            id=item.id,
            dia_semana=item.dia_semana,
            horario_abertura=item.horario_abertura,
            horario_fechamento=item.horario_fechamento,
        )
        for item in ponto.funcionamento
    ]


def _ponto_dto(ponto: PontoColeta, db: Session | None = None) -> PontoColetaDTO:
    company_nome = None
    if db is not None and ponto.company_id:
        company = db.query(Company).filter(Company.id == ponto.company_id).first()
        company_nome = (
            company.nome_fantasia or company.razao_social if company else None
        )
    materiais = None
    if ponto.materiais_coleta:
        materiais = [item.strip() for item in ponto.materiais_coleta.split(",") if item.strip()]
    return PontoColetaDTO(
        id=ponto.id,
        nome=ponto.nome,
        tipo_residuo=ponto.tipo_residuo,
        endereco=ponto.endereco,
        complemento=ponto.complemento,
        latitude=ponto.latitude,
        longitude=ponto.longitude,
        company_id=ponto.company_id,
        company_nome=company_nome,
        raio_km=ponto.raio_atendimento_km,
        materiais=materiais,
        peso_minimo_kg=ponto.peso_minimo_kg,
        peso_maximo_kg=ponto.peso_maximo_kg,
        recebe_materiais=ponto.recebe_materiais,
        coleta_domicilio=ponto.coleta_domicilio,
        telefone=ponto.telefone,
        imagem_url=ponto.imagem_url,
        funcionamento=_funcionamento_dto(ponto),
    )


def _criar_ponto(
    db: Session, body: PontoColetaCreate, ctx: AccountContext
):
    latitude, longitude = body.latitude, body.longitude
    endereco_texto = body.endereco
    if latitude is None or longitude is None:
        if body.cep:
            endereco = geo_service.get_address_from_cep(body.cep)
            coords = (
                (endereco["latitude"], endereco["longitude"])
                if endereco
                and endereco.get("latitude") is not None
                and endereco.get("longitude") is not None
                else None
            )
            if coords is None:
                return error_response(
                    500,
                    "500 INTERNAL_SERVER_ERROR",
                    "Não foi possível localizar o CEP informado. Informe latitude e longitude.",
                )
            latitude, longitude = coords
            endereco_texto = endereco_texto or geo_service.format_address(endereco)
        else:
            return error_response(
                500, "500 INTERNAL_SERVER_ERROR", "Localização não fornecida."
            )

    company = db.query(Company).filter(Company.email == ctx.email).first()
    if company is None:
        return error_response(
            500,
            "500 INTERNAL_SERVER_ERROR",
            "Empresa não encontrada para o usuário logado.",
        )

    ponto = PontoColeta(
        nome=body.nome,
        tipo_residuo=body.tipo_residuo,
        endereco=endereco_texto,
        complemento=body.complemento,
        latitude=latitude,
        longitude=longitude,
        company_id=company.id,
        raio_atendimento_km=body.raio_km if body.raio_km is not None else 5,
        materiais_coleta=",".join(body.materiais) if body.materiais else None,
        peso_minimo_kg=body.peso_minimo_kg,
        peso_maximo_kg=body.peso_maximo_kg,
        recebe_materiais=body.recebe_materiais if body.recebe_materiais is not None else True,
        coleta_domicilio=body.coleta_domicilio if body.coleta_domicilio is not None else True,
        telefone=body.telefone,
        imagem_url=body.imagem_url,
    )
    for item in body.funcionamento:
        ponto.funcionamento.append(
            HorarioFuncionamentoPonto(
                dia_semana=item.dia_semana,
                horario_abertura=item.horario_abertura,
                horario_fechamento=item.horario_fechamento,
            )
        )
    db.add(ponto)
    db.commit()
    db.refresh(ponto)

    try:
        email_service.send_new_collection_point(
            company.email,
            company.nome_fantasia or "",
            body.nome or "",
        )
    except Exception:  # noqa: BLE001
        pass
    return _ponto_dto(ponto, db).model_dump(by_alias=True)


@router.post("/api/pontos-coleta")
def criar_ponto(
    body: PontoColetaCreate,
    ctx: AccountContext = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    return _criar_ponto(db, body, ctx)


@router.get("/api/pontos-coleta")
def listar_pontos(db: Session = Depends(get_db)):
    pontos = db.query(PontoColeta).all()
    return [_ponto_dto(ponto, db).model_dump(by_alias=True) for ponto in pontos]


@router.put("/api/pontos-coleta/{ponto_id}")
def atualizar_ponto(
    ponto_id: int,
    body: PontoColetaCreate,
    ctx: AccountContext = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    """Atualiza um ponto de coleta pertencente à empresa autenticada."""
    company = db.query(Company).filter(Company.email == ctx.email).first()
    if company is None:
        return error_response(500, "500 INTERNAL_SERVER_ERROR", "Empresa não encontrada.")

    ponto = db.query(PontoColeta).filter(PontoColeta.id == ponto_id).first()
    if ponto is None:
        return error_response(404, "404 NOT_FOUND", "Ponto de coleta não encontrado.")
    if ponto.company_id != company.id:
        return error_response(403, "403 FORBIDDEN", "Acesso negado.")

    if body.nome is not None:
        ponto.nome = body.nome
    if body.tipo_residuo is not None:
        ponto.tipo_residuo = body.tipo_residuo
    if body.endereco is not None:
        ponto.endereco = body.endereco
    if body.complemento is not None:
        ponto.complemento = body.complemento
    elif body.cep:
        endereco = geo_service.get_address_from_cep(body.cep)
        if endereco:
            ponto.endereco = geo_service.format_address(endereco)
            if body.latitude is None or body.longitude is None:
                coords = geo_service.get_from_cep(body.cep)
                if coords:
                    ponto.latitude, ponto.longitude = coords
    if body.latitude is not None:
        ponto.latitude = body.latitude
    if body.longitude is not None:
        ponto.longitude = body.longitude
    if body.raio_km is not None:
        ponto.raio_atendimento_km = body.raio_km
    if body.materiais is not None:
        ponto.materiais_coleta = ",".join(body.materiais) or None
    if body.peso_minimo_kg is not None:
        ponto.peso_minimo_kg = body.peso_minimo_kg
    if body.peso_maximo_kg is not None:
        ponto.peso_maximo_kg = body.peso_maximo_kg
    if body.recebe_materiais is not None:
        ponto.recebe_materiais = body.recebe_materiais
    if body.coleta_domicilio is not None:
        ponto.coleta_domicilio = body.coleta_domicilio
    if body.telefone is not None:
        ponto.telefone = body.telefone
    if body.imagem_url is not None:
        ponto.imagem_url = body.imagem_url

    if "funcionamento" in body.model_fields_set:
        for horario in list(ponto.funcionamento):
            db.delete(horario)
        db.flush()
        for item in body.funcionamento:
            ponto.funcionamento.append(
                HorarioFuncionamentoPonto(
                    dia_semana=item.dia_semana,
                    horario_abertura=item.horario_abertura,
                    horario_fechamento=item.horario_fechamento,
                )
            )

    db.commit()
    db.refresh(ponto)
    return _ponto_dto(ponto, db).model_dump(by_alias=True)


@router.get("/api/pontos-coleta/proximos-coord")
def proximos_por_coordenada(
    lat: float,
    lon: float,
    raio: float = 5.0,
    db: Session = Depends(get_db),
):
    return _proximos(db, lat, lon, raio)


@router.get("/api/pontos-coleta/proximos-cep")
def proximos_por_cep(
    cep: str,
    raio: float = 5.0,
    db: Session = Depends(get_db),
):
    coords = geo_service.get_from_cep(cep)
    if coords is None:
        return error_response(
            500,
            "500 INTERNAL_SERVER_ERROR",
            "CEP de origem não encontrado ou serviço indisponível.",
        )
    return _proximos(db, coords[0], coords[1], raio)


def _proximos(db: Session, lat: float, lon: float, raio: float):
    resultados: list[tuple[float, PontoColeta]] = []
    for ponto in db.query(PontoColeta).all():
        distancia = geo_service.haversine_km(lat, lon, ponto.latitude, ponto.longitude)
        if distancia <= raio:
            resultados.append((distancia, ponto))
    resultados.sort(key=lambda item: item[0])
    return [
        PontoColetaProximoDTO(
            id=ponto.id,
            nome=ponto.nome,
            tipo_residuo=ponto.tipo_residuo,
            endereco=ponto.endereco,
            complemento=ponto.complemento,
            latitude=ponto.latitude,
            longitude=ponto.longitude,
            distancia=round(distancia, 3),
            company_id=ponto.company_id,
            materiais=(
                [item.strip() for item in ponto.materiais_coleta.split(",") if item.strip()]
                if ponto.materiais_coleta
                else None
            ),
            peso_minimo_kg=ponto.peso_minimo_kg,
            peso_maximo_kg=ponto.peso_maximo_kg,
            funcionamento=_funcionamento_dto(ponto),
        ).model_dump(by_alias=True)
        for distancia, ponto in resultados
    ]


@router.post("/api/pontos-coleta/lote")
def criar_pontos_em_lote(
    body: list[PontoColetaCreate],
    ctx: AccountContext = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    resultados = []
    for item in body:
        resultado = _criar_ponto(db, item, ctx)
        if isinstance(resultado, dict):
            resultados.append(resultado)
        else:  # resposta de erro (JSONResponse) — interrompe como no Java
            return resultado
    return resultados
