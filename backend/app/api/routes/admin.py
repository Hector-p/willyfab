import logging

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_admin
from app.core.config import Settings, get_settings
from app.core.storage import StorageNotConfigured, build_storage, storage_key_for_url
from app.core.uploads import UploadRejected, store_image
from app.models.board_member import BoardMember
from app.models.gallery_image import GalleryImage
from app.models.inquiry import Inquiry
from app.models.project import Project
from app.models.service import Service
from app.schemas.board_member import BoardMemberAdmin, BoardMemberAdminList, BoardMemberWrite
from app.schemas.gallery import (
    GalleryImageAdmin,
    GalleryImageAdminList,
    GalleryImageWrite,
    GalleryReorder,
)
from app.schemas.inquiry import InquiryAdmin, InquiryAdminList, InquiryStatus, InquiryStatusUpdate
from app.schemas.project import ProjectAdmin, ProjectAdminList, ProjectWrite
from app.schemas.service import ServiceAdmin, ServiceAdminList, ServiceWrite
from app.schemas.upload import UploadResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])

_GALLERY_ORDER = select(GalleryImage).order_by(GalleryImage.sort_order, GalleryImage.id)


def _get_or_404(db: Session, model: type, item_id: int, label: str):
    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    return item


@router.get("/board-members", response_model=BoardMemberAdminList)
def list_board_members_admin(db: Session = Depends(get_db)) -> BoardMemberAdminList:
    items = db.scalars(select(BoardMember).order_by(BoardMember.sort_order, BoardMember.id)).all()
    return BoardMemberAdminList(items=list(items), total=len(items))


@router.post("/board-members", status_code=status.HTTP_201_CREATED, response_model=BoardMemberAdmin)
def create_board_member(payload: BoardMemberWrite, db: Session = Depends(get_db)) -> BoardMember:
    member = BoardMember(**payload.model_dump())
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.put("/board-members/{member_id}", response_model=BoardMemberAdmin)
def update_board_member(
    member_id: int,
    payload: BoardMemberWrite,
    db: Session = Depends(get_db),
) -> BoardMember:
    member = _get_or_404(db, BoardMember, member_id, "Board member")
    for field, value in payload.model_dump().items():
        setattr(member, field, value)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/board-members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_board_member(member_id: int, db: Session = Depends(get_db)) -> Response:
    member = _get_or_404(db, BoardMember, member_id, "Board member")
    db.delete(member)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/projects", response_model=ProjectAdminList)
def list_projects_admin(db: Session = Depends(get_db)) -> ProjectAdminList:
    items = db.scalars(select(Project).order_by(Project.sort_order, Project.id)).all()
    return ProjectAdminList(items=list(items), total=len(items))


def _ensure_slug_free(db: Session, slug: str, current_id: int | None = None) -> None:
    query = select(Project.id).where(Project.slug == slug)
    if current_id is not None:
        query = query.where(Project.id != current_id)
    if db.scalar(query.limit(1)) is not None:
        raise HTTPException(status_code=409, detail="A project with this slug already exists")


@router.post("/projects", status_code=status.HTTP_201_CREATED, response_model=ProjectAdmin)
def create_project(payload: ProjectWrite, db: Session = Depends(get_db)) -> Project:
    _ensure_slug_free(db, payload.slug)
    project = Project(**payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.put("/projects/{project_id}", response_model=ProjectAdmin)
def update_project(
    project_id: int, payload: ProjectWrite, db: Session = Depends(get_db)
) -> Project:
    project = _get_or_404(db, Project, project_id, "Project")
    _ensure_slug_free(db, payload.slug, current_id=project.id)
    for field, value in payload.model_dump().items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db)) -> Response:
    project = _get_or_404(db, Project, project_id, "Project")
    db.delete(project)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/services", response_model=ServiceAdminList)
def list_services_admin(db: Session = Depends(get_db)) -> ServiceAdminList:
    items = db.scalars(select(Service).order_by(Service.sort_order, Service.id)).all()
    return ServiceAdminList(items=list(items), total=len(items))


def _ensure_service_slug_free(db: Session, slug: str, current_id: int | None = None) -> None:
    query = select(Service.id).where(Service.slug == slug)
    if current_id is not None:
        query = query.where(Service.id != current_id)
    if db.scalar(query.limit(1)) is not None:
        raise HTTPException(status_code=409, detail="A service with this slug already exists")


