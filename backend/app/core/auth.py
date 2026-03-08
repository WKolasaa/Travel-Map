import base64
import binascii
import hashlib
import hmac
import json
import os
import time
from collections.abc import Callable
from typing import Any

from fastapi import Cookie, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.data import get_user_auth_by_email, get_user_by_id
from app.schemas.user import UserRole

SESSION_SECRET = os.getenv("SESSION_SECRET", "dev-session-secret-change-me")
SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", str(60 * 60 * 24)))
PASSWORD_SALT = os.getenv("PASSWORD_SALT", "travel-map-salt")


class AuthLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthUser(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: UserRole
    group_ids: list[str] = Field(default_factory=list)


class AuthLoginResponse(BaseModel):
    token: str
    user: AuthUser


ROLE_RANK: dict[UserRole, int] = {
    "viewer": 1,
    "editor": 2,
    "admin": 3,
}


def hash_password(password: str) -> str:
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        PASSWORD_SALT.encode("utf-8"),
        120_000,
    )
    return base64.urlsafe_b64encode(hashed).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return hmac.compare_digest(hash_password(password), password_hash)


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _unb64(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("utf-8"))


def create_session_token(user: AuthUser) -> str:
    payload = {
        "uid": user.id,
        "sub": user.email,
        "name": user.name,
        "role": user.role,
        "exp": int(time.time()) + SESSION_TTL_SECONDS,
    }
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    payload_segment = _b64(payload_bytes)
    signature = hmac.new(SESSION_SECRET.encode("utf-8"), payload_segment.encode("utf-8"), hashlib.sha256).digest()
    return f"{payload_segment}.{_b64(signature)}"


def parse_session_token(token: str) -> AuthUser | None:
    try:
        payload_segment, signature_segment = token.split(".", 1)
    except ValueError:
        return None

    expected_signature = hmac.new(
        SESSION_SECRET.encode("utf-8"),
        payload_segment.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    try:
        actual_signature = _unb64(signature_segment)
        payload: dict[str, Any] = json.loads(_unb64(payload_segment).decode("utf-8"))
    except (binascii.Error, json.JSONDecodeError, UnicodeDecodeError, ValueError):
        return None

    if not hmac.compare_digest(expected_signature, actual_signature):
        return None

    if int(payload.get("exp", 0)) < int(time.time()):
        return None

    role = payload.get("role")
    if role not in ROLE_RANK:
        return None

    try:
        return AuthUser(
            id=str(payload["uid"]),
            email=str(payload["sub"]),
            name=str(payload.get("name", payload["sub"])),
            role=role,
            group_ids=[],
        )
    except KeyError:
        return None


def authenticate_user(email: str, password: str) -> AuthUser | None:
    record = get_user_auth_by_email(email)
    if record is None or not record["is_active"]:
        return None
    if not verify_password(password, record["password_hash"]):
        return None
    user = get_user_by_id(record["id"])
    if user is None:
        return AuthUser(
            id=record["id"],
            email=record["email"],
            name=record["name"],
            role=record["role"],
            group_ids=[],
        )
    return AuthUser(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        group_ids=[group.id for group in user.groups if getattr(group, "status", "active") == "active"],
    )


def resolve_optional_user(
    authorization: str | None = Header(default=None),
    admin_session: str | None = Cookie(default=None, alias="tm_admin_session"),
) -> AuthUser | None:
    token = admin_session
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()

    if not token:
        return None

    session_user = parse_session_token(token)
    if session_user is None:
        return None

    current_user = get_user_by_id(session_user.id)
    if current_user is None or not current_user.is_active:
        return None

    return AuthUser(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        group_ids=[group.id for group in current_user.groups if getattr(group, "status", "active") == "active"],
    )


def resolve_authenticated_user(user: AuthUser | None = Depends(resolve_optional_user)) -> AuthUser:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user


def require_role(*allowed_roles: UserRole) -> Callable[..., AuthUser]:
    def dependency(user: AuthUser = Depends(resolve_authenticated_user)) -> AuthUser:
        if user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return dependency


resolve_staff_user = require_role("viewer", "editor", "admin")
resolve_editor_user = require_role("editor", "admin")
resolve_admin_user = require_role("admin")

resolve_optional_authenticated_user = resolve_optional_user
