import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.security import hash_password

ADMIN_EMAIL = "admin@willyfab.test"
ADMIN_PASSWORD = "correct horse battery"
LOGIN_URL = "/api/v1/auth/login"
PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32


@pytest.fixture
def admin_settings(monkeypatch: pytest.MonkeyPatch, tmp_path) -> None:
    monkeypatch.setenv("ADMIN_EMAIL", ADMIN_EMAIL)
    monkeypatch.setenv("ADMIN_PASSWORD_HASH", hash_password(ADMIN_PASSWORD))
    monkeypatch.setenv("SESSION_SECRET", "test-session-secret")
    monkeypatch.setenv("UPLOAD_DIR", str(tmp_path / "uploads"))
    get_settings.cache_clear()


@pytest.fixture
def unconfigured_admin(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ADMIN_EMAIL", "")
    monkeypatch.setenv("SESSION_SECRET", "")
    get_settings.cache_clear()


def sign_in(client: TestClient) -> dict[str, str]:
    response = client.post(LOGIN_URL, json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def board_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": "Test Member",
        "position": "Chairman",
        "image_url": None,
        "image_alt": None,
        "sort_order": 0,
        "is_published": True,
    }
    payload.update(overrides)
    return payload


def project_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "slug": "test-project",
        "number": "01",
        "title": "Test Project",
        "category": "Fabrication",
        "image_url": None,
        "image_alt": None,
        "short_description": "A short description of the project.",
        "brief": "A longer brief describing the project.",
        "scope": "The scope of the work carried out.",
        "client": None,
        "location": None,
        "start_date": None,
        "completion_date": None,
        "featured": False,
        "sort_order": 0,
        "is_published": True,
    }
    payload.update(overrides)
    return payload


