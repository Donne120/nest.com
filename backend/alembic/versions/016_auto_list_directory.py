"""Auto-list orgs in the public directory (opt-out instead of opt-in)

Repurposes organizations.is_listed: it now means "show this org in the public
directory when it has published courses" and DEFAULTS TO TRUE. The admin toggle
becomes an opt-OUT ("Hide from directory"). Existing orgs are backfilled to
listed so real, already-published courses become discoverable on /explore.

The column was previously created only via metadata.create_all (never in a
migration), so on some databases it may not exist yet — add it defensively.

Revision ID: 016
Revises: 015
Create Date: 2026-07-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = '016'
down_revision = '015'
branch_labels = None
depends_on = None


def _has_column(table: str, column: str) -> bool:
    bind = op.get_bind()
    cols = [c['name'] for c in inspect(bind).get_columns(table)]
    return column in cols


def upgrade():
    if not _has_column('organizations', 'is_listed'):
        # Column never existed on this DB — create it already defaulting to listed.
        with op.batch_alter_table('organizations') as batch_op:
            batch_op.add_column(
                sa.Column('is_listed', sa.Boolean(),
                          nullable=False, server_default=sa.true())
            )
    else:
        # Column exists (created via create_all with default False). Backfill every
        # existing org to listed so the directory reflects real published content,
        # and make TRUE the default for new rows going forward.
        op.execute("UPDATE organizations SET is_listed = 1 WHERE is_listed = 0")
        with op.batch_alter_table('organizations') as batch_op:
            batch_op.alter_column('is_listed', server_default=sa.true())


def downgrade():
    with op.batch_alter_table('organizations') as batch_op:
        batch_op.alter_column('is_listed', server_default=sa.false())
