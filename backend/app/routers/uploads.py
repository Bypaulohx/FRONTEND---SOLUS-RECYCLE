"""UploadController — foto de perfil de usuários e empresas."""

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from ..auth import AccountContext, get_current_account
from ..database import get_db
from ..models import Company, User
from ..schemas import MessageResponse
from ..services import storage_service
from ..utils import error_response

router = APIRouter(tags=["uploads"])


@router.post("/api/uploads/profile-picture")
async def upload_foto_perfil(
    file: UploadFile = File(...),
    ctx: AccountContext = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    content = await file.read()
    folder = "usuarios" if ctx.role == "USER" else "empresas"
    url = storage_service.upload_file(file, content, folder)

    if ctx.role == "USER":
        account = db.query(User).filter(User.email == ctx.email).first()
        not_found = "Usuário não encontrado"
        message = "Foto de usuário atualizada com sucesso."
    else:
        account = db.query(Company).filter(Company.email == ctx.email).first()
        not_found = "Empresa não encontrada"
        message = "Foto de empresa atualizada com sucesso."

    if account is None:
        return error_response(500, "500 INTERNAL_SERVER_ERROR", not_found)
    account.profile_picture = url
    db.commit()
    return MessageResponse(message=message, url=url).model_dump(by_alias=True)
