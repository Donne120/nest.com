import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import api from '../../api/client';
import type { Lesson, LessonCheckpointAnswerWithStudent } from '../../types';
import { extractCheckpoints } from '../../utils/checkpoints';

interface Props {
  lesson: Lesson;
}

/** Tutor-facing view: how students answered each "[!checkpoint]" prompt in a
 * lesson. Groups answers by checkpoint_key and re-derives the prompt wording
 * from the lesson's own content (never stored separately — see models.py's
 * LessonCheckpointAnswer docstring), so a later reword can't orphan old data. */
export default function LessonCheckpointReview({ lesson }: Props) {
  const { data: answers = [], isLoading } = useQuery<LessonCheckpointAnswerWithStudent[]>({
    queryKey: ['checkpoint-answers', lesson.id, 'all'],
    queryFn: () =>
      api.get(`/lessons/${lesson.id}/checkpoint-answers`).then((r) => r.data),
  });

  const checkpoints = extractCheckpoints(lesson.content ?? []);

  if (isLoading) {
    return <p className="text-xs text-[var(--c-ink3)] py-3">Loading answers…</p>;
  }

  if (checkpoints.length === 0) {
    return (
      <p className="text-xs text-[var(--c-ink3)] py-3">
        No checkpoint prompts in this lesson yet — add one with{' '}
        <code className="text-[11px]">&gt; [!checkpoint] Your prompt</code> in a note block.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {checkpoints.map((cp) => {
        const cpAnswers = answers.filter((a) => a.checkpoint_key === cp.checkpointKey);
        return (
          <div key={cp.checkpointKey} className="border border-[var(--c-rule)] rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-[var(--c-bg2)] border-b border-[var(--c-rule)]">
              <p className="text-sm font-semibold text-[var(--c-ink)]">
                {cp.title || 'Checkpoint prompt'}
              </p>
              {cp.body && <p className="text-xs text-[var(--c-ink3)] mt-0.5">{cp.body}</p>}
              <p className="text-[11px] text-[var(--c-ink3)] mt-1">
                {cpAnswers.length} answer{cpAnswers.length !== 1 ? 's' : ''}
              </p>
            </div>
            {cpAnswers.length === 0 ? (
              <p className="text-xs text-[var(--c-ink3)] px-4 py-3">No answers yet.</p>
            ) : (
              cpAnswers.map((a) => (
                <div key={a.id} className="border-b border-[var(--c-rule)]/60 last:border-0 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--c-ink)]">{a.student.full_name}</p>
                    <p className="text-[11px] text-[var(--c-ink3)] flex-shrink-0">
                      {format(parseISO(a.created_at), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                  <p className="text-sm text-[var(--c-ink2)] mt-1 whitespace-pre-wrap">{a.answer_text}</p>
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
