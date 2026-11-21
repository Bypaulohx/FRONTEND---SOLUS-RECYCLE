"""Integração de e-mail (Brevo).

Quando BREVO_API_KEY não está configurada, o envio é apenas registrado em log,
equivalente ao comportamento tolerante a falhas do EmailService Java (todas as
chamadas são envolvidas em try/catch e nunca quebram a requisição).
"""

from __future__ import annotations

import logging

import httpx

from ..config import get_settings

logger = logging.getLogger("solus.email")

settings = get_settings()

SENDER = {"email": "solusrecycle@adsfasec.com.br", "name": "Solus Recycle"}

# IDs dos templates do Brevo, idênticos aos do projeto Java.
VERIFICATION_CODE = 2
PASSWORD_RESET_CODE = 3
WELCOME = 4
PASSWORD_CHANGED = 5
NEW_COLLECTION_POINT = 6
NEW_APPOINTMENT = 7
APPOINTMENT_STATUS = 8
PHONE_CHANGED = 9


def get_saudacao_simples(name: str | None) -> str:
    if not name:
        return "Usuário(a)"
    return name.split(" ")[0]


def send_template(
    template_id: int, to_email: str | None, to_name: str | None, params: dict
) -> None:
    if not to_email:
        return
    payload = {
        "sender": SENDER,
        "to": [{"email": to_email, "name": to_name or "Usuário(a)"}],
        "templateId": template_id,
        "params": params,
    }
    if not settings.brevo_api_key:
        logger.info("Brevo não configurado; e-mail simulado: %s", payload)
        return
    try:
        response = httpx.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "api-key": settings.brevo_api_key,
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=10,
        )
        response.raise_for_status()
    except Exception as exc:  # noqa: BLE001 - o Java engole falhas de e-mail
        logger.warning("Falha ao enviar e-mail (template %s): %s", template_id, exc)


def send_verification_code(to_email: str, name: str, code: str) -> None:
    send_template(
        VERIFICATION_CODE,
        to_email,
        name,
        {"NOME": get_saudacao_simples(name), "CODIGO": code},
    )


def send_reset_code(to_email: str, name: str, code: str) -> None:
    send_template(
        PASSWORD_RESET_CODE,
        to_email,
        name,
        {"NOME": get_saudacao_simples(name), "CODIGO": code},
    )


def send_welcome(to_email: str, name: str) -> None:
    send_template(WELCOME, to_email, name, {"NOME": get_saudacao_simples(name)})


def send_password_changed(to_email: str, name: str) -> None:
    send_template(PASSWORD_CHANGED, to_email, name, {"NOME": get_saudacao_simples(name)})


def send_new_collection_point(to_email: str, name: str, ponto_nome: str) -> None:
    send_template(
        NEW_COLLECTION_POINT,
        to_email,
        name,
        {"NOME": get_saudacao_simples(name), "PONTO_NOME": ponto_nome},
    )


def send_new_appointment(
    to_email: str,
    company_name: str,
    user_name: str,
    data: str,
    tipo: str,
    peso: float | None,
) -> None:
    send_template(
        NEW_APPOINTMENT,
        to_email,
        company_name,
        {
            "NOME_EMPRESA": get_saudacao_simples(company_name),
            "NOME_USUARIO": user_name or "",
            "DATA": data,
            "TIPO": tipo or "",
            "PESO": f"{peso:.1f}" if peso is not None else "0.0",
        },
    )


def send_appointment_status(
    to_email: str, name: str, status_description: str, data: str, empresa: str
) -> None:
    send_template(
        APPOINTMENT_STATUS,
        to_email,
        name,
        {
            "NOME": get_saudacao_simples(name),
            "STATUS": status_description,
            "DATA": data,
            "EMPRESA": empresa or "",
        },
    )


def send_phone_changed(to_email: str, name: str, new_phone: str) -> None:
    send_template(
        PHONE_CHANGED,
        to_email,
        name,
        {"NOME": get_saudacao_simples(name), "NOVO_FONE": new_phone},
    )
