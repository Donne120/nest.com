import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Pin, Search } from 'lucide-react';
import { useAuthStore } from '../../store';
import api from '../../api/client';
import type { LessonQuestion, LessonBlock } from '../../types';
import Button from '../UI/Button';
import toast from 'react-hot-toast';
import { formatDistanceToNow, parseISO } from 'date-fns';

type Filter = 'all' | 'answered' | 'pending' | 'mine';

interface Props {
  lessonId: string;
  blocks: LessonBlock[];
  activeQuestionId?: string | null;
  onClose?: () => void;
  /** Highlight a block in the viewer when question clicked */
  onScrollToBlock?: (blockId: string) => void;
}

function blockLabel(blocks: LessonBlock[], blockId: string): string {
  const idx = blocks.findIndex((b) => b.id === blockId);
  if (idx === -1) return 'Pinned section';
  const b = blocks[idx];
  if (b.type === 'text') return `Note ${idx + 1}`;
  return `Screenshot ${idx + 1}`;
}

export default function BlockQASidebar({
  lessonId,
  blocks,
  activeQuestionId,
  onClose,
  onScrollToBlock,
}: Props) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: questions = [], isLoading } = useQuery<LessonQuestion[]>({
    queryKey: ['lesson-questions', lessonId],
    queryFn: () =>
      api.get(`/lessons/${lessonId}/questions?limit=100`).then((r) => r.data),
    refetchInterval: 15000,
  });

  const submitReply = useMutation({
    mutationFn: ({ qId, text }: { qId: string; text: string }) =>
      api.post(`/lesson-questions/${qId}/answers`, {
        answer_text: text,
        is_official: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-questions', lessonId] });
      setReplyingTo(null);
      setReplyText('');
      toast.success('Reply posted!');
    },
  });

  const filtered = questions
    .filter((q) => {
      if (filter === 'answered') return q.status === 'answered';
      if (filter === 'pending') return q.status === 'pending';
      if (filter === 'mine') return q.asked_by_user.id === user?.id;
      return true;
    })
    .filter(
      (q) =>
        !search ||
        q.question_text.toLowerCase().includes(search.toLowerCase()),
    );

  const pendingCount = questions.filter((q) => q.status === 'pending').length;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'answered', label: 'Answered' },
    { key: 'mine', label: 'Mine' },
  ];

  return (
    <aside
      className="flex flex-col h-full w-full md:w-[360px] md:flex-shrink-0"
      style={{ background: '#13141a', borderLeft: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div
        className="px-5 pt-5 pb-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2
              className="font-bold text-base"
              style={{
                fontFamily: "'Lora', Georgia, serif",
                color: '#e8e4dc',
                letterSpacing: '-0.01em',
              }}
            >
              Lesson Q&amp;A
            </h2>
            <p
              className="mt-0.5 flex items-center gap-1.5"
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#6b6b78',
                letterSpacing: '0.06em',
              }}
            >
              {questions.length} QUESTION{questions.length !== 1 ? 'S' : ''}
              {pendingCount > 0 && (
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
                  style={{ background: '#c45c3c', color: '#fff' }}
                >
                  {pendingCount}
                </span>
              )}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors md:hidden"
              style={{ color: '#6b6b78' }}
              aria-label="Close Q&A"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Pin hint chip */}
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-4"
          style={{
            background: 'rgba(232,201,126,0.08)',
            border: '1px solid rgba(232,201,126,0.2)',
            fontFamily: 'monospace',
            fontSize: 10.5,
            color: '#e8c97e',
            letterSpacing: '0.08em',
          }}
        >
          <Pin size={10} />
          Hover any block to pin &amp; ask
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: '#6b6b78' }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="w-full pl-8 pr-3 py-2 text-sm outline-none transition-colors"
            style={{
              background: '#0b0c0f',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 4,
              color: '#e8e4dc',
              fontFamily: 'inherit',
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = 'rgba(232,201,126,0.35)')
            }
            onBlur={(e) =>
              (e.target.style.borderColor = 'rgba(255,255,255,0.07)')
            }
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X size={13} style={{ color: '#6b6b78' }} />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div
          className="flex gap-0.5 p-0.5 rounded-md"
          style={{ background: '#0b0c0f' }}
        >
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="flex-1 text-center text-xs font-medium py-1.5 rounded transition-all"
              style={
                filter === key
                  ? {
                      background: '#1c1e27',
                      color: '#e8e4dc',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }
                  : { color: '#6b6b78', border: '1px solid transparent' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Question list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div style={{ color: '#6b6b78', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2.5">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-lg mb-1"
              style={{
                background: '#1c1e27',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              📌
            </div>
            <p
              style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: 16,
                fontWeight: 700,
                color: '#e8e4dc',
                letterSpacing: '-0.01em',
              }}
            >
              No questions yet
            </p>
            <p
              style={{
                fontSize: 12.5,
                color: '#6b6b78',
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              {filter === 'all'
                ? 'Hover any block in the lesson\nand click "Ask about this".'
                : `No ${filter} questions`}
            </p>
          </div>
        ) : (
          filtered.map((q) => {
            const isActive = q.id === activeQuestionId;
            return (
              <div key={q.id}>
                {/* Question card */}
                <div
                  onClick={() => onScrollToBlock?.(q.block_id)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 8,
                    border: isActive
                      ? '1px solid rgba(232,201,126,0.35)'
                      : '1px solid rgba(255,255,255,0.07)',
                    background: isActive
                      ? 'rgba(232,201,126,0.04)'
                      : '#1c1e27',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {/* Block anchor pill */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 100,
                      background: 'rgba(232,201,126,0.1)',
                      border: '1px solid rgba(232,201,126,0.2)',
                      fontFamily: 'monospace',
                      fontSize: 9.5,
                      color: '#e8c97e',
                      letterSpacing: '0.08em',
                      marginBottom: 8,
                    }}
                  >
                    <Pin size={8} />
                    {blockLabel(blocks, q.block_id)}
                  </div>

                  <p
                    style={{
                      fontSize: 13.5,
                      color: '#e8e4dc',
                      lineHeight: 1.5,
                      marginBottom: 8,
                    }}
                  >
                    {q.question_text}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      color: '#6b6b78',
                    }}
                  >
                    <span>{q.asked_by_user.full_name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {q.answers.length > 0 && (
                        <span style={{ color: '#4ade80' }}>
                          {q.answers.length} answer{q.answers.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span
                        style={{
                          padding: '2px 7px',
                          borderRadius: 100,
                          fontSize: 10,
                          fontWeight: 600,
                          background:
                            q.status === 'answered'
                              ? 'rgba(74,222,128,0.1)'
                              : 'rgba(196,92,60,0.12)',
                          color:
                            q.status === 'answered' ? '#4ade80' : '#c45c3c',
                        }}
                      >
                        {q.status}
                      </span>
                    </div>
                  </div>

                  {/* Answers */}
                  {q.answers.length > 0 && (
                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 10,
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      {q.answers.map((a) => (
                        <div key={a.id}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 3,
                              fontSize: 11,
                              color: '#6b6b78',
                            }}
                          >
                            <span style={{ fontWeight: 600, color: a.is_official ? '#e8c97e' : '#9ca3af' }}>
                              {a.answered_by_user.full_name}
                            </span>
                            {a.is_official && (
                              <span
                                style={{
                                  fontSize: 9,
                                  padding: '1px 5px',
                                  borderRadius: 100,
                                  background: 'rgba(232,201,126,0.15)',
                                  color: '#e8c97e',
                                  fontWeight: 600,
                                  letterSpacing: '0.06em',
                                }}
                              >
                                OFFICIAL
                              </span>
                            )}
                            <span style={{ marginLeft: 'auto' }}>
                              {formatDistanceToNow(parseISO(a.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: '#d4cfc9', lineHeight: 1.5 }}>
                            {a.answer_text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplyingTo(replyingTo === q.id ? null : q.id);
                      setReplyText('');
                    }}
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      color: '#6b6b78',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontFamily: 'inherit',
                    }}
                  >
                    Reply
                  </button>
                </div>

                {/* Inline reply box */}
                {replyingTo === q.id && (
                  <div
                    className="mt-2 rounded-xl p-3"
                    style={{
                      background: '#1c1e27',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <textarea
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your reply..."
                      rows={2}
                      className="w-full text-sm px-3 py-2 resize-none outline-none rounded-lg"
                      style={{
                        background: '#0b0c0f',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: '#e8e4dc',
                        fontFamily: 'inherit',
                      }}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setReplyingTo(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        loading={submitReply.isPending}
                        disabled={!replyText.trim()}
                        onClick={() =>
                          submitReply.mutate({ qId: q.id, text: replyText })
                        }
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-4"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: 12,
          color: '#6b6b78',
          lineHeight: 1.6,
        }}
      >
        Questions are pinned to the section where you ask them — just like
        timestamps on video.
      </div>
    </aside>
  );
}
