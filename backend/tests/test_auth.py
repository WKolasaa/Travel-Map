import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core import auth
from app.routers import auth as auth_router


class AuthTests(unittest.TestCase):
    def test_session_token_round_trip(self):
        user = auth.AuthUser(id="user-1", email="admin@example.com", name="Admin", role="admin")

        token = auth.create_session_token(user)
        parsed = auth.parse_session_token(token)

        self.assertIsNotNone(parsed)
        self.assertEqual(parsed.id, user.id)
        self.assertEqual(parsed.email, user.email)
        self.assertEqual(parsed.name, user.name)
        self.assertEqual(parsed.role, user.role)

    def test_tampered_session_token_is_rejected(self):
        user = auth.AuthUser(id="user-1", email="admin@example.com", name="Admin", role="admin")
        token = auth.create_session_token(user)
        payload, signature = token.split(".", 1)
        tampered = f"{payload}.broken{signature}"

        parsed = auth.parse_session_token(tampered)

        self.assertIsNone(parsed)

    def test_password_verification_matches_hash(self):
        password_hash = auth.hash_password("secret-password")
        self.assertTrue(auth.verify_password("secret-password", password_hash))
        self.assertFalse(auth.verify_password("wrong-password", password_hash))

    def test_authenticate_user_rejects_inactive_account(self):
        record = {
            "id": "user-1",
            "email": "viewer@example.com",
            "name": "Viewer",
            "password_hash": auth.hash_password("viewer-pass"),
            "role": "viewer",
            "is_active": False,
        }

        with patch("app.core.auth.get_user_auth_by_email", return_value=record):
            self.assertIsNone(auth.authenticate_user("viewer@example.com", "viewer-pass"))

    def test_authenticate_user_returns_role_bound_identity(self):
        record = {
            "id": "user-2",
            "email": "editor@example.com",
            "name": "Editor",
            "password_hash": auth.hash_password("editor-pass"),
            "role": "editor",
            "is_active": True,
        }

        with patch("app.core.auth.get_user_auth_by_email", return_value=record):
            user = auth.authenticate_user("editor@example.com", "editor-pass")

        self.assertIsNotNone(user)
        self.assertEqual(user.role, "editor")
        self.assertEqual(user.name, "Editor")


class AuthEndpointTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(auth_router.router, prefix="/api")
        self.client = TestClient(app)

    def test_login_returns_token_and_user_payload(self):
        user = auth.AuthUser(id="user-1", email="viewer@example.com", name="Viewer", role="viewer")
        with patch("app.routers.auth.authenticate_user", return_value=user), patch("app.routers.auth.create_session_token", return_value="signed-token"):
            response = self.client.post("/api/auth/login", json={"email": "viewer@example.com", "password": "secret123"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "token": "signed-token",
            "user": {"id": "user-1", "email": "viewer@example.com", "name": "Viewer", "role": "viewer", "group_ids": []},
        })

    def test_login_rejects_invalid_credentials(self):
        with patch("app.routers.auth.authenticate_user", return_value=None):
            response = self.client.post("/api/auth/login", json={"email": "viewer@example.com", "password": "bad-pass"})

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Invalid credentials")

    def test_me_returns_authenticated_user(self):
        user = auth.AuthUser(id="user-9", email="admin@example.com", name="Admin", role="admin")
        with patch("app.routers.auth.resolve_authenticated_user", return_value=user):
            app = FastAPI()
            app.dependency_overrides[auth.resolve_authenticated_user] = lambda: user
            app.include_router(auth_router.router, prefix="/api")
            client = TestClient(app)
            response = client.get("/api/auth/me")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], "user-9")
        self.assertEqual(response.json()["role"], "admin")


if __name__ == "__main__":
    unittest.main()
