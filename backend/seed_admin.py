"""
One-time seed script: creates the Nest Cameroon organisation and its
super_admin account.

Run once from the backend directory:
    python seed_admin.py

Safe to run multiple times — skips creation if email already exists.
"""

import sys
import os

# Allow imports from the backend root
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine
import models
from auth import hash_password

# ── Nest Cameroon seed data ────────────────────────────────────────────────────

ORG_NAME = "Nest Cameroon"
ORG_SLUG = "nest-cameroon"

ADMIN_EMAIL = "ngummdieudonne4@gmail.com"
ADMIN_NAME = "Nest Cameroon Admin"
ADMIN_PASSWORD = os.environ.get("SEED_ADMIN_PASSWORD", "")


def run():
    if not ADMIN_PASSWORD:
        print(
            "ERROR: Set the SEED_ADMIN_PASSWORD environment variable "
            "before running this script.\n"
            "  export SEED_ADMIN_PASSWORD='your-password-here'\n"
            "  python seed_admin.py"
        )
        sys.exit(1)

    # Create tables if they don't exist yet (dev convenience)
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Skip if admin already exists
        existing = (
            db.query(models.User)
            .filter(models.User.email == ADMIN_EMAIL)
            .first()
        )
        if existing:
            print(f"[seed] Account {ADMIN_EMAIL} already exists — skipping.")
            return

        # Create or reuse the Nest Cameroon org
        org = (
            db.query(models.Organization)
            .filter(models.Organization.slug == ORG_SLUG)
            .first()
        )
        if not org:
            org = models.Organization(
                name=ORG_NAME,
                slug=ORG_SLUG,
                plan=models.Plan.enterprise
                if hasattr(models.Plan, "enterprise")
                else models.Plan.pro,
                subscription_status=models.SubscriptionStatus.active,
                is_active=True,
            )
            db.add(org)
            db.flush()
            print(f"[seed] Created organisation: {ORG_NAME}")
        else:
            print(f"[seed] Organisation '{ORG_NAME}' already exists — reusing.")

        # Create the super_admin user
        admin = models.User(
            organization_id=org.id,
            email=ADMIN_EMAIL,
            full_name=ADMIN_NAME,
            hashed_password=hash_password(ADMIN_PASSWORD),
            role=models.UserRole.super_admin,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"[seed] Created super_admin: {ADMIN_EMAIL}")
        print("[seed] Done. You can now log in at the Nest frontend.")

    finally:
        db.close()


if __name__ == "__main__":
    run()