def test_login_is_disabled_until_admin_is_configured(
    client: TestClient, unconfigured_admin: None
) -> None:
    response = client.post(LOGIN_URL, json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert response.status_code == 503


def test_login_issues_token_for_valid_credentials(client: TestClient, admin_settings: None) -> None:
    headers = sign_in(client)
    assert headers["Authorization"].startswith("Bearer ")


def test_login_rejects_wrong_password(client: TestClient, admin_settings: None) -> None:
    response = client.post(LOGIN_URL, json={"email": ADMIN_EMAIL, "password": "not the password"})
    assert response.status_code == 401


def test_login_is_rate_limited(client: TestClient, admin_settings: None) -> None:
    statuses = [
        client.post(
            LOGIN_URL, json={"email": ADMIN_EMAIL, "password": "not the password"}
        ).status_code
        for _ in range(11)
    ]
    assert statuses[-1] == 429


def test_admin_routes_require_a_valid_token(client: TestClient, admin_settings: None) -> None:
    assert client.get("/api/v1/admin/projects").status_code == 401
    bad = {"Authorization": "Bearer not-a-token"}
    assert client.get("/api/v1/admin/projects", headers=bad).status_code == 401


def test_admin_routes_are_unavailable_without_configuration(
    client: TestClient, unconfigured_admin: None
) -> None:
    assert client.get("/api/v1/admin/projects").status_code == 503


def test_public_board_members_show_only_published_in_order(
    client: TestClient, admin_settings: None
) -> None:
    headers = sign_in(client)
    client.post(
        "/api/v1/admin/board-members",
        json=board_payload(name="Second Person", sort_order=2),
        headers=headers,
    )
    client.post(
        "/api/v1/admin/board-members",
        json=board_payload(name="Draft Person", is_published=False),
        headers=headers,
    )
    client.post(
        "/api/v1/admin/board-members",
        json=board_payload(name="First Person", sort_order=1),
        headers=headers,
    )

    body = client.get("/api/v1/board-members").json()
    assert [member["name"] for member in body["items"]] == ["First Person", "Second Person"]
    assert body["total"] == 2
    assert "is_published" not in body["items"][0]


def test_board_member_crud(client: TestClient, admin_settings: None) -> None:
    headers = sign_in(client)
    created = client.post("/api/v1/admin/board-members", json=board_payload(), headers=headers)
    assert created.status_code == 201
    member_id = created.json()["id"]

    updated = client.put(
        f"/api/v1/admin/board-members/{member_id}",
        json=board_payload(position="Vice Chairman"),
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["position"] == "Vice Chairman"

    assert (
        client.delete(f"/api/v1/admin/board-members/{member_id}", headers=headers).status_code
        == 204
    )
    assert (
        client.delete(f"/api/v1/admin/board-members/{member_id}", headers=headers).status_code
        == 404
    )


def test_board_member_rejects_unsafe_image_url(client: TestClient, admin_settings: None) -> None:
    headers = sign_in(client)
    response = client.post(
        "/api/v1/admin/board-members",
        json=board_payload(image_url="javascript:alert(1)"),
        headers=headers,
    )
    assert response.status_code == 422


def test_project_admin_crud_and_public_visibility(client: TestClient, admin_settings: None) -> None:
    headers = sign_in(client)
    created = client.post("/api/v1/admin/projects", json=project_payload(), headers=headers)
    assert created.status_code == 201
    project_id = created.json()["id"]
    assert client.get("/api/v1/projects/test-project").status_code == 200

    duplicate = client.post("/api/v1/admin/projects", json=project_payload(), headers=headers)
    assert duplicate.status_code == 409

    other = client.post(
        "/api/v1/admin/projects",
        json=project_payload(slug="other-project"),
        headers=headers,
    )
    other_id = other.json()["id"]
    clash = client.put(
        f"/api/v1/admin/projects/{other_id}",
        json=project_payload(slug="test-project"),
        headers=headers,
    )
    assert clash.status_code == 409

    renamed = client.put(
        f"/api/v1/admin/projects/{project_id}",
        json=project_payload(title="Renamed Project"),
        headers=headers,
    )
    assert renamed.status_code == 200
    assert renamed.json()["title"] == "Renamed Project"

    assert client.delete(f"/api/v1/admin/projects/{project_id}", headers=headers).status_code == 204
    assert client.get("/api/v1/projects/test-project").status_code == 404


def test_admin_lists_inquiries_newest_first(client: TestClient, admin_settings: None) -> None:
    for name in ["First Visitor", "Second Visitor"]:
        response = client.post(
            "/api/v1/inquiries",
            json={
                "name": name,
                "email": "visitor@example.com",
                "message": "I would like to discuss a fabrication project.",
            },
        )
        assert response.status_code == 201

    headers = sign_in(client)
    body = client.get("/api/v1/admin/inquiries", headers=headers).json()
    assert body["total"] == 2
    assert body["items"][0]["name"] == "Second Visitor"


def test_upload_accepts_png_and_stores_file(
    client: TestClient, admin_settings: None, tmp_path
) -> None:
    headers = sign_in(client)
    response = client.post(
        "/api/v1/admin/uploads",
        files={"file": ("photo.png", PNG_BYTES, "image/png")},
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["url"].startswith("http://127.0.0.1:8000/media/")
    assert (tmp_path / "uploads" / body["filename"]).read_bytes() == PNG_BYTES


def test_upload_rejects_non_image_content(client: TestClient, admin_settings: None) -> None:
    headers = sign_in(client)
    response = client.post(
        "/api/v1/admin/uploads",
        files={"file": ("notes.png", b"plain text pretending to be an image", "image/png")},
        headers=headers,
    )
    assert response.status_code == 422


def test_upload_rejects_oversized_files(
    client: TestClient, admin_settings: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("MAX_UPLOAD_BYTES", "100")
    get_settings.cache_clear()
    headers = sign_in(client)
    response = client.post(
        "/api/v1/admin/uploads",
        files={"file": ("big.png", PNG_BYTES + b"\x00" * 200, "image/png")},
        headers=headers,
    )
    assert response.status_code == 422


def service_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "slug": "test-service",
        "number": "01",
        "title": "Test Service",
        "category": "Fabrication",
        "capacity": None,
        "summary": "A short summary of the service.",
        "description": "A longer description of the service offered.",
        "sort_order": 0,
        "is_published": True,
    }
    payload.update(overrides)
    return payload


def test_service_admin_crud_and_public_visibility(client: TestClient, admin_settings: None) -> None:
    headers = sign_in(client)
    created = client.post("/api/v1/admin/services", json=service_payload(), headers=headers)
    assert created.status_code == 201, created.text
    service_id = created.json()["id"]

    assert client.get("/api/v1/services/test-service").status_code == 200

    updated = client.put(
        f"/api/v1/admin/services/{service_id}",
        json=service_payload(title="Renamed Service", is_published=False),
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Renamed Service"
    assert client.get("/api/v1/services/test-service").status_code == 404

    listed = client.get("/api/v1/admin/services", headers=headers).json()
    assert listed["total"] == 1

    deleted = client.delete(f"/api/v1/admin/services/{service_id}", headers=headers)
    assert deleted.status_code == 204
    assert client.get("/api/v1/admin/services", headers=headers).json()["total"] == 0


def test_service_slug_must_be_unique(client: TestClient, admin_settings: None) -> None:
    headers = sign_in(client)
    first = client.post("/api/v1/admin/services", json=service_payload(), headers=headers)
    assert first.status_code == 201
    duplicate = client.post("/api/v1/admin/services", json=service_payload(), headers=headers)
    assert duplicate.status_code == 409


class FakeR2Client:
    def __init__(self) -> None:
        self.calls: list[dict[str, object]] = []

    def put_object(self, **kwargs: object) -> None:
        self.calls.append(kwargs)


def configure_r2(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("STORAGE_BACKEND", "r2")
    monkeypatch.setenv("R2_ENDPOINT_URL", "https://example.r2.cloudflarestorage.com")
    monkeypatch.setenv("R2_ACCESS_KEY_ID", "key-id")
    monkeypatch.setenv("R2_SECRET_ACCESS_KEY", "secret")
    monkeypatch.setenv("R2_BUCKET", "willyfab-media")
    monkeypatch.setenv("R2_PUBLIC_BASE_URL", "https://media.willyfab.test")
    get_settings.cache_clear()


def test_upload_goes_to_r2_when_selected(
    client: TestClient,
    admin_settings: None,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path,
) -> None:
    from app.core import storage

    configure_r2(monkeypatch)
    fake = FakeR2Client()
    monkeypatch.setattr(storage, "_r2_client", lambda *args: fake)

    headers = sign_in(client)
    response = client.post(
        "/api/v1/admin/uploads",
        files={"file": ("photo.png", PNG_BYTES, "image/png")},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["url"] == f"https://media.willyfab.test/{body['filename']}"

    assert len(fake.calls) == 1
    call = fake.calls[0]
    assert call["Bucket"] == "willyfab-media"
    assert call["Key"] == body["filename"]
    assert call["Body"] == PNG_BYTES
    assert call["ContentType"] == "image/png"
    assert not (tmp_path / "uploads").exists()


def test_upload_reports_missing_r2_settings(
    client: TestClient, admin_settings: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("STORAGE_BACKEND", "r2")
    get_settings.cache_clear()
    headers = sign_in(client)
    response = client.post(
        "/api/v1/admin/uploads",
        files={"file": ("photo.png", PNG_BYTES, "image/png")},
        headers=headers,
    )
    assert response.status_code == 503
