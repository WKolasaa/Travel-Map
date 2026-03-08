import json
import os
from uuid import uuid4

from app.db import get_connection
from app.schemas.group import GroupCreate, GroupDetail, GroupSummary, GroupUpdate
from app.schemas.place import PlaceCreate, PlaceDetail, PlaceSummary, PlaceUpdate
from app.schemas.trip import TripCreate, TripDetail, TripSummary, TripUpdate
from app.schemas.user import UserCreate, UserDetail, UserSummary, UserUpdate

PUBLISHED_STATUS = "published"
DEFAULT_ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
DEFAULT_ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
DEFAULT_ADMIN_NAME = os.getenv("ADMIN_NAME", "Admin")

DEFAULT_TRIPS = [
    {
        "id": "trip-japan-2023",
        "title": "Japan Autumn 2023",
        "slug": "japan-autumn-2023",
        "summary": "Cities, onsen towns, and coastal stops across a two-week route.",
        "description": "A two-week route built around high-contrast rhythm changes: Tokyo density, Kyoto quiet, and a final coastal reset before flying home.",
        "start_date": "2023-10-03",
        "end_date": "2023-10-17",
        "color": "#f3b544",
        "cover_image_url": "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1600&q=80",
        "route_enabled": True,
        "tags": ["autumn", "rail", "cities"],
        "status": "published",
    },
    {
        "id": "trip-italy-2022",
        "title": "Italy Summer 2022",
        "slug": "italy-summer-2022",
        "summary": "A dense train itinerary through Rome, Florence, and the Amalfi Coast.",
        "description": "Fast transfers, long dinners, and a route that moved from city weight to bright coastal air without losing momentum.",
        "start_date": "2022-06-08",
        "end_date": "2022-06-18",
        "color": "#7dd8c6",
        "cover_image_url": "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=80",
        "route_enabled": True,
        "tags": ["summer", "food", "rail"],
        "status": "published",
    },
]

DEFAULT_PLACES = [
    {
        "id": "tokyo-shinjuku",
        "title": "Tokyo, Shinjuku Nights",
        "slug": "tokyo-shinjuku-nights",
        "summary": "Neon streets, late ramen, and the first reset after landing.",
        "description": "Shinjuku was the decompression zone after the flight: narrow ramen counters, fluorescent crossings, and a pace that forced attention back into the present.",
        "city": "Tokyo",
        "country": "Japan",
        "latitude": 35.6938,
        "longitude": 139.7034,
        "start_date": "2023-10-03",
        "end_date": "2023-10-05",
        "marker_color": "#f3b544",
        "trip_id": "trip-japan-2023",
        "image_url": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
        "gallery": [
            "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=1200&q=80",
        ],
        "tags": ["city", "food", "night"],
        "visibility": "public",
        "companions": ["Marta", "Kacper"],
        "rating": 5,
        "trip_order": 1,
        "status": "published",
    },
    {
        "id": "kyoto-gion",
        "title": "Kyoto, Gion Walks",
        "slug": "kyoto-gion-walks",
        "summary": "Slow mornings, temple steps, and narrow side streets after rain.",
        "description": "Kyoto shifted the trip into a slower cadence. The strongest memory is not a single sight but the transition between temple courtyards and almost-empty streets after rain.",
        "city": "Kyoto",
        "country": "Japan",
        "latitude": 35.0037,
        "longitude": 135.7788,
        "start_date": "2023-10-07",
        "end_date": "2023-10-09",
        "marker_color": "#f3b544",
        "trip_id": "trip-japan-2023",
        "image_url": "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80",
        "gallery": [
            "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1478432780021-b8d273730d8c?auto=format&fit=crop&w=1200&q=80",
        ],
        "tags": ["temples", "walking", "autumn"],
        "visibility": "public",
        "companions": ["Marta", "Kacper"],
        "rating": 5,
        "trip_order": 2,
        "status": "published",
    },
    {
        "id": "rome-trastevere",
        "title": "Rome, Trastevere",
        "slug": "rome-trastevere",
        "summary": "Warm evenings, stone alleys, and one perfectly unplanned dinner.",
        "description": "The route through Trastevere worked because nothing was optimized. We followed side streets, sat down late, and let the district set the tempo for the evening.",
        "city": "Rome",
        "country": "Italy",
        "latitude": 41.8897,
        "longitude": 12.4663,
        "start_date": "2022-06-08",
        "end_date": "2022-06-10",
        "marker_color": "#7dd8c6",
        "trip_id": "trip-italy-2022",
        "image_url": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80",
        "gallery": [
            "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1200&q=80",
        ],
        "tags": ["city", "food", "summer"],
        "visibility": "public",
        "companions": ["Marta"],
        "rating": 4,
        "trip_order": 1,
        "status": "published",
    },
    {
        "id": "amalfi-ravello",
        "title": "Ravello Clifftops",
        "slug": "ravello-clifftops",
        "summary": "A higher, quieter angle on the coast with sea haze below the gardens.",
        "description": "Ravello felt separate from the louder rhythm of the coast. The memory is mostly altitude, pale haze, and the sense of distance opening underneath the terraces.",
        "city": "Ravello",
        "country": "Italy",
        "latitude": 40.6499,
        "longitude": 14.6118,
        "start_date": "2022-06-15",
        "end_date": "2022-06-16",
        "marker_color": "#7dd8c6",
        "trip_id": "trip-italy-2022",
        "image_url": "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
        "gallery": [
            "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=1200&q=80",
        ],
        "tags": ["coast", "viewpoint", "summer"],
        "visibility": "public",
        "companions": ["Marta"],
        "rating": 5,
        "trip_order": 2,
        "status": "published",
    },
]


def serialize_list(values: list[str]) -> str:
    return json.dumps(values)



def deserialize_list(value: str | None) -> list[str]:
    if not value:
        return []
    return json.loads(value)



def place_summary(place: PlaceDetail) -> PlaceSummary:
    return PlaceSummary(**place.model_dump())



def trip_summary(trip: TripDetail) -> TripSummary:
    return TripSummary(**trip.model_dump(exclude={"description", "places"}))



def user_summary(user: UserDetail) -> UserSummary:
    return UserSummary(**user.model_dump(exclude={"updated_at"}))



def group_summary(group: GroupDetail) -> GroupSummary:
    return GroupSummary(**group.model_dump(exclude={"updated_at", "member_ids"}))



def trip_from_row(row: dict, places: list[PlaceSummary] | None = None) -> TripDetail:
    return TripDetail(
        id=row["id"],
        title=row["title"],
        slug=row["slug"],
        summary=row["summary"],
        description=row["description"],
        start_date=str(row["start_date"]),
        end_date=str(row["end_date"]),
        route_enabled=bool(row["route_enabled"]),
        color=row["color"],
        cover_image_url=row["cover_image_url"],
        tags=deserialize_list(row["tags"]),
        status=row["status"],
        places=places or [],
    )



def place_from_row(row: dict) -> PlaceDetail:
    return PlaceDetail(
        id=row["id"],
        title=row["title"],
        slug=row["slug"],
        city=row["city"],
        country=row["country"],
        latitude=row["latitude"],
        longitude=row["longitude"],
        summary=row["summary"],
        trip_id=row["trip_id"],
        marker_color=row["marker_color"],
        image_url=row["image_url"],
        tags=deserialize_list(row["tags"]),
        visibility=row["visibility"],
        start_date=str(row["start_date"]),
        end_date=str(row["end_date"]),
        status=row["status"],
        description=row["description"],
        gallery=deserialize_list(row["gallery"]),
        companions=deserialize_list(row["companions"]),
        rating=row["rating"],
        trip_order=row["trip_order"],
    )



