import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';
import {
  BookOpen, Users, Clock, CheckCircle, AlertCircle,
  ChevronRight, FileEdit, Hourglass, Star, Sparkles,
} from 'lucide-react';
import api from '../api/client';
import type { Assignment } from '../types';

// ─── Per-learner submission status ───────────────────────────────────────────

type LearnerStatus =
  | 'not_started'
  | 'draft'
  | 'submitted'
  | 'waiting_team'
  | 'review_ready'
  | 'done';

function deriveLearnerStatus(a: Assignment): LearnerStatus {
  if (a.type === 'individual') {
    if (a.my_submission_status === 'submitted') return 'submitted';
    if (a.my_submission_status === 'draft') return 'draft';
    return 'not_started';
  }
  if (a.my_group_merge_status === 'final_submitted') return 'done';
  if (a.my_group_merge_status === 'complete') return 'review_ready';
  if (a.my_submission_status === 'submitted') return 'waiting_team';
  if (a.my_submission_status === 'draft') return 'draft';
  return 'not_started';
}

const STATUS_CONFIG: Record<LearnerStatus, {
  label: string;
  textColor: string;
  badgeBg: string;
  accentBorder: string;
  iconBg: string;
  icon: React.ReactNode;
  cta: string;
  hint: string;
}> = {
  not_started: {
    label: 'Not Started',
    textColor: 'text-gray-500 dark:text-gray-400',
    badgeBg: 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300',
    accentBorder: 'border-l-gray-200 dark:border-l-slate-600',
    iconBg: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400',
    icon: <BookOpen size={15} />,
    cta: 'Start',
    hint: 'Open the assignment and begin writing.',
  },
  draft: {
    label: 'In Progress',
    textColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
    accentBorder: 'border-l-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    icon: <FileEdit size={15} />,
    cta: 'Continue',
    hint: 'Draft saved. Keep writing and submit when ready.',
  },
  submitted: {
    label: 'Submitted',
    textColor: 'text-green-600 dark:text-green-400',
    badgeBg: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
    accentBorder: 'border-l-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    icon: <CheckCircle size={15} />,
    cta: 'View',
    hint: 'Your work has been submitted successfully.',
  },
  waiting_team: {
    label: 'Waiting for Team',
    textColor: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
    accentBorder: 'border-l-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    icon: <Hourglass size={15} />,
    cta: 'View Progress',
    hint: 'Your portion is in. Waiting for teammates to finish.',
  },
  review_ready: {
    label: 'Ready to Review',
    textColor: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400',
    accentBorder: 'border-l-purple-400',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    icon: <Star size={15} />,
    cta: 'Review & Submit',
    hint: 'All portions merged! Review together and submit to your instructor.',
  },
  done: {
    label: 'Submitted to Instructor',
    textColor: 'text-green-600 dark:text-green-400',
    badgeBg: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
    accentBorder: 'border-l-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    icon: <CheckCircle size={15} />,
    cta: 'View',
    hint: "Your group's merged document has been submitted.",
  },
};

// ─── Card ─────────────────────────────────────────────────────────────────────

function AssignmentCard({ a }: { a: Assignment }) {
  const status = deriveLearnerStatus(a);
  const cfg = STATUS_CONFIG[status];
  const deadline = a.deadline ? parseISO(a.deadline) : null;
  const overdue = deadline ? isPast(deadline) : false;

  const href =
    status === 'review_ready' || status === 'done'
      ? `/assignments/${a.id}/merged`
      : `/assignments/${a.id}/work`;

  return (
    <Link
      to={href}
      className={`group block bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 border-l-4 ${cfg.accentBorder} rounded-xl shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 overflow-hidden`}
    >
      <div className="flex items-start gap-0 p-5">
        {/* Status icon */}
        <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center mr-4 mt-0.5 ${cfg.iconBg}`}>
          {cfg.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badgeBg}`}>
              {cfg.label}
            </span>
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              a.type === 'group'
                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400'
                : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
            }`}>
              {a.type === 'group' ? <><Users size={10} /> Group</> : <><BookOpen size={10} /> Individual</>}
            </span>
            {a.my_portion_label && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-medium">
                Your part: <strong>{a.my_portion_label}</strong>
              </span>
            )}
          </div>

          <h2 className="font-serif text-base font-semibold text-gray-900 dark:text-white leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {a.title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{cfg.hint}</p>

          {overdue && status !== 'submitted' && status !== 'done' && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
              <AlertCircle size={11} />
              Deadline passed — submit as soon as possible
            </div>
          )}
        </div>

        {/* Right: deadline + CTA */}
        <div className="flex flex-col items-end justify-between gap-2 flex-shrink-0 ml-2 sm:ml-4">
          {deadline && (
            <span className={`flex items-center gap-1 text-xs font-medium ${
              overdue ? 'text-red-500 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {overdue ? <AlertCircle size={11} /> : <Clock size={11} />}
              <span className="hidden sm:inline">{overdue ? 'Overdue' : formatDistanceToNow(deadline, { addSuffix: true })}</span>
              <span className="sm:hidden">{overdue ? 'Overdue' : formatDistanceToNow(deadline, { addSuffix: false })}</span>
            </span>
          )}
          <span className={`flex items-center gap-1 text-xs font-semibold whitespace-nowrap ${cfg.textColor} group-hover:gap-2 transition-all`}>
            {cfg.cta} <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssignmentsPage() {
  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ['assignments', 'my'],
    queryFn: () => api.get('/assignments/my').then(r => r.data),
  });

  const active = assignments.filter(
    a => deriveLearnerStatus(a) !== 'done' && deriveLearnerStatus(a) !== 'submitted',
  );
  const completed = assignments.filter(
    a => deriveLearnerStatus(a) === 'done' || deriveLearnerStatus(a) === 'submitted',
  );

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <div className="h-28 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

      {/* ─── Hero header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-brand-50 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-brand-100 dark:border-slate-700 rounded-2xl px-6 py-7 mb-8 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1 font-mono">
              Workspace
            </p>
            <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              My Assignments
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
              Click any assignment to open your workspace and start writing.
            </p>
          </div>
          <Sparkles size={28} className="text-brand-300 dark:text-brand-700 flex-shrink-0 mt-1" />
        </div>

        {assignments.length > 0 && (
          <div className="flex items-center gap-4 sm:gap-6 mt-5 pt-5 border-t border-brand-100 dark:border-slate-700 overflow-x-auto">
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{assignments.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total</p>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-slate-700" />
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-amber-600">{active.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Active</p>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-slate-700" />
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-green-600">{completed.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Completed</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Empty state ─────────────────────────────────────────────────────── */}
      {assignments.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-5">
            <BookOpen size={36} className="text-gray-300 dark:text-slate-600" />
          </div>
          <h2 className="font-serif text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">
            No assignments yet
          </h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
            Your instructor hasn't published any assignments. Check back soon.
          </p>
        </div>
      )}

      {/* ─── Sections ────────────────────────────────────────────────────────── */}
      <div className="space-y-10">
        {active.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                Action Required
              </h2>
              <span className="text-[11px] font-bold text-white bg-brand-500 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                {active.length}
              </span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800" />
            </div>
            <div className="space-y-3">
              {active.map(a => <AssignmentCard key={a.id} a={a} />)}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                Completed
              </h2>
              <span className="text-[11px] font-bold text-white bg-green-500 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                {completed.length}
              </span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800" />
            </div>
            <div className="space-y-3">
              {completed.map(a => <AssignmentCard key={a.id} a={a} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
