"""
Video transcription via Groq Whisper large-v3-turbo.
- Auto-transcription: downloads video from stored URL, sends to Groq Whisper (≤25MB).
- Manual fallback: admin can paste/type the transcript text directly.
- Transcript is stored with timestamped segments for contextual AI retrieval.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth as auth_utils
from config import settings
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/videos", tags=["transcription"])

GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
MAX_FILE_BYTES = 25 * 1024 * 1024  # 25MB Groq limit


def _org_video(video_id: str, org_id: str, db: Session) -> models.Video:
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


def _get_or_create_transcript(video_id: str, db: Session) -> models.VideoTranscript:
    t = db.query(models.VideoTranscript).filter_by(video_id=video_id).first()
    if not t:
        t = models.VideoTranscript(video_id=video_id)
        db.add(t)
        db.commit()
        db.refresh(t)
    return t


# ─── Background task: download + transcribe ───────────────────────────────────

def _do_transcription(video_id: str, video_url: str, db: Session) -> None:
    """Runs in background: downloads video, sends to Groq Whisper, saves transcript."""
    transcript = _get_or_create_transcript(video_id, db)
    transcript.status = models.TranscriptStatus.processing
    transcript.error_message = None
    db.commit()

    try:
        # --- Download video ---
        with httpx.Client(timeout=120, follow_redirects=True) as client:
            # Check size first (HEAD request)
            try:
                head = client.head(video_url)
                size = int(head.headers.get("content-length", 0))
                if size > MAX_FILE_BYTES:
                    transcript.status = models.TranscriptStatus.too_large
                    transcript.error_message = (
                        f"File is {size // (1024*1024)}MB — exceeds the 25MB auto-transcription limit. "
                        "Please add the transcript manually."
                    )
                    db.commit()
                    return
            except Exception:
                pass  # If HEAD fails, attempt download anyway

            resp = client.get(video_url)
            resp.raise_for_status()
            video_bytes = resp.content

        if len(video_bytes) > MAX_FILE_BYTES:
            transcript.status = models.TranscriptStatus.too_large
            transcript.error_message = (
                f"File is {len(video_bytes) // (1024*1024)}MB — exceeds the 25MB limit. "
                "Please add the transcript manually."
            )
            db.commit()
            return

        # --- Send to Groq Whisper ---
        with httpx.Client(timeout=180) as client:
            resp = client.post(
                GROQ_WHISPER_URL,
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                files={
                    "file": ("video.mp4", video_bytes, "video/mp4"),
                },
                data={
                    "model": "whisper-large-v3-turbo",
                    "response_format": "verbose_json",
                    "timestamp_granularities": "segment",
                },
            )
            resp.raise_for_status()
            result = resp.json()

        full_text = result.get("text", "").strip()
        segments = result.get("segments", [])
        # Normalise segment fields to keep only what we need
        clean_segments = [
            {"start": s.get("start", 0), "end": s.get("end", 0), "text": s.get("text", "").strip()}
            for s in segments
        ]

        transcript.full_text = full_text
        transcript.segments = clean_segments
        transcript.language = result.get("language", "en")
        transcript.status = models.TranscriptStatus.done
        transcript.word_count = len(full_text.split()) if full_text else 0
        transcript.error_message = None
        db.commit()
        logger.info(f"Transcription done for video {video_id}: {transcript.word_count} words")

    except httpx.HTTPStatusError as e:
        transcript.status = models.TranscriptStatus.failed
        transcript.error_message = f"Groq API error {e.response.status_code}: {e.response.text[:200]}"
        db.commit()
        logger.error(f"Transcription failed for video {video_id}: {e}")
    except Exception as e:
        transcript.status = models.TranscriptStatus.failed
        transcript.error_message = str(e)[:300]
        db.commit()
        logger.error(f"Transcription failed for video {video_id}: {e}")


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/{video_id}/transcript", response_model=schemas.TranscriptOut)
def get_transcript(
    video_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    """Get the transcript for a video (if it exists)."""
    _org_video(video_id, current_user.organization_id, db)
    t = db.query(models.VideoTranscript).filter_by(video_id=video_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="No transcript yet")
    return t


@router.post("/{video_id}/transcribe", response_model=schemas.TranscriptOut)
def trigger_transcription(
    video_id: str,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    """Trigger automatic transcription via Groq Whisper (runs in background)."""
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY not configured")

    video = _org_video(video_id, current_user.organization_id, db)

    if not video.video_url:
        raise HTTPException(status_code=400, detail="Video has no URL to transcribe")

    transcript = _get_or_create_transcript(video_id, db)

    if transcript.status == models.TranscriptStatus.processing:
        raise HTTPException(status_code=409, detail="Transcription already in progress")

    background_tasks.add_task(_do_transcription, video_id, video.video_url, db)

    # Return immediately with processing status
    transcript.status = models.TranscriptStatus.processing
    db.commit()
    db.refresh(transcript)
    return transcript


@router.put("/{video_id}/transcript", response_model=schemas.TranscriptOut)
def set_manual_transcript(
    video_id: str,
    payload: schemas.TranscriptManualSet,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    """Manually set or update a video transcript."""
    _org_video(video_id, current_user.organization_id, db)

    transcript = _get_or_create_transcript(video_id, db)
    transcript.full_text = payload.text.strip()
    transcript.segments = None  # no timestamps for manual entry
    transcript.status = models.TranscriptStatus.manual
    transcript.word_count = len(payload.text.split())
    transcript.error_message = None
    db.commit()
    db.refresh(transcript)
    return transcript


@router.delete("/{video_id}/transcript", status_code=204)
def delete_transcript(
    video_id: str,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    """Delete the transcript for a video."""
    _org_video(video_id, current_user.organization_id, db)
    t = db.query(models.VideoTranscript).filter_by(video_id=video_id).first()
    if t:
        db.delete(t)
        db.commit()