def group_from_row(row: dict, member_ids: list[str] | None = None) -> GroupDetail:
    return GroupDetail(
        id=row["id"],
        name=row["name"],
        slug=row["slug"],
        description=row["description"],
        member_count=int(row.get("member_count", 0)),
        created_at=str(row["created_at"]),
        updated_at=str(row["updated_at"]),
        member_ids=member_ids or [],
    )



def user_from_row(row: dict, groups: list[GroupSummary] | None = None) -> UserDetail:
    return UserDetail(
        id=row["id"],
        email=row["email"],
        name=row["name"],
        role=row["role"],
        is_active=bool(row["is_active"]),
        created_at=str(row["created_at"]),
        updated_at=str(row["updated_at"]),
        groups=groups or [],
    )



def insert_trip(cursor, payload: dict[str, object]) -> None:
    cursor.execute(
        """
        INSERT INTO trips (id, title, slug, summary, description, start_date, end_date, route_enabled, color, cover_image_url, tags, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            payload["id"], payload["title"], payload["slug"], payload["summary"], payload["description"],
            payload["start_date"], payload["end_date"], payload["route_enabled"], payload["color"],
            payload["cover_image_url"], serialize_list(payload["tags"]), payload["status"],
        ),
    )



def insert_place(cursor, payload: dict[str, object]) -> None:
    cursor.execute(
        """
        INSERT INTO places (
          id, title, slug, summary, description, city, country, latitude, longitude,
          start_date, end_date, marker_color, trip_id, image_url, gallery, tags,
          visibility, companions, rating, trip_order, status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            payload["id"], payload["title"], payload["slug"], payload["summary"], payload["description"], payload["city"],
            payload["country"], payload["latitude"], payload["longitude"], payload["start_date"], payload["end_date"],
            payload["marker_color"], payload["trip_id"], payload["image_url"], serialize_list(payload["gallery"]),
            serialize_list(payload["tags"]), payload["visibility"], serialize_list(payload["companions"]), payload["rating"],
            payload["trip_order"], payload["status"],
        ),
    )



