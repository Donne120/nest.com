import re
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from database import get_db
import models
import schemas
import auth as auth_utils
from config import settings
import email_utils

_IS_PROD = settings.ENVIRONMENT not in ("development", "dev")

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _queue_verification_email(user: models.User, db: Session, background_tasks: BackgroundTasks):
    """Create a 24-hour verification token and queue the email."""
    # Invalidate any existing unused tokens for this user
    db.query(models.EmailVerificationToken).filter(
        models.EmailVerificationToken.user_id == user.id,
        models.EmailVerificationToken.used == False,
    ).delete()

    token = models.EmailVerificationToken(
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(token)
    db.flush()  # get token.token before background task

    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token.token}"
    background_tasks.add_task(
        email_utils.send_verification_email,
        to=user.email,
        full_name=user.full_name,
        verify_url=verify_url,
    )

def _generate_slug(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-") or "org"


def _unique_slug(base: str, db: Session) -> str:
    slug = base
    counter = 1
    while db.query(models.Organization).filter(models.Organization.slug == slug).first():
        slug = f"{base}-{counter}"
        counter += 1
    return slug


def _build_token_response(user: models.User, db: Session, response: Response | None = None) -> schemas.Token:
    org = (
        db.query(models.Organization).filter(models.Organization.id == user.organization_id).first()
        if user.organization_id else None
    )
    token = auth_utils.create_access_token({
        "sub": user.id,
        "org_id": user.organization_id,
    })
    # Set httpOnly cookie so JS cannot read the token.
    # In production the frontend (vercel.app) and backend (render.com) are on
    # different domains, so we need SameSite=None; Secure for the cookie to be
    # included in cross-origin API requests.  In dev we use lax + no secure.
    if response is not None:
        response.set_cookie(
            key="nest_token",
            value=token,
            httponly=True,
            secure=_IS_PROD,
            samesite="none" if _IS_PROD else "lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/",
        )
    return schemas.Token(
        access_token=token,
        token_type="bearer",
        user=user,
        organization=org,
    )


# ─── Standard login ───────────────────────────────────────────────────────────

class _LoginJSON(schemas.BaseModel):
    email: str
    password: str

@router.post("/login", response_model=schemas.Token)
@limiter.limit("10/minute")
async def login(request: Request, response: Response, db: Session = Depends(get_db)):
    """Accepts both JSON {email, password} and OAuth2 form-data {username, password}."""
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        body = await request.json()
        email = body.get("email") or body.get("username", "")
        password = body.get("password", "")
    else:
        form = await request.form()
        email = form.get("username") or form.get("email", "")
        password = form.get("password", "")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="No account found with that email. Check for a typo or ask for an invite link.")
    if not auth_utils.verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect password. Try again or use 'Forgot password'.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Contact your admin.")
    return _build_token_response(user, db, response)


# ─── Logout ───────────────────────────────────────────────────────────────────

