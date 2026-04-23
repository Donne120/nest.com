"""Add missing columns to meeting_bookings

Revision ID: 015
Revises: 014
Create Date: 2026-04-23

The meeting_bookings table was created by create_all from an early model
that lacked learner_id, owner_id, and the scheduling columns.
"""
from alembic import op
import sqlalchemy as sa

revision = '015'
down_revision = '014'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('meeting_bookings') as batch_op:
        batch_op.add_column(sa.Column('learner_id', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('owner_id', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('requested_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('note', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('meeting_link', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('decline_reason', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    with op.batch_alter_table('meeting_bookings') as batch_op:
        batch_op.drop_column('updated_at')
        batch_op.drop_column('decline_reason')
        batch_op.drop_column('meeting_link')
        batch_op.drop_column('note')
        batch_op.drop_column('confirmed_at')
        batch_op.drop_column('requested_at')
        batch_op.drop_column('owner_id')
        batch_op.drop_column('learner_id')