def insert_user(cursor, payload: dict[str, object]) -> None:
    cursor.execute(
        """
        INSERT INTO users (id, email, name, password_hash, role, is_active)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            payload["id"],
            payload["email"],
            payload["name"],
            payload["password_hash"],
            payload["role"],
            payload["is_active"],
        ),
    )



def insert_group(cursor, payload: dict[str, object]) -> None:
    cursor.execute(
        """
        INSERT INTO groups (id, name, slug, description)
        VALUES (%s, %s, %s, %s)
        """,
        (
            payload["id"],
            payload["name"],
            payload["slug"],
            payload["description"],
        ),
    )



def seed_database() -> None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) AS count FROM trips")
            trip_count = cursor.fetchone()["count"]
            cursor.execute("SELECT COUNT(*) AS count FROM places")
            place_count = cursor.fetchone()["count"]
            if trip_count == 0 and place_count == 0:
                for trip in DEFAULT_TRIPS:
                    insert_trip(cursor, trip)
                for place in DEFAULT_PLACES:
                    insert_place(cursor, place)
        connection.commit()



def seed_users() -> None:
    from app.core.auth import hash_password

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE email = %s", (DEFAULT_ADMIN_EMAIL,))
            existing = cursor.fetchone()
            if existing is None:
                insert_user(
                    cursor,
                    {
                        "id": f"user-{uuid4().hex[:8]}",
                        "email": DEFAULT_ADMIN_EMAIL,
                        "name": DEFAULT_ADMIN_NAME,
                        "password_hash": hash_password(DEFAULT_ADMIN_PASSWORD),
                        "role": "admin",
                        "is_active": True,
                    },
                )
        connection.commit()



def initialize_database() -> None:
    seed_database()
    seed_users()



def slugify(value: str) -> str:
    return value.strip().lower().replace(" ", "-")



def unique_slug(cursor, table: str, base_slug: str, exclude_id: str | None = None) -> str:
    slug = base_slug
    index = 2
    while True:
        cursor.execute(f"SELECT id FROM {table} WHERE slug = %s", (slug,))
        row = cursor.fetchone()
        if row is None or (exclude_id is not None and row["id"] == exclude_id):
            return slug
        slug = f"{base_slug}-{index}"
        index += 1



def validate_group_ids(cursor, group_ids: list[str]) -> list[str]:
    normalized = list(dict.fromkeys(group_ids))
    if not normalized:
        return []

    cursor.execute("SELECT id FROM groups WHERE id = ANY(%s)", (normalized,))
    found_ids = {row["id"] for row in cursor.fetchall()}
    missing_ids = [group_id for group_id in normalized if group_id not in found_ids]
    if missing_ids:
        raise ValueError(f"Unknown group ids: {', '.join(missing_ids)}")
    return normalized



def validate_user_ids(cursor, user_ids: list[str]) -> list[str]:
    normalized = list(dict.fromkeys(user_ids))
    if not normalized:
        return []

    cursor.execute("SELECT id FROM users WHERE id = ANY(%s)", (normalized,))
    found_ids = {row["id"] for row in cursor.fetchall()}
    missing_ids = [user_id for user_id in normalized if user_id not in found_ids]
    if missing_ids:
        raise ValueError(f"Unknown user ids: {', '.join(missing_ids)}")
    return normalized



def set_user_group_memberships(cursor, user_id: str, group_ids: list[str]) -> None:
    cursor.execute("DELETE FROM user_groups WHERE user_id = %s", (user_id,))
    for group_id in group_ids:
        cursor.execute(
            "INSERT INTO user_groups (user_id, group_id) VALUES (%s, %s)",
            (user_id, group_id),
        )



def set_group_memberships(cursor, group_id: str, user_ids: list[str]) -> None:
    cursor.execute("DELETE FROM user_groups WHERE group_id = %s", (group_id,))
    for user_id in user_ids:
        cursor.execute(
            "INSERT INTO user_groups (user_id, group_id) VALUES (%s, %s)",
            (user_id, group_id),
        )



def fetch_groups_for_users(cursor, user_ids: list[str]) -> dict[str, list[GroupSummary]]:
    if not user_ids:
        return {}

    cursor.execute(
        """
        SELECT ug.user_id, g.id, g.name, g.slug, g.description, g.created_at
        FROM user_groups ug
        JOIN groups g ON g.id = ug.group_id
        WHERE ug.user_id = ANY(%s)
        ORDER BY g.name ASC
        """,
        (user_ids,),
    )
    mapping = {user_id: [] for user_id in user_ids}
    for row in cursor.fetchall():
        mapping.setdefault(row["user_id"], []).append(
            GroupSummary(
                id=row["id"],
                name=row["name"],
                slug=row["slug"],
                description=row["description"],
                member_count=0,
                created_at=str(row["created_at"]),
            )
        )
    return mapping



def fetch_member_ids_for_groups(cursor, group_ids: list[str]) -> dict[str, list[str]]:
    if not group_ids:
        return {}

    cursor.execute(
        """
        SELECT group_id, user_id
        FROM user_groups
        WHERE group_id = ANY(%s)
        ORDER BY user_id ASC
        """,
        (group_ids,),
    )
    mapping = {group_id: [] for group_id in group_ids}
    for row in cursor.fetchall():
        mapping.setdefault(row["group_id"], []).append(row["user_id"])
    return mapping



def _build_place_filters(
    *,
    public_only: bool,
    q: str | None = None,
    trip_id: str | None = None,
    country: str | None = None,
    tag: str | None = None,
    status_filter: str | None = None,
    assignment: str | None = None,
) -> tuple[str, list[object]]:
    filters: list[str] = []
    params: list[object] = []

    if public_only:
        filters.append("status = %s")
        params.append(PUBLISHED_STATUS)
    elif status_filter:
        filters.append("status = %s")
        params.append(status_filter)

    if q:
        filters.append("(LOWER(title) LIKE %s OR LOWER(city) LIKE %s OR LOWER(country) LIKE %s OR LOWER(summary) LIKE %s OR LOWER(tags) LIKE %s)")
        normalized = f"%{q.strip().lower()}%"
        params.extend([normalized, normalized, normalized, normalized, normalized])
    if trip_id:
        filters.append("trip_id = %s")
        params.append(trip_id)
    if country:
        filters.append("LOWER(country) = %s")
        params.append(country.strip().lower())
    if tag:
        filters.append("LOWER(tags) LIKE %s")
        params.append(f'%"{tag.strip().lower()}"%')
    if assignment == "assigned":
        filters.append("trip_id IS NOT NULL")
    elif assignment == "unassigned":
        filters.append("trip_id IS NULL")

    if filters:
        return " WHERE " + " AND ".join(filters), params
    return "", params



def _build_trip_filters(
    *,
    public_only: bool,
    q: str | None = None,
    tag: str | None = None,
    year: int | None = None,
    status_filter: str | None = None,
    route_filter: str | None = None,
) -> tuple[str, list[object]]:
    filters: list[str] = []
    params: list[object] = []

    if public_only:
        filters.append("status = %s")
        params.append(PUBLISHED_STATUS)
    elif status_filter:
        filters.append("status = %s")
        params.append(status_filter)

    if q:
        filters.append("(LOWER(title) LIKE %s OR LOWER(summary) LIKE %s OR LOWER(description) LIKE %s OR LOWER(tags) LIKE %s)")
        normalized = f"%{q.strip().lower()}%"
        params.extend([normalized, normalized, normalized, normalized])
    if tag:
        filters.append("LOWER(tags) LIKE %s")
        params.append(f'%"{tag.strip().lower()}"%')
    if year is not None:
        filters.append("EXTRACT(YEAR FROM start_date) = %s")
        params.append(year)
    if route_filter == "enabled":
        filters.append("route_enabled = %s")
        params.append(True)
    elif route_filter == "disabled":
        filters.append("route_enabled = %s")
        params.append(False)

    if filters:
        return " WHERE " + " AND ".join(filters), params
    return "", params



def get_trip_summaries(
    *,
    public_only: bool = True,
    q: str | None = None,
    tag: str | None = None,
    year: int | None = None,
    status_filter: str | None = None,
    route_filter: str | None = None,
) -> list[TripSummary]:
    where_clause, params = _build_trip_filters(
        public_only=public_only,
        q=q,
        tag=tag,
        year=year,
        status_filter=status_filter,
        route_filter=route_filter,
    )
    query = "SELECT * FROM trips" + where_clause + " ORDER BY start_date DESC"
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            rows = cursor.fetchall()
    return [trip_summary(trip_from_row(row)) for row in rows]



def get_place_summaries(
    *,
    public_only: bool = True,
    q: str | None = None,
    trip_id: str | None = None,
    country: str | None = None,
    tag: str | None = None,
    status_filter: str | None = None,
    assignment: str | None = None,
) -> list[PlaceSummary]:
    where_clause, params = _build_place_filters(
        public_only=public_only,
        q=q,
        trip_id=trip_id,
        country=country,
        tag=tag,
        status_filter=status_filter,
        assignment=assignment,
    )
    query = "SELECT * FROM places" + where_clause + " ORDER BY start_date DESC, trip_order ASC"
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            rows = cursor.fetchall()
    return [place_summary(place_from_row(row)) for row in rows]



def get_trip_summaries_page(
    *,
    public_only: bool = True,
    q: str | None = None,
    tag: str | None = None,
    year: int | None = None,
    status_filter: str | None = None,
    route_filter: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[TripSummary], int]:
    where_clause, params = _build_trip_filters(
        public_only=public_only,
        q=q,
        tag=tag,
        year=year,
        status_filter=status_filter,
        route_filter=route_filter,
    )
    count_query = "SELECT COUNT(*) AS count FROM trips" + where_clause
    data_query = "SELECT * FROM trips" + where_clause + " ORDER BY start_date DESC LIMIT %s OFFSET %s"

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(count_query, params)
            total = cursor.fetchone()["count"]
            cursor.execute(data_query, [*params, limit, offset])
            rows = cursor.fetchall()

    return [trip_summary(trip_from_row(row)) for row in rows], total



def get_place_summaries_page(
    *,
    public_only: bool = True,
    q: str | None = None,
    trip_id: str | None = None,
    country: str | None = None,
    tag: str | None = None,
    status_filter: str | None = None,
    assignment: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[PlaceSummary], int]:
    where_clause, params = _build_place_filters(
        public_only=public_only,
        q=q,
        trip_id=trip_id,
        country=country,
        tag=tag,
        status_filter=status_filter,
        assignment=assignment,
    )
    count_query = "SELECT COUNT(*) AS count FROM places" + where_clause
    data_query = "SELECT * FROM places" + where_clause + " ORDER BY start_date DESC, trip_order ASC LIMIT %s OFFSET %s"

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(count_query, params)
            total = cursor.fetchone()["count"]
            cursor.execute(data_query, [*params, limit, offset])
            rows = cursor.fetchall()

    return [place_summary(place_from_row(row)) for row in rows], total



def get_trip_by_slug(slug: str, *, public_only: bool = True) -> TripDetail | None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            if public_only:
                cursor.execute("SELECT * FROM trips WHERE slug = %s AND status = %s", (slug, PUBLISHED_STATUS))
            else:
                cursor.execute("SELECT * FROM trips WHERE slug = %s", (slug,))
            row = cursor.fetchone()
    if row is None:
        return None
    return trip_from_row(row)



def get_place_by_slug(slug: str, *, public_only: bool = True) -> PlaceDetail | None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            if public_only:
                cursor.execute("SELECT * FROM places WHERE slug = %s AND status = %s", (slug, PUBLISHED_STATUS))
            else:
                cursor.execute("SELECT * FROM places WHERE slug = %s", (slug,))
            row = cursor.fetchone()
    if row is None:
        return None
    return place_from_row(row)



def get_places_for_trip(trip_id: str, *, public_only: bool = True) -> list[PlaceDetail]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            if public_only:
                cursor.execute(
                    "SELECT * FROM places WHERE trip_id = %s AND status = %s ORDER BY trip_order ASC, start_date ASC",
                    (trip_id, PUBLISHED_STATUS),
                )
            else:
                cursor.execute(
                    "SELECT * FROM places WHERE trip_id = %s ORDER BY trip_order ASC, start_date ASC",
                    (trip_id,),
                )
            rows = cursor.fetchall()
    return [place_from_row(row) for row in rows]



def get_user_auth_by_email(email: str) -> dict | None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, email, name, password_hash, role, is_active FROM users WHERE LOWER(email) = LOWER(%s)",
                (email,),
            )
            return cursor.fetchone()



def get_groups() -> list[GroupSummary]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT g.*, COUNT(ug.user_id)::int AS member_count
                FROM groups g
                LEFT JOIN user_groups ug ON ug.group_id = g.id
                GROUP BY g.id
                ORDER BY g.name ASC
                """
            )
            rows = cursor.fetchall()
    return [group_summary(group_from_row(row)) for row in rows]



