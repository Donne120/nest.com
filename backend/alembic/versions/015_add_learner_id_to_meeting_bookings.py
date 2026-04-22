"""Add learner_id to meeting_bookings

Revision ID: 015
Revises: 014
Create Date: 2026-04-23
"""
from alembic import op
import sqlalchemy as sa

revision = '015'
down_revision = '014'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('meeting_bookings') as batch_op:
        batch_op.add_column(
            sa.Column('learner_id', sa.String(), sa.ForeignKey('users.id'), nullable=True)
        )


def downgrade():
    with op.batch_alter_table('meeting_bookings') as batch_op:
        batch_op.drop_column('learner_id')
