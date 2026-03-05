"""001 initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-01

Captures the baseline schema before multi-tenancy was introduced.
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False, server_default="employee"),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("department", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # modules
    op.create_table(
        "modules",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("thumbnail_url", sa.String(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("order_index", sa.Integer(), server_default="0"),
        sa.Column("is_published", sa.Boolean(), server_default="1"),
        sa.Column("created_by", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # videos
    op.create_table(
        "videos",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("module_id", sa.String(), sa.ForeignKey("modules.id"), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("video_url", sa.String(), nullable=False),
        sa.Column("thumbnail_url", sa.String(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("order_index", sa.Integer(), server_default="0"),
        sa.Column("captions_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # questions (Q&A)
    op.create_table(
        "questions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("video_id", sa.String(), sa.ForeignKey("videos.id"), nullable=False),
        sa.Column("asked_by", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("timestamp_seconds", sa.Float(), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("is_public", sa.Boolean(), server_default="1"),
        sa.Column("view_count", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # answers
    op.create_table(
        "answers",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("question_id", sa.String(), sa.ForeignKey("questions.id"), nullable=False),
        sa.Column("answered_by", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("answer_text", sa.Text(), nullable=False),
        sa.Column("is_official", sa.Boolean(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # user_progress
    op.create_table(
        "user_progress",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("module_id", sa.String(), sa.ForeignKey("modules.id"), nullable=False),
        sa.Column("video_id", sa.String(), sa.ForeignKey("videos.id"), nullable=True),
        sa.Column("status", sa.String(), server_default="not_started"),
        sa.Column("progress_seconds", sa.Float(), server_default="0"),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_viewed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # quiz_questions
    op.create_table(
        "quiz_questions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("video_id", sa.String(), sa.ForeignKey("videos.id"), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("question_type", sa.String(), nullable=False, server_default="mcq"),
        sa.Column("order_index", sa.Integer(), server_default="0"),
        sa.Column("is_required", sa.Boolean(), server_default="1"),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # quiz_options
    op.create_table(
        "quiz_options",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("question_id", sa.String(), sa.ForeignKey("quiz_questions.id"), nullable=False),
        sa.Column("option_text", sa.String(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), server_default="0"),
        sa.Column("order_index", sa.Integer(), server_default="0"),
    )

    # quiz_submissions
    op.create_table(
        "quiz_submissions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("video_id", sa.String(), sa.ForeignKey("videos.id"), nullable=False),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("max_score", sa.Integer(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # quiz_answers
    op.create_table(
        "quiz_answers",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("submission_id", sa.String(), sa.ForeignKey("quiz_submissions.id"), nullable=False),
        sa.Column("question_id", sa.String(), sa.ForeignKey("quiz_questions.id"), nullable=False),
        sa.Column("selected_option_id", sa.String(), sa.ForeignKey("quiz_options.id"), nullable=True),
        sa.Column("answer_text", sa.Text(), nullable=True),
        sa.Column("is_correct", sa.Boolean(), nullable=True),
    )

    # notifications
    op.create_table(
        "notifications",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("reference_id", sa.String(), nullable=True),
        sa.Column("is_read", sa.Boolean(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("quiz_answers")
    op.drop_table("quiz_submissions")
    op.drop_table("quiz_options")
    op.drop_table("quiz_questions")
    op.drop_table("user_progress")
    op.drop_table("answers")
    op.drop_table("questions")
    op.drop_table("videos")
    op.drop_table("modules")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