def get_group_by_id(group_id: str) -> GroupDetail | None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT g.*, COUNT(ug.user_id)::int AS member_count
                FROM groups g
                LEFT JOIN user_groups ug ON ug.group_id = g.id
                WHERE g.id = %s
                GROUP BY g.id
                """,
                (group_id,),
            )
            row = cursor.fetchone()
            if row is None:
                return None
            member_ids = fetch_member_ids_for_groups(cursor, [group_id]).get(group_id, [])
    return group_from_row(row, member_ids=member_ids)



def get_users() -> list[UserSummary]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users ORDER BY created_at ASC")
            rows = cursor.fetchall()
            groups_by_user = fetch_groups_for_users(cursor, [row["id"] for row in rows])
    return [user_summary(user_from_row(row, groups=groups_by_user.get(row["id"], []))) for row in rows]



def get_user_by_id(user_id: str) -> UserDetail | None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()
            groups_by_user = fetch_groups_for_users(cursor, [user_id])
    if row is None:
        return None
    return user_from_row(row, groups=groups_by_user.get(user_id, []))



def create_user(payload: UserCreate) -> UserDetail:
    from app.core.auth import hash_password

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(%s)", (payload.email,))
            existing = cursor.fetchone()
            if existing is not None:
                raise ValueError("A user with this email already exists")
            group_ids = validate_group_ids(cursor, payload.group_ids)

            user = {
                "id": f"user-{uuid4().hex[:8]}",
                "email": payload.email.lower(),
                "name": payload.name,
                "password_hash": hash_password(payload.password),
                "role": payload.role,
                "is_active": payload.is_active,
            }
            insert_user(cursor, user)
            set_user_group_memberships(cursor, user["id"], group_ids)
            cursor.execute("SELECT * FROM users WHERE id = %s", (user["id"],))
            row = cursor.fetchone()
            groups_by_user = fetch_groups_for_users(cursor, [user["id"]])
        connection.commit()
    return user_from_row(row, groups=groups_by_user.get(user["id"], []))



def update_user(user_id: str, payload: UserUpdate) -> UserDetail | None:
    from app.core.auth import hash_password

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()
            if row is None:
                return None
            current = row
            updates = payload.model_dump(exclude_unset=True)

            next_email = str(updates.get("email", current["email"])).lower()
            if next_email != current["email"].lower():
                cursor.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(%s) AND id <> %s", (next_email, user_id))
                existing = cursor.fetchone()
                if existing is not None:
                    raise ValueError("A user with this email already exists")

            group_ids = None
            if "group_ids" in updates:
                group_ids = validate_group_ids(cursor, updates["group_ids"])

            password_hash = current["password_hash"]
            if updates.get("password"):
                password_hash = hash_password(updates["password"])

            cursor.execute(
                """
                UPDATE users
                SET email = %s, name = %s, password_hash = %s, role = %s, is_active = %s, updated_at = NOW()
                WHERE id = %s
                """,
                (
                    next_email,
                    updates.get("name", current["name"]),
                    password_hash,
                    updates.get("role", current["role"]),
                    updates.get("is_active", current["is_active"]),
                    user_id,
                ),
            )
            if group_ids is not None:
                set_user_group_memberships(cursor, user_id, group_ids)
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            updated_row = cursor.fetchone()
            groups_by_user = fetch_groups_for_users(cursor, [user_id])
        connection.commit()
    return user_from_row(updated_row, groups=groups_by_user.get(user_id, []))



def create_group(payload: GroupCreate) -> GroupDetail:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            slug = unique_slug(cursor, "groups", slugify(payload.slug or payload.name))
            cursor.execute("SELECT id FROM groups WHERE LOWER(name) = LOWER(%s)", (payload.name,))
            existing = cursor.fetchone()
            if existing is not None:
                raise ValueError("A group with this name already exists")

            member_ids = validate_user_ids(cursor, payload.member_ids)
            group = {
                "id": f"group-{uuid4().hex[:8]}",
                "name": payload.name,
                "slug": slug,
                "description": payload.description,
            }
            insert_group(cursor, group)
            set_group_memberships(cursor, group["id"], member_ids)
            cursor.execute(
                """
                SELECT g.*, COUNT(ug.user_id)::int AS member_count
                FROM groups g
                LEFT JOIN user_groups ug ON ug.group_id = g.id
                WHERE g.id = %s
                GROUP BY g.id
                """,
                (group["id"],),
            )
            row = cursor.fetchone()
            member_ids_by_group = fetch_member_ids_for_groups(cursor, [group["id"]])
        connection.commit()
    return group_from_row(row, member_ids=member_ids_by_group.get(group["id"], []))



def update_group(group_id: str, payload: GroupUpdate) -> GroupDetail | None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM groups WHERE id = %s", (group_id,))
            current = cursor.fetchone()
            if current is None:
                return None

            updates = payload.model_dump(exclude_unset=True)
            next_name = updates.get("name", current["name"])
            next_slug = current["slug"]

            if next_name.lower() != current["name"].lower():
                cursor.execute("SELECT id FROM groups WHERE LOWER(name) = LOWER(%s) AND id <> %s", (next_name, group_id))
                existing = cursor.fetchone()
                if existing is not None:
                    raise ValueError("A group with this name already exists")

            if "slug" in updates or "name" in updates:
                next_slug = unique_slug(cursor, "groups", slugify(updates.get("slug") or next_name), exclude_id=group_id)

            member_ids = None
            if "member_ids" in updates:
                member_ids = validate_user_ids(cursor, updates["member_ids"])

            cursor.execute(
                """
                UPDATE groups
                SET name = %s, slug = %s, description = %s, updated_at = NOW()
                WHERE id = %s
                """,
                (
                    next_name,
                    next_slug,
                    updates.get("description", current["description"]),
                    group_id,
                ),
            )
            if member_ids is not None:
                set_group_memberships(cursor, group_id, member_ids)
            cursor.execute(
                """
                SELECT g.*, COUNT(ug.user_id)::int AS member_count
                FROM groups g
                LEFT JOIN user_groups ug ON ug.group_id = g.id
                WHERE g.id = %s
                GROUP BY g.id
                """,
                (group_id,),
            )
            row = cursor.fetchone()
            member_ids_by_group = fetch_member_ids_for_groups(cursor, [group_id])
        connection.commit()
    return group_from_row(row, member_ids=member_ids_by_group.get(group_id, []))



def create_trip(payload: TripCreate) -> TripDetail:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            slug = unique_slug(cursor, "trips", slugify(payload.slug or payload.title))
            trip = {
                "id": f"trip-{uuid4().hex[:8]}", "slug": slug, "title": payload.title, "summary": payload.summary,
                "description": payload.description, "start_date": payload.start_date, "end_date": payload.end_date,
                "route_enabled": payload.route_enabled, "color": payload.color, "cover_image_url": payload.cover_image_url,
                "tags": payload.tags, "status": payload.status,
            }
            insert_trip(cursor, trip)
        connection.commit()
    return TripDetail(**trip, places=[])



def update_trip(slug: str, payload: TripUpdate) -> TripDetail | None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM trips WHERE slug = %s", (slug,))
            row = cursor.fetchone()
            if row is None:
                return None
            trip = trip_from_row(row)
            updates = payload.model_dump(exclude_unset=True)
            if updates.get("slug"):
                updates["slug"] = unique_slug(cursor, "trips", slugify(updates["slug"]), exclude_id=trip.id)
            values = {**trip.model_dump(exclude={"places"}), **updates}
            cursor.execute(
                """
                UPDATE trips
                SET title = %s, slug = %s, summary = %s, description = %s, start_date = %s, end_date = %s,
                    route_enabled = %s, color = %s, cover_image_url = %s, tags = %s, status = %s
                WHERE id = %s
                """,
                (
                    values["title"], values["slug"], values["summary"], values["description"], values["start_date"], values["end_date"],
                    values["route_enabled"], values["color"], values["cover_image_url"], serialize_list(values["tags"]), values["status"], trip.id,
                ),
            )
        connection.commit()
    return get_trip_by_slug(values["slug"], public_only=False)



def delete_trip(slug: str) -> bool:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE places
                SET trip_id = NULL, trip_order = 0
                WHERE trip_id = (SELECT id FROM trips WHERE slug = %s)
                """,
                (slug,),
            )
            cursor.execute("DELETE FROM trips WHERE slug = %s", (slug,))
            deleted = cursor.rowcount > 0
        connection.commit()
    return deleted



