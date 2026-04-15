"""Add deleted_at to modules (soft delete)

Revision ID: 012
Revises: 011
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa

revision = '012'
down_revision = '011'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'modules',
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_modules_deleted_at', 'modules', ['deleted_at'])


def downgrade():
    op.drop_index('ix_modules_deleted_at', table_name='modules')
    op.drop_column('modules', 'deleted_at')
