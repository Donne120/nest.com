"""Add payment_verified to users

Revision ID: 007
Revises: 006
Create Date: 2026-04-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # server_default='true' grandfathers existing users so they keep access.
    # New users created via SQLAlchemy use the Python-level default=False.
    op.add_column(
        'users',
        sa.Column(
            'payment_verified',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('true'),
        ),
    )


def downgrade() -> None:
    op.drop_column('users', 'payment_verified')
