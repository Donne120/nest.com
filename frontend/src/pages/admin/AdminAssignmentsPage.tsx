import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO, isPast } from 'date-fns';
import { Plus, Users, BookOpen, Clock, FileText, TrendingUp, CheckCircle, Edit3 } from 'lucide-react';
import api from '../../api/client';
import type { Assignment } from '../../types';

function TypeBadge({ type }: { type: Assignment['type'] }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
      type === 'group'
        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
        : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
    }`}>
      {type === 'group' ? <Users size={10} /> : <BookOpen size={10} />}
      {type === 'group' ? 'Group' : 'Individual'}
    </span>
  );
}

const STATUS_CONFIG: Record<Assignment['status'], { label: string; accent: string; badge: string; dot: string }> = {
  active:  { label: 'Active',  accent: 'border-l-green-500',  badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',  dot: 'bg-green-500' },
  draft:   { label: 'Draft',   accent: 'border-l-gray-400',   badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',           dot: 'bg-gray-400' },
  closed:  { label: 'Closed',  accent: 'border-l-red-400',    badge: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',            dot: 'bg-red-400' },
};

function StatusBadge({ status }: { status: Assignment['status'] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function DeadlineChip({ deadline }: { deadline: string }) {
  const overdue = isPast(parseISO(deadline));
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
      overdue
        ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
        : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    }`}>
      <Clock size={10} />
      {overdue ? 'Overdue · ' : ''}{formatDistanceToNow(parseISO(deadline), { addSuffix: true })}
    </span>
  );
}

function AssignmentCard({ a }: { a: Assignment }) {
  const cfg = STATUS_CONFIG[a.status];
  const submissionRate = a.type === 'group' && a.group_count > 0
    ? Math.round((a.submission_count / a.group_count) * 100)
    : null;

  return (
    <div className="border-b border-gray-100 last:border-b-0 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={a.status} />
            <TypeBadge type={a.type} />
          </div>
          <Link
            to={`/admin/assignments/${a.id}`}
            className="text-lg font-semibold text-gray-900 hover:text-brand-600 transition truncate block"
          >
            {a.title}
          </Link>
          {a.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-1">{a.description}</p>
          )}
        </div>

        {/* Right: edit */}
        <Link
          to={`/admin/assignments/${a.id}/edit`}
          className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition"
          title="Edit assignment"
        >
          <Edit3 size={15} />
        </Link>
      </div>

      {/* Metrics row */}
      <div className="mt-3 flex items-center gap-5 text-sm flex-wrap">
        {a.type === 'group' && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Users size={13} className="text-purple-400" />
            <span className="font-mono font-semibold text-gray-700">{a.group_count}</span>
            <span>groups</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-gray-500">
          <FileText size={13} className="text-brand-400" />
          <span className="font-mono font-semibold text-gray-700">{a.submission_count}</span>
          <span>submitted</span>
        </div>
        {a.deadline && <DeadlineChip deadline={a.deadline} />}
      </div>

      {/* Progress bar (group only) */}
      {submissionRate !== null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Submission progress</span>
            <span className="font-mono font-semibold text-gray-600">{submissionRate}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
              style={{ width: `${submissionRate}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="font-mono text-xs font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{count}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function StatPill({ label, color }: { label: string; color: 'gray' | 'green' | 'amber' | 'blue' }) {
  const cls = {
    gray:   'bg-gray-50 border-gray-200 text-gray-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    amber:  'bg-amber-50 border-amber-200 text-amber-700',
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
  }[color];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium border rounded-full px-3 py-1 ${cls}`}>
      {label}
    </span>
  );
}

export default function AdminAssignmentsPage() {
  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ['admin', 'assignments'],
    queryFn: () => api.get('/assignments').then(r => r.data),
  });

  const active  = assignments.filter(a => a.status === 'active');
  const draft   = assignments.filter(a => a.status === 'draft');
  const closed  = assignments.filter(a => a.status === 'closed');
  const totalSubmissions = assignments.reduce((s, a) => s + a.submission_count, 0);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Hero skeleton */}
        <div className="h-36 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
        {/* Cards skeleton */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-base text-gray-500 mt-2">
            Track submissions, groups, and deadlines across all assignments
          </p>
        </div>

        {/* Stats pills */}
        {!isLoading && assignments.length > 0 && (
          <div className="flex items-center gap-3 mb-8 flex-wrap">
            <StatPill label={`${assignments.length} total`} color="gray" />
            <StatPill label={`${active.length} active`} color="green" />
            <StatPill label={`${draft.length} draft`} color="amber" />
            <StatPill label={`${totalSubmissions} submitted`} color="blue" />
          </div>
        )}

        {/* Create button */}
        <div className="mb-8">
          <Link
            to="/admin/assignments/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
          >
            <Plus size={16} /> New Assignment
          </Link>
        </div>

      {/* ── Empty State ── */}
      {assignments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-gray-200 rounded-2xl">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <BookOpen size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-900 font-semibold text-lg">No assignments yet</p>
          <p className="text-sm text-gray-400 mt-1.5 mb-6">Create your first assignment to start tracking learner submissions.</p>
          <Link
            to="/admin/assignments/new"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
          >
            <Plus size={16} /> Create Assignment
          </Link>
        </div>
      )}

      {/* ── Active ── */}
      {active.length > 0 && (
        <section>
          <SectionHeader label="Active" count={active.length} />
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {active.map(a => <AssignmentCard key={a.id} a={a} />)}
          </div>
        </section>
      )}

      {/* ── Draft ── */}
      {draft.length > 0 && (
        <section>
          <SectionHeader label="Draft" count={draft.length} />
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {draft.map(a => <AssignmentCard key={a.id} a={a} />)}
          </div>
        </section>
      )}

      {/* ── Closed ── */}
      {closed.length > 0 && (
        <section>
          <SectionHeader label="Closed" count={closed.length} />
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {closed.map(a => <AssignmentCard key={a.id} a={a} />)}
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
