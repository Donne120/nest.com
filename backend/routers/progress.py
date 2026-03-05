from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.post("/update", status_code=204)
def update_progress(
    payload: schemas.ProgressUpdate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    # Verify the video belongs to this org
    video = (
        db.query(models.Video)
        .join(models.Module, models.Video.module_id == models.Module.id)
        .filter(
            models.Video.id == payload.video_id,
            models.Module.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.module_id == video.module_id,
    ).first()

    if not progress:
        progress = models.UserProgress(
            user_id=current_user.id,
            module_id=video.module_id,
            video_id=payload.video_id,
            status=models.ModuleStatus.in_progress,
        )
        db.add(progress)

    if payload.progress_seconds > progress.progress_seconds:
        progress.progress_seconds = payload.progress_seconds

    if payload.status:
        progress.status = payload.status
    elif progress.status == models.ModuleStatus.not_started:
        progress.status = models.ModuleStatus.in_progress

    if payload.status == models.ModuleStatus.completed:
        progress.completed_at = func.now()

    db.commit()
