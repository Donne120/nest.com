import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import api from '../../api/client';
import type { LessonCheckpointAnswer } from '../../types';
import RichText from '../UI/RichText';

interface Props {
  lessonId: string;
  blockId: string;
  checkpointKey: string;
  title: string;
  body: string;
  myAnswer?: LessonCheckpointAnswer;
}

/** A tutor-authored "[!checkpoint]" prompt, portaled into the RichText output
 * where its `data-checkpoint-key` placeholder sits (see LessonRichText). Shows
 * a saved answer read-only with an Edit affordance, or an open textarea + submit. */
export default function CheckpointBlock({
  lessonId,
  blockId,
  checkpointKey,
  title,
  body,
  myAnswer,
}: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(!myAnswer);
  const [text, setText] = useState(myAnswer?.answer_text ?? '');

  const submit = useMutation({
    mutationFn: () =>
      api.put(`/lessons/${lessonId}/checkpoint-answers`, {
        block_id: blockId,
        checkpoint_key: checkpointKey,
        answer_text: text.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkpoint-answers', lessonId, 'mine'] });
      setEditing(false);
    },
  });

  return (
    <div className="rt-checkpoint">
      <div className="rt-co-head">
        <span className="rt-co-ico">✍️</span>
        <span className="rt-co-title">{title || 'Your turn'}</span>
      </div>
      {body && (
        <div className="rt-co-body">
          <RichText>{body}</RichText>
        </div>
      )}

      {editing ? (
        <div className="rt-checkpoint-form">
          <textarea
            className="rt-checkpoint-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your answer here..."
            rows={3}
          />
          <div className="rt-checkpoint-actions">
            <button
              type="button"
              className="rt-checkpoint-submit"
              disabled={!text.trim() || submit.isPending}
              onClick={() => submit.mutate()}
            >
              {submit.isPending ? 'Saving…' : 'Submit answer'}
            </button>
            {myAnswer && (
              <button
                type="button"
                className="rt-checkpoint-cancel"
                onClick={() => { setText(myAnswer.answer_text); setEditing(false); }}
              >
                Cancel
              </button>
            )}
          </div>
          {submit.isError && (
            <p className="rt-checkpoint-error">Couldn't save your answer — try again.</p>
          )}
        </div>
      ) : (
        <div className="rt-checkpoint-saved">
          <p className="rt-checkpoint-saved-text">{myAnswer!.answer_text}</p>
          <button
            type="button"
            className="rt-checkpoint-edit"
            onClick={() => setEditing(true)}
          >
            <Pencil size={12} /> Edit answer
          </button>
        </div>
      )}
    </div>
  );
}
