from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
import auth as auth_utils
from config import settings
import email_utils

router = APIRouter(prefix="/api/invitations", tags=["invitations"])


@router.post("", response_model=schemas.InvitationOut, status_code=201)
def create_invitation(
    payload: schemas.InvitationCreate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth_utils.require_manager),
    db: Session = Depends(get_db),
):
    # Don't allow creating super_admin invites
    if payload.role == models.UserRole.super_admin:
        raise HTTPException(status_code=400, detail="Cannot invite super_admin")

    # Check if this email already has a pending invite in this org
    existing = db.query(models.Invitation).filter(
        models.Invitation.organization_id == current_user.organization_id,
        models.Invitation.email == payload.email,
        models.Invitation.is_accepted == False,
        models.Invitation.expires_at > datetime.now(timezone.utc),
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A pending invite already exists for this email. Revoke it first.",
        )

    # Check if user already exists in this org
    if db.query(models.User).filter(
        models.User.email == payload.email,
        models.User.organization_id == current_user.organization_id,
    ).first():
        raise HTTPException(status_code=400, detail="User is already a member of this organization")

    invite = models.Invitation(
        organization_id=current_user.organization_id,
        email=payload.email,
        role=payload.role,
        invited_by=current_user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    invite_url = f"{settings.FRONTEND_URL}/invite/{invite.token}"

    # Send email (no-op if SMTP not configured)
    org = db.query(models.Organization).filter_by(id=current_user.organization_id).first()
    background_tasks.add_task(email_utils.send_invitation,
        to=invite.email,
        org_name=org.name if org else "your organization",
        invite_url=invite_url,
        role=invite.role.value,
    )

    return schemas.InvitationOut(
        id=invite.id,
        email=invite.email,
        role=invite.role,
        is_accepted=invite.is_accepted,
        created_at=invite.created_at,
        expires_at=invite.expires_at,
        invite_url=invite_url,
    )


@router.get("", response_model=List[schemas.InvitationOut])
def list_invitations(
    current_user: models.User = Depends(auth_utils.require_manager),
    db: Session = Depends(get_db),
):
    invites = (
        db.query(models.Invitation)
        .filter(models.Invitation.organization_id == current_user.organization_id)
        .order_by(models.Invitation.created_at.desc())
        .all()
    )
    result = []
    for inv in invites:
        invite_url = f"{settings.FRONTEND_URL}/invite/{inv.token}" if not inv.is_accepted else None
        result.append(schemas.InvitationOut(
            id=inv.id,
            email=inv.email,
            role=inv.role,
            is_accepted=inv.is_accepted,
            created_at=inv.created_at,
            expires_at=inv.expires_at,
            invite_url=invite_url,
        ))
    return result


@router.delete("/{invitation_id}", status_code=204)
def revoke_invitation(
    invitation_id: str,
    current_user: models.User = Depends(auth_utils.require_admin),
    db: Session = Depends(get_db),
):
    invite = db.query(models.Invitation).filter(
        models.Invitation.id == invitation_id,
        models.Invitation.organization_id == current_user.organization_id,
    ).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if invite.is_accepted:
        raise HTTPException(status_code=400, detail="Cannot revoke an already accepted invitation")
    db.delete(invite)
    db.commit()
