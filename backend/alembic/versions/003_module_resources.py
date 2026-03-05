"""003 module resources

Revision ID: 003
Revises: 002
Create Date: 2026-03-03

Adds resources JSON column to modules table for storing additional learning resources.
"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("modules", sa.Column("resources", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("modules", "resources")