def create_place(payload: PlaceCreate) -> PlaceDetail:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            slug = unique_slug(cursor, "places", slugify(payload.slug or payload.title))
            trip_order = payload.trip_order if payload.trip_id else 0
            place = {
                "id": f"place-{uuid4().hex[:8]}", "slug": slug, "title": payload.title, "summary": payload.summary,
                "description": payload.description, "city": payload.city, "country": payload.country,
                "latitude": payload.latitude, "longitude": payload.longitude, "start_date": payload.start_date, "end_date": payload.end_date,
                "marker_color": payload.marker_color, "trip_id": payload.trip_id, "image_url": payload.image_url,
                "gallery": payload.gallery or [payload.image_url], "tags": payload.tags, "visibility": payload.visibility,
                "companions": payload.companions, "rating": payload.rating, "trip_order": trip_order, "status": payload.status,
            }
            insert_place(cursor, place)
        connection.commit()
    return PlaceDetail(**place)



def update_place(slug: str, payload: PlaceUpdate) -> PlaceDetail | None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM places WHERE slug = %s", (slug,))
            row = cursor.fetchone()
            if row is None:
                return None
            place = place_from_row(row)
            updates = payload.model_dump(exclude_unset=True)
            if updates.get("slug"):
                updates["slug"] = unique_slug(cursor, "places", slugify(updates["slug"]), exclude_id=place.id)
            values = {**place.model_dump(), **updates}
            if not values["trip_id"]:
                values["trip_order"] = 0
            if not values["gallery"]:
                values["gallery"] = [values["image_url"]]
            cursor.execute(
                """
                UPDATE places
                SET title = %s, slug = %s, summary = %s, description = %s, city = %s, country = %s,
                    latitude = %s, longitude = %s, start_date = %s, end_date = %s, marker_color = %s, trip_id = %s,
                    image_url = %s, gallery = %s, tags = %s, visibility = %s, companions = %s, rating = %s, trip_order = %s, status = %s
                WHERE id = %s
                """,
                (
                    values["title"], values["slug"], values["summary"], values["description"], values["city"], values["country"],
                    values["latitude"], values["longitude"], values["start_date"], values["end_date"], values["marker_color"], values["trip_id"],
                    values["image_url"], serialize_list(values["gallery"]), serialize_list(values["tags"]), values["visibility"],
                    serialize_list(values["companions"]), values["rating"], values["trip_order"], values["status"], place.id,
                ),
            )
        connection.commit()
    return get_place_by_slug(values["slug"], public_only=False)



def delete_place(slug: str) -> bool:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM places WHERE slug = %s", (slug,))
            deleted = cursor.rowcount > 0
        connection.commit()
    return deleted

def trip_from_row(row: dict, places: list[PlaceSummary] | None = None) -> TripDetail:
    return TripDetail(
        id=row["id"],
        title=row["title"],
        slug=row["slug"],
        summary=row["summary"],
        description=row["description"],
        start_date=str(row["start_date"]),
        end_date=str(row["end_date"]),
        route_enabled=bool(row["route_enabled"]),
        color=row["color"],
        cover_image_url=row["cover_image_url"],
        tags=deserialize_list(row["tags"]),
        visibility=row.get("visibility", "public"),
        group_ids=deserialize_list(row.get("group_ids")),
        status=row["status"],
        places=places or [],
    )


def place_from_row(row: dict) -> PlaceDetail:
    return PlaceDetail(
        id=row["id"],
        title=row["title"],
        slug=row["slug"],
        city=row["city"],
        country=row["country"],
        latitude=row["latitude"],
        longitude=row["longitude"],
        summary=row["summary"],
        trip_id=row["trip_id"],
        marker_color=row["marker_color"],
        image_url=row["image_url"],
        tags=deserialize_list(row["tags"]),
        visibility=row["visibility"],
        group_ids=deserialize_list(row.get("group_ids")),
        start_date=str(row["start_date"]),
        end_date=str(row["end_date"]),
        status=row["status"],
        description=row["description"],
        gallery=deserialize_list(row["gallery"]),
        companions=deserialize_list(row["companions"]),
        rating=row["rating"],
        trip_order=row["trip_order"],
    )


def group_from_row(row: dict, member_ids: list[str] | None = None) -> GroupDetail:
    return GroupDetail(
        id=row["id"],
        name=row["name"],
        slug=row["slug"],
        description=row["description"],
        status=row.get("status", "active"),
        member_count=int(row.get("member_count", 0)),
        created_at=str(row["created_at"]),
        updated_at=str(row["updated_at"]),
        member_ids=member_ids or [],
    )


def insert_trip(cursor, payload: dict[str, object]) -> None:
    cursor.execute(
        """
        INSERT INTO trips (id, title, slug, summary, description, start_date, end_date, route_enabled, color, cover_image_url, tags, visibility, group_ids, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            payload["id"], payload["title"], payload["slug"], payload["summary"], payload["description"],
            payload["start_date"], payload["end_date"], payload["route_enabled"], payload["color"],
            payload["cover_image_url"], serialize_list(payload["tags"]), payload.get("visibility", "public"),
            serialize_list(payload.get("group_ids", [])), payload["status"],
        ),
    )


def insert_place(cursor, payload: dict[str, object]) -> None:
    cursor.execute(
        """
        INSERT INTO places (
          id, title, slug, summary, description, city, country, latitude, longitude,
          start_date, end_date, marker_color, trip_id, image_url, gallery, tags,
          visibility, group_ids, companions, rating, trip_order, status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            payload["id"], payload["title"], payload["slug"], payload["summary"], payload["description"], payload["city"],
            payload["country"], payload["latitude"], payload["longitude"], payload["start_date"], payload["end_date"],
            payload["marker_color"], payload["trip_id"], payload["image_url"], serialize_list(payload["gallery"]),
            serialize_list(payload["tags"]), payload["visibility"], serialize_list(payload.get("group_ids", [])),
            serialize_list(payload["companions"]), payload["rating"], payload["trip_order"], payload["status"],
        ),
    )


