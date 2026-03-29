from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta, timezone
from database import get_db
import models
import schemas
import auth as auth_utils
import email_utils
from config import settings

router = APIRouter(prefix="/api/ats", tags=["ats"])


@router.get("/connection", response_model=Optional[schemas.ATSConnectionOut])
def get_connection(
    current_user: models.User = Depends(auth_utils.require_owner),
    db: Session = Depends(get_db),
):
    return db.query(models.ATSConnection).filter(
        models.ATSConnection.org_id == current_user.organization_id,
    ).first()


@router.put("/connection", response_model=schemas.ATSConnectionOut)
def upsert_connection(
    payload: schemas.ATSConnectionCreate,
    current_user: models.User = Depends(auth_utils.require_owner),
    db: Session = Depends(get_db),
):
    existing = db.query(models.ATSConnection).filter(
        models.ATSConnection.org_id == current_user.organization_id,
    ).first()

    if existing:
        existing.provider = payload.provider
        existing.api_key = payload.api_key
        existing.default_role = payload.default_role
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return existing

    conn = models.ATSConnection(
        org_id=current_user.organization_id,
        provider=payload.provider,
        api_key=payload.api_key,
        default_role=payload.default_role,
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


@router.delete("/connection", status_code=204)
def delete_connection(
    current_user: models.User = Depends(auth_utils.require_owner),
    db: Session = Depends(get_db),
):
    db.query(models.ATSConnection).filter(
        models.ATSConnection.org_id == current_user.organization_id,
    ).delete()
    db.commit()


@router.post("/webhook/{org_slug}")
async def ats_webhook(org_slug: str, payload: dict, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Public webhook. ATS providers POST here when a candidate is hired.

    Normalized payload (we accept all three provider formats):
    Greenhouse: { "action": "candidate_hired", "payload": { "application": { "candidate": { "first_name", "last_name", "email_addresses": [{"value": ...}] } } } }
    Lever:      { "event": "candidateHired", "data": { "contact": { "name", "emails": [...] } } }
    Workable:   { "event_type": "hired", "data": { "candidate": { "name", "email" } } }
    """
    org = db.query(models.Organization).filter(
        models.Organization.slug == org_slug,
        models.Organization.is_active == True,
    ).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    conn = db.query(models.ATSConnection).filter(
        models.ATSConnection.org_id == org.id,
        models.ATSConnection.is_active == True,
    ).first()
    if not conn:
        raise HTTPException(status_code=400, detail="ATS not configured")

    # ── Normalize across provider formats ──────────────────────────────────
    email, name = None, None

    # Greenhouse
    gh_candidate = (payload.get("payload") or {}).get("application", {}).get("candidate") or {}
    if gh_candidate:
        emails = gh_candidate.get("email_addresses", [])
        email = emails[0].get("value") if emails else None
        name = f"{gh_candidate.get('first_name', '')} {gh_candidate.get('last_name', '')}".strip()

    # Lever
    if not email:
        lv = (payload.get("data") or {}).get("contact") or {}
        if lv:
            lv_emails = lv.get("emails", [])
            email = lv_emails[0] if lv_emails else None
            name = lv.get("name")

    # Workable
    if not email:
        wk = (payload.get("data") or {}).get("candidate") or {}
        email = wk.get("email")
        name = wk.get("name")

    # Generic fallback
    if not email:
        candidate = payload.get("candidate") or {}
        email = candidate.get("email") or payload.get("email")
        name = candidate.get("name") or payload.get("name")

    if not email or not name:
        return {"status": "skipped", "reason": "missing name or email"}

    # ── Idempotency checks ─────────────────────────────────────────────────
    if db.query(models.User).filter(models.User.email == email).first():
        return {"status": "skipped", "reason": "user already exists"}

    if db.query(models.Invitation).filter(
        models.Invitation.email == email,
        models.Invitation.organization_id == org.id,
        models.Invitation.is_accepted == False,
    ).first():
        return {"status": "skipped", "reason": "invite already pending"}

    # ── Create invite ──────────────────────────────────────────────────────
    admin = db.query(models.User).filter(
        models.User.organization_id == org.id,
        models.User.role.in_([models.UserRole.owner, models.UserRole.educator]),
        models.User.is_active == True,
    ).first()
    if not admin:
        return {"status": "error", "reason": "no owner found in org"}

    invite = models.Invitation(
        organization_id=org.id,
        email=email,
        role=conn.default_role,
        invited_by=admin.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    invite_url = f"{settings.FRONTEND_URL}/invite/{invite.token}"
    background_tasks.add_task(email_utils.send_invitation, to=email, org_name=org.name, invite_url=invite_url, role=conn.default_role)

    return {"status": "invited", "email": email, "invite_id": invite.id}
