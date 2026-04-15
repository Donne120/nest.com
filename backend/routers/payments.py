"""
Payments router — manual proof-of-payment verification system.

Flow:
  1. User sends money via MoMo/bank to Nest's number
  2. User submits proof (screenshot + details) via POST /payments/submit
  3. Admin sees pending queue via GET /payments/pending
  4. Admin approves → access granted automatically
     - teacher_subscription → org.plan + subscription_status updated
     - module_purchase      → ModuleAccess row created for the student
  5. Admin rejects → rejection_reason stored, user notified
"""

import re
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import (
    APIRouter, BackgroundTasks, Depends, HTTPException,
    Request, UploadFile, File, Form,
)
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session, joinedload

from auth import get_current_user
from config import settings
from database import get_db
from models import (
    ModuleAccess, Organization, PaymentMethod, PaymentStatus,
    PaymentSubmission, PaymentType, Plan, SubscriptionStatus,
    User, UserRole, Module,
)
import email_utils
import plan_limits
import storage as storage_helper

limiter = Limiter(key_func=get_remote_address)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/payments", tags=["payments"])


# ── helpers ───────────────────────────────────────────────────────────

_ALLOWED_CURRENCIES = {"RWF", "USD", "EUR", "XAF"}
_PHONE_RE = re.compile(r"^\+?[0-9\-\s]{7,20}$")


def _require_admin(user: User):
    """Read-only admin access: owner, educator, super_admin can view."""
    if user.role not in (
        UserRole.super_admin, UserRole.owner, UserRole.educator
    ):
        raise HTTPException(status_code=403, detail="Not authorized")


def _require_approver(user: User):
    """Only owner / super_admin may approve or reject payments."""
    if user.role not in (UserRole.super_admin, UserRole.owner):
        raise HTTPException(
            status_code=403,
            detail="Only an owner or super-admin can approve payments.",
        )


def _serialize(sub: PaymentSubmission) -> dict:
    return {
        "id": sub.id,
        "payment_type": sub.payment_type,
        "payment_method": sub.payment_method,
        "amount": sub.amount,
        "currency": sub.currency,
        "phone_number": sub.phone_number,
        "transaction_reference": sub.transaction_reference,
        "proof_image_url": sub.proof_image_url,
        "status": sub.status,
        "notes": sub.notes,
        "plan": sub.plan,
        "module_id": sub.module_id,
        "rejection_reason": sub.rejection_reason,
        "reviewed_at": (
            sub.reviewed_at.isoformat() if sub.reviewed_at else None
        ),
        "created_at": (
            sub.created_at.isoformat() if sub.created_at else None
        ),
        "payer": {
            "id": sub.payer.id,
            "full_name": sub.payer.full_name,
            "email": sub.payer.email,
            "avatar_url": sub.payer.avatar_url,
        } if sub.payer else None,
        "module": {
            "id": sub.module.id,
            "title": sub.module.title,
            "thumbnail_url": sub.module.thumbnail_url,
            "price": sub.module.price,
            "currency": sub.module.currency,
        } if sub.module else None,
    }


# ── submit proof ──────────────────────────────────────────────────────

