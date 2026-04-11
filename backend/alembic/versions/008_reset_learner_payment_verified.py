"""Reset payment_verified to FALSE for all learners

Revision ID: 008
Revises: 007
Create Date: 2026-04-11 00:00:00.000000

Migration rationale:
  Migration 007 (and the startup ALTER TABLE in main.py) used server_default='true',
  which granted every pre-existing user payment_verified=True for free.
  This migration corrects that: all learners must now submit proper payment proof.
  Educators, owners, and super_admins are left untouched.
"""
from alembic import op


revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        UPDATE users
        SET payment_verified = FALSE
        WHERE role = 'learner'
    """)


def downgrade() -> None:
    # Restore the grandfathered state — all learners get free access again.
    # Only run this if you intentionally want to revert.
    op.execute("""
        UPDATE users
        SET payment_verified = TRUE
        WHERE role = 'learner'
    """)