def validate_group_ids(cursor, group_ids: list[str]) -> list[str]:
    normalized = list(dict.fromkeys(group_ids))
    if not normalized:
        return []

    cursor.execute("SELECT id FROM groups WHERE status = 'active' AND id = ANY(%s)", (normalized,))
    found_ids = {row["id"] for row in cursor.fetchall()}
    missing_ids = [group_id for group_id in normalized if group_id not in found_ids]
    if missing_ids:
        raise ValueError(f"Unknown or archived group ids: {', '.join(missing_ids)}")
    return normalized


def get_groups() -> list[GroupSummary]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT g.*, COUNT(ug.user_id)::int AS member_count
                FROM groups g
                LEFT JOIN user_groups ug ON ug.group_id = g.id
                GROUP BY g.id
                ORDER BY CASE WHEN g.status = 'active' THEN 0 ELSE 1 END, g.name ASC
                """
            )
            rows = cursor.fetchall()
    return [group_summary(group_from_row(row)) for row in rows]


def get_group_by_id(group_id: str) -> GroupDetail | None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT g.*, COUNT(ug.user_id)::int AS member_count
                FROM groups g
                LEFT JOIN user_groups ug ON ug.group_id = g.id
                WHERE g.id = %s
                GROUP BY g.id
                """,
                (group_id,),
            )
            row = cursor.fetchone()
            if row is None:
                return None
            member_ids = fetch_member_ids_for_groups(cursor, [group_id]).get(group_id, [])
    return group_from_row(row, member_ids=member_ids)


def create_group(payload: GroupCreate) -> GroupDetail:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            slug = unique_slug(cursor, "groups", slugify(payload.slug or payload.name))
            cursor.execute("SELECT id FROM groups WHERE LOWER(name) = LOWER(%s)", (payload.name,))
            existing = cursor.fetchone()
            if existing is not None:
                raise ValueError("A group with this name already exists")

            member_ids = validate_user_ids(cursor, payload.member_ids)
            group = {
                "id": f"group-{uuid4().hex[:8]}",
                "name": payload.name,
                "slug": slug,
                "description": payload.description,
                "status": "active",
            }
            cursor.execute(
                "INSERT INTO groups (id, name, slug, description, status) VALUES (%s, %s, %s, %s, %s)",
                (group["id"], group["name"], group["slug"], group["description"], group["status"]),
            )
            set_group_memberships(cursor, group["id"], member_ids)
            cursor.execute(
                """
                SELECT g.*, COUNT(ug.user_id)::int AS member_count
                FROM groups g
                LEFT JOIN user_groups ug ON ug.group_id = g.id
                WHERE g.id = %s
                GROUP BY g.id
                """,
                (group["id"],),
            )
            row = cursor.fetchone()
            member_ids_by_group = fetch_member_ids_for_groups(cursor, [group["id"]])
        connection.commit()
    return group_from_row(row, member_ids=member_ids_by_group.get(group["id"], []))


def update_group(group_id: str, payload: GroupUpdate) -> GroupDetail | None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM groups WHERE id = %s", (group_id,))
            current = cursor.fetchone()
            if current is None:
                return None

            updates = payload.model_dump(exclude_unset=True)
            next_name = updates.get("name", current["name"])
            next_slug = current["slug"]

            if next_name.lower() != current["name"].lower():
                cursor.execute("SELECT id FROM groups WHERE LOWER(name) = LOWER(%s) AND id <> %s", (next_name, group_id))
                existing = cursor.fetchone()
                if existing is not None:
                    raise ValueError("A group with this name already exists")

            if "slug" in updates or "name" in updates:
                next_slug = unique_slug(cursor, "groups", slugify(updates.get("slug") or next_name), exclude_id=group_id)

            member_ids = None
            if "member_ids" in updates:
                member_ids = validate_user_ids(cursor, updates["member_ids"])

            cursor.execute(
                """
                UPDATE groups
                SET name = %s, slug = %s, description = %s, status = %s, updated_at = NOW()
                WHERE id = %s
                """,
                (
                    next_name,
                    next_slug,
                    updates.get("description", current["description"]),
                    updates.get("status", current.get("status", "active")),
                    group_id,
                ),
            )
            if member_ids is not None:
                set_group_memberships(cursor, group_id, member_ids)
            cursor.execute(
                """
                SELECT g.*, COUNT(ug.user_id)::int AS member_count
                FROM groups g
                LEFT JOIN user_groups ug ON ug.group_id = g.id
                WHERE g.id = %s
                GROUP BY g.id
                """,
                (group_id,),
            )
            row = cursor.fetchone()
            member_ids_by_group = fetch_member_ids_for_groups(cursor, [group_id])
        connection.commit()
    return group_from_row(row, member_ids=member_ids_by_group.get(group_id, []))


def delete_group(group_id: str) -> bool:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM groups WHERE id = %s", (group_id,))
            deleted = cursor.rowcount > 0
        connection.commit()
    return deleted


def _build_public_visibility_filter(visibility_column: str, group_ids_column: str, *, authenticated: bool, viewer_group_ids: list[str] | None) -> tuple[str, list[object]]:
    clauses = [f"{visibility_column} = %s"]
    params: list[object] = ["public"]

    if authenticated:
        clauses.append(f"{visibility_column} = %s")
        params.append("authenticated")

    normalized_group_ids = [group_id.lower() for group_id in (viewer_group_ids or []) if group_id]
    if normalized_group_ids:
        group_clauses: list[str] = []
        group_params: list[object] = []
        for group_id in normalized_group_ids:
            group_clauses.append(f"LOWER({group_ids_column}) LIKE %s")
            group_params.append(f'%"{group_id}"%')
        clauses.append(f"({visibility_column} = %s AND ({' OR '.join(group_clauses)}))")
        params.append("group")
        params.extend(group_params)

    return "(" + " OR ".join(clauses) + ")", params


def _build_place_filters(
    *,
    public_only: bool,
    q: str | None = None,
    trip_id: str | None = None,
    country: str | None = None,
    tag: str | None = None,
    status_filter: str | None = None,
    assignment: str | None = None,
    authenticated: bool = False,
    viewer_group_ids: list[str] | None = None,
) -> tuple[str, list[object]]:
    filters: list[str] = []
    params: list[object] = []

    if public_only:
        filters.append("status = %s")
        params.append(PUBLISHED_STATUS)
        visibility_clause, visibility_params = _build_public_visibility_filter(
            "visibility",
            "group_ids",
            authenticated=authenticated,
            viewer_group_ids=viewer_group_ids,
        )
        filters.append(visibility_clause)
        params.extend(visibility_params)
    elif status_filter:
        filters.append("status = %s")
        params.append(status_filter)

    if q:
        filters.append("(LOWER(title) LIKE %s OR LOWER(city) LIKE %s OR LOWER(country) LIKE %s OR LOWER(summary) LIKE %s OR LOWER(tags) LIKE %s)")
        normalized = f"%{q.strip().lower()}%"
        params.extend([normalized, normalized, normalized, normalized, normalized])
    if trip_id:
        filters.append("trip_id = %s")
        params.append(trip_id)
    if country:
        filters.append("LOWER(country) = %s")
        params.append(country.strip().lower())
    if tag:
        filters.append("LOWER(tags) LIKE %s")
        params.append(f'%"{tag.strip().lower()}"%')
    if assignment == "assigned":
        filters.append("trip_id IS NOT NULL")
    elif assignment == "unassigned":
        filters.append("trip_id IS NULL")

    if filters:
        return " WHERE " + " AND ".join(filters), params
    return "", params