@router.post("/services", status_code=status.HTTP_201_CREATED, response_model=ServiceAdmin)
def create_service(payload: ServiceWrite, db: Session = Depends(get_db)) -> Service:
    _ensure_service_slug_free(db, payload.slug)
    service = Service(**payload.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/services/{service_id}", response_model=ServiceAdmin)
def update_service(
    service_id: int, payload: ServiceWrite, db: Session = Depends(get_db)
) -> Service:
    service = _get_or_404(db, Service, service_id, "Service")
    _ensure_service_slug_free(db, payload.slug, current_id=service.id)
    for field, value in payload.model_dump().items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service


@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: int, db: Session = Depends(get_db)) -> Response:
    service = _get_or_404(db, Service, service_id, "Service")
    db.delete(service)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/inquiries", response_model=InquiryAdminList)
def list_inquiries(
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    status_filter: InquiryStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
) -> InquiryAdminList:
    filters = [Inquiry.status == status_filter] if status_filter else []
    total = db.scalar(select(func.count()).select_from(Inquiry).where(*filters)) or 0
    items = db.scalars(
        select(Inquiry)
        .where(*filters)
        .order_by(Inquiry.created_at.desc(), Inquiry.id.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    return InquiryAdminList(
        items=[InquiryAdmin.model_validate(item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.patch("/inquiries/{inquiry_id}", response_model=InquiryAdmin)
def update_inquiry_status(
    inquiry_id: int, payload: InquiryStatusUpdate, db: Session = Depends(get_db)
) -> InquiryAdmin:
    inquiry = _get_or_404(db, Inquiry, inquiry_id, "Inquiry")
    inquiry.status = payload.status
    db.commit()
    db.refresh(inquiry)
    return InquiryAdmin.model_validate(inquiry)


@router.get("/gallery", response_model=GalleryImageAdminList)
def list_gallery_admin(db: Session = Depends(get_db)) -> GalleryImageAdminList:
    items = db.scalars(_GALLERY_ORDER).all()
    return GalleryImageAdminList(items=list(items), total=len(items))


@router.post("/gallery", status_code=status.HTTP_201_CREATED, response_model=GalleryImageAdmin)
def create_gallery_image(payload: GalleryImageWrite, db: Session = Depends(get_db)) -> GalleryImage:
    image = GalleryImage(**payload.model_dump())
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


@router.post("/gallery/reorder", response_model=GalleryImageAdminList)
def reorder_gallery(
    payload: GalleryReorder, db: Session = Depends(get_db)
) -> GalleryImageAdminList:
    images = {image.id: image for image in db.scalars(select(GalleryImage)).all()}
    missing = [image_id for image_id in payload.ids if image_id not in images]
    if missing:
        raise HTTPException(status_code=404, detail="Some gallery images were not found")
    for position, image_id in enumerate(payload.ids):
        images[image_id].sort_order = position * 10
    db.commit()
    items = db.scalars(_GALLERY_ORDER).all()
    return GalleryImageAdminList(items=list(items), total=len(items))


@router.put("/gallery/{image_id}", response_model=GalleryImageAdmin)
def update_gallery_image(
    image_id: int,
    payload: GalleryImageWrite,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> GalleryImage:
    image = _get_or_404(db, GalleryImage, image_id, "Gallery image")
    previous_url = image.image_url
    for field, value in payload.model_dump().items():
        setattr(image, field, value)
    db.commit()
    db.refresh(image)
    if previous_url != image.image_url:
        _remove_unreferenced_upload(db, previous_url, settings)
    return image


@router.delete("/gallery/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gallery_image(
    image_id: int,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    image = _get_or_404(db, GalleryImage, image_id, "Gallery image")
    previous_url = image.image_url
    db.delete(image)
    db.commit()
    _remove_unreferenced_upload(db, previous_url, settings)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _remove_unreferenced_upload(db: Session, url: str, settings: Settings) -> None:
    """Delete a stored upload once no project, board member or gallery image uses it."""
    key = storage_key_for_url(url, settings)
    if key is None:
        return
    references = (
        (Project, Project.image_url),
        (BoardMember, BoardMember.image_url),
        (GalleryImage, GalleryImage.image_url),
    )
    for model, column in references:
        if db.scalar(select(func.count()).select_from(model).where(column == url)):
            return
    try:
        build_storage(settings).delete(key)
    except (StorageNotConfigured, ValueError, OSError):
        logger.warning("Could not remove stored image %s", key, exc_info=True)
    except Exception:
        logger.exception("Unexpected error removing stored image %s", key)


@router.post("/uploads", status_code=status.HTTP_201_CREATED, response_model=UploadResponse)
def upload_image(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> UploadResponse:
    try:
        storage = build_storage(settings)
        stored = store_image(file.file, storage, settings.max_upload_bytes)
    except UploadRejected as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except StorageNotConfigured as exc:
        raise HTTPException(status_code=503, detail="Image storage is not configured") from exc
    return UploadResponse(filename=stored.filename, url=stored.url)
