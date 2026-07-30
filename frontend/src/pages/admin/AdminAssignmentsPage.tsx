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
        ? 'bg-brand-500/15 text-brand-400 dark:bg-brand-900/40 dark:text-brand-300'
        : 'bg-[var(--c-bg2)] text-[var(--c-ink2)] dark:bg-[var(--c-bg2)] dark:text-[var(--c-ink2)]'
    }`}>
      {type === 'group' ? <Users size={10} /> : <BookOpen size={10} />}
      {type === 'group' ? 'Group' : 'Individual'}
    </span>
  );
}

const STATUS_CONFIG: Record<Assignment['status'], { label: string; accent: string; badge: string; dot: string }> = {
  active:  { label: 'Active',  accent: 'border-l-green-500',  badge: 'bg-green-500/15 text-green-400 dark:bg-green-900/40 dark:text-green-300',  dot: 'bg-green-500' },
  draft:   { label: 'Draft',   accent: 'border-l-[var(--c-ink3)]',   badge: 'bg-[var(--c-bg2)] text-[var(--c-ink2)] dark:bg-[var(--c-bg2)] dark:text-[var(--c-ink3)]',           dot: 'bg-[var(--c-ink3)]' },
  closed:  { label: 'Closed',  accent: 'border-l-red-400',    badge: 'bg-red-500/15 text-red-600 dark:bg-red-900/40 dark:text-red-400',            dot: 'bg-red-400' },
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
        ? 'bg-red-500/10 text-red-600 dark:bg-red-900/30 dark:text-red-400'
        : 'bg-amber-500/10 text-amber-400 dark:bg-amber-900/30 dark:text-amber-400'
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
    <div className="border-b border-[var(--c-rule)] last:border-b-0 px-6 py-4 hover:bg-[var(--c-bg2)] transition-colors cursor-pointer">
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={a.status} />
            <TypeBadge type={a.type} />
          </div>
          <Link
            to={`/admin/assignments/${a.id}`}
            className="text-lg font-semibold text-[var(--c-ink)] hover:text-brand-600 transition truncate block"
          >
            {a.title}
          </Link>
          {a.description && (
            <p className="mt-1 text-sm text-[var(--c-ink2)] line-clamp-1">{a.description}</p>
          )}
        </div>

        {/* Right: edit */}
        <Link
          to={`/admin/assignments/${a.id}/edit`}
          className="flex-shrink-0 p-2 rounded-lg text-[var(--c-ink3)] hover:text-brand-600 hover:bg-brand-500/10 transition"
          title="Edit assignment"
        >
          <Edit3 size={15} />
        </Link>
      </div>

      {/* Metrics row */}
      <div className="mt-3 flex items-center gap-5 text-sm flex-wrap">
        {a.type === 'group' && (
          <div className="flex items-center gap-1.5 text-[var(--c-ink2)]">
            <Users size={13} className="text-purple-400" />
            <span className="font-mono font-semibold text-[var(--c-ink2)]">{a.group_count}</span>
            <span>groups</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[var(--c-ink2)]">
          <FileText size={13} className="text-brand-400" />
          <span className="font-mono font-semibold text-[var(--c-ink2)]">{a.submission_count}</span>
          <span>submitted</span>
        </div>
        {a.deadline && <DeadlineChip deadline={a.deadline} />}
      </div>

      {/* Progress bar (group only) */}
      {submissionRate !== null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-[var(--c-ink3)] mb-1">
            <span>Submission progress</span>
            <span className="font-mono font-semibold text-[var(--c-ink2)]">{submissionRate}%</span>
          </div>
          <div className="h-1.5 bg-[var(--c-bg2)] rounded-full overflow-hidden">
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
      <span className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--c-ink3)]">{label}</span>
      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--c-bg2)] text-[var(--c-ink2)]">{count}</span>
      <div className="flex-1 h-px bg-[var(--c-rule)]" />
    </div>
  );
}

function StatPill({ label, color }: { label: string; color: 'gray' | 'green' | 'amber' | 'brand' }) {
  const cls = {
    gray:   'bg-[var(--c-bg2)] border-[var(--c-rule)] text-[var(--c-ink2)]',
    green:  'bg-green-500/10 border-green-500/30 text-green-400',
    amber:  'bg-amber-500/10 border-amber-500/30 text-amber-400',
    brand:  'bg-brand-500/10 border-brand-500/30 text-brand-400',
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
        <div className="h-36 bg-[var(--c-bg2)] dark:bg-[var(--c-bg2)] rounded-2xl" />
        {/* Cards skeleton */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-[var(--c-bg2)] dark:bg-[var(--c-bg2)] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--c-ink)]">Assignments</h1>
          <p className="text-base text-[var(--c-ink2)] mt-2">
            Track submissions, groups, and deadlines across all assignments
          </p>
        </div>

        {/* Stats pills */}
        {!isLoading && assignments.length > 0 && (
          <div className="flex items-center gap-3 mb-8 flex-wrap">
            <StatPill label={`${assignments.length} total`} color="gray" />
            <StatPill label={`${active.length} active`} color="green" />
            <StatPill label={`${draft.length} draft`} color="amber" />
            <StatPill label={`${totalSubmissions} submitted`} color="brand" />
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
        <div className="flex flex-col items-center justify-center py-24 text-center bg-[var(--c-surf)] border border-[var(--c-rule)] rounded-2xl">
          <div className="w-14 h-14 bg-[var(--c-bg2)] rounded-2xl flex items-center justify-center mx-auto mb-5">
            <BookOpen size={24} className="text-[var(--c-ink3)]" />
          </div>
          <p className="text-[var(--c-ink)] font-semibold text-lg">No assignments yet</p>
          <p className="text-sm text-[var(--c-ink3)] mt-1.5 mb-6">Create your first assignment to start tracking learner submissions.</p>
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
          <div className="bg-[var(--c-surf)] border border-[var(--c-rule)] rounded-2xl overflow-hidden shadow-sm">
            {active.map(a => <AssignmentCard key={a.id} a={a} />)}
          </div>
        </section>
      )}

      {/* ── Draft ── */}
      {draft.length > 0 && (
        <section>
          <SectionHeader label="Draft" count={draft.length} />
          <div className="bg-[var(--c-surf)] border border-[var(--c-rule)] rounded-2xl overflow-hidden shadow-sm">
            {draft.map(a => <AssignmentCard key={a.id} a={a} />)}
          </div>
        </section>
      )}

      {/* ── Closed ── */}
      {closed.length > 0 && (
        <section>
          <SectionHeader label="Closed" count={closed.length} />
          <div className="bg-[var(--c-surf)] border border-[var(--c-rule)] rounded-2xl overflow-hidden shadow-sm">
            {closed.map(a => <AssignmentCard key={a.id} a={a} />)}
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
