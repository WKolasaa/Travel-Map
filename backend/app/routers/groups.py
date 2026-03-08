from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core.auth import AuthUser, resolve_admin_user, resolve_staff_user
from app.data import create_group, delete_group, get_group_by_id, get_groups, set_group_status, update_group
from app.schemas.group import GroupCreate, GroupDetail, GroupSummary, GroupUpdate

router = APIRouter(tags=["groups"])


@router.get("/admin/groups", response_model=list[GroupSummary])
def list_groups(_: AuthUser = Depends(resolve_staff_user)) -> list[GroupSummary]:
    return get_groups()


@router.get("/admin/groups/{group_id}", response_model=GroupDetail)
def get_group(group_id: str, _: AuthUser = Depends(resolve_staff_user)) -> GroupDetail:
    group = get_group_by_id(group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.post("/admin/groups", response_model=GroupDetail, status_code=status.HTTP_201_CREATED)
def create_group_endpoint(payload: GroupCreate, _: AuthUser = Depends(resolve_admin_user)) -> GroupDetail:
    try:
        return create_group(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/admin/groups/{group_id}", response_model=GroupDetail)
def update_group_endpoint(group_id: str, payload: GroupUpdate, _: AuthUser = Depends(resolve_admin_user)) -> GroupDetail:
    try:
        group = update_group(group_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.post("/admin/groups/{group_id}/archive", response_model=GroupDetail)
def archive_group_endpoint(group_id: str, _: AuthUser = Depends(resolve_admin_user)) -> GroupDetail:
    group = set_group_status(group_id, "archived")
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.post("/admin/groups/{group_id}/restore", response_model=GroupDetail)
def restore_group_endpoint(group_id: str, _: AuthUser = Depends(resolve_admin_user)) -> GroupDetail:
    group = set_group_status(group_id, "active")
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.delete("/admin/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group_endpoint(group_id: str, _: AuthUser = Depends(resolve_admin_user)) -> Response:
    try:
        deleted = delete_group(group_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not deleted:
        raise HTTPException(status_code=404, detail="Group not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
