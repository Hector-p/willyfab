from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from app.api.routes import inquiries as inquiries_route
from app.models.inquiry import Inquiry


def valid_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": "Ada Obi",
        "email": "ada@example.com",
        "phone": "+234 803 000 0000",
        "company": "Obi Farms",
        "service_interest": "Steel fabrication",
        "message": "We need quotes for a steel gate and a pergola.",
        "website": "",
    }
    payload.update(overrides)
    return payload


def test_valid_inquiry_is_stored(
    client: TestClient,
    test_session_factory: sessionmaker[Session],
) -> None:
    response = client.post("/api/v1/inquiries", json=valid_payload())

    assert response.status_code == 201
    assert response.json() == {"status": "received"}
    with test_session_factory() as session:
        stored = session.scalars(select(Inquiry)).one()
        assert stored.email == "ada@example.com"
        assert stored.service_interest == "Steel fabrication"


def test_honeypot_submission_is_accepted_but_not_stored(
    client: TestClient,
    test_session_factory: sessionmaker[Session],
) -> None:
    response = client.post("/api/v1/inquiries", json=valid_payload(website="http://spam.example"))

    assert response.status_code == 201
    with test_session_factory() as session:
        assert session.scalars(select(Inquiry)).all() == []


def test_invalid_inquiry_is_rejected(client: TestClient) -> None:
    invalid_payloads = [
        valid_payload(email="not-an-email"),
        valid_payload(message="short"),
        valid_payload(phone="call me"),
        valid_payload(unexpected="field"),
    ]
    for payload in invalid_payloads:
        assert client.post("/api/v1/inquiries", json=payload).status_code == 422


def test_blank_optional_fields_are_stored_as_none(
    client: TestClient,
    test_session_factory: sessionmaker[Session],
) -> None:
    response = client.post(
        "/api/v1/inquiries",
        json=valid_payload(phone="", company="   ", service_interest=""),
    )

    assert response.status_code == 201
    with test_session_factory() as session:
        stored = session.scalars(select(Inquiry)).one()
        assert stored.phone is None
        assert stored.company is None
        assert stored.service_interest is None


def test_inquiry_submissions_are_rate_limited_per_client(client: TestClient) -> None:
    for _ in range(inquiries_route.RATE_LIMIT_MAX_SUBMISSIONS):
        assert client.post("/api/v1/inquiries", json=valid_payload()).status_code == 201

    response = client.post("/api/v1/inquiries", json=valid_payload())

    assert response.status_code == 429
    assert "Too many enquiries" in response.json()["detail"]
