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
from typing import Iterable
from fastapi import HTTPException
from sqlalchemy.orm import Session

import models

_STAFF_ROLES = {
    models.UserRole.educator,
    models.UserRole.owner,
    models.UserRole.super_admin,
}


def _is_staff(user: models.User) -> bool:
    return user.role in _STAFF_ROLES


def has_module_access(
    user: models.User,
    module_id: str,
    db: Session,
) -> bool:
    if _is_staff(user):
        return True
    if user.payment_verified:
        return True
    row = (
        db.query(models.ModuleAccess.id)
        .filter(
            models.ModuleAccess.student_id == user.id,
            models.ModuleAccess.module_id == module_id,
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
    rows = (
        db.query(models.ModuleAccess.module_id)
        .filter(
            models.ModuleAccess.student_id == user.id,
            models.ModuleAccess.module_id.in_(ids),
        )
        .all()
    )
    return {r[0] for r in rows}


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
