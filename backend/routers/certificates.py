from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(prefix="/api/certificates", tags=["certificates"])


def _gen_cert_number(db: Session) -> str:
    count = db.query(func.count(models.Certificate.id)).scalar() or 0
    year = datetime.utcnow().year
    return f"NEST-{year}-{str(count + 1).zfill(5)}"


def issue_if_not_exists(
    user_id: str, module_id: str, org_id: str, db: Session
) -> models.Certificate | None:
    """
    Auto-issue a completion certificate. Called from progress router when a
    module is marked as completed. Idempotent — safe to call multiple times.
    """
    existing = db.query(models.Certificate).filter(
        models.Certificate.user_id == user_id,
        models.Certificate.module_id == module_id,
    ).first()
    if existing:
        return existing

    cert = models.Certificate(
        cert_number=_gen_cert_number(db),
        user_id=user_id,
        module_id=module_id,
        org_id=org_id,
    )
    db.add(cert)
    # caller commits
    return cert


@router.get("/me", response_model=List[schemas.CertificateOut])
def my_certificates(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Certificate)
        .filter(models.Certificate.user_id == current_user.id)
        .order_by(models.Certificate.issued_at.desc())
        .all()
    )


@router.get("/{cert_id}", response_model=schemas.CertificateOut)
def get_certificate(cert_id: str, db: Session = Depends(get_db)):
    """Public — no auth required. Used for LinkedIn sharing."""
    cert = db.query(models.Certificate).filter(models.Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return cert
