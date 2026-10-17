from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.project import Project
from app.schemas.project import ProjectList, ProjectPublic

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=ProjectList)
def list_projects(
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    category: str | None = None,
    featured: bool | None = None,
    db: Session = Depends(get_db),
) -> ProjectList:
    filters = [Project.is_published.is_(True)]
    if category:
        filters.append(Project.category == category)
    if featured is not None:
        filters.append(Project.featured.is_(featured))

    total = db.scalar(select(func.count()).select_from(Project).where(*filters)) or 0
    items = db.scalars(
        select(Project)
        .where(*filters)
        .order_by(Project.sort_order, Project.id)
        .limit(limit)
        .offset(offset)
    ).all()
    return ProjectList(items=list(items), total=total, limit=limit, offset=offset)


@router.get("/{slug}", response_model=ProjectPublic)
def get_project(slug: str, db: Session = Depends(get_db)) -> Project:
    project = db.scalar(
        select(Project).where(Project.slug == slug, Project.is_published.is_(True))
    )
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project