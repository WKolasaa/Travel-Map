from pathlib import Path
import os
from uuid import uuid4

from fastapi import UploadFile

MEDIA_ROOT = Path(os.getenv("MEDIA_ROOT", Path(__file__).resolve().parent.parent / "media"))
MEDIA_URL_PREFIX = os.getenv("MEDIA_URL_PREFIX", "/media")
ALLOWED_MEDIA_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
}
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))


def ensure_media_root() -> None:
    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)


ensure_media_root()


def sanitize_extension(filename: str | None, content_type: str | None) -> str:
    extension = Path(filename or "").suffix.lower()
    if extension in ALLOWED_MEDIA_EXTENSIONS:
        return extension
    if content_type == "image/jpeg":
        return ".jpg"
    if content_type == "image/png":
        return ".png"
    if content_type == "image/webp":
        return ".webp"
    if content_type == "image/gif":
        return ".gif"
    if content_type == "image/avif":
        return ".avif"
    return ""


def save_upload(file: UploadFile) -> str:
    content_type = file.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError("Unsupported file type")

    extension = sanitize_extension(file.filename, content_type)
    if not extension:
        raise ValueError("Unsupported file extension")

    ensure_media_root()
    filename = f"{uuid4().hex}{extension}"
    destination = MEDIA_ROOT / filename

    size = 0
    with destination.open("wb") as output:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                output.close()
                destination.unlink(missing_ok=True)
                raise ValueError("File exceeds upload size limit")
            output.write(chunk)

    return f"{MEDIA_URL_PREFIX}/{filename}"