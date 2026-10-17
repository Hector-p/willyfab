from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.security import hash_password

ADMIN_EMAIL = "admin@willyfab.test"
ADMIN_PASSWORD = "correct horse battery"
LOGIN_URL = "/api/v1/auth/login"
GALLERY_URL = "/api/v1/gallery"
ADMIN_GALLERY_URL = "/api/v1/admin/gallery"
PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
MEDIA_BASE = "http://testserver/media"


@pytest.fixture
def admin_settings(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Path:
    upload_dir = tmp_path / "uploads"
    monkeypatch.setenv("ADMIN_EMAIL", ADMIN_EMAIL)
    monkeypatch.setenv("ADMIN_PASSWORD_HASH", hash_password(ADMIN_PASSWORD))
    monkeypatch.setenv("SESSION_SECRET", "test-session-secret")
    monkeypatch.setenv("UPLOAD_DIR", str(upload_dir))
    monkeypatch.setenv("MEDIA_BASE_URL", MEDIA_BASE)
    get_settings.cache_clear()
    return upload_dir


def sign_in(client: TestClient) -> dict[str, str]:
    response = client.post(LOGIN_URL, json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def gallery_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "title": "Silo fabrication",
        "category": "Fabrication",
        "image_url": "/images/hero-02-engineering.jpg",
        "image_alt": "Steel silo under fabrication",
        "caption": None,
        "featured": False,
        "sort_order": 0,
        "is_published": True,
    }
    payload.update(overrides)
    return payload


def create_gallery_item(client: TestClient, headers: dict[str, str], **overrides: object) -> int:
    response = client.post(ADMIN_GALLERY_URL, json=gallery_payload(**overrides), headers=headers)
    assert response.status_code == 201, response.text
    return response.json()["id"]


def upload_png(client: TestClient, headers: dict[str, str]) -> str:
    response = client.post(
        "/api/v1/admin/uploads",
        files={"file": ("photo.png", PNG_BYTES, "image/png")},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()["url"]


def test_public_gallery_shows_only_published_items_in_order(
    client: TestClient, admin_settings: Path
) -> None:
    headers = sign_in(client)
    create_gallery_item(client, headers, title="Second", sort_order=20)
    create_gallery_item(client, headers, title="First", sort_order=10)
    create_gallery_item(client, headers, title="Hidden", is_published=False)

    items = client.get(GALLERY_URL).json()["items"]
    assert [item["title"] for item in items] == ["First", "Second"]
    assert "is_published" not in items[0]


def test_public_gallery_filters_by_category_and_featured(
    client: TestClient, admin_settings: Path
) -> None:
    headers = sign_in(client)
    create_gallery_item(client, headers, title="Fab featured", featured=True)
    create_gallery_item(client, headers, title="Fab plain", category="Fabrication")
    create_gallery_item(client, headers, title="Install", category="Installation")

    by_category = client.get(GALLERY_URL, params={"category": "Installation"}).json()["items"]
    assert [item["title"] for item in by_category] == ["Install"]

    featured = client.get(GALLERY_URL, params={"featured": "true"}).json()["items"]
    assert [item["title"] for item in featured] == ["Fab featured"]


def test_gallery_write_requires_an_image_and_alt_text(
    client: TestClient, admin_settings: Path
) -> None:
    headers = sign_in(client)
    missing_image = client.post(
        ADMIN_GALLERY_URL, json=gallery_payload(image_url=""), headers=headers
    )
    assert missing_image.status_code == 422

    external_image = client.post(
        ADMIN_GALLERY_URL,
        json=gallery_payload(image_url="ftp://example.com/a.jpg"),
        headers=headers,
    )
    assert external_image.status_code == 422

    no_alt = client.post(ADMIN_GALLERY_URL, json=gallery_payload(image_alt=""), headers=headers)
    assert no_alt.status_code == 422


def test_gallery_admin_requires_sign_in(client: TestClient, admin_settings: Path) -> None:
    assert client.get(ADMIN_GALLERY_URL).status_code == 401
    assert client.post(ADMIN_GALLERY_URL, json=gallery_payload()).status_code == 401


def test_gallery_update_changes_fields(client: TestClient, admin_settings: Path) -> None:
    headers = sign_in(client)
    image_id = create_gallery_item(client, headers)
    response = client.put(
        f"{ADMIN_GALLERY_URL}/{image_id}",
        json=gallery_payload(title="Renamed", featured=True, caption="  "),
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Renamed"
    assert body["featured"] is True
    assert body["caption"] is None


def test_gallery_reorder_sets_sort_order(client: TestClient, admin_settings: Path) -> None:
    headers = sign_in(client)
    first = create_gallery_item(client, headers, title="First")
    second = create_gallery_item(client, headers, title="Second")
    third = create_gallery_item(client, headers, title="Third")

    response = client.post(
        f"{ADMIN_GALLERY_URL}/reorder", json={"ids": [third, first, second]}, headers=headers
    )
    assert response.status_code == 200
    assert [item["id"] for item in response.json()["items"]] == [third, first, second]


def test_gallery_reorder_rejects_unknown_and_duplicate_ids(
    client: TestClient, admin_settings: Path
) -> None:
    headers = sign_in(client)
    image_id = create_gallery_item(client, headers)

    unknown = client.post(
        f"{ADMIN_GALLERY_URL}/reorder", json={"ids": [image_id, 9999]}, headers=headers
    )
    assert unknown.status_code == 404

    duplicate = client.post(
        f"{ADMIN_GALLERY_URL}/reorder", json={"ids": [image_id, image_id]}, headers=headers
    )
    assert duplicate.status_code == 422


def test_deleting_gallery_item_removes_its_uploaded_file(
    client: TestClient, admin_settings: Path
) -> None:
    headers = sign_in(client)
    url = upload_png(client, headers)
    stored_file = admin_settings / url.rsplit("/", 1)[-1]
    assert stored_file.exists()

    image_id = create_gallery_item(client, headers, image_url=url)
    response = client.delete(f"{ADMIN_GALLERY_URL}/{image_id}", headers=headers)
    assert response.status_code == 204
    assert not stored_file.exists()


def test_upload_is_kept_while_another_record_still_uses_it(
    client: TestClient, admin_settings: Path
) -> None:
    headers = sign_in(client)
    url = upload_png(client, headers)
    stored_file = admin_settings / url.rsplit("/", 1)[-1]

    first = create_gallery_item(client, headers, image_url=url)
    create_gallery_item(client, headers, image_url=url, title="Second use")

    client.delete(f"{ADMIN_GALLERY_URL}/{first}", headers=headers)
    assert stored_file.exists()


def test_replacing_gallery_image_removes_the_old_upload(
    client: TestClient, admin_settings: Path
) -> None:
    headers = sign_in(client)
    old_url = upload_png(client, headers)
    old_file = admin_settings / old_url.rsplit("/", 1)[-1]
    image_id = create_gallery_item(client, headers, image_url=old_url)

    response = client.put(
        f"{ADMIN_GALLERY_URL}/{image_id}",
        json=gallery_payload(image_url="/images/hero-04-machinery.jpg"),
        headers=headers,
    )
    assert response.status_code == 200
    assert not old_file.exists()


def test_deleting_item_with_bundled_image_does_not_touch_storage(
    client: TestClient, admin_settings: Path
) -> None:
    headers = sign_in(client)
    image_id = create_gallery_item(client, headers, image_url="/images/hero-02-engineering.jpg")
    response = client.delete(f"{ADMIN_GALLERY_URL}/{image_id}", headers=headers)
    assert response.status_code == 204
    assert not admin_settings.exists() or not any(admin_settings.iterdir())


def test_inquiry_status_can_be_updated_and_filtered(
    client: TestClient, admin_settings: Path
) -> None:
    headers = sign_in(client)
    created = client.post(
        "/api/v1/inquiries",
        json={
            "name": "Ada Okafor",
            "email": "ada@example.com",
            "message": "We need a quote for a storage silo.",
        },
    )
    assert created.status_code in (200, 201), created.text

    listed = client.get("/api/v1/admin/inquiries", headers=headers).json()
    assert listed["items"][0]["status"] == "new"
    inquiry_id = listed["items"][0]["id"]

    updated = client.patch(
        f"/api/v1/admin/inquiries/{inquiry_id}", json={"status": "contacted"}, headers=headers
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "contacted"

    contacted = client.get(
        "/api/v1/admin/inquiries", params={"status": "contacted"}, headers=headers
    ).json()
    assert contacted["total"] == 1
    assert (
        client.get("/api/v1/admin/inquiries", params={"status": "new"}, headers=headers).json()[
            "total"
        ]
        == 0
    )


def test_inquiry_status_rejects_unknown_values(client: TestClient, admin_settings: Path) -> None:
    headers = sign_in(client)
    response = client.patch(
        "/api/v1/admin/inquiries/1", json={"status": "spam-folder"}, headers=headers
    )
    assert response.status_code == 422


def test_me_returns_the_signed_in_admin(client: TestClient, admin_settings: Path) -> None:
    headers = sign_in(client)
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == ADMIN_EMAIL
    assert client.get("/api/v1/auth/me").status_code == 401


def test_logout_returns_no_content(client: TestClient, admin_settings: Path) -> None:
    assert client.post("/api/v1/auth/logout").status_code == 204
