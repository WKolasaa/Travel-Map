from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import (
    AuthLoginRequest,
    AuthLoginResponse,
    AuthUser,
    authenticate_user,
    create_session_token,
    resolve_authenticated_user,
)


router = APIRouter(tags=["auth"])


@router.post("/auth/login", response_model=AuthLoginResponse)
def login(payload: AuthLoginRequest) -> AuthLoginResponse:
    user = authenticate_user(payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_session_token(user)
    return AuthLoginResponse(token=token, user=user)


@router.get("/auth/me", response_model=AuthUser)
def me(user: AuthUser = Depends(resolve_authenticated_user)) -> AuthUser:
    return user


@router.post("/auth/logout")
def logout() -> dict[str, bool]:
    return {"ok": True}
