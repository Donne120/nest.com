"""
Per-module access control.

A learner can reach a module if any of:
  - role is educator / owner / super_admin (staff bypass)
  - user.payment_verified is True (org-wide pass — covers
    teacher_subscription orgs and learner_access purchases)
  - a ModuleAccess row exists for (user, module) — from a
    module_purchase payment approval

Use `require_module_access` at the entry of any endpoint that returns
content belonging to a single module. Use `has_module_access` when you
need a boolean for response shaping (e.g. catalog listings).
"""
from datetime import datetime, timezone, timedelta
from typing import Iterable
from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

import models

# Guest (invited) access lasts exactly one month from acceptance.
GUEST_ACCESS_DAYS = 30

_STAFF_ROLES = {
    models.UserRole.educator,
    models.UserRole.owner,
    models.UserRole.super_admin,
}


def _is_staff(user: models.User) -> bool:
    return user.role in _STAFF_ROLES


def _unexpired(now: datetime):
    # A ModuleAccess row counts only if it never expires (NULL) or is still in date.
    return or_(
        models.ModuleAccess.expires_at.is_(None),
        models.ModuleAccess.expires_at > now,
    )


def has_module_access(
    user: models.User,
    module_id: str,
    db: Session,
) -> bool:
    if _is_staff(user):
        return True
    if user.payment_verified:
        return True
    now = datetime.now(timezone.utc)
    row = (
        db.query(models.ModuleAccess.id)
        .filter(
            models.ModuleAccess.student_id == user.id,
            models.ModuleAccess.module_id == module_id,
            _unexpired(now),
        )
        .first()
    )
    return row is not None


def accessible_module_ids(
    user: models.User,
    module_ids: Iterable[str],
    db: Session,
) -> set[str]:
    """Bulk variant for catalog listings. Returns the subset the learner
    can open. Staff and globally-verified users get the full set back."""
    ids = list(module_ids)
    if _is_staff(user) or user.payment_verified:
        return set(ids)
    if not ids:
        return set()
    now = datetime.now(timezone.utc)
    rows = (
        db.query(models.ModuleAccess.module_id)
        .filter(
            models.ModuleAccess.student_id == user.id,
            models.ModuleAccess.module_id.in_(ids),
            _unexpired(now),
        )
        .all()
    )
    return {r[0] for r in rows}


def grant_invite_access(
    user: models.User,
    *,
    all_modules: bool,
    module_ids: list[str],
    granted_by: str | None,
    db: Session,
    expires: bool = True,
    access_days: int | None = None,
) -> None:
    """The ONE place invite-based access is materialised, so it can't be
    bypassed. If all_modules, flip the org-wide pass. Otherwise create a
    scoped, time-boxed ModuleAccess row per module. `expires` gives guests a
    clock (custom access_days, else the 30-day default); pass expires=False for
    unlimited grants."""
    if all_modules:
        user.payment_verified = True
        return
    if not module_ids:
        return
    days = access_days if (access_days and access_days > 0) else GUEST_ACCESS_DAYS
    expires_at = (
        datetime.now(timezone.utc) + timedelta(days=days)
        if expires else None
    )
    existing = {
        r[0] for r in db.query(models.ModuleAccess.module_id).filter(
            models.ModuleAccess.student_id == user.id,
            models.ModuleAccess.module_id.in_(module_ids),
        ).all()
    }
    for mid in module_ids:
        if mid in existing:
            continue
        db.add(models.ModuleAccess(
            student_id=user.id,
            module_id=mid,
            granted_by=granted_by,
            expires_at=expires_at,
        ))


def require_module_access(
    user: models.User,
    module_id: str,
    db: Session,
) -> None:
    if has_module_access(user, module_id, db):
        return
    raise HTTPException(
        status_code=403,
        detail=(
            "You do not have access to this module yet. "
            "Purchase access or submit your payment proof and "
            "wait for admin approval."
        ),
    )


def require_video_access(
    user: models.User,
    video: models.Video,
    db: Session,
) -> None:
    """Same as module access, except videos marked is_preview are open
    to any authenticated user in the org (so learners can sample paid
    modules before purchase). Org-scoping is the caller's job —
    typically via _org_video()."""
    if getattr(video, "is_preview", False):
        return
    require_module_access(user, video.module_id, db)
