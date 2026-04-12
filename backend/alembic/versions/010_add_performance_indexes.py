"""Add missing foreign key indexes for performance

Revision ID: 010
Revises: 009
Create Date: 2026-04-12
"""
from alembic import op

revision = '010'
down_revision = '009'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_user_progress_user_id ON user_progress (user_id)")
    op.execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_user_progress_module_id ON user_progress (module_id)")
    op.execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_user_progress_composite ON user_progress (user_id, module_id)")
    op.execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_notification_user_id ON notifications (user_id)")
    op.execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_question_asked_by ON questions (asked_by)")
    op.execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_question_video_id ON questions (video_id)")
    op.execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_answer_question_id ON answers (question_id)")
    op.execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_answer_answered_by ON answers (answered_by)")
    op.execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_video_note_user_id ON video_notes (user_id)")
    op.execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_video_note_video_id ON video_notes (video_id)")
    op.execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_assignment_org_id ON assignments (organization_id)")
    op.execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_assignment_submission_learner ON assignment_submissions (learner_id)")
    op.execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_payment_submission_payer ON payment_submissions (payer_id)")
    op.execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_video_module_id ON videos (module_id)")


def downgrade():
    for idx in [
        "ix_user_progress_user_id", "ix_user_progress_module_id", "ix_user_progress_composite",
        "ix_notification_user_id", "ix_question_asked_by", "ix_question_video_id",
        "ix_answer_question_id", "ix_answer_answered_by", "ix_video_note_user_id",
        "ix_video_note_video_id", "ix_assignment_org_id", "ix_assignment_submission_learner",
        "ix_payment_submission_payer", "ix_video_module_id",
    ]:
        op.execute(f"DROP INDEX IF EXISTS {idx}")
