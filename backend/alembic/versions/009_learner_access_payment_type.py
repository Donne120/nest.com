"""Add learner_access to paymenttype enum

Revision ID: 009
Revises: 008
Create Date: 2026-04-11 00:00:00.000000

Adds the new 'learner_access' payment type so students can pay for
general course access when joining via an invite link.
"""
from alembic import op


revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE paymenttype ADD VALUE IF NOT EXISTS 'learner_access'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values without recreating the type.
    # Safe to leave in place; rows using this value must be deleted first if needed.
    pass
