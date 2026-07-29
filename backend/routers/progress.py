from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from database import get_db
import models
import schemas
import auth as auth_utils
from routers.certificates import issue_if_not_exists

router = APIRouter(prefix="/api/progress", tags=["progress"])


def _bump_streak(user: models.User) -> None:
    """Update the learner's daily-learning streak from *any* activity today.

    Same day  -> no change. Yesterday -> +1. A gap (or first ever) -> reset to 1.
    Uses UTC dates; caller commits.
    """
    today = datetime.now(timezone.utc).date()
    last = user.streak_last_day
    if last == today:
        return  # already counted today
    if last == today - timedelta(days=1):
        user.streak_count = (user.streak_count or 0) + 1
    else:
        user.streak_count = 1
    user.streak_last_day = today


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

    # Persist the real duration when the DB value is still 0 (e.g. YouTube videos)
    if payload.duration_seconds and payload.duration_seconds > 0 and video.duration_seconds == 0:
        video.duration_seconds = payload.duration_seconds

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
            progress_seconds=0.0,
        )
        db.add(progress)

    advanced = payload.progress_seconds > (progress.progress_seconds or 0)
    if advanced:
        progress.progress_seconds = payload.progress_seconds

    # Genuine watching activity today keeps the streak alive.
    if advanced or payload.status == models.ModuleStatus.completed:
        _bump_streak(current_user)

    if payload.status:
        progress.status = payload.status
    elif progress.status == models.ModuleStatus.not_started:
        progress.status = models.ModuleStatus.in_progress

    # Only honour a 'completed' status when the user has watched at least 80% of the video
    min_watch_pct = 0.80
    if payload.status == models.ModuleStatus.completed:
        actual_duration = video.duration_seconds or 0
        watched = max(progress.progress_seconds, payload.progress_seconds)
        if actual_duration > 0 and watched < actual_duration * min_watch_pct:
            # Silently downgrade to in_progress — don't let client skip ahead
            progress.status = models.ModuleStatus.in_progress
            db.commit()
            return

        progress.completed_at = func.now()
        # Auto-issue completion certificate (best-effort — don't fail the progress save)
        try:
            cert = issue_if_not_exists(
                user_id=current_user.id,
                module_id=video.module_id,
                org_id=current_user.organization_id,
                db=db,
            )
            if cert and not cert.id:
                db.flush()  # ensure cert gets its id before commit
        except Exception:
            pass

    db.commit()


@router.get("/summary", response_model=schemas.ProgressSummary)
def progress_summary(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    """Lightweight learner momentum for the Learn home: current streak + how many
    lessons remain in the course they're closest to finishing (the certificate nudge)."""
    # If a UTC day was missed, the stored streak is stale — report 0 without writing.
    today = datetime.now(timezone.utc).date()
    last = current_user.streak_last_day
    streak = current_user.streak_count or 0
    if last and last < today - timedelta(days=1):
        streak = 0

    # At risk = they have a live streak, were active YESTERDAY, but not yet today.
    # Opening the app now + one lesson keeps it alive → the highest-converting nudge.
    at_risk = bool(streak >= 1 and last == today - timedelta(days=1))

    # Find the in-progress module with the FEWEST lessons left (closest to a cert).
    best = None  # (remaining, module_id, done, total)
    in_progress = (
        db.query(models.UserProgress)
        .filter(
            models.UserProgress.user_id == current_user.id,
            models.UserProgress.status == models.ModuleStatus.in_progress,
        )
        .all()
    )
    for p in in_progress:
        vids = (
            db.query(models.Video.id, models.Video.duration_seconds)
            .filter(models.Video.module_id == p.module_id)
            .all()
        )
        total = len(vids)
        if total == 0:
            continue
        # A lesson counts as done once its own progress is past 80% — but we only
        # track module-level progress_seconds, so approximate: done = share of the
        # module's total duration watched, floored to whole lessons.
        module_dur = sum((d or 0) for _, d in vids)
        done = 0
        if module_dur > 0:
            frac = min(1.0, (p.progress_seconds or 0) / module_dur)
            done = min(total, int(round(frac * total)))
        remaining = total - done
        if remaining > 0 and (best is None or remaining < best[0]):
            best = (remaining, p.module_id, done, total)

    nudge = None
    if best:
        nudge = {"lessons_left": best[0], "lessons_done": best[2], "lessons_total": best[3], "module_id": best[1]}

    return schemas.ProgressSummary(streak=streak, at_risk=at_risk, nudge=nudge)
