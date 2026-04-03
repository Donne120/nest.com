"""
Admin seed endpoint — one-time setup for production.

POST /api/admin/seed
Headers: X-Seed-Secret: <your SEED_SECRET env var>

Creates:
  - Nest Cameroon organisation
  - super_admin account (ngumdieudonne4@gmail.com)
  - 13 educational modules with thumbnails

Safe to call multiple times — skips anything that already exists.
Also callable with admin JWT to patch thumbnails on existing modules.
"""

import hmac
import logging
from fastapi import APIRouter, Header, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel

from database import get_db
from config import settings
from auth import hash_password
import models

limiter = Limiter(key_func=get_remote_address)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])

# ── Constants ──────────────────────────────────────────────────────────────────

ORG_NAME = "Nest Cameroon"
ORG_SLUG = "nest-cameroon"
ADMIN_EMAIL = "ngumdieudonne4@gmail.com"
ADMIN_NAME = "Nest Cameroon Admin"


def _img(photo_id: str) -> str:
    return (
        f"https://images.unsplash.com/photo-{photo_id}"
        "?w=800&h=450&fit=crop&auto=format&q=80"
    )


MODULES = [
    {
        "order_index": 1,
        "title": "Welcome to Nest",
        "description": (
            "A complete overview of the Nest onboarding platform. "
            "Learn what Nest is, who it's for, and how every feature "
            "fits together before you dive deeper into the other modules."
        ),
        "thumbnail_url": _img("1497366216548-37526070297c"),
    },
    {
        "order_index": 2,
        "title": "Setting Up Your Organisation",
        "description": (
            "Step-by-step guide to creating and configuring your Nest "
            "workspace. Covers organisation name, slug, branding, plan "
            "selection, and subscription management."
        ),
        "thumbnail_url": _img("1542744173-8e7e53415bb0"),
    },
    {
        "order_index": 3,
        "title": "Managing Your Team",
        "description": (
            "Everything about users inside Nest. How to invite team members "
            "via email, assign roles (Owner, Educator, Learner), manage "
            "departments, deactivate accounts, and control access."
        ),
        "thumbnail_url": _img("1522071820081-009f0129c71c"),
    },
    {
        "order_index": 4,
        "title": "Creating Courses & Videos",
        "description": (
            "How to build your onboarding content library. Creating modules, "
            "uploading videos to Supabase, setting thumbnails, writing "
            "descriptions, reordering content, and publishing."
        ),
        "thumbnail_url": _img("1611532736597-de2d4265fba3"),
    },
    {
        "order_index": 5,
        "title": "Transcription & AI Q&A",
        "description": (
            "Using Nest's AI features. Automatic video transcription with "
            "Groq, asking questions at specific timestamps, how the AI "
            "answers using transcript context, and building a reusable "
            "knowledge base for future hires."
        ),
        "thumbnail_url": _img("1677442135703-1787eea5ce01"),
    },
    {
        "order_index": 6,
        "title": "Quizzes & Assessments",
        "description": (
            "Creating quizzes to test learner understanding. Covers multiple "
            "choice, true/false, and short-answer question types, setting "
            "pass thresholds, and reviewing results."
        ),
        "thumbnail_url": _img("1434030216411-0b793f4b4173"),
    },
    {
        "order_index": 7,
        "title": "Assignments & Tasks",
        "description": (
            "How to create assignments for learners, set due dates, review "
            "submissions, and give feedback. Ideal for practical onboarding "
            "tasks beyond video watching."
        ),
        "thumbnail_url": _img("1484480974693-6ca0a78fb36b"),
    },
    {
        "order_index": 8,
        "title": "Progress Tracking",
        "description": (
            "How learners track their own progress through modules and videos. "
            "Covers completion states, progress percentages, and how admins "
            "can monitor their whole team's advancement."
        ),
        "thumbnail_url": _img("1551288049-bebda4e38f71"),
    },
    {
        "order_index": 9,
        "title": "1-on-1 Meetings",
        "description": (
            "The meeting feature in Nest. How learners request 1-on-1 sessions "
            "with managers, how managers confirm or decline with a reason, "
            "adding meeting links, and the email notification flow."
        ),
        "thumbnail_url": _img("1573496359142-b8d87734a5a2"),
    },
    {
        "order_index": 10,
        "title": "Analytics & Reporting",
        "description": (
            "Reading your organisation's data. Module completion rates, "
            "per-learner progress, quiz score summaries, and using analytics "
            "to improve your onboarding program over time."
        ),
        "thumbnail_url": _img("1460925895917-afdab827c52f"),
    },
    {
        "order_index": 11,
        "title": "Certificates",
        "description": (
            "How Nest issues completion certificates. Triggering certificates "
            "after module completion, customising certificate content, and "
            "where learners can view and download them."
        ),
        "thumbnail_url": _img("1523050854058-8df90110c9f1"),
    },
    {
        "order_index": 12,
        "title": "Payments & Billing",
        "description": (
            "How the Nest manual payment system works. Submitting MoMo or "
            "bank transfer proofs, the admin approval flow, how access is "
            "granted automatically after approval, and handling rejections."
        ),
        "thumbnail_url": _img("1556742049-0cfed4f6a45d"),
    },
    {
        "order_index": 13,
        "title": "ATS — Hiring Pipeline",
        "description": (
            "Using Nest's Applicant Tracking System. Managing candidates, "
            "moving them through hiring stages, connecting with external ATS "
            "providers (Greenhouse, Lever, Workable), and turning new hires "
            "into onboarded employees."
        ),
        "thumbnail_url": _img("1586281380349-632531db7ed4"),
    },
]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _seed(db: Session, admin_password: str) -> dict:
    results = {
        "organisation": None,
        "admin_user": None,
        "modules_created": 0,
        "modules_updated": 0,
    }

    # Organisation
    org = (
        db.query(models.Organization)
        .filter(models.Organization.slug == ORG_SLUG)
        .first()
    )
    if not org:
        org = models.Organization(
            name=ORG_NAME,
            slug=ORG_SLUG,
            plan=models.Plan.enterprise,
            subscription_status=models.SubscriptionStatus.active,
            is_active=True,
        )
        db.add(org)
        db.flush()
        results["organisation"] = "created"
        logger.info(f"[seed] Created org: {ORG_NAME}")
    else:
        results["organisation"] = "already exists"

    # Admin user — search by correct email OR the old typo email so we can fix it
    OLD_ADMIN_EMAIL = "ngummdieudonne4@gmail.com"
    admin = (
        db.query(models.User)
        .filter(models.User.email.in_([ADMIN_EMAIL, OLD_ADMIN_EMAIL]))
        .first()
    )
    if not admin:
        if not admin_password:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Admin user does not exist yet. "
                    "Pass admin_password in the request body."
                ),
            )
        admin = models.User(
            organization_id=org.id,
            email=ADMIN_EMAIL,
            full_name=ADMIN_NAME,
            hashed_password=hash_password(admin_password),
            role=models.UserRole.super_admin,
            is_active=True,
        )
        db.add(admin)
        db.flush()
        results["admin_user"] = "created"
        logger.info(f"[seed] Created super_admin: {ADMIN_EMAIL}")
    else:
        # Patch email and/or password if they need correcting
        patched = []
        if admin.email != ADMIN_EMAIL:
            admin.email = ADMIN_EMAIL
            patched.append("email")
        if admin_password:
            admin.hashed_password = hash_password(admin_password)
            patched.append("password")
        if patched:
            results["admin_user"] = f"updated ({', '.join(patched)})"
            logger.info(f"[seed] Patched super_admin: {', '.join(patched)}")
        else:
            results["admin_user"] = "already exists (no changes)"

    # Modules — create or patch thumbnail
    for data in MODULES:
        existing = (
            db.query(models.Module)
            .filter(
                models.Module.organization_id == org.id,
                models.Module.title == data["title"],
            )
            .first()
        )
        if existing:
            if existing.thumbnail_url != data["thumbnail_url"]:
                existing.thumbnail_url = data["thumbnail_url"]
                results["modules_updated"] += 1
        else:
            module = models.Module(
                organization_id=org.id,
                created_by=admin.id,
                title=data["title"],
                description=data["description"],
                thumbnail_url=data["thumbnail_url"],
                order_index=data["order_index"],
                is_published=True,
                is_for_sale=False,
                price=None,
                currency="RWF",
                duration_seconds=0,
            )
            db.add(module)
            results["modules_created"] += 1

    db.commit()
    return results


# ── Endpoint ───────────────────────────────────────────────────────────────────


class SeedRequest(BaseModel):
    admin_password: str = ""


@router.post("/seed")
@limiter.limit("3/hour")
def seed(
    request: Request,
    body: SeedRequest,
    x_seed_secret: str = Header(..., alias="X-Seed-Secret"),
    db: Session = Depends(get_db),
):
    """
    One-time production setup. Requires the X-Seed-Secret header to match
    the SEED_SECRET environment variable set on Render.

    IMPORTANT: Remove or disable this endpoint once your production database
    is seeded. It is rate-limited to 3 calls/hour as an extra safeguard.
    """
    # Require a strong secret (minimum 20 chars) to be explicitly set
    if not settings.SEED_SECRET or len(settings.SEED_SECRET) < 20:
        raise HTTPException(
            status_code=503,
            detail=(
                "SEED_SECRET env var is not set or is too short. "
                "Set it to at least 20 random characters in your Render env vars."
            ),
        )
    # Constant-time comparison to prevent timing attacks
    if not hmac.compare_digest(x_seed_secret, settings.SEED_SECRET):
        raise HTTPException(status_code=403, detail="Invalid seed secret.")

    results = _seed(db, body.admin_password)
    return {"status": "ok", "results": results}
