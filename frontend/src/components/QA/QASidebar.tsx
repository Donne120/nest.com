import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { useUIStore, useAuthStore, usePlayerStore } from '../../store';
import api from '../../api/client';
import type { Question } from '../../types';
import QuestionCard from './QuestionCard';
import { QuestionCardSkeleton } from '../UI/Skeleton';
import Button from '../UI/Button';
import clsx from 'clsx';
import toast from 'react-hot-toast';

type Filter = 'all' | 'answered' | 'pending' | 'mine';

interface Props {
  videoId: string;
  activeQuestionId: string | null;
  onClose?: () => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function QASidebar({ videoId, activeQuestionId, onClose }: Props) {
  const { openQuestionForm } = useUIStore();
  const { user } = useAuthStore();
  const { currentTime } = usePlayerStore();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [search, setSearch] = useState('');

  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ['questions', videoId],
    queryFn: () => api.get(`/questions?video_id=${videoId}&limit=100`).then(r => r.data),
    refetchInterval: 15000,
  });

  const submitReply = useMutation({
    mutationFn: ({ qId, text }: { qId: string; text: string }) =>
      api.post(`/questions/${qId}/answers`, { answer_text: text, is_official: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', videoId] });
      setReplyingTo(null);
      setReplyText('');
      toast.success('Reply posted!');
    },
  });

  const filtered = questions.filter((q) => {
    if (filter === 'answered') return q.status === 'answered';
    if (filter === 'pending') return q.status === 'pending';
    if (filter === 'mine') return q.asked_by_user.id === user?.id;
    return true;
  }).filter((q) =>
    !search || q.question_text.toLowerCase().includes(search.toLowerCase())
  );

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'answered', label: 'Answered' },
    { key: 'mine', label: 'Mine' },
  ];

  const pendingCount = questions.filter(q => q.status === 'pending').length;

  return (
    <aside
      className="flex flex-col h-full w-full md:w-[360px] md:flex-shrink-0"
      style={{ background: '#13141a', borderLeft: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-bold text-base" style={{ fontFamily: "'Lora', Georgia, serif", color: '#e8e4dc', letterSpacing: '-0.01em' }}>
              Timeline Q&amp;A
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5" style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b6b78', letterSpacing: '0.06em' }}>
              {questions.length} QUESTION{questions.length !== 1 ? 'S' : ''}
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold" style={{ background: '#c45c3c', color: '#fff' }}>
                  {pendingCount}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openQuestionForm(currentTime)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded transition-opacity hover:opacity-80"
              style={{ background: '#e8c97e', color: '#0b0c0f', fontFamily: 'inherit' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              Ask
            </button>
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
        </div>

        {/* Timestamp chip */}
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-4"
          style={{
            background: 'rgba(232,201,126,0.08)',
            border: '1px solid rgba(232,201,126,0.2)',
            fontFamily: 'monospace',
            fontSize: 10.5,
            color: '#e8c97e',
            letterSpacing: '0.1em',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#e8c97e', animation: 'pulse 2s infinite' }}
          />
          AT {formatTime(currentTime)}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6b6b78' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="w-full pl-8 pr-3 outline-none transition-colors"
            style={{ minHeight: 44 }}
            style={{
              background: '#0b0c0f',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 4,
              color: '#e8e4dc',
              fontFamily: 'inherit',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(232,201,126,0.35)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X size={13} style={{ color: '#6b6b78' }} />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0.5 p-0.5 rounded-md" style={{ background: '#0b0c0f' }}>
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="flex-1 text-center text-xs font-medium rounded transition-all"
              style={{ minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              style={filter === key
                ? { background: '#1c1e27', color: '#e8e4dc', border: '1px solid rgba(255,255,255,0.07)' }
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
          Array.from({ length: 3 }).map((_, i) => <QuestionCardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2.5">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-lg mb-1"
              style={{ background: '#1c1e27', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              💬
            </div>
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 16, fontWeight: 700, color: '#e8e4dc', letterSpacing: '-0.01em' }}>
              No questions yet
            </p>
            <p style={{ fontSize: 12.5, color: '#6b6b78', textAlign: 'center', lineHeight: 1.5 }}>
              {filter === 'all' ? 'Be the first to ask something\nabout this lesson.' : `No ${filter} questions`}
            </p>
          </div>
        ) : (
          filtered.map((q) => (
            <div key={q.id}>
              <QuestionCard
                question={q}
                isActive={q.id === activeQuestionId}
                onReply={(id) => { setReplyingTo(id); setReplyText(''); }}
              />

              {/* Inline reply box */}
              {replyingTo === q.id && (
                <div
                  className="mt-2 rounded-xl p-3 animate-fade-in"
                  style={{ background: '#1c1e27', border: '1px solid rgba(255,255,255,0.08)' }}
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
                    <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>Cancel</Button>
                    <Button
                      size="sm"
                      loading={submitReply.isPending}
                      disabled={!replyText.trim()}
                      onClick={() => submitReply.mutate({ qId: q.id, text: replyText })}
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer note */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: '#6b6b78', lineHeight: 1.6 }}>
        Questions are pinned to the timestamp where you ask them — great for following along with the content.
      </div>
    </aside>
  );
}
