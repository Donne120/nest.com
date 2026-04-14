import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import {
  ChevronLeft, Users, CheckCircle, Clock, Lock, LockOpen,
  FileText, MessageSquare, ChevronDown, ChevronUp, Eye,
  AlertCircle, BookOpen, User, Edit3, Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import type { Assignment, AssignmentGroup, AssignmentSubmission } from '../../types';

// ─── TipTap JSON → plain text renderer ───────────────────────────────────────

function extractText(node: any): string {
  if (!node) return '';
  if (node.type === 'text') return node.text ?? '';
  if (Array.isArray(node.content)) {
    const text = node.content.map(extractText).join('');
    if (['paragraph', 'heading', 'blockquote', 'listItem'].includes(node.type)) {
      return text + '\n';
    }
    return text;
  }
  return '';
}

function SubmissionContent({ content }: { content: any }) {
  if (!content) {
    return <p className="text-sm text-gray-400 italic">No content written yet.</p>;
  }
  const nodes: any[] = content?.content ?? [];
  if (nodes.length === 0) {
    return <p className="text-sm text-gray-400 italic">Empty document.</p>;
  }
  return (
    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-1">
      {nodes.map((node: any, i: number) => {
        const text = extractText(node).trimEnd();
        if (!text) return null;
        if (node.type === 'heading') {
          const level = node.attrs?.level ?? 2;
          const cls = level === 1 ? 'text-base font-bold' : level === 2 ? 'text-sm font-bold' : 'text-sm font-semibold text-gray-600';
          return <p key={i} className={cls}>{text}</p>;
        }
        if (node.type === 'bulletList' || node.type === 'orderedList') {
          const items = (node.content ?? []).map((li: any, j: number) => (
            <li key={j} className="text-sm">{extractText(li).trimEnd()}</li>
          ));
          return node.type === 'bulletList'
            ? <ul key={i} className="list-disc pl-4 space-y-0.5">{items}</ul>
            : <ol key={i} className="list-decimal pl-4 space-y-0.5">{items}</ol>;
        }
        if (node.type === 'blockquote') {
          return (
            <blockquote key={i} className="border-l-4 border-gray-300 pl-3 italic text-sm text-gray-500">
              {text}
            </blockquote>
          );
        }
        return <p key={i} className="text-sm">{text}</p>;
      })}
    </div>
  );
}

// ─── Submission row (individual) ──────────────────────────────────────────────

function SubmissionRow({ s, assignmentId }: { s: AssignmentSubmission; assignmentId: string }) {
  const [open, setOpen] = useState(false);
  const name = s.learner?.full_name ?? s.learner_id;
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const submitted = s.status === 'submitted';

  return (
    <div className="border-b border-gray-200/60 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-left group"
      >
        <div className="flex items-center gap-3">
          {/* Status dot */}
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${submitted ? 'bg-green-400' : 'bg-amber-400'}`} />
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{name}</p>
            {s.learner?.email && (
              <p className="text-xs text-gray-400">{s.learner.email}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
              submitted
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {submitted ? <CheckCircle size={11} /> : <Clock size={11} />}
              {submitted ? 'Submitted' : 'Draft'}
            </span>
            <p className="text-xs text-gray-400 mt-0.5 text-right font-mono">{s.word_count} words</p>
          </div>
          <Link
            to={`/admin/assignments/${assignmentId}/submissions/${s.id}/review`}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition font-semibold shadow-card"
            onClick={e => e.stopPropagation()}
          >
            <MessageSquare size={11} /> Review
          </Link>
          {open
            ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0" />
            : <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5">
          {s.submitted_at && (
            <p className="text-xs text-gray-400 mb-3 font-mono">
              Submitted {format(parseISO(s.submitted_at), 'MMM d, yyyy')} at {format(parseISO(s.submitted_at), 'h:mm a')}
            </p>
          )}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-2000">
            <SubmissionContent content={s.content} />
          </div>
          {s.status === 'draft' && (
            <p className="mt-2.5 text-xs text-amber-600 flex items-center gap-1.5 font-medium">
              <AlertCircle size={11} />
              This is a draft — the learner has not yet submitted.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Group member row ─────────────────────────────────────────────────────────

function MemberSubmissionRow({
  m,
  assignmentId,
}: {
  m: AssignmentGroup['members'][number];
  assignmentId: string;
}) {
  const [open, setOpen] = useState(false);
  const { data: sub, isLoading } = useQuery<AssignmentSubmission>({
    queryKey: ['submission-content', assignmentId, m.learner_id],
    queryFn: () =>
      api.get(`/assignments/${assignmentId}/submissions`, {
        params: { learner_id: m.learner_id },
      }).then(r => {
        const list: AssignmentSubmission[] = r.data;
        const match = list.find(s => s.learner_id === m.learner_id);
        if (!match) throw new Error('not found');
        return match;
      }),
    enabled: open,
    staleTime: 60_000,
  });

  const initials = m.learner.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="border-b border-gray-200/60 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.submitted_at ? 'bg-green-400' : 'bg-gray-300'}`} />
          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{m.learner.full_name}</p>
            <p className="text-xs text-gray-400">
              {m.portion_label ?? `Portion ${m.portion_index + 1}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {m.submitted_at ? (
            <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
              <CheckCircle size={12} /> Submitted
            </span>
          ) : (
            <span className="text-xs text-gray-400 italic">In progress…</span>
          )}
          {open
            ? <ChevronUp size={13} className="text-gray-400" />
            : <Eye size={13} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {isLoading ? (
            <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ) : sub ? (
            <>
              {sub.submitted_at && (
                <p className="text-xs text-gray-400 mb-2 font-mono">
                  Submitted {format(parseISO(sub.submitted_at), 'MMM d, yyyy')} · {sub.word_count} words
                </p>
              )}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-2000">
                <SubmissionContent content={sub.content} />
              </div>
              {sub.status === 'draft' && (
                <p className="mt-2 text-xs text-amber-600 flex items-center gap-1.5">
                  <AlertCircle size={11} /> Draft — not yet submitted.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 italic py-2">No submission yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Group card ───────────────────────────────────────────────────────────────

function GroupCard({
  group,
  groupIndex,
  assignmentId,
  onLockMeeting,
}: {
  group: AssignmentGroup;
  groupIndex: number;
  assignmentId: string;
  onLockMeeting: (n: 1 | 2) => void;
}) {
  const [feedback, setFeedback] = useState(group.instructor_feedback ?? '');
  const queryClient = useQueryClient();

  const feedbackMutation = useMutation({
    mutationFn: () =>
      api.post(`/assignments/${assignmentId}/groups/${group.id}/feedback`, { feedback }),
    onSuccess: () => {
      toast.success('Feedback saved');
      queryClient.invalidateQueries({ queryKey: ['admin', 'assignment-groups', assignmentId] });
    },
  });

  const submitted = group.members.filter(m => m.submitted_at).length;
  const total = group.members.length;
  const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;

  return (
    <div className="bg-white border border-gray-2000 rounded-xl overflow-hidden shadow-card">

      {/* Card header */}
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-2000">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
              T{groupIndex + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800">
                  Team {groupIndex + 1}
                </span>
                {group.merge_status === 'complete' && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    Merged
                  </span>
                )}
                {group.final_submitted_at && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                    Final submitted
                  </span>
                )}
                {group.grade && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-mono">
                    {group.grade}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{submitted}/{total} portions submitted</p>
            </div>
          </div>

          {group.merge_status === 'complete' && (
            <Link
              to={`/assignments/${assignmentId}/merged?group_id=${group.id}`}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition shadow-card"
            >
              <BookOpen size={11} /> View merged
            </Link>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span className="font-mono">{pct}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-400 to-green-400 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Member rows */}
      <div className="divide-y divide-gray-50">
        {group.members.map(m => (
          <MemberSubmissionRow key={m.id} m={m} assignmentId={assignmentId} />
        ))}
      </div>

      {/* Meetings */}
      <div className="px-5 py-3 border-t border-gray-200 bg-gray-50/50">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono mb-2.5">Meetings</p>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${group.kickoff_meeting_id ? 'bg-green-400' : 'bg-gray-300'}`} />
            <Calendar size={12} className="text-gray-400" />
            <span className="text-xs text-gray-600">
              Kickoff: <span className="font-semibold">{group.kickoff_meeting_id ? 'Scheduled' : 'Pending'}</span>
            </span>
            <button
              onClick={() => onLockMeeting(1)}
              className="ml-0.5 text-gray-400 hover:text-brand-600 transition"
              title="Toggle kickoff meeting lock"
            >
              <Lock size={11} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${group.review_meeting_id ? 'bg-green-400' : 'bg-gray-300'}`} />
            <Calendar size={12} className="text-gray-400" />
            <span className="text-xs text-gray-600">
              Review: <span className="font-semibold">{group.review_meeting_id ? 'Scheduled' : 'Pending'}</span>
            </span>
            <button
              onClick={() => onLockMeeting(2)}
              className="ml-0.5 text-gray-400 hover:text-brand-600 transition"
              title="Toggle review meeting lock"
            >
              <LockOpen size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div className="px-5 py-4 border-t border-gray-200">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono mb-2.5 flex items-center gap-1.5">
          <MessageSquare size={11} /> Instructor Feedback
        </p>
        <textarea
          rows={3}
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Leave feedback for this group…"
          className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none transition"
        />
        <button
          onClick={() => feedbackMutation.mutate()}
          disabled={feedbackMutation.isPending || feedback === group.instructor_feedback}
          className="mt-2.5 flex items-center gap-1.5 text-xs px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition disabled:opacity-50 font-semibold shadow-card"
        >
          <CheckCircle size={11} />
          {feedbackMutation.isPending ? 'Saving…' : 'Save Feedback'}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAssignmentDetail() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: assignment, isLoading } = useQuery<Assignment>({
    queryKey: ['assignment', assignmentId],
    queryFn: () => api.get(`/assignments/${assignmentId}`).then(r => r.data),
    enabled: !!assignmentId,
  });

  const { data: groups = [] } = useQuery<AssignmentGroup[]>({
    queryKey: ['admin', 'assignment-groups', assignmentId],
    queryFn: () => api.get(`/assignments/${assignmentId}/groups`).then(r => r.data),
    enabled: !!assignmentId && assignment?.type === 'group',
  });

  const { data: submissions = [] } = useQuery<AssignmentSubmission[]>({
    queryKey: ['admin', 'assignment-submissions', assignmentId],
    queryFn: () => api.get(`/assignments/${assignmentId}/submissions`).then(r => r.data),
    enabled: !!assignmentId && assignment?.type === 'individual',
  });

  const lockMutation = useMutation({
    mutationFn: (n: 1 | 2) =>
      api.put(`/assignments/${assignmentId}/lock-meeting/${n}`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      toast.success('Meeting lock toggled');
    },
  });

  if (isLoading || !assignment) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-36 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const submittedCount = submissions.filter(s => s.status === 'submitted').length;
  const draftCount = submissions.filter(s => s.status === 'draft').length;

  return (
    <div>
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-8 lg:py-12">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/admin/assignments')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition font-medium mb-6"
        >
          <ChevronLeft size={16} />
          <span className="text-gray-400">Assignments</span>
          <span className="text-gray-300 mx-1">/</span>
          <span className="text-gray-700 truncate max-w-[300px]">{assignment.title}</span>
        </button>

        {/* Overview card */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-8">
          {/* Color bar */}
          <div className={`h-1 w-full ${
            assignment.status === 'active' ? 'bg-gradient-to-r from-green-400 to-brand-400' :
            assignment.status === 'closed' ? 'bg-gradient-to-r from-red-400 to-red-500' :
            'bg-gradient-to-r from-gray-300 to-gray-400'
          }`} />

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                  assignment.status === 'active' ? 'bg-green-100 text-green-700' :
                  assignment.status === 'closed' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {assignment.status}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  assignment.type === 'group'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {assignment.type === 'group' ? <><Users size={10} className="inline mr-1" />Group</> : <><User size={10} className="inline mr-1" />Individual</>}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                {assignment.title}
              </h1>
              {assignment.description && (
                <p className="mt-2 text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  {assignment.description}
                </p>
              )}
            </div>

            {/* Stats + Edit button */}
            <div className="flex-shrink-0 text-right space-y-4">
              <Link
                to={`/admin/assignments/${assignmentId}/edit`}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition font-medium"
              >
                <Edit3 size={12} /> Edit
              </Link>
              {assignment.deadline && (
                <div>
                  <p className="font-mono text-lg font-bold text-gray-800">
                    {formatDistanceToNow(parseISO(assignment.deadline), { addSuffix: true })}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                    <Clock size={11} /> Deadline
                  </p>
                </div>
              )}
              {assignment.type === 'individual' ? (
                <div>
                  <p className="font-mono text-lg font-bold text-gray-800">
                    {submittedCount}
                    <span className="text-gray-400 text-sm">/{submissions.length}</span>
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                    <CheckCircle size={11} className="text-green-400" /> Submitted
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-mono text-lg font-bold text-gray-800">
                    {groups.length}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                    <Users size={11} /> Groups
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Stats row for individual */}
          {assignment.type === 'individual' && submissions.length > 0 && (
            <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                <CheckCircle size={12} /> {submittedCount} submitted
              </div>
              {draftCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                  <FileText size={12} /> {draftCount} in draft
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                <User size={12} /> {submissions.length} total
              </div>
            </div>
          )}

          {/* Meeting locks (group only) */}
          {assignment.type === 'group' && (
            <div className="flex items-center gap-5 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => lockMutation.mutate(1)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 transition font-medium"
              >
                {assignment.meeting_1_locked
                  ? <Lock size={14} className="text-amber-500" />
                  : <LockOpen size={14} className="text-gray-400" />}
                Kickoff: {assignment.meeting_1_locked ? 'Locked' : 'Unlocked'}
              </button>
              <button
                onClick={() => lockMutation.mutate(2)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 transition font-medium"
              >
                {assignment.meeting_2_locked
                  ? <Lock size={14} className="text-amber-500" />
                  : <LockOpen size={14} className="text-gray-400" />}
                Review: {assignment.meeting_2_locked ? 'Locked' : 'Unlocked'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Individual submissions ─────────────────────────────────────────────── */}
      {assignment.type === 'individual' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">
              Submissions
            </h2>
            <span className="text-[11px] font-bold text-white bg-gray-400 rounded-full w-5 h-5 flex items-center justify-center">
              {submissions.length}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
            {submissions.length > 0 && (
              <p className="text-xs text-gray-400">Click a row to expand</p>
            )}
          </div>

          {submissions.length === 0 ? (
            <div className="bg-white border border-gray-2000 rounded-xl p-10 text-center shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <FileText size={28} className="text-gray-300" />
              </div>
              <p className="text-base font-semibold text-gray-500">No submissions yet</p>
              <p className="text-xs text-gray-400 mt-1">Submissions will appear here once learners start writing.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-2000 rounded-xl overflow-hidden shadow-card">
              {submissions.map(s => (
                <SubmissionRow key={s.id} s={s} assignmentId={assignmentId!} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Group submissions ──────────────────────────────────────────────────── */}
      {assignment.type === 'group' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">
              Groups
            </h2>
            <span className="text-[11px] font-bold text-white bg-purple-500 rounded-full w-5 h-5 flex items-center justify-center">
              {groups.length}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {groups.length === 0 ? (
            <div className="bg-white border border-gray-2000 rounded-xl p-10 text-center shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Users size={28} className="text-gray-300" />
              </div>
              <p className="text-base font-semibold text-gray-500">No groups yet</p>
              <p className="text-xs text-gray-400 mt-1">Groups appear once the assignment is activated.</p>
            </div>
          ) : (
            groups.map((g, i) => (
              <GroupCard
                key={g.id}
                group={g}
                groupIndex={i}
                assignmentId={assignmentId!}
                onLockMeeting={n => lockMutation.mutate(n)}
              />
            ))
          )}
        </div>
      )}
      </div>
    </div>
  );
}
