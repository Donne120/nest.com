"""Add assignment engine tables

Revision ID: 005
Revises: 004
Create Date: 2026-03-28
"""

import sqlalchemy as sa
from alembic import op

revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade():
    # ── assignments ────────────────────────────────────────────────────────────
    op.create_table(
        'assignments',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('organization_id', sa.String(), nullable=False),
        sa.Column('module_id', sa.String(), nullable=True),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type', sa.Enum('individual', 'group', name='assignmenttype'), nullable=False),
        sa.Column('max_group_size', sa.Integer(), nullable=True),
        sa.Column('portions', sa.JSON(), nullable=True),
        sa.Column('deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('meeting_1_locked', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('meeting_2_locked', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('status', sa.Enum('draft', 'active', 'closed', name='assignmentstatus'), nullable=False, server_default='draft'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['module_id'], ['modules.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── assignment_groups ──────────────────────────────────────────────────────
    op.create_table(
        'assignment_groups',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('assignment_id', sa.String(), nullable=False),
        sa.Column('kickoff_meeting_id', sa.String(), nullable=True),
        sa.Column('review_meeting_id', sa.String(), nullable=True),
        sa.Column('merged_document', sa.JSON(), nullable=True),
        sa.Column('merge_status', sa.Enum('pending', 'partial', 'complete', name='mergestatus'), nullable=False, server_default='pending'),
        sa.Column('final_submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('instructor_feedback', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['assignment_id'], ['assignments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['kickoff_meeting_id'], ['meeting_bookings.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['review_meeting_id'], ['meeting_bookings.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── group_members ──────────────────────────────────────────────────────────
    op.create_table(
        'group_members',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('group_id', sa.String(), nullable=False),
        sa.Column('learner_id', sa.String(), nullable=False),
        sa.Column('portion_label', sa.String(), nullable=True),
        sa.Column('portion_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['group_id'], ['assignment_groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['learner_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── assignment_submissions ─────────────────────────────────────────────────
    op.create_table(
        'assignment_submissions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('group_member_id', sa.String(), nullable=True),
        sa.Column('assignment_id', sa.String(), nullable=False),
        sa.Column('learner_id', sa.String(), nullable=False),
        sa.Column('content', sa.JSON(), nullable=True),
        sa.Column('word_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.Enum('draft', 'submitted', name='submissionstatus'), nullable=False, server_default='draft'),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['group_member_id'], ['group_members.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assignment_id'], ['assignments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['learner_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── Add columns to meeting_bookings ────────────────────────────────────────
    op.add_column('meeting_bookings', sa.Column('assignment_id', sa.String(), nullable=True))
    op.add_column('meeting_bookings', sa.Column('locked', sa.Boolean(), nullable=False, server_default='0'))
    op.create_foreign_key(
        'meeting_bookings_assignment_id_fkey',
        'meeting_bookings', 'assignments',
        ['assignment_id'], ['id'],
        ondelete='SET NULL',
    )


def downgrade():
    op.drop_constraint('meeting_bookings_assignment_id_fkey', 'meeting_bookings', type_='foreignkey')
    op.drop_column('meeting_bookings', 'locked')
    op.drop_column('meeting_bookings', 'assignment_id')
    op.drop_table('assignment_submissions')
    op.drop_table('group_members')
    op.drop_table('assignment_groups')
    op.drop_table('assignments')
