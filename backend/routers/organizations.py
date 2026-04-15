from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
import auth as auth_utils
import plan_limits

router = APIRouter(prefix="/api/organizations", tags=["organizations"])

_SUPER = models.UserRole.super_admin


# ── Current org ───────────────────────────────────────────────────────

@router.get("/mine", response_model=schemas.OrganizationOut)
def get_my_org(
    current_user: models.User = Depends(auth_utils.require_owner),
    db: Session = Depends(get_db),
):
    org = db.query(models.Organization).filter(
        models.Organization.id == current_user.organization_id
    ).first()
    if not org:
        raise HTTPException(
            status_code=404, detail="Organization not found"
        )
    return org


@router.put("/mine", response_model=schemas.OrganizationOut)
def update_my_org(
    payload: schemas.OrganizationUpdate,
    current_user: models.User = Depends(auth_utils.require_owner),
    db: Session = Depends(get_db),
):
    org = db.query(models.Organization).filter(
        models.Organization.id == current_user.organization_id
    ).first()
    if not org:
        raise HTTPException(
            status_code=404, detail="Organization not found"
        )
    updates = payload.model_dump(exclude_unset=True)
    branding_keys = {"logo_url", "brand_color"}
    if (
        branding_keys & updates.keys()
        and current_user.role != _SUPER
    ):
        plan_limits.check_custom_branding(org)
    for field, value in updates.items():
        setattr(org, field, value)
    db.commit()
    db.refresh(org)
    return org


# ── Member management ─────────────────────────────────────────────────

@router.get("/mine/members", response_model=List[schemas.UserOut])
def list_members(
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.User)
        .filter(
            models.User.organization_id
            == current_user.organization_id
        )
        .order_by(models.User.full_name)
        .all()
    )


@router.put(
    "/mine/members/{user_id}/role",
    response_model=schemas.UserOut,
)
def update_member_role(
    user_id: str,
    payload: schemas.UserRoleUpdate,
    current_user: models.User = Depends(auth_utils.require_owner),
    db: Session = Depends(get_db),
):
    if payload.role == _SUPER:
        raise HTTPException(
            status_code=400,
            detail="Cannot assign super_admin via this endpoint",
        )
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.organization_id == current_user.organization_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400, detail="Cannot change your own role"
        )
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


@router.put(
    "/mine/members/{user_id}/deactivate",
    response_model=schemas.UserOut,
)
def deactivate_member(
    user_id: str,
    current_user: models.User = Depends(auth_utils.require_owner),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.organization_id == current_user.organization_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400, detail="Cannot deactivate yourself"
        )
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


@router.put(
    "/mine/members/{user_id}/reactivate",
    response_model=schemas.UserOut,
)
def reactivate_member(
    user_id: str,
    current_user: models.User = Depends(auth_utils.require_owner),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.organization_id == current_user.organization_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user


# ── Super-admin: list all orgs ────────────────────────────────────────

@router.get("", response_model=List[schemas.OrganizationOut])
def list_all_orgs(
    current_user: models.User = Depends(
        auth_utils.require_super_admin
    ),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Organization)
        .order_by(models.Organization.created_at.desc())
        .all()
    )
