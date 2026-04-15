"""
Plan enforcement helpers for Nest — Option B.

Differentiators per plan:
  - All plans: full feature access (analytics, assignments, quizzes,
    AI Q&A, certificates, meetings)
  - Module cap and video upload size vary by plan
  - Extra educator accounts: School/Enterprise only
  - Custom branding (logo + brand colour): School/Enterprise only
  - Trial orgs: cannot collect learner payments (enforced in payments
    router — see routers/payments.py)

Import and call these helpers from routers. Never duplicate rules.
"""
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session
import models

# ─── Limits per plan ──────────────────────────────────────────────────
#
# max_modules    int|None — None = unlimited.
#                Counted all-time (incl. soft-deleted) so the
#                delete-reupload loop does not reset the counter.
# max_upload_mb  int      — max single video file in MB
# max_educators  int|None — extra educators beyond the owner
#                           (0 = solo plan, None = unlimited)
# custom_branding bool    — may set logo_url and brand_color

_MB = 1024 * 1024

_LIMITS: dict[models.Plan, dict] = {
    models.Plan.trial: dict(
        max_modules=2,
        max_upload_mb=100,
        max_educators=0,
        custom_branding=False,
    ),
    models.Plan.starter: dict(
        max_modules=5,
        max_upload_mb=500,
        max_educators=0,
        custom_branding=False,
    ),
    models.Plan.professional: dict(
        max_modules=None,
        max_upload_mb=2048,
        max_educators=0,
        custom_branding=False,
    ),
    models.Plan.enterprise: dict(
        max_modules=None,
        max_upload_mb=5120,
        max_educators=None,
        custom_branding=True,
    ),
}


def _utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def effective_plan(org: models.Organization) -> models.Plan:
    """
    The plan the org is currently entitled to, accounting for expiry.

    Priority:
    1. Explicitly cancelled/expired status  → trial limits
    2. Paid plan whose subscription_end has passed → trial limits
    3. Otherwise → org.plan
    """
    now = datetime.now(timezone.utc)

    if org.subscription_status in (
        models.SubscriptionStatus.expired,
        models.SubscriptionStatus.cancelled,
    ):
        return models.Plan.trial

    if org.plan != models.Plan.trial:
        end = _utc(org.subscription_end)
        if end and end < now:
            return models.Plan.trial   # lapsed paid plan

    return org.plan


def _limits(org: models.Organization) -> dict:
    return _LIMITS.get(
        effective_plan(org),
        _LIMITS[models.Plan.trial],
    )


# ─── Org loader ───────────────────────────────────────────────────────

def get_org_or_403(
    user: models.User,
    db: Session,
) -> models.Organization:
    org = db.query(models.Organization).filter(
        models.Organization.id == user.organization_id
    ).first()
    if not org:
        raise HTTPException(
            status_code=404,
            detail="Organisation not found",
        )
    return org


# ─── Guard functions ──────────────────────────────────────────────────

def check_module_limit(
    org: models.Organization,
    all_time_count: int,
) -> None:
    """
    Raise 403 if the org has hit its module cap.

    all_time_count MUST include soft-deleted modules.
    Passing only active modules would allow the delete-reupload loop.
    """
    lim = _limits(org)
    cap = lim["max_modules"]
    if cap is not None and all_time_count >= cap:
        plan = effective_plan(org)
        upgrade = (
            "Professional"
            if plan in (models.Plan.trial, models.Plan.starter)
            else "a higher"
        )
        raise HTTPException(
            status_code=403,
            detail=(
                f"Your {plan.value.title()} plan allows up to "
                f"{cap} module(s). "
                f"Upgrade to {upgrade} for unlimited modules."
            ),
        )


def check_upload_size(
    org: models.Organization,
    file_bytes: int,
) -> None:
    """Raise 413 if the video exceeds the plan's per-file limit."""
    lim = _limits(org)
    cap_mb = lim["max_upload_mb"]
    cap_bytes = cap_mb * _MB
    if file_bytes > cap_bytes:
        plan = effective_plan(org)
        size_mb = file_bytes // _MB
        raise HTTPException(
            status_code=413,
            detail=(
                f"File is {size_mb} MB. Your "
                f"{plan.value.title()} plan allows uploads up to "
                f"{cap_mb} MB per video. "
                f"Upgrade to upload larger files."
            ),
        )


def check_educator_invite(
    org: models.Organization,
    current_educator_count: int,
) -> None:
    """
    Raise 403 if the plan does not allow additional educators.

    current_educator_count: active users with role=educator,
    NOT counting the owner.
    """
    lim = _limits(org)
    cap = lim["max_educators"]
    if cap is not None and current_educator_count >= cap:
        plan = effective_plan(org)
        raise HTTPException(
            status_code=403,
            detail=(
                f"The {plan.value.title()} plan does not include "
                f"additional educator accounts. Upgrade to the "
                f"School/Institution plan to add multiple teachers."
            ),
        )


def check_custom_branding(org: models.Organization) -> None:
    """Raise 403 if the plan does not include custom branding."""
    if not _limits(org)["custom_branding"]:
        plan = effective_plan(org)
        raise HTTPException(
            status_code=403,
            detail=(
                f"Custom branding is not available on the "
                f"{plan.value.title()} plan. Upgrade to the "
                f"School/Institution plan to upload a logo and "
                f"set a brand colour."
            ),
        )