@router.post("/logout", status_code=200)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    """Revoke the current token and clear the auth cookie."""
    # Try to get token from cookie or Authorization header
    token = request.cookies.get("nest_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if token:
        auth_utils.revoke_token(token, db)
    response.delete_cookie(key="nest_token", path="/")
    return {"message": "Logged out successfully"}


# ─── Company / Organisation registration ──────────────────────────────────────

@router.post("/register-org", response_model=schemas.Token, status_code=201)
@limiter.limit("5/hour")
def register_org(request: Request, response: Response, background_tasks: BackgroundTasks, payload: schemas.RegisterOrgRequest, db: Session = Depends(get_db)):
    """
    Self-service company signup. Creates an Organization + first Admin user
    in a single transaction, then returns a login token (auto-login).
    """
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Unable to create account with that email")

    base_slug = _generate_slug(payload.org_name)
    slug = _unique_slug(base_slug, db)

    org = models.Organization(
        name=payload.org_name,
        slug=slug,
        plan=models.Plan.trial,
        subscription_status=models.SubscriptionStatus.active,
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=14),
        is_active=True,
    )
    db.add(org)
    db.flush()  # get org.id before creating user

    user = models.User(
        organization_id=org.id,
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=auth_utils.hash_password(payload.password),
        role=models.UserRole.owner,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.refresh(org)

    dashboard_url = f"{settings.FRONTEND_URL}/admin"
    background_tasks.add_task(email_utils.send_welcome,
        to=user.email,
        admin_name=user.full_name,
        org_name=org.name,
        dashboard_url=dashboard_url,
    )
    _queue_verification_email(user, db, background_tasks)
    db.commit()

    return _build_token_response(user, db, response)


# ─── Invite info (public — no auth) ──────────────────────────────────────────

@router.get("/invite-info/{token}", response_model=schemas.InviteInfoOut)
def invite_info(token: str, db: Session = Depends(get_db)):
    invite = db.query(models.Invitation).filter(models.Invitation.token == token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.is_accepted:
        raise HTTPException(status_code=400, detail="Invite already used")
    if invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite has expired")
    return schemas.InviteInfoOut(
        org_name=invite.organization.name,
        org_logo_url=invite.organization.logo_url,
        org_momo_number=invite.organization.momo_number,
        invited_role=invite.role,
        expires_at=invite.expires_at,
    )


# ─── Accept invite ────────────────────────────────────────────────────────────

@router.post("/accept-invite", response_model=schemas.Token, status_code=201)
@limiter.limit("5/minute")
def accept_invite(request: Request, response: Response, background_tasks: BackgroundTasks, payload: schemas.AcceptInviteRequest, db: Session = Depends(get_db)):
    invite = db.query(models.Invitation).filter(models.Invitation.token == payload.token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.is_accepted:
        raise HTTPException(status_code=400, detail="Invite already used")
    if invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite has expired")
    existing = db.query(models.User).filter(models.User.email == invite.email).first()
    if existing:
        if existing.organization_id != invite.organization_id:
            raise HTTPException(
                status_code=400,
                detail="An account with this email already exists. Please sign in instead.",
            )
        # User already created (e.g. from a previous failed attempt) — just
        # mark the invite accepted and log them in without creating a duplicate.
        invite.is_accepted = True
        db.commit()
        return _build_token_response(existing, db, response)

    user = models.User(
        organization_id=invite.organization_id,
        email=invite.email,
        full_name=payload.full_name,
        hashed_password=auth_utils.hash_password(payload.password),
        role=invite.role,
    )
    db.add(user)
    invite.is_accepted = True
    db.flush()
    _queue_verification_email(user, db, background_tasks)
    db.commit()
    db.refresh(user)

    return _build_token_response(user, db, response)


# ─── Password Reset ───────────────────────────────────────────────────────────

@router.post("/forgot-password", status_code=200)
@limiter.limit("5/minute")
def forgot_password(request: Request, background_tasks: BackgroundTasks, payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Always returns 200 so we don't leak whether an email exists."""
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user and user.is_active:
        # Invalidate any existing unused tokens for this user
        db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.user_id == user.id,
            models.PasswordResetToken.used == False,
        ).delete()

        reset_token = models.PasswordResetToken(
            user_id=user.id,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        db.add(reset_token)
        db.commit()
        db.refresh(reset_token)

        reset_url = f"{settings.FRONTEND_URL}/reset-password/{reset_token.token}"
        background_tasks.add_task(email_utils.send_password_reset, to=user.email, reset_url=reset_url)

    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password", status_code=200)
@limiter.limit("5/minute")
def reset_password(request: Request, payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    record = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == payload.token,
    ).first()

    if not record or record.used or record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.query(models.User).filter(models.User.id == record.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="User not found")

    user.hashed_password = auth_utils.hash_password(payload.new_password)
    # Mark this token used AND delete all other outstanding reset tokens for
    # this user so that old links cannot be replayed.
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == record.user_id,
    ).delete()
    db.commit()

    return {"message": "Password updated successfully"}


# ─── Bulk Invite Link — public join ──────────────────────────────────────────

@router.get("/join-info/{token}", response_model=schemas.JoinLinkInfo)
def join_link_info(token: str, db: Session = Depends(get_db)):
    """Public endpoint — returns just enough info for the registration page."""
    link = db.query(models.InviteLink).filter(models.InviteLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Invite link not found")
    if not link.is_active:
        raise HTTPException(status_code=400, detail="This invite link has been deactivated")
    if link.expires_at and link.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This invite link has expired")
    if link.max_uses is not None and link.use_count >= link.max_uses:
        raise HTTPException(status_code=400, detail="This invite link has reached its maximum number of uses")
    org = db.query(models.Organization).filter(models.Organization.id == link.organization_id).first()
    return schemas.JoinLinkInfo(
        org_name=org.name if org else "Unknown Organization",
        org_logo_url=org.logo_url if org else None,
        label=link.label,
        role=link.role.value,
        free_access=link.free_access,
        requires_code=link.access_code is not None,
        max_uses=link.max_uses,
        use_count=link.use_count,
        expires_at=link.expires_at,
    )


@router.post("/join/{token}", response_model=schemas.Token, status_code=201)
@limiter.limit("10/minute")
def join_via_link(
    request: Request,
    response: Response,
    background_tasks: BackgroundTasks,
    token: str,
    payload: schemas.JoinLinkRegister,
    db: Session = Depends(get_db),
):
    """Register a new user via a bulk invite link."""
    link = db.query(models.InviteLink).filter(models.InviteLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Invite link not found")
    if not link.is_active:
        raise HTTPException(status_code=400, detail="This invite link has been deactivated")
    if link.expires_at and link.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This invite link has expired")
    if link.max_uses is not None and link.use_count >= link.max_uses:
        raise HTTPException(status_code=400, detail="This invite link has reached its maximum number of uses")

    # Validate access code if required
    if link.access_code:
        if not payload.access_code or payload.access_code.strip() != link.access_code.strip():
            raise HTTPException(status_code=400, detail="Incorrect access code")

    # Normalise email
    email = payload.email.strip().lower()

    # Reject if email already exists in this org
    if db.query(models.User).filter(
        models.User.email == email,
        models.User.organization_id == link.organization_id,
    ).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists in this organisation")

    # Also reject if they exist elsewhere (for now; can be relaxed later)
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists. Please sign in instead.",
        )

    user = models.User(
        organization_id=link.organization_id,
        email=email,
        full_name=payload.full_name.strip(),
        hashed_password=auth_utils.hash_password(payload.password),
        role=link.role,
        payment_verified=link.free_access,   # grant access immediately if free_access
    )
    db.add(user)
    link.use_count += 1
    db.flush()
    _queue_verification_email(user, db, background_tasks)
    db.commit()
    db.refresh(user)

    return _build_token_response(user, db, response)


# ─── Change password (authenticated) ─────────────────────────────────────────

@router.post("/change-password", status_code=200)
@limiter.limit("5/minute")
def change_password(
    request: Request,
    payload: schemas.ChangePasswordRequest,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    if not auth_utils.verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = auth_utils.hash_password(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


# ─── Profile ──────────────────────────────────────────────────────────────────

@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth_utils.get_current_user)):
    return current_user


@router.put("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UserUpdate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


# ─── Email verification ───────────────────────────────────────────────────────

@router.get("/verify-email", status_code=200)
@limiter.limit("10/minute")
def verify_email(
    request: Request,
    token: str,
    db: Session = Depends(get_db),
):
    """
    Verify a user's email address via a token link sent by Nest.
    Called by the frontend at /verify-email?token=xxx.
    """
    record = db.query(models.EmailVerificationToken).filter(
        models.EmailVerificationToken.token == token,
    ).first()

    if not record or record.used or record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired verification link.")

    user = db.query(models.User).filter(models.User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    user.email_verified = True
    record.used = True
    db.commit()

    return {"verified": True, "message": "Email verified successfully."}


@router.post("/resend-verification", status_code=200)
@limiter.limit("3/hour")
def resend_verification(
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    """Resend the verification email for the currently logged-in user."""
    if current_user.email_verified:
        return {"message": "Your email is already verified."}
    _queue_verification_email(current_user, db, background_tasks)
    db.commit()
    return {"message": "Verification email sent."}
