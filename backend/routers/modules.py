from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(prefix="/api/modules", tags=["modules"])


def _check_learner_access(user: models.User):
    if (
        user.role == models.UserRole.learner
        and not user.payment_verified
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Access requires an approved payment. "
                "Submit your proof and wait for admin approval."
            ),
        )


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
    _check_learner_access(current_user)
    modules = (
        db.query(models.Module)
        .filter(
            models.Module.organization_id == current_user.organization_id,
            models.Module.is_published.is_(True),
        )
        .options(joinedload(models.Module.videos))
        .order_by(models.Module.order_index)
        .all()
    )

    # Bulk fetch question counts for all modules in one query
    module_ids = [m.id for m in modules]
    all_video_ids = [v.id for m in modules for v in m.videos]

    q_counts_by_module: dict = {}
    if all_video_ids:
        rows = (
            db.query(models.Video.module_id, func.count(models.Question.id))
            .join(models.Question, models.Video.id == models.Question.video_id)
            .filter(models.Video.module_id.in_(module_ids))
            .group_by(models.Video.module_id)
            .all()
        )
        q_counts_by_module = {mid: cnt for mid, cnt in rows}

    # Bulk fetch all progress records for this user in one query
    progress_map: dict = {}
    if module_ids:
        progress_rows = (
            db.query(models.UserProgress)
            .filter(
                models.UserProgress.user_id == current_user.id,
                models.UserProgress.module_id.in_(module_ids),
            )
            .all()
        )
        progress_map = {p.module_id: p for p in progress_rows}

    result = []
    for m in modules:
        progress = progress_map.get(m.id)
        result.append(schemas.ModuleWithProgress(
            id=m.id, title=m.title, description=m.description,
            thumbnail_url=m.thumbnail_url,
            duration_seconds=sum(v.duration_seconds for v in m.videos),
            order_index=m.order_index, is_published=m.is_published,
            created_at=m.created_at, video_count=len(m.videos),
            question_count=q_counts_by_module.get(m.id, 0),
            status=progress.status if progress else models.ModuleStatus.not_started,
            progress_seconds=progress.progress_seconds if progress else 0,
            last_viewed_at=progress.last_viewed_at if progress else None,
        ))
    return result


@router.post("", response_model=schemas.ModuleOut, status_code=201)
def create_module(
    payload: schemas.ModuleCreate,
    current_user: models.User = Depends(auth_utils.require_educator),
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


@router.get("/{module_id}", response_model=schemas.ModuleWithProgress)
def get_module(
    module_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    _check_learner_access(current_user)
    m = _org_module(module_id, current_user.organization_id, db)
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
    return schemas.ModuleWithProgress(
        id=m.id, title=m.title, description=m.description,
        thumbnail_url=m.thumbnail_url,
        duration_seconds=sum(v.duration_seconds for v in m.videos),
        order_index=m.order_index, is_published=m.is_published,
        created_at=m.created_at, video_count=len(m.videos), question_count=q_count,
        status=progress.status if progress else models.ModuleStatus.not_started,
        progress_seconds=progress.progress_seconds if progress else 0,
        last_viewed_at=progress.last_viewed_at if progress else None,
    )


@router.put("/{module_id}", response_model=schemas.ModuleOut)
def update_module(
    module_id: str,
    payload: schemas.ModuleUpdate,
    current_user: models.User = Depends(auth_utils.require_educator),
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
    current_user: models.User = Depends(auth_utils.require_owner),
    db: Session = Depends(get_db),
):
    m = _org_module(module_id, current_user.organization_id, db)
    db.delete(m)
    db.commit()
