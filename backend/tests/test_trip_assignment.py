import unittest
from unittest.mock import patch

from app import data
from app.schemas.place import PlaceCreate, PlaceDetail, PlaceUpdate


class FakeCursor:
    def __init__(self, fetchone_results=None):
        self.fetchone_results = list(fetchone_results or [])
        self.executed = []
        self.rowcount = 1

    def execute(self, query, params=None):
        self.executed.append((query, params))

    def fetchone(self):
        if self.fetchone_results:
            return self.fetchone_results.pop(0)
        return None

    def fetchall(self):
        return []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class FakeConnection:
    def __init__(self, cursor):
        self._cursor = cursor
        self.committed = False

    def cursor(self):
        return self._cursor

    def commit(self):
        self.committed = True

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class TripAssignmentTests(unittest.TestCase):
    def test_delete_trip_unassigns_places_before_deleting_trip(self):
        cursor = FakeCursor()
        connection = FakeConnection(cursor)

        with patch("app.data.get_connection", return_value=connection):
            deleted = data.delete_trip("japan-autumn-2023")

        self.assertTrue(deleted)
        self.assertTrue(connection.committed)
        self.assertEqual(len(cursor.executed), 2)
        self.assertIn("UPDATE places", cursor.executed[0][0])
        self.assertIn("SET trip_id = NULL, trip_order = 0", cursor.executed[0][0])
        self.assertEqual(cursor.executed[0][1], ("japan-autumn-2023",))
        self.assertIn("DELETE FROM trips", cursor.executed[1][0])

    def test_update_place_clears_trip_order_when_trip_is_removed(self):
        row = {
            "id": "place-1",
            "title": "Kyoto",
            "slug": "kyoto",
            "city": "Kyoto",
            "country": "Japan",
            "latitude": 35.0,
            "longitude": 135.0,
            "summary": "Summary",
            "trip_id": "trip-japan-2023",
            "marker_color": "#7dd8c6",
            "image_url": "https://example.com/cover.jpg",
            "tags": "[]",
            "visibility": "public",
            "group_ids": "[]",
            "start_date": "2023-10-07",
            "end_date": "2023-10-09",
            "status": "published",
            "description": "Description",
            "gallery": "[]",
            "companions": "[]",
            "rating": 4,
            "trip_order": 3,
        }
        cursor = FakeCursor(fetchone_results=[row])
        connection = FakeConnection(cursor)
        updated_place = PlaceDetail(
            id="place-1",
            title="Kyoto",
            slug="kyoto",
            city="Kyoto",
            country="Japan",
            latitude=35.0,
            longitude=135.0,
            summary="Summary",
            trip_id=None,
            marker_color="#7dd8c6",
            image_url="https://example.com/cover.jpg",
            tags=[],
            visibility="public",
            group_ids=[],
            start_date="2023-10-07",
            end_date="2023-10-09",
            status="published",
            description="Description",
            gallery=["https://example.com/cover.jpg"],
            companions=[],
            rating=4,
            trip_order=0,
        )

        with patch("app.data.get_connection", return_value=connection), patch("app.data.get_place_by_slug", return_value=updated_place):
            result = data.update_place("kyoto", PlaceUpdate(trip_id=None, trip_order=9))

        self.assertIsNotNone(result)
        self.assertTrue(connection.committed)
        update_query, update_params = cursor.executed[-1]
        self.assertIn("UPDATE places", update_query)
        self.assertIsNone(update_params[11])
        self.assertEqual(update_params[19], 0)

    def test_create_place_supports_unassigned_place(self):
        cursor = FakeCursor(fetchone_results=[[{"id": "group-team", "status": "active"}]])
        connection = FakeConnection(cursor)
        captured = {}

        payload = PlaceCreate(
            title="Standalone Place",
            summary="Summary",
            description="Description",
            city="Warsaw",
            country="Poland",
            latitude=52.2297,
            longitude=21.0122,
            start_date="2024-05-01",
            end_date="2024-05-02",
            trip_id=None,
            image_url="https://example.com/place.jpg",
            gallery=["https://example.com/place.jpg"],
            tags=["city"],
            visibility="group",
            group_ids=["group-team"],
            companions=[],
            rating=4,
            trip_order=0,
            status="draft",
        )

        def fake_insert_place(_, place_payload):
            captured.update(place_payload)

        with patch("app.data.get_connection", return_value=connection), patch("app.data.unique_slug", return_value="standalone-place"), patch("app.data.validate_group_ids", return_value=["group-team"]), patch("app.data.insert_place", side_effect=fake_insert_place):
            result = data.create_place(payload)

        self.assertEqual(result.trip_id, None)
        self.assertEqual(result.trip_order, 0)
        self.assertEqual(captured["trip_id"], None)
        self.assertEqual(captured["trip_order"], 0)
        self.assertEqual(captured["group_ids"], ["group-team"])
        self.assertTrue(connection.committed)

    def test_delete_group_requires_archived_and_no_references(self):
        cursor = FakeCursor(fetchone_results=[{"status": "active"}])
        connection = FakeConnection(cursor)
        with patch("app.data.get_connection", return_value=connection):
            with self.assertRaisesRegex(ValueError, "Only archived groups can be deleted"):
                data.delete_group("group-team")


if __name__ == "__main__":
    unittest.main()
