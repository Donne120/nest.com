from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_db
import models
import schemas
import auth as auth_utils
import storage

router = APIRouter(prefix="/api/videos", tags=["videos"])


def _org_video(video_id: str, org_id: str, db: Session) -> models.Video:
    """Fetch a video scoped to the org via module FK. Raises 404 otherwise."""
    v = (
        db.query(models.Video)
        .join(models.Module, models.Video.module_id == models.Module.id)
        .filter(
            models.Video.id == video_id,
            models.Module.organization_id == org_id,
        )
        .first()
    )
    if not v:
        raise HTTPException(status_code=404, detail="Video not found")
    return v


def _video_out(v: models.Video, db: Session) -> schemas.VideoOut:
    q_count = db.query(func.count(models.Question.id)).filter(models.Question.video_id == v.id).scalar()
    return schemas.VideoOut(**{**v.__dict__, "question_count": q_count})


@router.get("/module/{module_id}", response_model=List[schemas.VideoOut])
def list_videos(
    module_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    # Verify the module belongs to this org
    module = db.query(models.Module).filter(
        models.Module.id == module_id,
        models.Module.organization_id == current_user.organization_id,
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    videos = (
        db.query(models.Video)
        .filter(models.Video.module_id == module_id)
        .order_by(models.Video.order_index)
        .all()
    )
    return [_video_out(v, db) for v in videos]


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


@router.get("/{video_id}/timeline", response_model=List[schemas.TimelineMarker])
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
            models.Question.is_public == True,
        )
        .order_by(models.Question.timestamp_seconds)
        .all()
    )
    return [
        schemas.TimelineMarker(
            timestamp_seconds=q.timestamp_seconds,
            question_id=q.id,
            question_preview=q.question_text[:80] + ("..." if len(q.question_text) > 80 else ""),
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


_VIDEO_MAX_BYTES = 500 * 1024 * 1024   # 500 MB
_IMAGE_MAX_BYTES = 10 * 1024 * 1024    # 10 MB

_ALLOWED_VIDEO_MIME = {"video/mp4", "video/webm", "video/ogg", "video/quicktime"}
_ALLOWED_VIDEO_EXT = {".mp4", ".webm", ".ogg", ".mov"}
_ALLOWED_IMAGE_MIME = {"image/jpeg", "image/png", "image/webp"}
_ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}


def _check_upload(data: bytes, filename: str, allowed_mime: set, allowed_ext: set, max_bytes: int, label: str):
    import os
    ext = os.path.splitext(filename.lower())[1]
    if ext not in allowed_ext:
        raise HTTPException(status_code=400, detail=f"Unsupported {label} extension: {ext}")
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail=f"{label.capitalize()} exceeds maximum size of {max_bytes // (1024*1024)} MB")


@router.post("/upload/video", status_code=201)
async def upload_video_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth_utils.require_educator),
):
    """Upload a video file to Supabase Storage. Returns the signed URL."""
    if file.content_type not in _ALLOWED_VIDEO_MIME:
        raise HTTPException(status_code=400, detail=f"Unsupported video type: {file.content_type}")
    data = await file.read()
    _check_upload(data, file.filename or "video.mp4", _ALLOWED_VIDEO_MIME, _ALLOWED_VIDEO_EXT, _VIDEO_MAX_BYTES, "video")
    url = storage.upload_video(data, file.filename or "video.mp4", file.content_type)
    return {"url": url}


@router.post("/upload/thumbnail", status_code=201)
async def upload_thumbnail_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth_utils.require_educator),
):
    """Upload a thumbnail image to Supabase Storage. Returns the public URL."""
    if file.content_type not in _ALLOWED_IMAGE_MIME:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {file.content_type}")
    data = await file.read()
    _check_upload(data, file.filename or "thumb.jpg", _ALLOWED_IMAGE_MIME, _ALLOWED_IMAGE_EXT, _IMAGE_MAX_BYTES, "image")
    url = storage.upload_thumbnail(data, file.filename or "thumb.jpg", file.content_type)
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
