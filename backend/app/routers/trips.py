from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.core.auth import AuthUser, resolve_admin_user, resolve_editor_user, resolve_optional_authenticated_user, resolve_staff_user
from app.data import create_trip, delete_trip, get_places_for_trip, get_trip_by_slug, get_trip_summaries, get_trip_summaries_page, update_trip
from app.schemas.trip import TripCreate, TripDetail, TripSummary, TripUpdate


router = APIRouter(tags=["trips"])


def _viewer_group_ids(user: AuthUser | None) -> list[str]:
    return user.group_ids if user else []


@router.get("/trips", response_model=list[TripSummary])
def get_trips(
    q: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    year: int | None = Query(default=None),
    user: AuthUser | None = Depends(resolve_optional_authenticated_user),
) -> list[TripSummary]:
    return get_trip_summaries(q=q, tag=tag, year=year, authenticated=user is not None, viewer_group_ids=_viewer_group_ids(user))


@router.get("/trips/query")
def get_trips_query(
    q: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    year: int | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=9, ge=1, le=100),
    user: AuthUser | None = Depends(resolve_optional_authenticated_user),
) -> dict[str, object]:
    items, total = get_trip_summaries_page(
        q=q,
        tag=tag,
        year=year,
        limit=page_size,
        offset=(page - 1) * page_size,
        authenticated=user is not None,
        viewer_group_ids=_viewer_group_ids(user),
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/trips/slug/{slug}", response_model=TripDetail)
def get_trip(slug: str, user: AuthUser | None = Depends(resolve_optional_authenticated_user)) -> TripDetail:
    viewer_group_ids = _viewer_group_ids(user)
    trip = get_trip_by_slug(slug, authenticated=user is not None, viewer_group_ids=viewer_group_ids)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")

    return TripDetail(
        **trip.model_dump(exclude={"places"}),
        places=[place.model_dump() for place in get_places_for_trip(trip.id, authenticated=user is not None, viewer_group_ids=viewer_group_ids)],
    )


@router.get("/admin/trips")
def get_admin_trips_query(
    q: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    year: int | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    route_filter: str | None = Query(default=None, alias="route"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    _: AuthUser = Depends(resolve_staff_user),
) -> dict[str, object]:
    items, total = get_trip_summaries_page(
        public_only=False,
        q=q,
        tag=tag,
        year=year,
        status_filter=status_filter,
        route_filter=route_filter,
        limit=page_size,
        offset=(page - 1) * page_size,
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/admin/trips/slug/{slug}", response_model=TripDetail)
def get_admin_trip(slug: str, _: AuthUser = Depends(resolve_staff_user)) -> TripDetail:
    trip = get_trip_by_slug(slug, public_only=False)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    return TripDetail(**trip.model_dump(exclude={"places"}), places=[place.model_dump() for place in get_places_for_trip(trip.id, public_only=False)])


@router.post("/admin/trips", response_model=TripDetail, status_code=status.HTTP_201_CREATED)
def create_trip_endpoint(payload: TripCreate, _: AuthUser = Depends(resolve_editor_user)) -> TripDetail:
    return create_trip(payload)


@router.patch("/admin/trips/{slug}", response_model=TripDetail)
def update_trip_endpoint(slug: str, payload: TripUpdate, _: AuthUser = Depends(resolve_editor_user)) -> TripDetail:
    trip = update_trip(slug, payload)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.delete("/admin/trips/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip_endpoint(slug: str, _: AuthUser = Depends(resolve_admin_user)) -> Response:
    deleted = delete_trip(slug)
    if not deleted:
        raise HTTPException(status_code=404, detail="Trip not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
