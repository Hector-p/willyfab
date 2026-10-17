from collections.abc import Generator
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import AdminToken, read_admin_token
from app.database.session import SessionLocal


def get_db() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session


def require_admin(authorization: Annotated[str | None, Header()] = None) -> AdminToken:
    settings = get_settings()
    if not settings.admin_email or not settings.session_secret:
        raise HTTPException(status_code=503, detail="Administration is not configured")

    scheme, _, token = (authorization or "").partition(" ")
    principal = (
        read_admin_token(token.strip(), settings.session_secret)
        if scheme.lower() == "bearer"
        else None
    )
    if principal is None or principal.subject != settings.admin_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to continue",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return principal


AdminUser = Annotated[AdminToken, Depends(require_admin)]
DbSession = Annotated[Session, Depends(get_db)]
