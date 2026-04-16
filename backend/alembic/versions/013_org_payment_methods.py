"""Add extended payment method fields to organizations

Revision ID: 013
Revises: 012
Create Date: 2026-04-16
"""
from alembic import op
import sqlalchemy as sa

revision = '013'
down_revision = '012'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('organizations') as batch_op:
        batch_op.add_column(sa.Column('payment_orange_number', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('payment_orange_name',   sa.String(), nullable=True))
        batch_op.add_column(sa.Column('payment_bank_name',     sa.String(), nullable=True))
        batch_op.add_column(sa.Column('payment_bank_account',  sa.String(), nullable=True))
        batch_op.add_column(sa.Column('payment_bank_holder',   sa.String(), nullable=True))
        batch_op.add_column(sa.Column('payment_instructions',  sa.String(), nullable=True))


def downgrade():
    with op.batch_alter_table('organizations') as batch_op:
        batch_op.drop_column('payment_instructions')
        batch_op.drop_column('payment_bank_holder')
        batch_op.drop_column('payment_bank_account')
        batch_op.drop_column('payment_bank_name')
        batch_op.drop_column('payment_orange_name')
        batch_op.drop_column('payment_orange_number')
