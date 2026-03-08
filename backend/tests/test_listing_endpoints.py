import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.auth import AuthUser, resolve_authenticated_user, resolve_optional_authenticated_user
from app.routers import groups, map_data, places, trips, users
from app.schemas.place import PlaceSummary
from app.schemas.trip import TripSummary


class ListingEndpointTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(map_data.router, prefix="/api")
        app.include_router(places.router, prefix="/api")
        app.include_router(trips.router, prefix="/api")
        app.include_router(users.router, prefix="/api")
        app.include_router(groups.router, prefix="/api")
        self.app = app
        self.client = TestClient(app)

    def tearDown(self):
        self.app.dependency_overrides.clear()

    def _override_user(self, role: str = "admin", user_id: str = "user-admin", group_ids: list[str] | None = None):
        user = AuthUser(id=user_id, email=f"{role}@example.com", name=role.title(), role=role, group_ids=group_ids or [])
        self.app.dependency_overrides[resolve_authenticated_user] = lambda: user
        self.app.dependency_overrides[resolve_optional_authenticated_user] = lambda: user

    def test_public_places_query_returns_pagination_envelope(self):
        sample_place = PlaceSummary(
            id="place-1",
            title="Kyoto",
            slug="kyoto",
            city="Kyoto",
            country="Japan",
            latitude=35.0116,
            longitude=135.7681,
            summary="Temple district",
            trip_id="trip-japan-2023",
            marker_color="#7dd8c6",
            image_url="https://example.com/kyoto.jpg",
            tags=["temples", "autumn"],
            visibility="public",
            group_ids=[],
            start_date="2023-10-07",
            end_date="2023-10-09",
            status="published",
        )

        with patch("app.routers.places.get_place_summaries_page", return_value=([sample_place], 1)) as mock_query:
            response = self.client.get("/api/places/query", params={"q": "kyoto", "trip_id": "trip-japan-2023", "page": 2, "page_size": 5})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total"], 1)
        self.assertEqual(response.json()["page"], 2)
        self.assertEqual(response.json()["page_size"], 5)
        self.assertEqual(response.json()["items"][0]["slug"], "kyoto")
        mock_query.assert_called_once_with(
            q="kyoto",
            trip_id="trip-japan-2023",
            country=None,
            tag=None,
            limit=5,
            offset=5,
            authenticated=False,
            viewer_group_ids=[],
        )

    def test_public_trips_query_passes_authenticated_group_context(self):
        self._override_user("viewer", "user-viewer", ["group-team"])
        sample_trip = TripSummary(
            id="trip-japan-2023",
            title="Japan Autumn 2023",
            slug="japan-autumn-2023",
            summary="Tokyo to Kyoto",
            start_date="2023-10-01",
            end_date="2023-10-12",
            route_enabled=True,
            color="#7dd8c6",
            cover_image_url="https://example.com/japan.jpg",
            tags=["japan", "autumn"],
            visibility="group",
            group_ids=["group-team"],
            status="published",
        )

        with patch("app.routers.trips.get_trip_summaries_page", return_value=([sample_trip], 1)) as mock_query:
            response = self.client.get("/api/trips/query", params={"tag": "autumn", "year": 2023, "page": 3, "page_size": 4})

        self.assertEqual(response.status_code, 200)
        mock_query.assert_called_once_with(
            q=None,
            tag="autumn",
            year=2023,
            limit=4,
            offset=8,
            authenticated=True,
            viewer_group_ids=["group-team"],
        )

    def test_admin_places_query_requires_authentication(self):
        response = self.client.get("/api/admin/places")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Authentication required")

    def test_admin_places_query_allows_viewer_read_access(self):
        self._override_user("viewer")
        sample_place = PlaceSummary(
            id="place-1",
            title="Kyoto",
            slug="kyoto",
            city="Kyoto",
            country="Japan",
            latitude=35.0116,
            longitude=135.7681,
            summary="Temple district",
            trip_id=None,
            marker_color="#7dd8c6",
            image_url="https://example.com/kyoto.jpg",
            tags=["temples"],
            visibility="public",
            group_ids=[],
            start_date="2023-10-07",
            end_date="2023-10-09",
            status="draft",
        )

        with patch("app.routers.places.get_place_summaries_page", return_value=([sample_place], 1)) as mock_query:
            response = self.client.get(
                "/api/admin/places",
                params={"q": "kyoto", "status": "draft", "assignment": "unassigned", "page": 2, "page_size": 12},
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["items"][0]["status"], "draft")
        self.assertIsNone(payload["items"][0]["trip_id"])
        mock_query.assert_called_once_with(
            public_only=False,
            q="kyoto",
            trip_id=None,
            country=None,
            tag=None,
            status_filter="draft",
            assignment="unassigned",
            limit=12,
            offset=12,
        )

    def test_viewer_cannot_mutate_content(self):
        self._override_user("viewer")

        response = self.client.post(
            "/api/admin/trips",
            json={
                "title": "Blocked",
                "summary": "Summary",
                "description": "Description",
                "start_date": "2024-01-01",
                "end_date": "2024-01-02",
                "route_enabled": True,
                "color": "#7dd8c6",
                "cover_image_url": "https://example.com/cover.jpg",
                "tags": ["test"],
                "visibility": "public",
                "group_ids": [],
                "status": "draft",
            },
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["detail"], "Insufficient permissions")

    def test_admin_users_create_accepts_group_ids(self):
        self._override_user("admin")
        created_user = {
            "id": "user-2",
            "email": "new@example.com",
            "name": "New User",
            "role": "viewer",
            "is_active": True,
            "created_at": "2026-03-07T19:00:00+00:00",
            "updated_at": "2026-03-07T19:00:00+00:00",
            "groups": [
                {
                    "id": "group-team",
                    "name": "Team",
                    "slug": "team",
                    "description": "Core team",
                    "status": "active",
                    "member_count": 1,
                    "created_at": "2026-03-07T19:00:00+00:00",
                }
            ],
        }

        with patch("app.routers.users.create_user", return_value=created_user) as mock_create:
            response = self.client.post(
                "/api/admin/users",
                json={
                    "email": "new@example.com",
                    "name": "New User",
                    "password": "secret123",
                    "role": "viewer",
                    "is_active": True,
                    "group_ids": ["group-team"],
                },
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["groups"][0]["id"], "group-team")
        self.assertEqual(mock_create.call_args.args[0].group_ids, ["group-team"])

    def test_group_archive_and_restore_are_admin_only(self):
        self._override_user("editor")
        response = self.client.post("/api/admin/groups/group-team/archive")
        self.assertEqual(response.status_code, 403)

        self._override_user("admin")
        archived_group = {
            "id": "group-team",
            "name": "Team",
            "slug": "team",
            "description": "Core team",
            "status": "archived",
            "member_count": 0,
            "created_at": "2026-03-07T19:00:00+00:00",
            "updated_at": "2026-03-07T20:00:00+00:00",
            "member_ids": [],
        }
        restored_group = {**archived_group, "status": "active"}

        with patch("app.routers.groups.set_group_status", side_effect=[archived_group, restored_group]) as mock_status:
            archive_response = self.client.post("/api/admin/groups/group-team/archive")
            restore_response = self.client.post("/api/admin/groups/group-team/restore")

        self.assertEqual(archive_response.status_code, 200)
        self.assertEqual(restore_response.status_code, 200)
        self.assertEqual(mock_status.call_args_list[0].args, ("group-team", "archived"))
        self.assertEqual(mock_status.call_args_list[1].args, ("group-team", "active"))

    def test_group_delete_surfaces_guard_errors(self):
        self._override_user("admin")
        with patch("app.routers.groups.delete_group", side_effect=ValueError("Only archived groups can be deleted")):
            response = self.client.delete("/api/admin/groups/group-team")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Only archived groups can be deleted")


if __name__ == "__main__":
    unittest.main()
