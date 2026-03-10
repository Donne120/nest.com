"""Add ON DELETE CASCADE to all content foreign keys

Revision ID: 004
Revises: 003
Create Date: 2026-03-10
"""

from alembic import op

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    # modules → videos (cascade: deleting a module deletes its videos)
    op.drop_constraint('videos_module_id_fkey', 'videos', type_='foreignkey')
    op.create_foreign_key('videos_module_id_fkey', 'videos', 'modules', ['module_id'], ['id'], ondelete='CASCADE')

    # videos → video_transcripts
    op.drop_constraint('video_transcripts_video_id_fkey', 'video_transcripts', type_='foreignkey')
    op.create_foreign_key('video_transcripts_video_id_fkey', 'video_transcripts', 'videos', ['video_id'], ['id'], ondelete='CASCADE')

    # videos → questions
    op.drop_constraint('questions_video_id_fkey', 'questions', type_='foreignkey')
    op.create_foreign_key('questions_video_id_fkey', 'questions', 'videos', ['video_id'], ['id'], ondelete='CASCADE')

    # questions → answers
    op.drop_constraint('answers_question_id_fkey', 'answers', type_='foreignkey')
    op.create_foreign_key('answers_question_id_fkey', 'answers', 'questions', ['question_id'], ['id'], ondelete='CASCADE')

    # modules → user_progress
    op.drop_constraint('user_progress_module_id_fkey', 'user_progress', type_='foreignkey')
    op.create_foreign_key('user_progress_module_id_fkey', 'user_progress', 'modules', ['module_id'], ['id'], ondelete='CASCADE')

    # videos → user_progress (nullable — set null so row is kept)
    op.drop_constraint('user_progress_video_id_fkey', 'user_progress', type_='foreignkey')
    op.create_foreign_key('user_progress_video_id_fkey', 'user_progress', 'videos', ['video_id'], ['id'], ondelete='SET NULL')

    # videos → quiz_questions
    op.drop_constraint('quiz_questions_video_id_fkey', 'quiz_questions', type_='foreignkey')
    op.create_foreign_key('quiz_questions_video_id_fkey', 'quiz_questions', 'videos', ['video_id'], ['id'], ondelete='CASCADE')

    # quiz_questions → quiz_options
    op.drop_constraint('quiz_options_question_id_fkey', 'quiz_options', type_='foreignkey')
    op.create_foreign_key('quiz_options_question_id_fkey', 'quiz_options', 'quiz_questions', ['question_id'], ['id'], ondelete='CASCADE')

    # videos → quiz_submissions
    op.drop_constraint('quiz_submissions_video_id_fkey', 'quiz_submissions', type_='foreignkey')
    op.create_foreign_key('quiz_submissions_video_id_fkey', 'quiz_submissions', 'videos', ['video_id'], ['id'], ondelete='CASCADE')

    # quiz_submissions → quiz_answers
    op.drop_constraint('quiz_answers_submission_id_fkey', 'quiz_answers', type_='foreignkey')
    op.create_foreign_key('quiz_answers_submission_id_fkey', 'quiz_answers', 'quiz_submissions', ['submission_id'], ['id'], ondelete='CASCADE')

    # quiz_questions → quiz_answers
    op.drop_constraint('quiz_answers_question_id_fkey', 'quiz_answers', type_='foreignkey')
    op.create_foreign_key('quiz_answers_question_id_fkey', 'quiz_answers', 'quiz_questions', ['question_id'], ['id'], ondelete='CASCADE')

    # quiz_options → quiz_answers (nullable)
    op.drop_constraint('quiz_answers_selected_option_id_fkey', 'quiz_answers', type_='foreignkey')
    op.create_foreign_key('quiz_answers_selected_option_id_fkey', 'quiz_answers', 'quiz_options', ['selected_option_id'], ['id'], ondelete='SET NULL')

    # videos → video_notes
    op.drop_constraint('video_notes_video_id_fkey', 'video_notes', type_='foreignkey')
    op.create_foreign_key('video_notes_video_id_fkey', 'video_notes', 'videos', ['video_id'], ['id'], ondelete='CASCADE')

    # modules → meeting_bookings (nullable — keep meeting, just clear module ref)
    op.drop_constraint('meeting_bookings_module_id_fkey', 'meeting_bookings', type_='foreignkey')
    op.create_foreign_key('meeting_bookings_module_id_fkey', 'meeting_bookings', 'modules', ['module_id'], ['id'], ondelete='SET NULL')


def downgrade():
    # Restore without cascade (original state)
    for table, col, ref_table, ref_col, constraint in [
        ('videos',            'module_id',          'modules',       'id', 'videos_module_id_fkey'),
        ('video_transcripts', 'video_id',            'videos',        'id', 'video_transcripts_video_id_fkey'),
        ('questions',         'video_id',            'videos',        'id', 'questions_video_id_fkey'),
        ('answers',           'question_id',         'questions',     'id', 'answers_question_id_fkey'),
        ('user_progress',     'module_id',           'modules',       'id', 'user_progress_module_id_fkey'),
        ('user_progress',     'video_id',            'videos',        'id', 'user_progress_video_id_fkey'),
        ('quiz_questions',    'video_id',            'videos',        'id', 'quiz_questions_video_id_fkey'),
        ('quiz_options',      'question_id',         'quiz_questions','id', 'quiz_options_question_id_fkey'),
        ('quiz_submissions',  'video_id',            'videos',        'id', 'quiz_submissions_video_id_fkey'),
        ('quiz_answers',      'submission_id',       'quiz_submissions','id','quiz_answers_submission_id_fkey'),
        ('quiz_answers',      'question_id',         'quiz_questions','id', 'quiz_answers_question_id_fkey'),
        ('quiz_answers',      'selected_option_id',  'quiz_options',  'id', 'quiz_answers_selected_option_id_fkey'),
        ('video_notes',       'video_id',            'videos',        'id', 'video_notes_video_id_fkey'),
        ('meeting_bookings',  'module_id',           'modules',       'id', 'meeting_bookings_module_id_fkey'),
    ]:
        op.drop_constraint(constraint, table, type_='foreignkey')
        op.create_foreign_key(constraint, table, ref_table, [col], [ref_col])
