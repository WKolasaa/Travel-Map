from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import AuthUser, resolve_admin_user, resolve_staff_user
from app.data import create_user, get_user_by_id, get_users, update_user
from app.schemas.user import UserCreate, UserDetail, UserSummary, UserUpdate

router = APIRouter(tags=["users"])


@router.get("/admin/users", response_model=list[UserSummary])
def list_users(_: AuthUser = Depends(resolve_staff_user)) -> list[UserSummary]:
    return get_users()


@router.get("/admin/users/{user_id}", response_model=UserDetail)
def get_user(user_id: str, _: AuthUser = Depends(resolve_staff_user)) -> UserDetail:
    user = get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/admin/users", response_model=UserDetail, status_code=status.HTTP_201_CREATED)
def create_user_endpoint(payload: UserCreate, _: AuthUser = Depends(resolve_admin_user)) -> UserDetail:
    try:
        return create_user(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/admin/users/{user_id}", response_model=UserDetail)
def update_user_endpoint(user_id: str, payload: UserUpdate, current_user: AuthUser = Depends(resolve_admin_user)) -> UserDetail:
    if current_user.id == user_id and payload.role is not None and payload.role != "admin":
        raise HTTPException(status_code=400, detail="You cannot remove your own admin role")
    if current_user.id == user_id and payload.is_active is False:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")

    try:
        user = update_user(user_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user
