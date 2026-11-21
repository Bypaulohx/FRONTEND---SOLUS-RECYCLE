"""Entidades portadas do backend Java (com.projeto.ads.entities)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship

from .database import Base


class Endereco(Base):
    __tablename__ = "endereco"

    id = Column(Integer, primary_key=True, index=True)
    cep = Column(String, nullable=True)
    rua = Column(String, nullable=True)
    numero = Column(String, nullable=True)
    complemento = Column(String, nullable=True)
    bairro = Column(String, nullable=True)
    cidade = Column(String, nullable=True)
    estado = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)


class User(Base):
    __tablename__ = "tb_users"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=True)
    cpf = Column(String, unique=True, nullable=True, index=True)
    email = Column(String, unique=True, nullable=True, index=True)
    senha = Column(String, nullable=True)
    telefone = Column(String, nullable=True)
    endereco_id = Column(Integer, ForeignKey("endereco.id"), nullable=True)
    profile_picture = Column(String, nullable=True)
    last_update_date = Column(DateTime, nullable=True)

    endereco = relationship("Endereco", cascade="all, delete-orphan", single_parent=True)


class Company(Base):
    __tablename__ = "tb_companies"

    id = Column(Integer, primary_key=True, index=True)
    razao_social = Column(String, nullable=True)
    nome_fantasia = Column(String, nullable=True)
    cnpj = Column(String, unique=True, nullable=True, index=True)
    email = Column(String, unique=True, nullable=True, index=True)
    senha = Column(String, nullable=True)
    telefone = Column(String, nullable=True)
    descricao = Column(String, nullable=True)
    tipo_residuo = Column(String, nullable=True)
    faz_coleta_domicilio = Column(Boolean, nullable=False, default=False)
    materiais_coleta = Column(Text, nullable=True)
    peso_minimo_kg = Column(Float, nullable=True)
    peso_maximo_kg = Column(Float, nullable=True)
    dias_funcionamento = Column(Text, nullable=True)
    feriados = Column(Text, nullable=True)
    imagem_local = Column(String, nullable=True)
    endereco_id = Column(Integer, ForeignKey("endereco.id"), nullable=True)
    profile_picture = Column(String, nullable=True)
    last_update_date = Column(DateTime, nullable=True)

    endereco = relationship("Endereco", cascade="all, delete-orphan", single_parent=True)


class Agendamento(Base):
    __tablename__ = "tb_agendamento"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_users.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("tb_companies.id"), nullable=False, index=True)
    tipo_residuo = Column(String, nullable=False)
    peso_estimado = Column(Float, nullable=True)
    schedule_time = Column(DateTime, nullable=False)
    status = Column(String, nullable=False, default="PENDENTE")

    user = relationship("User")
    company = relationship("Company")


class PontoColeta(Base):
    __tablename__ = "ponto_coleta"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=True)
    tipo_residuo = Column(String, nullable=True)
    endereco = Column(String, nullable=True)
    complemento = Column(String, nullable=True)
    latitude = Column(Float, nullable=False, default=0.0)
    longitude = Column(Float, nullable=False, default=0.0)
    company_id = Column(Integer, nullable=True, index=True)
    raio_atendimento_km = Column(Float, nullable=True, default=5)
    materiais_coleta = Column(Text, nullable=True)
    peso_minimo_kg = Column(Float, nullable=True)
    peso_maximo_kg = Column(Float, nullable=True)
    recebe_materiais = Column(Boolean, nullable=True, default=True)
    coleta_domicilio = Column(Boolean, nullable=True, default=True)
    telefone = Column(String, nullable=True)
    imagem_url = Column(String, nullable=True)

    funcionamento = relationship(
        "HorarioFuncionamentoPonto",
        cascade="all, delete-orphan",
        back_populates="ponto",
    )


class HorarioFuncionamentoPonto(Base):
    __tablename__ = "horario_funcionamento_ponto"

    id = Column(Integer, primary_key=True, index=True)
    ponto_coleta_id = Column(Integer, ForeignKey("ponto_coleta.id"), nullable=False)
    dia_semana = Column(String, nullable=True)
    horario_abertura = Column(String, nullable=True)
    horario_fechamento = Column(String, nullable=True)

    ponto = relationship("PontoColeta", back_populates="funcionamento")


class Disponibilidade(Base):
    __tablename__ = "disponibilidade"

    id = Column(Integer, primary_key=True, index=True)
    dia_semana = Column("dia_semana", String, nullable=True)
    company_id = Column(Integer, ForeignKey("tb_companies.id"), nullable=True, index=True)

    company = relationship("Company")
    horarios = relationship(
        "HorarioSlot", cascade="all, delete-orphan", back_populates="disponibilidade"
    )


class HorarioSlot(Base):
    __tablename__ = "disponibilidade_horarios"

    id = Column(Integer, primary_key=True, index=True)
    disponibilidade_id = Column(Integer, ForeignKey("disponibilidade.id"), nullable=False)
    horario_inicio = Column(String, nullable=True)
    horario_fim = Column(String, nullable=True)

    disponibilidade = relationship("Disponibilidade", back_populates="horarios")


class PasswordResetToken(Base):
    __tablename__ = "tb_password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    principal_id = Column(String, nullable=True, index=True)
    principal_type = Column(String, nullable=True)
    token = Column(String, nullable=True, index=True)
    expiry_date = Column(DateTime, nullable=True)
    delivery_method = Column(String, nullable=True)
    destination = Column(String, nullable=True)


class VerificationCode(Base):
    __tablename__ = "tb_verification_codes"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    code = Column(String, nullable=True)
    account_type = Column(String, nullable=True)
    registration_data = Column(Text, nullable=True)
    expiry_date = Column(DateTime, nullable=True)

    def is_expired(self) -> bool:
        return self.expiry_date is not None and datetime.now() > self.expiry_date
