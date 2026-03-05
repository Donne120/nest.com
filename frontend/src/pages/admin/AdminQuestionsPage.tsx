import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, MessageSquare, AlertCircle, CheckCircle2, Archive } from 'lucide-react';
import api from '../../api/client';
import type { Question, QuestionStatus } from '../../types';
import Avatar from '../../components/UI/Avatar';
import { QuestionCardSkeleton } from '../../components/UI/Skeleton';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

type StatusFilter = 'all' | QuestionStatus;

const STATUS_CONFIG: Record<QuestionStatus, {
  icon: typeof AlertCircle;
  iconColor: string;
  leftBorder: string;
  rowBg: string;
  rowHover: string;
  badge: string;
  dot: string;
  label: string;
}> = {
  pending: {
    icon: AlertCircle,
    iconColor: 'text-amber-500',
    leftBorder: 'border-l-amber-400',
    rowBg: 'bg-amber-50/25',
    rowHover: 'hover:bg-amber-50/50',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-400',
    label: 'Pending',
  },
  answered: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    leftBorder: 'border-l-emerald-300',
    rowBg: '',
    rowHover: 'hover:bg-gray-50/80',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-400',
    label: 'Answered',
  },
  archived: {
    icon: Archive,
    iconColor: 'text-gray-300',
    leftBorder: 'border-l-gray-200',
    rowBg: 'opacity-60',
    rowHover: 'hover:bg-gray-50',
    badge: 'bg-gray-100 text-gray-500 border border-gray-200',
    dot: 'bg-gray-300',
    label: 'Archived',
  },
};

// Sort: pending → answered → archived, newest first within each group
const STATUS_ORDER: QuestionStatus[] = ['pending', 'answered', 'archived'];

export default function AdminQuestionsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ['all-questions', statusFilter],
    queryFn: () =>
      api.get(`/questions?limit=100${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`).then(r => r.data),
    refetchInterval: 15000,
  });

  const sorted = useMemo(() =>
    [...questions].sort((a, b) => {
      const sd = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      if (sd !== 0) return sd;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }),
    [questions]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(item =>
      item.question_text.toLowerCase().includes(q) ||
      item.asked_by_user.full_name.toLowerCase().includes(q)
    );
  }, [sorted, search]);

  const pendingCount = questions.filter(q => q.status === 'pending').length;
  const answeredCount = questions.filter(q => q.status === 'answered').length;

  const TABS: { key: StatusFilter; label: string; count?: number }[] = [
    { key: 'all',      label: 'All',          count: questions.length },
    { key: 'pending',  label: 'Needs Reply',  count: pendingCount },
    { key: 'answered', label: 'Answered',     count: answeredCount },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl">

        {/* ─── Header ─── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Question Queue</h1>
          <p className="text-sm text-gray-400 mt-1">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
            {pendingCount > 0 && (
              <> · <span className="text-amber-600 font-semibold">
                {pendingCount} need{pendingCount === 1 ? 's' : ''} a reply
              </span></>
            )}
          </p>
        </div>

        {/* ─── Search ─── */}
        <div className="relative mb-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions or employees…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-300 transition"
          />
        </div>

        {/* ─── Tabs ─── */}
        <div className="flex gap-0 border-b border-gray-200 mt-4 mb-5">
          {TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                statusFilter === key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              )}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span className={clsx(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight',
                  key === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-500'
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Content ─── */}
        {isLoading ? (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => <QuestionCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl py-20 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={20} className="text-gray-300" />
            </div>
            <p className="text-[15px] font-semibold text-gray-800">No questions found</p>
            <p className="text-sm text-gray-400 mt-1.5">
              {search ? 'Try a different search term' : 'Questions will appear here once employees ask them'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filtered.map((q) => {
                const cfg = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                const isPending = q.status === 'pending';

                return (
                  <div
                    key={q.id}
                    onClick={() => navigate(`/admin/questions/${q.id}`)}
                    className={clsx(
                      'flex items-start gap-0 cursor-pointer transition-all group border-l-[3px]',
                      cfg.leftBorder,
                      cfg.rowBg,
                      cfg.rowHover,
                    )}
                  >
                    {/* Status icon column */}
                    <div className="flex-shrink-0 px-4 pt-4 pb-3">
                      <Icon size={15} className={cfg.iconColor} />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0 py-3.5 pr-4">
                      {/* Question text */}
                      <p className={clsx(
                        'text-[14px] leading-snug mb-2',
                        isPending
                          ? 'font-semibold text-gray-900'
                          : 'font-medium text-gray-600'
                      )}>
                        {q.question_text}
                      </p>

                      {/* Meta row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            name={q.asked_by_user.full_name}
                            url={q.asked_by_user.avatar_url}
                            size="sm"
                          />
                          <span className="text-[12px] font-medium text-gray-500">
                            {q.asked_by_user.full_name}
                          </span>
                        </div>

                        <span className="text-gray-200 select-none">·</span>

                        <span className="inline-flex items-center text-[11px] font-mono font-semibold text-brand-600 bg-brand-50 border border-brand-100 px-1.5 py-0.5 rounded">
                          @{formatTime(q.timestamp_seconds)}
                        </span>

                        <span className="text-gray-200 select-none">·</span>

                        <span className="text-[12px] text-gray-400">
                          {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                        </span>

                        {q.answers.length > 0 && (
                          <>
                            <span className="text-gray-200 select-none">·</span>
                            <span className="text-[12px] text-emerald-600 font-medium">
                              {q.answers.length} repl{q.answers.length > 1 ? 'ies' : 'y'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex-shrink-0 flex items-center self-center pr-4 pl-2">
                      <span className={clsx(
                        'inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1',
                        cfg.badge
                      )}>
                        <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
