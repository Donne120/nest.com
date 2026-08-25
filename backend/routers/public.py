"""
Public (no-auth) endpoints for the shareable-clip growth loop.

A lesson an educator marks `is_shareable` can be watched by ANYONE with the link,
no account. This router returns only the minimum a public watch page needs:
the playable video URL, the lesson/course titles, the owning org's public
branding, and that org's open-enrollment join token (so "ask your own question"
can send a newcomer into the right space). It deliberately leaks NO private data
(no transcript, no other modules, no user info).
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
from typing import Optional

from database import get_db
import models
from routers.organizations import _ensure_public_join_link

router = APIRouter(prefix="/api/public", tags=["public"])
limiter = Limiter(key_func=get_remote_address)


class PublicClipOut(BaseModel):
    video_id: str
    title: str
    video_url: str
    thumbnail_url: Optional[str] = None
    duration_seconds: int = 0
    module_title: Optional[str] = None
    # Owning org's public branding (the tutor/school "space")
    org_name: str
    org_slug: Optional[str] = None
    org_logo_url: Optional[str] = None
    org_brand_color: Optional[str] = None
    # Open-enrollment token so "ask your own question" can route into this space.
    join_token: Optional[str] = None


@router.get("/clip/{video_id}", response_model=PublicClipOut)
@limiter.limit("60/minute")
def get_public_clip(
    request: Request,
    video_id: str,
    db: Session = Depends(get_db),
):
    """Return a shareable lesson for anonymous viewing. 404 unless is_shareable."""
    v = (
        db.query(models.Video)
        .filter(models.Video.id == video_id, models.Video.is_shareable.is_(True))
        .first()
    )
    if not v:
        # Same 404 whether it doesn't exist or isn't shared — don't leak which.
        raise HTTPException(status_code=404, detail="Clip not found")

    module = db.query(models.Module).filter(models.Module.id == v.module_id).first()
    org = (
        db.query(models.Organization)
        .filter(models.Organization.id == module.organization_id)
        .first()
        if module else None
    )
    if not org:
        raise HTTPException(status_code=404, detail="Clip not found")

    # The org's public join token (may be None if the org has no owner yet).
    link = _ensure_public_join_link(org, db)
    join_token = link.token if link else None

    return PublicClipOut(
        video_id=v.id,
        title=v.title,
        video_url=v.video_url,
        thumbnail_url=v.thumbnail_url,
        duration_seconds=v.duration_seconds or 0,
        module_title=module.title if module else None,
        org_name=org.name,
        org_slug=org.slug,
        org_logo_url=org.logo_url,
        org_brand_color=org.brand_color,
        join_token=join_token,
    )
