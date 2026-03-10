import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCirclePlus, Search, X } from 'lucide-react';
import { useUIStore, useAuthStore, usePlayerStore } from '../../store';
import api from '../../api/client';
import type { Question, QuestionStatus } from '../../types';
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
    <aside className="flex flex-col h-full bg-white border-l border-gray-200 w-full md:w-[360px] md:flex-shrink-0">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Timeline Notes & Q&A</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {questions.length} question{questions.length !== 1 ? 's' : ''}
              {pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                  {pendingCount}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              icon={<MessageCirclePlus size={14} />}
              onClick={() => openQuestionForm(currentTime)}
            >
              Ask
            </Button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
                aria-label="Close Q&A"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X size={13} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={clsx(
                'flex-1 text-xs font-medium py-1.5 rounded-md transition-colors',
                filter === key
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
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
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageCirclePlus size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">No questions yet</p>
            <p className="text-xs text-gray-400 mt-1">
              {filter === 'all' ? 'Be the first to ask!' : `No ${filter} questions`}
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
                <div className="mt-2 bg-gray-50 rounded-xl border border-gray-200 p-3 animate-fade-in">
                  <textarea
                    autoFocus
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    rows={2}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
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
    </aside>
  );
}
