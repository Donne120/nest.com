from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
import models
import schemas
import auth as auth_utils
import plan_limits

router = APIRouter(prefix="/api/organizations", tags=["organizations"])

_SUPER = models.UserRole.super_admin


# ── Public directory (no auth) ────────────────────────────────────────

# A listed org gets one durable, unlimited-use "open enrollment" invite link
# so a stranger who finds them on Explore can actually join. Identified by this
# reserved label so we never collide with an admin's own cohort links.
_PUBLIC_LINK_LABEL = "__public_directory__"


def _ensure_public_join_link(org: "models.Organization", db: Session):
    """Return the org's public open-enrollment InviteLink, creating it if needed.

    Returns None if the org has no owner to attribute it to (can't satisfy the
    NOT NULL created_by) — Explore then falls back to contact-only for that org.
    """
    link = (
        db.query(models.InviteLink)
        .filter(
            models.InviteLink.organization_id == org.id,
            models.InviteLink.label == _PUBLIC_LINK_LABEL,
        )
        .first()
    )
    if link:
        return link if link.is_active else None

    owner = (
        db.query(models.User)
        .filter(
            models.User.organization_id == org.id,
            models.User.role == models.UserRole.owner,
        )
        .first()
    )
    if not owner:
        return None

    link = models.InviteLink(
        organization_id=org.id,
        created_by=owner.id,
        label=_PUBLIC_LINK_LABEL,
        role=models.UserRole.learner,
        free_access=False,   # learner still pays for paid courses via the normal flow
        max_uses=None,       # unlimited — it's the public front door
        expires_at=None,     # never expires
        is_active=True,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.get("/public", response_model=List[schemas.OrganizationPublicOut])
def list_public_orgs(db: Session = Depends(get_db)):
    """Public directory of organizations (auto-listed, opt-out via `is_listed`).

    Unauthenticated — powers the "Find Courses" page so visitors can discover
    schools/tutors, see what they teach, and contact them directly. Returns
    only safe profile fields + published courses; never payment/plan data.

    An org appears when it is active, has not opted out of the directory, and
    has at least one published course — so real content shows up automatically
    without any admin toggle, while empty shells stay hidden.
    """
    orgs = (
        db.query(models.Organization)
        .options(
            joinedload(models.Organization.modules).joinedload(models.Module.videos)
        )
        .filter(
            models.Organization.is_listed.is_(True),
            models.Organization.is_active.is_(True),
        )
        .order_by(models.Organization.created_at.desc())
        .all()
    )

    out: List[schemas.OrganizationPublicOut] = []
    for org in orgs:
        published = [m for m in org.modules if m.is_published]
        # Only surface orgs that actually have something to teach.
        if not published:
            continue
        join_link = _ensure_public_join_link(org, db)
        courses = [
            schemas.PublicCourseOut(
                id=m.id,
                title=m.title,
                thumbnail_url=m.thumbnail_url,
                lesson_count=len(m.videos),
                duration_seconds=m.duration_seconds or 0,
            )
            for m in published
        ]
        out.append(
            schemas.OrganizationPublicOut(
                name=org.name,
                slug=org.slug,
                logo_url=org.logo_url,
                brand_color=org.brand_color,
                tagline=org.tagline,
                description=org.description,
                public_email=org.public_email,
                public_phone=org.public_phone,
                public_whatsapp=org.public_whatsapp,
                website_url=org.website_url,
                country=org.country,
                city=org.city,
                course_count=len(courses),
                courses=courses,
                join_token=join_link.token if join_link else None,
            )
        )
    return out


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

    # Custom branding (logo/brand colour) is plan-gated. But the settings form
    # sends these fields on every save even when untouched, which would block
    # unrelated edits (tagline, payment, etc.). So only enforce — and only apply —
    # branding when it's ACTUALLY being changed to a new non-empty value.
    branding_keys = {"logo_url", "brand_color"}
    for key in branding_keys:
        if key in updates:
            new_val = (updates[key] or "").strip() if isinstance(updates[key], str) else updates[key]
            current_val = getattr(org, key, None) or ""
            if not new_val or new_val == current_val:
                # unchanged or cleared — don't gate, don't treat as a branding change
                updates.pop(key)

    if (branding_keys & updates.keys()) and current_user.role != _SUPER:
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

# ── Country payment configs (admin) ──────────────────────────────────

@router.get(
    "/mine/payment-countries",
    response_model=List[schemas.PaymentCountryConfigOut],
)
def list_payment_countries(
    current_user: models.User = Depends(auth_utils.require_owner),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.PaymentCountryConfig)
        .filter(models.PaymentCountryConfig.org_id == current_user.organization_id)
        .order_by(models.PaymentCountryConfig.country_name)
        .all()
    )


@router.post(
    "/mine/payment-countries",
    response_model=schemas.PaymentCountryConfigOut,
    status_code=201,
)
def create_payment_country(
    payload: schemas.PaymentCountryConfigCreate,
    current_user: models.User = Depends(auth_utils.require_owner),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(models.PaymentCountryConfig)
        .filter(
            models.PaymentCountryConfig.org_id == current_user.organization_id,
            models.PaymentCountryConfig.country_code == payload.country_code,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="A config for this country already exists.")
    config = models.PaymentCountryConfig(
        org_id=current_user.organization_id,
        **payload.model_dump(),
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


@router.put(
    "/mine/payment-countries/{config_id}",
    response_model=schemas.PaymentCountryConfigOut,
)
def update_payment_country(
    config_id: str,
    payload: schemas.PaymentCountryConfigCreate,
    current_user: models.User = Depends(auth_utils.require_owner),
    db: Session = Depends(get_db),
):
    config = (
        db.query(models.PaymentCountryConfig)
        .filter(
            models.PaymentCountryConfig.id == config_id,
            models.PaymentCountryConfig.org_id == current_user.organization_id,
        )
        .first()
    )
    if not config:
        raise HTTPException(status_code=404, detail="Not found")
    for field, value in payload.model_dump().items():
        setattr(config, field, value)
    db.commit()
    db.refresh(config)
    return config


@router.delete("/mine/payment-countries/{config_id}", status_code=204)
def delete_payment_country(
    config_id: str,
    current_user: models.User = Depends(auth_utils.require_owner),
    db: Session = Depends(get_db),
):
    config = (
        db.query(models.PaymentCountryConfig)
        .filter(
            models.PaymentCountryConfig.id == config_id,
            models.PaymentCountryConfig.org_id == current_user.organization_id,
        )
        .first()
    )
    if not config:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(config)
    db.commit()


# ── Super-admin: all orgs ─────────────────────────────────────────────

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
