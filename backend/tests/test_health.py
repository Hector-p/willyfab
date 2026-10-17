from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from app.models.project import Project
from app.models.service import Service


def test_health_reports_ok(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_public_services_are_paginated_and_ordered(
    client: TestClient,
    test_session_factory: sessionmaker[Session],
) -> None:
    with test_session_factory() as session:
        session.add_all(
            [
                Service(
                    slug="second",
                    number="02",
                    title="Second service",
                    category="Fabrication",
                    summary="Second summary",
                    description="Second description",
                    sort_order=2,
                    is_published=True,
                ),
                Service(
                    slug="first",
                    number="01",
                    title="First service",
                    category="Agro-processing",
                    summary="First summary",
                    description="First description",
                    sort_order=1,
                    is_published=True,
                ),
                Service(
                    slug="draft",
                    number="03",
                    title="Draft service",
                    category="Fabrication",
                    summary="Draft summary",
                    description="Draft description",
                    sort_order=3,
                    is_published=False,
                ),
            ]
        )
        session.commit()

    response = client.get("/api/v1/services?limit=1&offset=0")

    assert response.status_code == 200
    assert response.json()["total"] == 2
    assert response.json()["items"][0]["slug"] == "first"
    assert response.json()["limit"] == 1


def test_public_service_detail_hides_drafts_and_unknown_slugs(
    client: TestClient,
    test_session_factory: sessionmaker[Session],
) -> None:
    with test_session_factory() as session:
        session.add(
            Service(
                slug="draft-service",
                number="01",
                title="Draft service",
                category="Fabrication",
                summary="Draft summary",
                description="Draft description",
                sort_order=1,
                is_published=False,
            )
        )
        session.commit()

    assert client.get("/api/v1/services/draft-service").status_code == 404
    assert client.get("/api/v1/services/unknown").status_code == 404


def test_public_projects_are_published_and_filterable(
    client: TestClient,
    test_session_factory: sessionmaker[Session],
) -> None:
    with test_session_factory() as session:
        session.add_all(
            [
                Project(
                    slug="published-project",
                    number="01",
                    title="Published project",
                    category="Fabrication",
                    short_description="Published summary",
                    brief="Project brief",
                    scope="Project scope",
                    featured=True,
                    sort_order=1,
                    is_published=True,
                ),
                Project(
                    slug="draft-project",
                    number="02",
                    title="Draft project",
                    category="Fabrication",
                    short_description="Draft summary",
                    brief="Draft brief",
                    scope="Draft scope",
                    featured=False,
                    sort_order=2,
                    is_published=False,
                ),
            ]
        )
        session.commit()

    response = client.get("/api/v1/projects?featured=true")

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["slug"] == "published-project"
    assert client.get("/api/v1/projects/draft-project").status_code == 404
