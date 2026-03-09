import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search, MessageSquare, AlertCircle, CheckCircle2,
  Archive, Clock, ChevronRight, Inbox,
} from 'lucide-react';
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
  accent: string;
  rowHover: string;
  badge: string;
  dot: string;
  label: string;
}> = {
  pending: {
    icon: AlertCircle,
    accent: 'border-l-amber-400 bg-amber-50/30',
    rowHover: 'hover:bg-amber-50/60',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-400',
    label: 'Needs reply',
  },
  answered: {
    icon: CheckCircle2,
    accent: 'border-l-emerald-300',
    rowHover: 'hover:bg-slate-50',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Answered',
  },
  archived: {
    icon: Archive,
    accent: 'border-l-gray-200 opacity-60',
    rowHover: 'hover:bg-gray-50',
    badge: 'bg-gray-100 text-gray-500 border border-gray-200',
    dot: 'bg-gray-300',
    label: 'Archived',
  },
};

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

  const pendingCount  = questions.filter(q => q.status === 'pending').length;
  const answeredCount = questions.filter(q => q.status === 'answered').length;

  const TABS: { key: StatusFilter; label: string; count?: number }[] = [
    { key: 'all',      label: 'All',         count: questions.length },
    { key: 'pending',  label: 'Needs Reply', count: pendingCount },
    { key: 'answered', label: 'Answered',    count: answeredCount },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <div className="p-6 lg:p-10">
      <div className="max-w-4xl">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Inbox size={15} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Question Queue</h1>
            </div>
            <p className="text-sm text-gray-500 ml-10">
              {questions.length} question{questions.length !== 1 ? 's' : ''}
              {pendingCount > 0 && (
                <>
                  {' · '}
                  <span className="text-amber-600 font-semibold">
                    {pendingCount} need{pendingCount === 1 ? 's' : ''} a reply
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>

        {/* ── Stat pills ── */}
        {!isLoading && questions.length > 0 && (
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <StatPill
              icon={<AlertCircle size={13} className="text-amber-500" />}
              label={`${pendingCount} pending`}
              color="amber"
            />
            <StatPill
              icon={<CheckCircle2 size={13} className="text-emerald-500" />}
              label={`${answeredCount} answered`}
              color="emerald"
            />
            <StatPill
              icon={<Clock size={13} className="text-indigo-400" />}
              label="Refreshes every 15s"
              color="indigo"
            />
          </div>
        )}

        {/* ── Search ── */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions or employees…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-gray-300 transition"
          />
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 w-fit">
          {TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={clsx(
                'flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap',
                statusFilter === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span className={clsx(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight',
                  key === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : statusFilter === key
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-white text-gray-400'
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-sm">
            {Array.from({ length: 5 }).map((_, i) => <QuestionCardSkeleton key={i} />)}
          </div>

        ) : filtered.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-24 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <MessageSquare size={22} className="text-gray-300" />
            </div>
            <p className="text-gray-900 font-semibold">No questions found</p>
            <p className="text-sm text-gray-400 mt-1.5">
              {search ? 'Try a different search term' : 'Questions will appear here once learners ask them.'}
            </p>
          </div>

        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
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
                      'flex items-center gap-0 cursor-pointer transition-all group border-l-4',
                      cfg.accent,
                      cfg.rowHover,
                    )}
                  >
                    {/* Status icon */}
                    <div className="flex-shrink-0 px-4 py-5">
                      <Icon size={15} className={clsx(
                        isPending ? 'text-amber-500' : q.status === 'answered' ? 'text-emerald-500' : 'text-gray-300'
                      )} />
                    </div>

                    {/* Main */}
                    <div className="flex-1 min-w-0 py-4 pr-3">
                      <p className={clsx(
                        'text-sm leading-snug mb-2.5',
                        isPending ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'
                      )}>
                        {q.question_text}
                      </p>

                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Avatar + name */}
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            name={q.asked_by_user.full_name}
                            url={q.asked_by_user.avatar_url}
                            size="sm"
                          />
                          <span className="text-xs font-medium text-gray-500">
                            {q.asked_by_user.full_name}
                          </span>
                        </div>

                        <Sep />

                        {/* Timestamp */}
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                          @{formatTime(q.timestamp_seconds)}
                        </span>

                        <Sep />

                        {/* Time ago */}
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                        </span>

                        {/* Reply count */}
                        {q.answers.length > 0 && (
                          <>
                            <Sep />
                            <span className="text-xs text-emerald-600 font-semibold">
                              {q.answers.length} {q.answers.length === 1 ? 'reply' : 'replies'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex-shrink-0 flex items-center gap-3 pr-4 pl-2">
                      <span className={clsx(
                        'hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1',
                        cfg.badge
                      )}>
                        <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
                        {cfg.label}
                      </span>
                      <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Showing {filtered.length} of {questions.length} questions
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Auto-refreshing
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Sep() {
  return <span className="w-1 h-1 rounded-full bg-gray-200 flex-shrink-0" />;
}

function StatPill({
  icon, label, color,
}: {
  icon: React.ReactNode;
  label: string;
  color: 'amber' | 'emerald' | 'indigo';
}) {
  const cls = {
    amber:   'bg-amber-50 border-amber-200 text-amber-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    indigo:  'bg-indigo-50 border-indigo-200 text-indigo-600',
  }[color];

  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-medium border rounded-full px-3 py-1', cls)}>
      {icon}
      {label}
    </span>
  );
}
