import threading
import time
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.inquiry import Inquiry
from app.schemas.inquiry import InquiryCreate, InquiryReceipt

router = APIRouter(prefix="/inquiries", tags=["inquiries"])

RATE_LIMIT_WINDOW_SECONDS = 15 * 60
RATE_LIMIT_MAX_SUBMISSIONS = 5

_submission_times: dict[str, deque[float]] = defaultdict(deque)
_rate_limit_lock = threading.Lock()


def reset_inquiry_rate_limit() -> None:
    with _rate_limit_lock:
        _submission_times.clear()


def _enforce_rate_limit(client_key: str) -> None:
    now = time.monotonic()
    with _rate_limit_lock:
        window = _submission_times[client_key]
        while window and now - window[0] > RATE_LIMIT_WINDOW_SECONDS:
            window.popleft()
        if len(window) >= RATE_LIMIT_MAX_SUBMISSIONS:
            raise HTTPException(
                status_code=429,
                detail=(
                    "Too many enquiries were sent from this connection. "
                    "Please try again later or contact us by phone or email."
                ),
            )
        window.append(now)


@router.post("", status_code=201, response_model=InquiryReceipt)
def create_inquiry(
    payload: InquiryCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> InquiryReceipt:
    if payload.website:
        return InquiryReceipt(status="received")

    client_host = request.client.host if request.client else "unknown"
    _enforce_rate_limit(client_host)

    db.add(
        Inquiry(
            name=payload.name,
            email=payload.email,
            phone=payload.phone,
            company=payload.company,
            service_interest=payload.service_interest,
            message=payload.message,
        )
    )
    db.commit()
    return InquiryReceipt(status="received")
