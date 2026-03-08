from fastapi import APIRouter, Depends, Query

from app.core.auth import AuthUser, resolve_optional_authenticated_user, resolve_staff_user
from app.data import get_place_summaries, get_trip_summaries
from app.schemas.place import PlaceSummary
from app.schemas.trip import TripSummary


router = APIRouter(tags=["map"])



def _sorted_unique(values: list[str]) -> list[str]:
    return sorted({value for value in values if value})



def _viewer_group_ids(user: AuthUser | None) -> list[str]:
    if user is None:
        return []
    full_user = get_user_by_id(user.id)
    if full_user is None:
        return []
    return [group.id for group in full_user.groups if group.status == "active"]


@router.get("/map/places", response_model=list[PlaceSummary])
def get_map_places(
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


@router.get("/bootstrap")
def get_bootstrap(user: AuthUser | None = Depends(resolve_optional_authenticated_user)) -> dict[str, list[PlaceSummary] | list[TripSummary]]:
    viewer_group_ids = _viewer_group_ids(user)
    return {
        "places": get_place_summaries(authenticated=user is not None, viewer_group_ids=viewer_group_ids),
        "trips": get_trip_summaries(authenticated=user is not None, viewer_group_ids=viewer_group_ids),
    }


@router.get("/facets/places")
def get_place_facets(
    q: str | None = Query(default=None),
    trip_id: str | None = Query(default=None),
    country: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    user: AuthUser | None = Depends(resolve_optional_authenticated_user),
) -> dict[str, list[str] | list[dict[str, str]]]:
    viewer_group_ids = _viewer_group_ids(user)
    places = get_place_summaries(q=q, trip_id=trip_id, country=country, tag=tag, authenticated=user is not None, viewer_group_ids=viewer_group_ids)
    trips = get_trip_summaries(authenticated=user is not None, viewer_group_ids=viewer_group_ids)
    return {
        "countries": _sorted_unique([place.country for place in places]),
        "tags": _sorted_unique([tag_name for place in places for tag_name in place.tags]),
        "trips": [
            {"id": trip.id, "title": trip.title}
            for trip in trips
        ],
    }


@router.get("/facets/trips")
def get_trip_facets(
    q: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    year: int | None = Query(default=None),
    user: AuthUser | None = Depends(resolve_optional_authenticated_user),
) -> dict[str, list[str]]:
    trips = get_trip_summaries(q=q, tag=tag, year=year, authenticated=user is not None, viewer_group_ids=_viewer_group_ids(user))
    return {
        "tags": _sorted_unique([tag_name for trip in trips for tag_name in trip.tags]),
        "years": sorted({trip.start_date[:4] for trip in trips if trip.start_date}, reverse=True),
    }


@router.get("/facets/timeline")
def get_timeline_facets(user: AuthUser | None = Depends(resolve_optional_authenticated_user)) -> dict[str, list[str] | list[dict[str, str]]]:
    viewer_group_ids = _viewer_group_ids(user)
    places = get_place_summaries(authenticated=user is not None, viewer_group_ids=viewer_group_ids)
    trips = get_trip_summaries(authenticated=user is not None, viewer_group_ids=viewer_group_ids)
    years = sorted(
        {entry.start_date[:4] for entry in [*places, *trips] if entry.start_date},
        reverse=True,
    )
    return {
        "years": years,
        "tags": _sorted_unique([
            *[tag_name for place in places for tag_name in place.tags],
            *[tag_name for trip in trips for tag_name in trip.tags],
        ]),
        "trips": [{"id": trip.id, "title": trip.title} for trip in trips],
        "kinds": ["all", "place", "trip"],
    }


@router.get("/admin/bootstrap")
def get_admin_bootstrap(_: AuthUser = Depends(resolve_staff_user)) -> dict[str, list[PlaceSummary] | list[TripSummary]]:
    return {
        "places": get_place_summaries(public_only=False),
        "trips": get_trip_summaries(public_only=False),
    }
