"""Schemas Pydantic que reproduzem os DTOs do backend Java."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class MessageResponse(CamelModel):
    message: str
    url: str | None = None


class ErrorResponse(CamelModel):
    status: int
    error: str
    message: str


class CheckResponse(CamelModel):
    unique: bool
    # O Jackson serializa o getter isUnique() como "unique"; enviamos os dois.
    isUnique: bool = False
    message: str

    @model_validator(mode="after")
    def _sync(self) -> "CheckResponse":
        self.isUnique = self.unique
        return self


class EnderecoDTO(CamelModel):
    id: int | None = None
    cep: str | None = None
    rua: str | None = None
    numero: str | None = None
    complemento: str | None = None
    bairro: str | None = None
    cidade: str | None = None
    estado: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class UserRegistration(CamelModel):
    id: int | None = None
    nome: str | None = None
    cpf: str | None = None
    email: str | None = None
    senha: str | None = None
    telefone: str | None = None
    endereco: EnderecoDTO | None = None
    profile_picture: str | None = None
    last_update_date: datetime | None = None


class CompanyRegistration(CamelModel):
    id: int | None = None
    razao_social: str | None = None
    nome_fantasia: str | None = None
    cnpj: str | None = None
    email: str | None = None
    senha: str | None = None
    telefone: str | None = None
    descricao: str | None = None
    tipo_residuo: str | None = None
    faz_coleta_domicilio: bool | None = None
    materiais_coleta: str | None = None
    peso_minimo_kg: float | None = None
    peso_maximo_kg: float | None = None
    endereco: EnderecoDTO | None = None
    profile_picture: str | None = None
    last_update_date: datetime | None = None


class AuthRequest(CamelModel):
    email: str | None = None
    password: str | None = None


class AuthResponse(CamelModel):
    type: str = "Bearer"
    jwt_token: str
    message: str
    role: str
    id: int
    first_name: str
    full_name: str
    telefone: str
    cpf: str
    cnpj: str


class AgendamentoRequest(CamelModel):
    company_id: int
    tipo_residuo: str
    peso_estimado: float | None = None
    schedule_time: str  # dd/MM/yyyy HH:mm, como no @JsonFormat do Java


class AgendamentoDTO(CamelModel):
    id: int
    user_name: str | None = None
    user_telefone: str | None = None
    user_endereco: str | None = None
    tipo_residuo: str | None = None
    company_nome_fantasia: str | None = None
    company_telefone: str | None = None
    schedule_time: datetime
    status: str
    peso_estimado: float | None = None


class HorarioSlotDTO(CamelModel):
    inicio: str | None = None
    fim: str | None = None


class DisponibilidadeDTO(CamelModel):
    id: int | None = None
    dia_semana: str | None = None
    horarios: list[HorarioSlotDTO] = Field(default_factory=list)
    company: dict[str, Any] | None = None


class FuncionamentoDTO(CamelModel):
    id: int | None = None
    dia_semana: str | None = None
    horario_abertura: str | None = None
    horario_fechamento: str | None = None


class PontoColetaCreate(CamelModel):
    nome: str | None = None
    tipo_residuo: str | None = None
    cep: str | None = None
    endereco: str | None = None
    complemento: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    raio_km: float | None = None
    materiais: list[str] | None = None
    peso_minimo_kg: float | None = None
    peso_maximo_kg: float | None = None
    recebe_materiais: bool | None = None
    coleta_domicilio: bool | None = None
    telefone: str | None = None
    imagem_url: str | None = None
    funcionamento: list[FuncionamentoDTO] = Field(default_factory=list)


class PontoColetaDTO(CamelModel):
    id: int
    nome: str | None = None
    tipo_residuo: str | None = None
    endereco: str | None = None
    complemento: str | None = None
    latitude: float
    longitude: float
    company_id: int | None = None
    company_nome: str | None = None
    raio_km: float | None = None
    materiais: list[str] | None = None
    peso_minimo_kg: float | None = None
    peso_maximo_kg: float | None = None
    recebe_materiais: bool | None = None
    coleta_domicilio: bool | None = None
    telefone: str | None = None
    imagem_url: str | None = None
    funcionamento: list[FuncionamentoDTO] | None = None


class PontoColetaProximoDTO(CamelModel):
    id: int
    nome: str | None = None
    tipo_residuo: str | None = None
    endereco: str | None = None
    complemento: str | None = None
    latitude: float
    longitude: float
    distancia: float
    company_id: int | None = None
    company_nome: str | None = None
    materiais: list[str] | None = None
    peso_minimo_kg: float | None = None
    peso_maximo_kg: float | None = None
    funcionamento: list[FuncionamentoDTO] | None = None


class CepDTO(CamelModel):
    cep: str
    rua: str | None = None
    bairro: str | None = None
    cidade: str | None = None
    estado: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class ResetRequest(CamelModel):
    identifier: str | None = None
    principal_type: str | None = None
    delivery_method: str | None = None


class VerificationRequest(CamelModel):
    principal_type: str | None = None
    code: str | None = None
    new_password: str | None = None


class FeriadoDTO(CamelModel):
    data: str
    motivo: str | None = None
    tipo: str | None = None


class CompanyProfileUpdate(CamelModel):
    nome_fantasia: str | None = None
    razao_social: str | None = None
    descricao: str | None = None
    telefone: str | None = None
    faz_coleta_domicilio: bool | None = None
    materiais_coleta: list[str] | None = None
    peso_minimo_kg: float | None = None
    peso_maximo_kg: float | None = None
    dias_funcionamento: list[str] | None = None
    feriados: list[FeriadoDTO] | None = None
    imagem_local: str | None = None


class PasswordChangeRequest(CamelModel):
    current_password: str | None = None
    new_password: str | None = None


class CompanySummaryDTO(CamelModel):
    id: int
    nome_fantasia: str | None = None
    razao_social: str | None = None
    tipo_residuo: str | None = None
    cep: str | None = None
    profile_picture: str | None = None
