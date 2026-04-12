"""add invite_links table

Revision ID: 011
Revises: 010
Create Date: 2026-04-12
"""
from alembic import op
import sqlalchemy as sa

revision = '011'
down_revision = '010'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'invite_links',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column(
            'organization_id',
            sa.String(),
            sa.ForeignKey('organizations.id', ondelete='CASCADE'),
            nullable=False,
        ),
        sa.Column(
            'created_by',
            sa.String(),
            sa.ForeignKey('users.id', ondelete='SET NULL'),
            nullable=True,
        ),
        sa.Column('token', sa.String(), nullable=False),
        sa.Column('label', sa.String(), nullable=True),
        sa.Column(
            'role',
            sa.String(),
            nullable=False,
            server_default='learner',
        ),
        sa.Column(
            'free_access',
            sa.Boolean(),
            nullable=False,
            server_default='0',
        ),
        sa.Column('access_code', sa.String(), nullable=True),
        sa.Column('max_uses', sa.Integer(), nullable=True),
        sa.Column(
            'use_count',
            sa.Integer(),
            nullable=False,
            server_default='0',
        ),
        sa.Column(
            'expires_at',
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            'is_active',
            sa.Boolean(),
            nullable=False,
            server_default='1',
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token'),
    )
    op.create_index(
        'ix_invite_links_organization_id',
        'invite_links',
        ['organization_id'],
    )
    op.create_index(
        'ix_invite_links_token',
        'invite_links',
        ['token'],
        unique=True,
    )


def downgrade():
    op.drop_index(
        'ix_invite_links_token',
        table_name='invite_links',
    )
    op.drop_index(
        'ix_invite_links_organization_id',
        table_name='invite_links',
    )
    op.drop_table('invite_links')
