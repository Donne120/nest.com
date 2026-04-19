"""Add subscription_end and renewal_notified_at to organizations

Revision ID: 014
Revises: 013
Create Date: 2026-04-19
"""
from alembic import op
import sqlalchemy as sa

revision = '014'
down_revision = '013'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('organizations') as batch_op:
        batch_op.add_column(
            sa.Column('subscription_end',
                      sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.add_column(
            sa.Column('renewal_notified_at',
                      sa.DateTime(timezone=True), nullable=True)
        )


def downgrade():
    with op.batch_alter_table('organizations') as batch_op:
        batch_op.drop_column('renewal_notified_at')
        batch_op.drop_column('subscription_end')