def _build_trip_filters(
    *,
    public_only: bool,
    q: str | None = None,
    tag: str | None = None,
    year: int | None = None,
    status_filter: str | None = None,
    route_filter: str | None = None,
    authenticated: bool = False,
    viewer_group_ids: list[str] | None = None,
) -> tuple[str, list[object]]:
    filters: list[str] = []
    params: list[object] = []

    if public_only:
        filters.append("status = %s")
        params.append(PUBLISHED_STATUS)
        visibility_clause, visibility_params = _build_public_visibility_filter(
            "visibility",
            "group_ids",
            authenticated=authenticated,
            viewer_group_ids=viewer_group_ids,
        )
        filters.append(visibility_clause)
        params.extend(visibility_params)
    elif status_filter:
        filters.append("status = %s")
        params.append(status_filter)

    if q:
        filters.append("(LOWER(title) LIKE %s OR LOWER(summary) LIKE %s OR LOWER(description) LIKE %s OR LOWER(tags) LIKE %s)")
        normalized = f"%{q.strip().lower()}%"
        params.extend([normalized, normalized, normalized, normalized])
    if tag:
        filters.append("LOWER(tags) LIKE %s")
        params.append(f'%"{tag.strip().lower()}"%')
    if year is not None:
        filters.append("EXTRACT(YEAR FROM start_date) = %s")
        params.append(year)
    if route_filter == "enabled":
        filters.append("route_enabled = %s")
        params.append(True)
    elif route_filter == "disabled":
        filters.append("route_enabled = %s")
        params.append(False)

    if filters:
        return " WHERE " + " AND ".join(filters), params
    return "", params


def get_trip_summaries(
    *,
    public_only: bool = True,
    q: str | None = None,
    tag: str | None = None,
    year: int | None = None,
    status_filter: str | None = None,
    route_filter: str | None = None,
    authenticated: bool = False,
    viewer_group_ids: list[str] | None = None,
) -> list[TripSummary]:
    where_clause, params = _build_trip_filters(
        public_only=public_only,
        q=q,
        tag=tag,
        year=year,
        status_filter=status_filter,
        route_filter=route_filter,
        authenticated=authenticated,
        viewer_group_ids=viewer_group_ids,
    )
    query = "SELECT * FROM trips" + where_clause + " ORDER BY start_date DESC"
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            rows = cursor.fetchall()
    return [trip_summary(trip_from_row(row)) for row in rows]


def get_place_summaries(
    *,
    public_only: bool = True,
    q: str | None = None,
    trip_id: str | None = None,
    country: str | None = None,
    tag: str | None = None,
    status_filter: str | None = None,
    assignment: str | None = None,
    authenticated: bool = False,
    viewer_group_ids: list[str] | None = None,
) -> list[PlaceSummary]:
    where_clause, params = _build_place_filters(
        public_only=public_only,
        q=q,
        trip_id=trip_id,
        country=country,
        tag=tag,
        status_filter=status_filter,
        assignment=assignment,
        authenticated=authenticated,
        viewer_group_ids=viewer_group_ids,
    )
    query = "SELECT * FROM places" + where_clause + " ORDER BY start_date DESC, trip_order ASC"
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            rows = cursor.fetchall()
    return [place_summary(place_from_row(row)) for row in rows]


def get_trip_summaries_page(
    *,
    public_only: bool = True,
    q: str | None = None,
    tag: str | None = None,
    year: int | None = None,
    status_filter: str | None = None,
    route_filter: str | None = None,
    limit: int = 20,
    offset: int = 0,
    authenticated: bool = False,
    viewer_group_ids: list[str] | None = None,
) -> tuple[list[TripSummary], int]:
    where_clause, params = _build_trip_filters(
        public_only=public_only,
        q=q,
        tag=tag,
        year=year,
        status_filter=status_filter,
        route_filter=route_filter,
        authenticated=authenticated,
        viewer_group_ids=viewer_group_ids,
    )
    count_query = "SELECT COUNT(*) AS count FROM trips" + where_clause
    data_query = "SELECT * FROM trips" + where_clause + " ORDER BY start_date DESC LIMIT %s OFFSET %s"

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(count_query, params)
            total = cursor.fetchone()["count"]
            cursor.execute(data_query, [*params, limit, offset])
            rows = cursor.fetchall()

    return [trip_summary(trip_from_row(row)) for row in rows], total


def get_place_summaries_page(
    *,
    public_only: bool = True,
    q: str | None = None,
    trip_id: str | None = None,
    country: str | None = None,
    tag: str | None = None,
    status_filter: str | None = None,
    assignment: str | None = None,
    limit: int = 20,
    offset: int = 0,
    authenticated: bool = False,
    viewer_group_ids: list[str] | None = None,
) -> tuple[list[PlaceSummary], int]:
    where_clause, params = _build_place_filters(
        public_only=public_only,
        q=q,
        trip_id=trip_id,
        country=country,
        tag=tag,
        status_filter=status_filter,
        assignment=assignment,
        authenticated=authenticated,
        viewer_group_ids=viewer_group_ids,
    )
    count_query = "SELECT COUNT(*) AS count FROM places" + where_clause
    data_query = "SELECT * FROM places" + where_clause + " ORDER BY start_date DESC, trip_order ASC LIMIT %s OFFSET %s"

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(count_query, params)
            total = cursor.fetchone()["count"]
            cursor.execute(data_query, [*params, limit, offset])
            rows = cursor.fetchall()

    return [place_summary(place_from_row(row)) for row in rows], total


def get_trip_by_slug(slug: str, *, public_only: bool = True, authenticated: bool = False, viewer_group_ids: list[str] | None = None) -> TripDetail | None:
    where_clause, params = _build_trip_filters(
        public_only=public_only,
        authenticated=authenticated,
        viewer_group_ids=viewer_group_ids,
    )
    query = "SELECT * FROM trips WHERE slug = %s"
    query_params: list[object] = [slug]
    if where_clause:
        query += " AND " + where_clause.removeprefix(" WHERE ")
        query_params.extend(params)
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, query_params)
            row = cursor.fetchone()
    if row is None:
        return None
    return trip_from_row(row)


def get_place_by_slug(slug: str, *, public_only: bool = True, authenticated: bool = False, viewer_group_ids: list[str] | None = None) -> PlaceDetail | None:
    where_clause, params = _build_place_filters(
        public_only=public_only,
        authenticated=authenticated,
        viewer_group_ids=viewer_group_ids,
    )
    query = "SELECT * FROM places WHERE slug = %s"
    query_params: list[object] = [slug]
    if where_clause:
        query += " AND " + where_clause.removeprefix(" WHERE ")
        query_params.extend(params)
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, query_params)
            row = cursor.fetchone()
    if row is None:
        return None
    return place_from_row(row)


def get_places_for_trip(trip_id: str, *, public_only: bool = True, authenticated: bool = False, viewer_group_ids: list[str] | None = None) -> list[PlaceDetail]:
    where_clause, params = _build_place_filters(
        public_only=public_only,
        authenticated=authenticated,
        viewer_group_ids=viewer_group_ids,
    )
    query = "SELECT * FROM places WHERE trip_id = %s"
    query_params: list[object] = [trip_id]
    if where_clause:
        query += " AND " + where_clause.removeprefix(" WHERE ")
        query_params.extend(params)
    query += " ORDER BY trip_order ASC, start_date ASC"
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, query_params)
            rows = cursor.fetchall()
    return [place_from_row(row) for row in rows]