@router.post("/submit")
@limiter.limit("10/minute")
async def submit_payment(
    request: Request,
    background_tasks: BackgroundTasks,
    payment_type: str = Form(...),
    payment_method: str = Form(...),
    amount: float = Form(...),
    currency: str = Form("RWF"),
    phone_number: Optional[str] = Form(None),
    transaction_reference: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    plan: Optional[str] = Form(None),
    module_id: Optional[str] = Form(None),
    proof_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ── Proof image required ───────────────────────────────────────────
    if not proof_image or not proof_image.filename:
        raise HTTPException(
            status_code=400,
            detail=(
                "Payment proof screenshot is required. "
                "Please upload your payment confirmation."
            ),
        )

    # ── Role-based payment type gate ───────────────────────────────────
    # Never trust the client — validate the type against the user's role.
    _ROLE_ALLOWED: dict = {
        UserRole.learner: {
            PaymentType.learner_access,
            PaymentType.module_purchase,
        },
        UserRole.educator: {PaymentType.teacher_subscription},
        UserRole.owner: {PaymentType.teacher_subscription},
        UserRole.super_admin: {
            PaymentType.teacher_subscription,
            PaymentType.learner_access,
            PaymentType.module_purchase,
        },
    }
    try:
        pt_enum = PaymentType(payment_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid payment type: {payment_type}",
        )
    allowed_for_role = _ROLE_ALLOWED.get(current_user.role, set())
    if pt_enum not in allowed_for_role:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Your account role is not permitted to submit "
                f"a '{payment_type}' payment."
            ),
        )

    # ── Trial org cannot collect learner payments ──────────────────────
    # Learner access / module purchase payments flow money TO the org.
    # Trial orgs are not verified and must not collect learner money.
    # Super-admin is fully exempt from this check.
    if (
        pt_enum in {PaymentType.learner_access, PaymentType.module_purchase}
        and current_user.role != UserRole.super_admin
    ):
        org = plan_limits.get_org_or_403(current_user, db)
        if plan_limits.effective_plan(org) == Plan.trial:
            raise HTTPException(
                status_code=403,
                detail=(
                    "This organisation is on a free trial and cannot "
                    "collect learner payments yet. "
                    "Please contact the school administrator."
                ),
            )

    # ── Input validation ───────────────────────────────────────────────
    if amount <= 0 or amount > 10_000_000:
        raise HTTPException(status_code=400, detail="Invalid amount.")
    if currency not in _ALLOWED_CURRENCIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid currency. Allowed: {_ALLOWED_CURRENCIES}",
        )
    if phone_number and not _PHONE_RE.match(phone_number):
        raise HTTPException(
            status_code=400, detail="Invalid phone number format.",
        )
    if notes and len(notes) > 1000:
        raise HTTPException(
            status_code=400,
            detail="Notes must be under 1000 characters.",
        )
    if transaction_reference and len(transaction_reference) > 200:
        raise HTTPException(
            status_code=400,
            detail="Transaction reference too long.",
        )

    # ── Upload proof screenshot to Supabase ────────────────────────────
    proof_url = None
    if proof_image and proof_image.filename:
        try:
            content = await proof_image.read()

            # Validate file type by magic bytes (not just extension)
            _ALLOWED_MAGIC = {
                b'\xff\xd8\xff': 'jpg',
                b'\x89PNG': 'png',
                b'GIF8': 'gif',
                b'RIFF': 'webp',   # RIFF....WEBP
            }
            _detected = None
            for magic, ftype in _ALLOWED_MAGIC.items():
                is_webp = (
                    ftype == 'webp' and content[8:12] == b'WEBP'
                )
                if content[:len(magic)] == magic or is_webp:
                    _detected = ftype
                    break
            if _detected is None:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Only JPG, PNG, GIF, or WEBP images are "
                        "accepted as payment proof."
                    ),
                )

            filename = f"{uuid.uuid4()}.{_detected}"
            client = storage_helper.get_client()
            client.storage.from_("payment-proofs").upload(
                path=filename,
                file=content,
                file_options={
                    "content-type": (
                        proof_image.content_type or "image/jpeg"
                    ),
                },
            )
            # Signed URL valid for 1 year so admin can always view it
            result = client.storage.from_(
                "payment-proofs"
            ).create_signed_url(filename, 31536000)
            proof_url = result.get("signedURL") or result.get(
                "signed_url"
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Proof image upload failed (non-fatal): {e}")

    # ── Resolve payee for module purchases ─────────────────────────────
    # Scoped to the user's own org so cross-tenant module IDs are
    # rejected.
    payee_id = None
    if payment_type == PaymentType.module_purchase and module_id:
        mod = db.query(Module).filter(
            Module.id == module_id,
            Module.organization_id == current_user.organization_id,
        ).first()
        if not mod:
            raise HTTPException(
                status_code=404,
                detail="Module not found in your organisation.",
            )
        payee_id = mod.created_by

    submission = PaymentSubmission(
        payer_id=current_user.id,
        payment_type=PaymentType(payment_type),
        payment_method=PaymentMethod(payment_method),
        amount=amount,
        currency=currency,
        phone_number=phone_number,
        transaction_reference=transaction_reference,
        notes=notes,
        plan=Plan(plan) if plan else None,
        module_id=module_id,
        payee_id=payee_id,
        proof_image_url=proof_url,
        status=PaymentStatus.pending,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    # Notify admin
    module_title = None
    if module_id:
        mod = db.query(Module).filter(Module.id == module_id).first()
        if mod:
            module_title = mod.title
    review_url = f"{settings.FRONTEND_URL}/admin/payments"
    background_tasks.add_task(
        email_utils.send_payment_submitted,
        to=settings.ADMIN_NOTIFICATION_EMAIL,
        payer_name=current_user.full_name,
        payer_email=current_user.email,
        payment_type=payment_type,
        amount=amount,
        currency=currency,
        plan=plan,
        module_title=module_title,
        review_url=review_url,
    )

    return {
        "id": submission.id,
        "status": "pending",
        "message": (
            "Payment submitted. "
            "Access will be granted within 24 hours after verification."
        ),
    }


# ── admin: pending queue ──────────────────────────────────────────────

@router.get("/pending")
def get_pending_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    q = db.query(PaymentSubmission).options(
        joinedload(PaymentSubmission.payer),
        joinedload(PaymentSubmission.module),
    ).filter(PaymentSubmission.status == PaymentStatus.pending)

    # Educators only see their own module purchase proofs
    if current_user.role == UserRole.educator:
        q = q.filter(
            PaymentSubmission.payee_id == current_user.id
        )

    submissions = q.order_by(
        PaymentSubmission.created_at.desc()
    ).all()
    return [_serialize(s) for s in submissions]


@router.get("/all")
def get_all_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    q = db.query(PaymentSubmission).options(
        joinedload(PaymentSubmission.payer),
        joinedload(PaymentSubmission.module),
    )
    if current_user.role == UserRole.educator:
        q = q.filter(
            PaymentSubmission.payee_id == current_user.id
        )

    submissions = q.order_by(
        PaymentSubmission.created_at.desc()
    ).all()
    return [_serialize(s) for s in submissions]


# ── approve ───────────────────────────────────────────────────────────

@router.post("/{payment_id}/approve")
def approve_payment(
    payment_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_approver(current_user)

    sub = db.query(PaymentSubmission).options(
        joinedload(PaymentSubmission.payer),
    ).filter(PaymentSubmission.id == payment_id).first()
    if not sub:
        raise HTTPException(
            status_code=404, detail="Payment not found"
        )
    if sub.status != PaymentStatus.pending:
        raise HTTPException(
            status_code=400, detail="Payment already processed"
        )

    sub.status = PaymentStatus.approved
    sub.reviewed_by = current_user.id
    sub.reviewed_at = datetime.now(timezone.utc)

    payer = db.query(User).filter(User.id == sub.payer_id).first()
    if payer:
        payer.payment_verified = True

    if sub.payment_type == PaymentType.teacher_subscription:
        if payer and payer.organization_id:
            org = db.query(Organization).filter(
                Organization.id == payer.organization_id
            ).first()
            if org:
                org.subscription_status = SubscriptionStatus.active
                if sub.plan:
                    org.plan = sub.plan
                org.subscription_end = (
                    datetime.now(timezone.utc) + timedelta(days=30)
                )
                org.renewal_notified_at = None

    elif (
        sub.payment_type == PaymentType.module_purchase
        and sub.module_id
    ):
        existing = db.query(ModuleAccess).filter(
            ModuleAccess.student_id == sub.payer_id,
            ModuleAccess.module_id == sub.module_id,
        ).first()
        if not existing:
            access = ModuleAccess(
                student_id=sub.payer_id,
                module_id=sub.module_id,
                payment_submission_id=sub.id,
                granted_by=current_user.id,
            )
            db.add(access)

    db.commit()

    # Notify the payer
    if sub.payer:
        module_title = sub.module.title if sub.module else None
        dashboard_url = f"{settings.FRONTEND_URL}/dashboard"
        background_tasks.add_task(
            email_utils.send_payment_approved,
            to=sub.payer.email,
            user_name=sub.payer.full_name,
            payment_type=sub.payment_type,
            amount=sub.amount,
            currency=sub.currency,
            plan=sub.plan,
            module_title=module_title,
            dashboard_url=dashboard_url,
        )

    return {"status": "approved", "message": "Access granted."}


# ── reject ────────────────────────────────────────────────────────────

class RejectBody(BaseModel):
    reason: str = ""


@router.post("/{payment_id}/reject")
def reject_payment(
    payment_id: str,
    body: RejectBody,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_approver(current_user)

    sub = db.query(PaymentSubmission).options(
        joinedload(PaymentSubmission.payer),
    ).filter(PaymentSubmission.id == payment_id).first()
    if not sub:
        raise HTTPException(
            status_code=404, detail="Payment not found"
        )
    if sub.status != PaymentStatus.pending:
        raise HTTPException(
            status_code=400, detail="Payment already processed"
        )

    sub.status = PaymentStatus.rejected
    sub.rejection_reason = body.reason
    sub.reviewed_by = current_user.id
    sub.reviewed_at = datetime.now(timezone.utc)
    db.commit()

    # Notify the payer
    if sub.payer:
        support_url = f"{settings.FRONTEND_URL}/payments"
        background_tasks.add_task(
            email_utils.send_payment_rejected,
            to=sub.payer.email,
            user_name=sub.payer.full_name,
            amount=sub.amount,
            currency=sub.currency,
            reason=body.reason or None,
            support_url=support_url,
        )

    return {"status": "rejected"}


# ── user: my submissions ──────────────────────────────────────────────

@router.get("/mine")
def get_my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    submissions = (
        db.query(PaymentSubmission)
        .options(joinedload(PaymentSubmission.module))
        .filter(PaymentSubmission.payer_id == current_user.id)
        .order_by(PaymentSubmission.created_at.desc())
        .all()
    )
    return [_serialize(s) for s in submissions]


# ── check module access ───────────────────────────────────────────────

@router.get("/access/{module_id}")
def check_module_access(
    module_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    access = db.query(ModuleAccess).filter(
        ModuleAccess.student_id == current_user.id,
        ModuleAccess.module_id == module_id,
    ).first()
    return {"has_access": access is not None}
