import hmac

from fastapi import APIRouter, HTTPException, Request, Response, status

from app.api.dependencies import AdminUser
from app.core.config import get_settings
from app.core.rate_limit import SlidingWindowLimiter
from app.core.security import create_admin_token, verify_password
from app.schemas.auth import AdminMe, LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])

login_limiter = SlidingWindowLimiter(max_events=10, window_seconds=15 * 60)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request) -> TokenResponse:
    settings = get_settings()
    if not settings.admin_email or not settings.session_secret:
        raise HTTPException(status_code=503, detail="Administration is not configured")

    client_host = request.client.host if request.client else "unknown"
    if not login_limiter.allow(client_host):
        raise HTTPException(status_code=429, detail="Too many sign-in attempts. Try again later.")

    email_matches = hmac.compare_digest(
        payload.email.strip().lower().encode("utf-8"),
        settings.admin_email.strip().lower().encode("utf-8"),
    )
    password_matches = verify_password(payload.password, settings.admin_password_hash)
    if not (email_matches and password_matches):
        raise HTTPException(status_code=401, detail="Email or password is incorrect")

    principal, token = create_admin_token(
        subject=settings.admin_email,
        secret=settings.session_secret,
        ttl_minutes=settings.admin_token_ttl_minutes,
    )
    return TokenResponse(access_token=token, token_type="bearer", expires_at=principal.expires_at)


@router.get("/me", response_model=AdminMe)
def current_admin(principal: AdminUser) -> AdminMe:
    return AdminMe(email=principal.subject, expires_at=principal.expires_at)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout() -> Response:
    """Tokens are stateless and expire on their own, so the client discards its token.

    Revoking a token before it expires would need server-side state, which is not kept.
    """
    return Response(status_code=status.HTTP_204_NO_CONTENT)
