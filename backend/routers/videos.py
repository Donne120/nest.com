from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from database import get_db
import models
import schemas
import auth as auth_utils
import storage
import plan_limits

router = APIRouter(prefix="/api/videos", tags=["videos"])


def _org_video(
    video_id: str,
    org_id: str | None,
    db: Session,
) -> models.Video:
    """Fetch a video scoped to the org via module FK.

    Super-admins have org_id=None — skip the org filter.
    """
    q = (
        db.query(models.Video)
        .join(models.Module, models.Video.module_id == models.Module.id)
        .filter(models.Video.id == video_id)
    )
    if org_id is not None:
        q = q.filter(models.Module.organization_id == org_id)
    v = q.first()
    if not v:
        raise HTTPException(status_code=404, detail="Video not found")
    return v


def _video_out(v: models.Video, db: Session) -> schemas.VideoOut:
    q_count = (
        db.query(func.count(models.Question.id))
        .filter(models.Question.video_id == v.id)
        .scalar()
    )
    has_transcript = bool(
        db.query(models.VideoTranscript.id)
        .filter(
            models.VideoTranscript.video_id == v.id,
            models.VideoTranscript.full_text.isnot(None),
        )
        .first()
    )
    return schemas.VideoOut(**{**v.__dict__, "question_count": q_count, "has_transcript": has_transcript})


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


@router.get("/module/{module_id}", response_model=List[schemas.VideoOut])
def list_videos(
    module_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    _check_learner_access(current_user)
    # Verify the module belongs to this org (super_admin sees any module)
    q = db.query(models.Module).filter(models.Module.id == module_id)
    if current_user.organization_id is not None:
        q = q.filter(
            models.Module.organization_id == current_user.organization_id
        )
    module = q.first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    videos = (
        db.query(models.Video)
        .filter(models.Video.module_id == module_id)
        .order_by(models.Video.order_index)
        .all()
    )
    # Bulk question count and transcript status — one query each instead of one per video
    video_ids = [v.id for v in videos]
    q_counts: dict = {}
    transcript_ids: set = set()
    if video_ids:
        q_rows = (
            db.query(models.Question.video_id, func.count(models.Question.id))
            .filter(models.Question.video_id.in_(video_ids))
            .group_by(models.Question.video_id)
            .all()
        )
        q_counts = {vid: cnt for vid, cnt in q_rows}
        t_rows = (
            db.query(models.VideoTranscript.video_id)
            .filter(
                models.VideoTranscript.video_id.in_(video_ids),
                models.VideoTranscript.full_text.isnot(None),
            )
            .all()
        )
        transcript_ids = {r[0] for r in t_rows}
    return [
        schemas.VideoOut(**{
            **v.__dict__,
            "question_count": q_counts.get(v.id, 0),
            "has_transcript": v.id in transcript_ids,
        })
        for v in videos
    ]


@router.post("", response_model=schemas.VideoOut, status_code=201)
def create_video(
    payload: schemas.VideoCreate,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    # Ensure the target module belongs to this org
    module = db.query(models.Module).filter(
        models.Module.id == payload.module_id,
        models.Module.organization_id == current_user.organization_id,
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    v = models.Video(**payload.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return schemas.VideoOut(**{**v.__dict__, "question_count": 0})


@router.get("/{video_id}", response_model=schemas.VideoOut)
def get_video(
    video_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    v = _org_video(video_id, current_user.organization_id, db)
    return _video_out(v, db)


@router.get(
    "/{video_id}/timeline",
    response_model=List[schemas.TimelineMarker],
)
def get_timeline_markers(
    video_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    # Validate org ownership of the video
    _org_video(video_id, current_user.organization_id, db)

    questions = (
        db.query(models.Question)
        .filter(
            models.Question.video_id == video_id,
            models.Question.is_public.is_(True),
        )
        .options(joinedload(models.Question.answers))
        .order_by(models.Question.timestamp_seconds)
        .all()
    )
    return [
        schemas.TimelineMarker(
            timestamp_seconds=q.timestamp_seconds,
            question_id=q.id,
            question_preview=(
                q.question_text[:80]
                + ("..." if len(q.question_text) > 80 else "")
            ),
            status=q.status,
            answer_count=len(q.answers),
        )
        for q in questions
    ]


@router.put("/{video_id}", response_model=schemas.VideoOut)
def update_video(
    video_id: str,
    payload: schemas.VideoUpdate,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    v = _org_video(video_id, current_user.organization_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(v, field, value)
    db.commit()
    db.refresh(v)
    return _video_out(v, db)


_IMAGE_MAX_BYTES = 10 * 1024 * 1024    # 10 MB

_ALLOWED_VIDEO_MIME = {
    "video/mp4", "video/webm", "video/ogg", "video/quicktime",
}
_ALLOWED_VIDEO_EXT = {".mp4", ".webm", ".ogg", ".mov"}
_ALLOWED_IMAGE_MIME = {"image/jpeg", "image/png", "image/webp"}
_ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}


def _check_ext(filename: str, allowed_ext: set, label: str):
    import os
    ext = os.path.splitext(filename.lower())[1]
    if ext not in allowed_ext:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported {label} extension: {ext}",
        )


@router.post("/upload/video", status_code=201)
async def upload_video_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    """Upload a video file to Supabase Storage. Returns the signed URL."""
    base_content_type = (file.content_type or '').split(';')[0].strip()
    if base_content_type not in _ALLOWED_VIDEO_MIME:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video type: {file.content_type}",
        )
    data = await file.read()
    _check_ext(file.filename or "video.mp4", _ALLOWED_VIDEO_EXT, "video")
    # Super-admin is exempt from upload size limits
    if current_user.role != models.UserRole.super_admin:
        org = plan_limits.get_org_or_403(current_user, db)
        plan_limits.check_upload_size(org, len(data))
    url = storage.upload_video(
        data, file.filename or "video.mp4", file.content_type,
    )
    return {"url": url}


@router.post("/upload/thumbnail", status_code=201)
async def upload_thumbnail_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth_utils.require_educator),
):
    """Upload a thumbnail image to Supabase Storage. Returns the public URL."""
    if file.content_type not in _ALLOWED_IMAGE_MIME:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type: {file.content_type}",
        )
    data = await file.read()
    _check_ext(
        file.filename or "thumb.jpg", _ALLOWED_IMAGE_EXT, "image",
    )
    if len(data) > _IMAGE_MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Image exceeds maximum size of 10 MB",
        )
    url = storage.upload_thumbnail(
        data, file.filename or "thumb.jpg", file.content_type,
    )
    return {"url": url}


@router.delete("/{video_id}", status_code=204)
def delete_video(
    video_id: str,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    v = _org_video(video_id, current_user.organization_id, db)
    db.delete(v)
    db.commit()
