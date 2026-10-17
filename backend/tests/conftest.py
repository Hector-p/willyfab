from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_db
from app.api.routes.auth import login_limiter
from app.api.routes.inquiries import reset_inquiry_rate_limit
from app.core.config import get_settings
from app.database.base import Base
from app.main import app


@pytest.fixture
def test_session_factory() -> Generator[sessionmaker[Session], None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    test_sessions = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    yield test_sessions
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def client(test_session_factory: sessionmaker[Session]) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        with test_session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def _reset_rate_limit() -> Generator[None, None, None]:
    reset_inquiry_rate_limit()
    login_limiter.reset()
    yield
    reset_inquiry_rate_limit()
    login_limiter.reset()


@pytest.fixture(autouse=True)
def _reset_settings_cache() -> Generator[None, None, None]:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
