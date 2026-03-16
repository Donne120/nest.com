from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import auth as auth_utils
from pydantic import BaseModel

router = APIRouter(prefix="/api/search", tags=["search"])


class SearchResult(BaseModel):
    type: str          # "module" | "video" | "question"
    id: str
    title: str
    subtitle: str
    url: str           # frontend navigation path

    class Config:
        from_attributes = True


@router.get("", response_model=List[SearchResult])
def global_search(
    q: str = Query(..., min_length=1, max_length=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    org_id = current_user.organization_id
    term = f"%{q.strip().lower()}%"
    results: List[SearchResult] = []

    # ── Modules ──────────────────────────────────────────────────────────────
    modules = (
        db.query(models.Module)
        .filter(
            models.Module.organization_id == org_id,
            models.Module.is_published == True,
            models.Module.title.ilike(term),
        )
        .limit(4)
        .all()
    )
    for m in modules:
        results.append(SearchResult(
            type="module",
            id=m.id,
            title=m.title,
            subtitle=f"{len(m.videos)} lessons",
            url=f"/modules/{m.id}",
        ))

    # ── Videos ───────────────────────────────────────────────────────────────
    videos = (
        db.query(models.Video)
        .join(models.Module, models.Video.module_id == models.Module.id)
        .filter(
            models.Module.organization_id == org_id,
            models.Module.is_published == True,
            models.Video.title.ilike(term),
        )
        .limit(4)
        .all()
    )
    for v in videos:
        results.append(SearchResult(
            type="video",
            id=v.id,
            title=v.title,
            subtitle=v.module.title if v.module else "Video",
            url=f"/video/{v.id}",
        ))

    # ── Questions (Q&A) ───────────────────────────────────────────────────────
    questions = (
        db.query(models.Question)
        .join(models.Video, models.Question.video_id == models.Video.id)
        .join(models.Module, models.Video.module_id == models.Module.id)
        .filter(
            models.Module.organization_id == org_id,
            models.Question.question_text.ilike(term),
        )
        .limit(4)
        .all()
    )
    for question in questions:
        video_title = question.video.title if question.video else "Video"
        results.append(SearchResult(
            type="question",
            id=question.id,
            title=question.question_text,
            subtitle=f"Q&A in {video_title}",
            url=f"/video/{question.video_id}",
        ))

    return results[:12]
