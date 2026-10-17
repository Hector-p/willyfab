from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.gallery_image import GalleryImage
from app.schemas.gallery import GalleryImageList, GalleryImagePublic

router = APIRouter(prefix="/gallery", tags=["gallery"])


@router.get("", response_model=GalleryImageList)
def list_gallery(
    category: str | None = None,
    featured: bool | None = None,
    limit: int = Query(default=60, ge=1, le=200),
    db: Session = Depends(get_db),
) -> GalleryImageList:
    filters = [GalleryImage.is_published.is_(True)]
    if category:
        filters.append(GalleryImage.category == category)
    if featured is not None:
        filters.append(GalleryImage.featured.is_(featured))

    items = db.scalars(
        select(GalleryImage)
        .where(*filters)
        .order_by(GalleryImage.sort_order, GalleryImage.id)
        .limit(limit)
    ).all()
    return GalleryImageList(
        items=[GalleryImagePublic.model_validate(item) for item in items],
        total=len(items),
    )
