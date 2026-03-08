from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.auth import AuthUser, resolve_editor_user
from app.media import save_upload

router = APIRouter(tags=["media"])


@router.post("/admin/uploads")
def upload_media(
    _: AuthUser = Depends(resolve_editor_user),
    file: UploadFile = File(...),
) -> dict[str, str]:
    try:
        url = save_upload(file)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    finally:
        file.file.close()

    return {"url": url}
