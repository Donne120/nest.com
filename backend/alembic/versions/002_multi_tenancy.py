"""002 multi-tenancy

Revision ID: 002
Revises: 001
Create Date: 2026-03-01

Adds organizations and invitations tables.
Adds organization_id FK to users and modules.
Adds super_admin to the UserRole enum (stored as string, no DB enum change needed for SQLite).
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── organizations ──────────────────────────────────────────────────────────
    op.create_table(
        "organizations",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("logo_url", sa.String(), nullable=True),
        sa.Column("brand_color", sa.String(), nullable=True, server_default="#6366f1"),
        sa.Column("plan", sa.String(), nullable=False, server_default="trial"),
        sa.Column("subscription_status", sa.String(), nullable=False, server_default="active"),
        sa.Column("trial_ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_organizations_slug", "organizations", ["slug"], unique=True)

    # ── invitations ────────────────────────────────────────────────────────────
    op.create_table(
        "invitations",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("organization_id", sa.String(), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("token", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False, server_default="employee"),
        sa.Column("invited_by", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("is_accepted", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_invitations_token", "invitations", ["token"], unique=True)
    op.create_index("ix_invitations_email", "invitations", ["email"])

    # ── add organization_id to users (nullable — super_admin has no org) ───────
    # Note: SQLite does not enforce FK constraints; omit inline FK here.
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("organization_id", sa.String(), nullable=True))

    # ── add organization_id to modules ─────────────────────────────────────────
    with op.batch_alter_table("modules") as batch_op:
        batch_op.add_column(sa.Column("organization_id", sa.String(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("modules") as batch_op:
        batch_op.drop_column("organization_id")

    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("organization_id")

    op.drop_index("ix_invitations_email", table_name="invitations")
    op.drop_index("ix_invitations_token", table_name="invitations")
    op.drop_table("invitations")

    op.drop_index("ix_organizations_slug", table_name="organizations")
    op.drop_table("organizations")
