from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.core.auth import AuthUser, resolve_admin_user, resolve_editor_user, resolve_optional_authenticated_user, resolve_staff_user
from app.data import (
    create_place,
    delete_place,
    get_place_by_slug,
    get_place_summaries,
    get_place_summaries_page,
    get_places_for_trip,
    update_place,
)
from app.schemas.place import PlaceCreate, PlaceDetail, PlaceSummary, PlaceUpdate


router = APIRouter(tags=["places"])


def _viewer_group_ids(user: AuthUser | None) -> list[str]:
    return user.group_ids if user else []


@router.get("/places", response_model=list[PlaceSummary])
def get_places(
    q: str | None = Query(default=None),
    trip_id: str | None = Query(default=None),
    country: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    user: AuthUser | None = Depends(resolve_optional_authenticated_user),
) -> list[PlaceSummary]:
    return get_place_summaries(
        q=q,
        trip_id=trip_id,
        country=country,
        tag=tag,
        authenticated=user is not None,
        viewer_group_ids=_viewer_group_ids(user),
    )


@router.get("/places/query")
def get_places_query(
    q: str | None = Query(default=None),
    trip_id: str | None = Query(default=None),
    country: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=9, ge=1, le=100),
    user: AuthUser | None = Depends(resolve_optional_authenticated_user),
) -> dict[str, object]:
    items, total = get_place_summaries_page(
        q=q,
        trip_id=trip_id,
        country=country,
        tag=tag,
        limit=page_size,
        offset=(page - 1) * page_size,
        authenticated=user is not None,
        viewer_group_ids=_viewer_group_ids(user),
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/places/slug/{slug}", response_model=PlaceDetail)
def get_place(slug: str, user: AuthUser | None = Depends(resolve_optional_authenticated_user)) -> PlaceDetail:
    place = get_place_by_slug(slug, authenticated=user is not None, viewer_group_ids=_viewer_group_ids(user))
    if place is None:
        raise HTTPException(status_code=404, detail="Place not found")
    return place


@router.get("/places/slug/{slug}/related", response_model=list[PlaceSummary])
def get_related_places(slug: str, user: AuthUser | None = Depends(resolve_optional_authenticated_user)) -> list[PlaceSummary]:
    viewer_group_ids = _viewer_group_ids(user)
    place = get_place_by_slug(slug, authenticated=user is not None, viewer_group_ids=viewer_group_ids)
    if place is None:
        raise HTTPException(status_code=404, detail="Place not found")
    if not place.trip_id:
        return []
    return [PlaceSummary(**related.model_dump()) for related in get_places_for_trip(place.trip_id, authenticated=user is not None, viewer_group_ids=viewer_group_ids) if related.slug != slug]


@router.get("/admin/places")
def get_admin_places_query(
    q: str | None = Query(default=None),
    trip_id: str | None = Query(default=None),
    country: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    assignment: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    _: AuthUser = Depends(resolve_staff_user),
) -> dict[str, object]:
    items, total = get_place_summaries_page(
        public_only=False,
        q=q,
        trip_id=trip_id,
        country=country,
        tag=tag,
        status_filter=status_filter,
        assignment=assignment,
        limit=page_size,
        offset=(page - 1) * page_size,
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/admin/places/slug/{slug}", response_model=PlaceDetail)
def get_admin_place(slug: str, _: AuthUser = Depends(resolve_staff_user)) -> PlaceDetail:
    place = get_place_by_slug(slug, public_only=False)
    if place is None:
        raise HTTPException(status_code=404, detail="Place not found")
    return place


@router.post("/admin/places", response_model=PlaceDetail, status_code=status.HTTP_201_CREATED)
def create_place_endpoint(payload: PlaceCreate, _: AuthUser = Depends(resolve_editor_user)) -> PlaceDetail:
    return create_place(payload)


@router.patch("/admin/places/{slug}", response_model=PlaceDetail)
def update_place_endpoint(slug: str, payload: PlaceUpdate, _: AuthUser = Depends(resolve_editor_user)) -> PlaceDetail:
    place = update_place(slug, payload)
    if place is None:
        raise HTTPException(status_code=404, detail="Place not found")
    return place


@router.delete("/admin/places/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_place_endpoint(slug: str, _: AuthUser = Depends(resolve_admin_user)) -> Response:
    deleted = delete_place(slug)
    if not deleted:
        raise HTTPException(status_code=404, detail="Place not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
