import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';
import {
  Clock, Users, CheckCircle, Send, AlertCircle, ChevronLeft,
  Calendar, User, Hourglass, ArrowRight, FileText, Star,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TiptapLink from '@tiptap/extension-link';
import api from '../api/client';
import { useAuthStore } from '../store';
import type { Assignment, AssignmentSubmission, AssignmentGroup } from '../types';
import AssignmentEditor from '../components/Editor/AssignmentEditor';
import { CommentMark } from '../components/Editor/CommentMark';
import { sanitizeTiptap } from '../components/Editor/sanitize';

// ─── Step indicator for group assignments ─────────────────────────────────────

const GROUP_STEPS = [
  { id: 'kickoff', label: 'Kickoff Meeting', icon: Calendar },
  { id: 'write', label: 'Write Your Portion', icon: FileText },
  { id: 'submitted', label: 'Portion Submitted', icon: CheckCircle },
  { id: 'merge', label: 'Team Merging', icon: Users },
  { id: 'review', label: 'Review & Submit', icon: Star },
];

function currentStep(
  sub: AssignmentSubmission | undefined,
  group: AssignmentGroup | undefined,
): number {
  if (!group) return 0;
  if (group.merge_status === 'complete') return 4; // review_ready
  if (sub?.status === 'submitted') return 3;       // waiting for team
  if (sub?.status === 'draft') return 1;            // writing
  if (group.kickoff_meeting_id) return 1;           // kickoff done, start writing
  return 0;                                          // waiting for kickoff
}

function StepIndicator({
  sub,
  group,
}: {
  sub: AssignmentSubmission | undefined;
  group: AssignmentGroup | undefined;
}) {
  const step = currentStep(sub, group);
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
      {GROUP_STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition ${
              done
                ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                : active
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 ring-1 ring-brand-400'
                  : 'bg-gray-100 text-gray-400 dark:bg-slate-800'
            }`}>
              <Icon size={11} />
              <span className="hidden sm:block">{s.label}</span>
            </div>
            {i < GROUP_STEPS.length - 1 && (
              <ArrowRight size={12} className="text-gray-300 dark:text-slate-600 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Post-submission panel ────────────────────────────────────────────────────

function SubmittedPanel({
  assignment,
  group,
  sub,
}: {
  assignment: Assignment;
  group: AssignmentGroup | undefined;
  sub: AssignmentSubmission;
}) {
  const { assignmentId } = useParams<{ assignmentId: string }>();

  if (assignment.type === 'individual') {
    return (
      <div className="overflow-y-auto h-full">
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assignment Submitted!</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            Your work has been submitted successfully. Your instructor will review it and may leave feedback.
          </p>
          <div className="mt-2 text-sm text-gray-400">
            Submitted {sub.submitted_at
              ? formatDistanceToNow(parseISO(sub.submitted_at), { addSuffix: true })
              : 'just now'}
          </div>
        </div>
        <FeedbackPanel sub={sub} />
      </div>
    );
  }

  // Group assignment
  const allSubmitted = group?.merge_status === 'complete' || group?.merge_status === 'partial'
    ? group.members.every(m => m.submitted_at)
    : false;

  const mergeComplete = group?.merge_status === 'complete';
  const submittedCount = group?.members.filter(m => m.submitted_at).length ?? 0;
  const totalCount = group?.members.length ?? 0;

  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-8 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
        {mergeComplete
          ? <Star size={30} className="text-purple-500" />
          : <Hourglass size={30} className="text-blue-500" />
        }
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {mergeComplete ? 'All portions merged!' : 'Your portion is submitted!'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
          {mergeComplete
            ? 'The group\'s work has been combined into one document. Review it together and submit to your instructor.'
            : `Waiting for teammates to finish. ${submittedCount} of ${totalCount} submitted so far.`}
        </p>
      </div>

      {/* Team progress */}
      <div className="w-full max-w-xs space-y-2">
        {group?.members.map(m => (
          <div key={m.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <User size={13} className="text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                {m.learner.full_name}
              </span>
              {m.portion_label && (
                <span className="text-xs text-gray-400">({m.portion_label})</span>
              )}
            </div>
            {m.submitted_at
              ? <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
              : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />
            }
          </div>
        ))}
      </div>

      {mergeComplete && (
        <Link
          to={`/assignments/${assignmentId}/merged`}
          className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition"
        >
          <Star size={15} />
          Review Merged Document
          <ArrowRight size={14} />
        </Link>
      )}

      {/* Meeting info */}
      {(group?.kickoff_meeting_id || group?.review_meeting_id) && (
        <div className="w-full max-w-xs border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Meetings</p>
          {group?.kickoff_meeting_id && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <Calendar size={12} className="text-blue-500 flex-shrink-0" />
              Kickoff meeting scheduled
              <CheckCircle size={11} className="text-green-500" />
            </div>
          )}
          {group?.review_meeting_id && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <Calendar size={12} className="text-green-500 flex-shrink-0" />
              Review meeting scheduled
              <CheckCircle size={11} className="text-green-500" />
            </div>
          )}
          {!group?.review_meeting_id && (
            <div className="text-xs text-gray-400">
              Review meeting will be auto-scheduled once all portions are submitted.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Annotated document viewer ────────────────────────────────────────────────

function AnnotatedDocViewer({ content }: { content: any }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TiptapLink.configure({ openOnClick: false }),
      CommentMark,
    ],
    content: sanitizeTiptap(content),
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
        style: 'padding: 16px 20px;',
      },
    },
  });

  // Extract comments for sidebar
  const comments: { id: string; comment: string; color: string; quote: string }[] = [];
  if (editor) {
    editor.state.doc.descendants((node) => {
      node.marks.forEach(mark => {
        if (mark.type.name === 'commentMark' && mark.attrs.commentId) {
          if (!comments.find(c => c.id === mark.attrs.commentId)) {
            comments.push({
              id: mark.attrs.commentId,
              comment: mark.attrs.comment ?? '',
              color: mark.attrs.color ?? '#fef08a',
              quote: (node.text ?? '').slice(0, 60),
            });
          }
        }
      });
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <EditorContent editor={editor} />
      </div>
      {comments.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-700 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {comments.length} Comment{comments.length !== 1 ? 's' : ''}
          </div>
          <div className="p-3 space-y-2">
            {comments.map(c => (
              <div
                key={c.id}
                className="rounded-lg p-2.5 text-sm"
                style={{ backgroundColor: c.color + '33', borderLeft: `3px solid ${c.color}` }}
              >
                <p className="text-xs text-gray-500 italic mb-1 truncate">"{c.quote}"</p>
                <p className="text-gray-800 dark:text-white">{c.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Feedback panel for learners ──────────────────────────────────────────────

function FeedbackPanel({ sub }: { sub: AssignmentSubmission }) {
  const hasReview = sub.grade || sub.instructor_feedback || sub.reviewed_content;
  if (!hasReview) return null;

  return (
    <div className="space-y-4 px-4 pb-4">
      {/* Grade badge */}
      {sub.grade && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl">
          <Star size={20} className="text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">Grade</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{sub.grade}</p>
          </div>
          {sub.reviewed_at && (
            <p className="ml-auto text-xs text-amber-500">
              Reviewed {formatDistanceToNow(parseISO(sub.reviewed_at), { addSuffix: true })}
            </p>
          )}
        </div>
      )}

      {/* Overall feedback */}
      {sub.instructor_feedback && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <MessageSquare size={11} /> Instructor Feedback
          </p>
          <p className="text-sm text-blue-900 dark:text-blue-200 whitespace-pre-wrap leading-relaxed">
            {sub.instructor_feedback}
          </p>
        </div>
      )}

      {/* Annotated document */}
      {sub.reviewed_content && (
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Your Annotated Submission
          </p>
          <AnnotatedDocViewer content={sub.reviewed_content} />
        </div>
      )}
    </div>
  );
}

// ─── Main workspace ───────────────────────────────────────────────────────────

export default function AssignmentWorkspace() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editorContent, setEditorContent] = useState<any>(null);
  const pendingSave = useRef(false);

  // ── Data ────────────────────────────────────────────────────────────────────

  const { data: assignment, isLoading: loadingAssignment } = useQuery<Assignment>({
    queryKey: ['assignment', assignmentId],
    queryFn: () => api.get(`/assignments/${assignmentId}`).then(r => r.data),
    enabled: !!assignmentId,
  });

  const { data: submission } = useQuery<AssignmentSubmission>({
    queryKey: ['submission', assignmentId],
    queryFn: () => api.get(`/assignments/${assignmentId}/my-submission`).then(r => r.data),
    enabled: !!assignmentId,
    retry: false,
  });

  const { data: group } = useQuery<AssignmentGroup>({
    queryKey: ['my-group', assignmentId],
    queryFn: () => api.get(`/assignments/${assignmentId}/my-group`).then(r => r.data),
    enabled: !!assignmentId && assignment?.type === 'group',
    retry: false,
    refetchInterval: 15_000, // poll for team progress updates
  });

  // Load submission content into editor on first load
  useEffect(() => {
    if (submission?.content && !editorContent) {
      setEditorContent(submission.content);
    }
  }, [submission, editorContent]);

  // ── Mutations ────────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (submit: boolean) =>
      api.put(`/assignments/${assignmentId}/my-submission`, {
        content: editorContent,
        word_count: 0,
        submit,
      }).then(r => r.data),
    onSuccess: (data: AssignmentSubmission, submit) => {
      const wasAlreadySubmitted = submission?.status === 'submitted';
      queryClient.setQueryData(['submission', assignmentId], data);
      if (submit) {
        toast.success(wasAlreadySubmitted ? 'Submission updated!' : 'Submitted successfully!');
        queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
        queryClient.invalidateQueries({ queryKey: ['my-group', assignmentId] });
        queryClient.invalidateQueries({ queryKey: ['assignments', 'my'] });
      }
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err.response?.data?.detail ?? 'Save failed');
    },
  });

  const autoSave = useCallback(() => {
    if (pendingSave.current) return;
    // Don't auto-save if submitted and deadline has passed
    const deadlineDate = assignment?.deadline ? parseISO(assignment.deadline) : null;
    if (submission?.status === 'submitted' && deadlineDate && isPast(deadlineDate)) return;
    pendingSave.current = true;
    saveMutation.mutate(false);
    pendingSave.current = false;
  }, [saveMutation, submission?.status, assignment?.deadline]);

  const handleSubmit = () => {
    if (!editorContent) {
      toast.error('Please write something before submitting.');
      return;
    }
    const alreadySubmitted = submission?.status === 'submitted';
    let msg: string;
    if (alreadySubmitted) {
      msg = 'Update your submission? Your previous submission will be replaced.';
    } else if (assignment?.type === 'group') {
      msg = 'Submit your portion? Your teammates will then be able to merge the full document.';
    } else {
      msg = 'Submit your work? You can still edit it before the deadline.';
    }
    if (window.confirm(msg)) {
      saveMutation.mutate(true);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const isSubmitted = submission?.status === 'submitted';
  const deadline = assignment?.deadline ? parseISO(assignment.deadline) : null;
  const isOverdue = deadline ? isPast(deadline) : false;
  // Can still edit if submitted but deadline hasn't passed (or no deadline set)
  const canEdit = !isOverdue;

  // Fix: use auth user ID (not submission learner_id which is null before first save)
  const myMember = group?.members.find(m => m.learner_id === user?.id);

  if (loadingAssignment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-20 text-gray-400">
        <AlertCircle size={40} className="mx-auto mb-3 opacity-40" />
        <p>Assignment not found.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50 dark:bg-slate-950">

      {/* ─── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={() => navigate('/assignments')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white transition"
          >
            <ChevronLeft size={16} /> Assignments
          </button>

          <div className="flex items-center gap-3">
            {saveMutation.isPending && (
              <span className="text-xs text-gray-400">Saving…</span>
            )}

            {isSubmitted && !canEdit ? (
              // Deadline passed — locked
              <span className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                <CheckCircle size={16} className="text-green-500" /> Submitted · Deadline passed
              </span>
            ) : (
              <>
                <button
                  onClick={autoSave}
                  disabled={saveMutation.isPending}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white border border-gray-200 dark:border-slate-700 rounded-lg transition disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saveMutation.isPending || !editorContent}
                  className="flex items-center gap-2 px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                >
                  <Send size={14} />
                  {isSubmitted
                    ? 'Update Submission'
                    : assignment.type === 'group'
                      ? 'Submit Portion'
                      : 'Submit'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Step indicator for group assignments */}
        {assignment.type === 'group' && (
          <div className="px-4 pb-2">
            <StepIndicator sub={submission} group={group} />
          </div>
        )}
      </div>

      {/* ─── Main content ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel — brief */}
        <div className="w-72 flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto">
          <div className="p-4 space-y-4">

            {/* Title & type */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  assignment.type === 'group'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                }`}>
                  {assignment.type === 'group' ? <><Users size={11} /> Group</> : 'Individual'}
                </span>
              </div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                {assignment.title}
              </h1>
            </div>

            {/* Deadline */}
            {deadline && (
              <div className={`flex items-center gap-2 text-xs ${isOverdue ? 'text-red-500' : 'text-amber-600'}`}>
                {isOverdue ? <AlertCircle size={13} /> : <Clock size={13} />}
                <span>
                  {isOverdue ? 'Overdue — ' : 'Due '}
                  {formatDistanceToNow(deadline, { addSuffix: true })}
                </span>
              </div>
            )}

            {/* My portion (group only) */}
            {assignment.type === 'group' && myMember && (
              <div className="bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 rounded-xl px-3 py-2.5">
                <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-0.5">Your Portion</p>
                <p className="text-sm font-bold text-brand-700 dark:text-brand-300">
                  {myMember.portion_label ?? `Part ${myMember.portion_index + 1}`}
                </p>
                <p className="text-xs text-brand-500 mt-0.5">Write only your assigned section.</p>
              </div>
            )}

            {/* Instructions */}
            {assignment.description && (
              <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Instructions</p>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: assignment.description }}
                />
              </div>
            )}

            {/* Team status (group only) */}
            {assignment.type === 'group' && group && (
              <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Team Progress</p>
                <div className="space-y-2">
                  {group.members.map(m => (
                    <div key={m.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs">
                        <User size={11} className="text-gray-400 flex-shrink-0" />
                        <span className={`truncate max-w-[110px] ${m.learner_id === user?.id ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                          {m.learner_id === user?.id ? 'You' : m.learner.full_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {m.submitted_at
                          ? <CheckCircle size={12} className="text-green-500" />
                          : <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                        }
                        <span className="text-xs text-gray-400 truncate max-w-[60px]">{m.portion_label}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Merge ready call to action */}
                {group.merge_status === 'complete' && (
                  <Link
                    to={`/assignments/${assignmentId}/merged`}
                    className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition"
                  >
                    <Star size={12} /> Review Merged Document
                  </Link>
                )}
              </div>
            )}

            {/* Meetings */}
            {assignment.type === 'group' && group && (
              <div className="border-t border-gray-100 dark:border-slate-700 pt-3 space-y-1.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Meetings</p>
                <div className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 ${
                  group.kickoff_meeting_id
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-gray-50 text-gray-400 dark:bg-slate-800'
                }`}>
                  <Calendar size={11} />
                  <span>Kickoff Meeting</span>
                  {group.kickoff_meeting_id && <CheckCircle size={11} className="ml-auto" />}
                </div>
                <div className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 ${
                  group.review_meeting_id
                    ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                    : 'bg-gray-50 text-gray-400 dark:bg-slate-800'
                }`}>
                  <Calendar size={11} />
                  <span>Review Meeting</span>
                  {group.review_meeting_id
                    ? <CheckCircle size={11} className="ml-auto" />
                    : <span className="ml-auto text-[10px]">Auto-scheduled</span>
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — editor (always if editable) or locked submitted panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {isSubmitted && !canEdit ? (
            // Deadline passed — show read-only submitted state
            <SubmittedPanel
              assignment={assignment}
              group={group}
              sub={submission!}
            />
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Submitted-but-editable banner */}
              {isSubmitted && canEdit && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300 flex-shrink-0">
                  <CheckCircle size={14} className="flex-shrink-0" />
                  <span>
                    Previously submitted
                    {submission?.submitted_at
                      ? ` ${formatDistanceToNow(parseISO(submission.submitted_at), { addSuffix: true })}`
                      : ''}.
                    You can still edit and resubmit before the deadline.
                  </span>
                </div>
              )}
              <div className="flex-1 p-4 overflow-hidden">
                <AssignmentEditor
                  value={editorContent}
                  onChange={setEditorContent}
                  onAutoSave={autoSave}
                  readOnly={false}
                  placeholder={
                    assignment.type === 'group' && myMember
                      ? `Write your "${myMember.portion_label}" portion here…`
                      : 'Start writing your response here…'
                  }
                  minHeight={480}
                />
              </div>
              {/* Show feedback below editor when instructor has reviewed */}
              {isSubmitted && submission && (
                <div className="overflow-y-auto flex-shrink-0 max-h-[50vh]">
                  <FeedbackPanel sub={submission} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
