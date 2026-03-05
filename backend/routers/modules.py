from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(prefix="/api/modules", tags=["modules"])


def _org_module(module_id: str, org_id: str, db: Session) -> models.Module:
    """Fetch a module scoped to the org. Raises 404 if not found or cross-org."""
    m = db.query(models.Module).filter(
        models.Module.id == module_id,
        models.Module.organization_id == org_id,
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Module not found")
    return m


def _module_out(m: models.Module, db: Session) -> schemas.ModuleOut:
    video_ids = [v.id for v in m.videos]
    q_count = (
        db.query(func.count(models.Question.id))
        .filter(models.Question.video_id.in_(video_ids))
        .scalar()
    ) if video_ids else 0
    return schemas.ModuleOut(
        id=m.id, title=m.title, description=m.description,
        thumbnail_url=m.thumbnail_url,
        duration_seconds=sum(v.duration_seconds for v in m.videos),
        order_index=m.order_index, is_published=m.is_published,
        created_at=m.created_at, video_count=len(m.videos), question_count=q_count,
    )


@router.get("", response_model=List[schemas.ModuleWithProgress])
def list_modules(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    modules = (
        db.query(models.Module)
        .filter(
            models.Module.organization_id == current_user.organization_id,
            models.Module.is_published == True,
        )
        .order_by(models.Module.order_index)
        .all()
    )
    result = []
    for m in modules:
        video_ids = [v.id for v in m.videos]
        q_count = (
            db.query(func.count(models.Question.id))
            .filter(models.Question.video_id.in_(video_ids))
            .scalar()
        ) if video_ids else 0

        progress = db.query(models.UserProgress).filter(
            models.UserProgress.user_id == current_user.id,
            models.UserProgress.module_id == m.id,
        ).first()

        result.append(schemas.ModuleWithProgress(
            id=m.id, title=m.title, description=m.description,
            thumbnail_url=m.thumbnail_url,
            duration_seconds=sum(v.duration_seconds for v in m.videos),
            order_index=m.order_index, is_published=m.is_published,
            created_at=m.created_at, video_count=len(m.videos), question_count=q_count,
            status=progress.status if progress else models.ModuleStatus.not_started,
            progress_seconds=progress.progress_seconds if progress else 0,
            last_viewed_at=progress.last_viewed_at if progress else None,
        ))
    return result


@router.post("", response_model=schemas.ModuleOut, status_code=201)
def create_module(
    payload: schemas.ModuleCreate,
    current_user: models.User = Depends(auth_utils.require_manager),
    db: Session = Depends(get_db),
):
    m = models.Module(
        **payload.model_dump(),
        created_by=current_user.id,
        organization_id=current_user.organization_id,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return schemas.ModuleOut(
        id=m.id, title=m.title, description=m.description,
        thumbnail_url=m.thumbnail_url, duration_seconds=0,
        order_index=m.order_index, is_published=m.is_published,
        created_at=m.created_at, video_count=0, question_count=0,
    )


@router.get("/{module_id}", response_model=schemas.ModuleOut)
def get_module(
    module_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    m = _org_module(module_id, current_user.organization_id, db)
    return _module_out(m, db)


@router.put("/{module_id}", response_model=schemas.ModuleOut)
def update_module(
    module_id: str,
    payload: schemas.ModuleUpdate,
    current_user: models.User = Depends(auth_utils.require_manager),
    db: Session = Depends(get_db),
):
    m = _org_module(module_id, current_user.organization_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(m, field, value)
    db.commit()
    db.refresh(m)
    return _module_out(m, db)


@router.delete("/{module_id}", status_code=204)
def delete_module(
    module_id: str,
    current_user: models.User = Depends(auth_utils.require_admin),
    db: Session = Depends(get_db),
):
    m = _org_module(module_id, current_user.organization_id, db)
    db.delete(m)
    db.commit()