def create_trip(payload: TripCreate) -> TripDetail:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            slug = unique_slug(cursor, "trips", slugify(payload.slug or payload.title))
            group_ids = validate_group_ids(cursor, payload.group_ids)
            trip = {
                "id": f"trip-{uuid4().hex[:8]}", "slug": slug, "title": payload.title, "summary": payload.summary,
                "description": payload.description, "start_date": payload.start_date, "end_date": payload.end_date,
                "route_enabled": payload.route_enabled, "color": payload.color, "cover_image_url": payload.cover_image_url,
                "tags": payload.tags, "visibility": payload.visibility, "group_ids": group_ids, "status": payload.status,
            }
            insert_trip(cursor, trip)
        connection.commit()
    return TripDetail(**trip, places=[])


def update_trip(slug: str, payload: TripUpdate) -> TripDetail | None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM trips WHERE slug = %s", (slug,))
            row = cursor.fetchone()
            if row is None:
                return None
            trip = trip_from_row(row)
            updates = payload.model_dump(exclude_unset=True)
            if updates.get("slug"):
                updates["slug"] = unique_slug(cursor, "trips", slugify(updates["slug"]), exclude_id=trip.id)
            if "group_ids" in updates:
                updates["group_ids"] = validate_group_ids(cursor, updates["group_ids"])
            values = {**trip.model_dump(exclude={"places"}), **updates}
            if values["visibility"] != "group":
                values["group_ids"] = []
            cursor.execute(
                """
                UPDATE trips
                SET title = %s, slug = %s, summary = %s, description = %s, start_date = %s, end_date = %s,
                    route_enabled = %s, color = %s, cover_image_url = %s, tags = %s, visibility = %s, group_ids = %s, status = %s
                WHERE id = %s
                """,
                (
                    values["title"], values["slug"], values["summary"], values["description"], values["start_date"], values["end_date"],
                    values["route_enabled"], values["color"], values["cover_image_url"], serialize_list(values["tags"]), values["visibility"],
                    serialize_list(values["group_ids"]), values["status"], trip.id,
                ),
            )
        connection.commit()
    return get_trip_by_slug(values["slug"], public_only=False)


def create_place(payload: PlaceCreate) -> PlaceDetail:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            slug = unique_slug(cursor, "places", slugify(payload.slug or payload.title))
            trip_order = payload.trip_order if payload.trip_id else 0
            group_ids = validate_group_ids(cursor, payload.group_ids)
            place = {
                "id": f"place-{uuid4().hex[:8]}", "slug": slug, "title": payload.title, "summary": payload.summary,
                "description": payload.description, "city": payload.city, "country": payload.country,
                "latitude": payload.latitude, "longitude": payload.longitude, "start_date": payload.start_date, "end_date": payload.end_date,
                "marker_color": payload.marker_color, "trip_id": payload.trip_id, "image_url": payload.image_url,
                "gallery": payload.gallery or [payload.image_url], "tags": payload.tags, "visibility": payload.visibility,
                "group_ids": group_ids if payload.visibility == "group" else [],
                "companions": payload.companions, "rating": payload.rating, "trip_order": trip_order, "status": payload.status,
            }
            insert_place(cursor, place)
        connection.commit()
    return PlaceDetail(**place)


def update_place(slug: str, payload: PlaceUpdate) -> PlaceDetail | None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM places WHERE slug = %s", (slug,))
            row = cursor.fetchone()
            if row is None:
                return None
            place = place_from_row(row)
            updates = payload.model_dump(exclude_unset=True)
            if updates.get("slug"):
                updates["slug"] = unique_slug(cursor, "places", slugify(updates["slug"]), exclude_id=place.id)
            if "group_ids" in updates:
                updates["group_ids"] = validate_group_ids(cursor, updates["group_ids"])
            values = {**place.model_dump(), **updates}
            if not values["trip_id"]:
                values["trip_order"] = 0
            if not values["gallery"]:
                values["gallery"] = [values["image_url"]]
            if values["visibility"] != "group":
                values["group_ids"] = []
            cursor.execute(
                """
                UPDATE places
                SET title = %s, slug = %s, summary = %s, description = %s, city = %s, country = %s,
                    latitude = %s, longitude = %s, start_date = %s, end_date = %s, marker_color = %s, trip_id = %s,
                    image_url = %s, gallery = %s, tags = %s, visibility = %s, group_ids = %s, companions = %s, rating = %s, trip_order = %s, status = %s
                WHERE id = %s
                """,
                (
                    values["title"], values["slug"], values["summary"], values["description"], values["city"], values["country"],
                    values["latitude"], values["longitude"], values["start_date"], values["end_date"], values["marker_color"], values["trip_id"],
                    values["image_url"], serialize_list(values["gallery"]), serialize_list(values["tags"]), values["visibility"],
                    serialize_list(values["group_ids"]), serialize_list(values["companions"]), values["rating"], values["trip_order"], values["status"], place.id,
                ),
            )
        connection.commit()
    return get_place_by_slug(values["slug"], public_only=False)


def set_group_status(group_id: str, status: str) -> GroupDetail | None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM groups WHERE id = %s", (group_id,))
            current = cursor.fetchone()
            if current is None:
                return None
            cursor.execute("UPDATE groups SET status = %s, updated_at = NOW() WHERE id = %s", (status, group_id))
            cursor.execute(
                """
                SELECT g.*, COUNT(ug.user_id)::int AS member_count
                FROM groups g
                LEFT JOIN user_groups ug ON ug.group_id = g.id
                WHERE g.id = %s
                GROUP BY g.id
                """,
                (group_id,),
            )
            row = cursor.fetchone()
            member_ids_by_group = fetch_member_ids_for_groups(cursor, [group_id])
        connection.commit()
    return group_from_row(row, member_ids=member_ids_by_group.get(group_id, []))



def delete_group(group_id: str) -> bool:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT status FROM groups WHERE id = %s", (group_id,))
            current = cursor.fetchone()
            if current is None:
                return False
            if current.get("status", "active") != "archived":
                raise ValueError("Only archived groups can be deleted")

            group_pattern = f'%"{group_id}"%'
            cursor.execute("SELECT COUNT(*) AS count FROM user_groups WHERE group_id = %s", (group_id,))
            user_refs = int(cursor.fetchone()["count"])
            cursor.execute("SELECT COUNT(*) AS count FROM trips WHERE group_ids LIKE %s", (group_pattern,))
            trip_refs = int(cursor.fetchone()["count"])
            cursor.execute("SELECT COUNT(*) AS count FROM places WHERE group_ids LIKE %s", (group_pattern,))
            place_refs = int(cursor.fetchone()["count"])
            if user_refs or trip_refs or place_refs:
                raise ValueError("Group cannot be deleted while it is still assigned to users, trips, or places")

            cursor.execute("DELETE FROM groups WHERE id = %s", (group_id,))
            deleted = cursor.rowcount > 0
        connection.commit()
    return deleted



def delete_place(slug: str) -> bool:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM places WHERE slug = %s", (slug,))
            deleted = cursor.rowcount > 0
        connection.commit()
    return deleted
