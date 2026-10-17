from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.service import Service
from app.schemas.service import ServiceList, ServicePublic

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=ServiceList)
def list_services(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    category: str | None = None,
    db: Session = Depends(get_db),
) -> ServiceList:
    filters = [Service.is_published.is_(True)]
    if category:
        filters.append(Service.category == category)

    total = db.scalar(select(func.count()).select_from(Service).where(*filters)) or 0
    items = db.scalars(
        select(Service)
        .where(*filters)
        .order_by(Service.sort_order, Service.id)
        .limit(limit)
        .offset(offset)
    ).all()
    return ServiceList(items=list(items), total=total, limit=limit, offset=offset)


@router.get("/{slug}", response_model=ServicePublic)
def get_service(slug: str, db: Session = Depends(get_db)) -> Service:
    service = db.scalar(
        select(Service).where(Service.slug == slug, Service.is_published.is_(True))
    )
    if service is None:
        raise HTTPException(status_code=404, detail="Service not found")
    return service