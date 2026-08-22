import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';
import {
  Clock, Users, CheckCircle, Send, AlertCircle, ChevronLeft,
  Calendar, User, Hourglass, ArrowRight, FileText, Star,
  MessageSquare, PanelLeftOpen, X, Lightbulb, Maximize2, ChevronDown,
} from 'lucide-react';
import RichText from '../components/UI/RichText';
import SafeHtml from '../components/UI/SafeHtml';

// ─── Collapsible + expandable content viewer ──────────────────────────────────
// In the narrow brief column each section can be COLLAPSED (click the header /
// corner chevron to fold it away) and EXPANDED to full-width in a modal — so
// learners can read wide equations & tables comfortably, then get back to work.
function ExpandableRich({
  title,
  icon,
  content,
  accent,
  defaultCollapsed = false,
}: {
  title: string;
  icon: React.ReactNode;
  content: string;
  accent?: boolean;
  defaultCollapsed?: boolean;
}) {
  const [open, setOpen] = useState(false);          // full-width modal
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const isHtml = !isRichMarkdown(content);
  const body = isHtml
    ? <SafeHtml
        className="prose prose-sm dark:prose-invert max-w-none text-[var(--c-ink)] dark:text-[var(--c-ink2)] leading-relaxed"
        html={content}
      />
    : <RichText className="text-[13px]">{content}</RichText>;

  return (
    <>
      <div className="flex items-center justify-between mb-2 gap-2">
        {/* Header is the collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition hover:opacity-80 min-w-0"
          style={accent ? { color: 'var(--c-acc)' } : { color: 'var(--c-ink3)' }}
          aria-expanded={!collapsed}
          title={collapsed ? 'Click to expand' : 'Click to collapse'}
        >
          <ChevronDown
            size={13}
            className="flex-shrink-0 transition-transform"
            style={{ transform: collapsed ? 'rotate(-90deg)' : 'none' }}
          />
          {icon} <span className="truncate">{title}</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-[11px] font-semibold text-[var(--c-ink3)] hover:text-brand-600 border border-[var(--c-rule)] rounded-md px-1.5 py-0.5 transition flex-shrink-0"
          title="Open full-width"
        >
          <Maximize2 size={11} /> Expand
        </button>
      </div>

      {!collapsed && (
        accent ? (
          <div className="rounded-xl border p-3" style={{ borderColor: 'color-mix(in srgb, var(--c-acc) 26%, transparent)', background: 'color-mix(in srgb, var(--c-acc) 6%, transparent)' }}>
            {body}
          </div>
        ) : body
      )}

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[var(--c-surf)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden border border-[var(--c-rule)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--c-rule)] flex-shrink-0">
              <p className="text-sm font-semibold inline-flex items-center gap-2"
                 style={accent ? { color: 'var(--c-acc)' } : { color: 'var(--c-ink)' }}>
                {icon} {title}
              </p>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--c-bg2)] transition"
                aria-label="Close"
              >
                <X size={18} className="text-[var(--c-ink3)]" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 sm:px-8 py-5">
              {isHtml
                ? <SafeHtml
                    className="prose dark:prose-invert max-w-none text-[var(--c-ink)] dark:text-[var(--c-ink2)] leading-relaxed"
                    html={content}
                  />
                : <RichText className="text-[15px]">{content}</RichText>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Old assignments stored HTML (from the WYSIWYG editor); new ones store
// markdown/LaTeX. If it has no HTML tags (or has $ math / | tables), render rich.
function isRichMarkdown(s: string): boolean {
  const hasHtml = /<\/?(p|div|h[1-6]|ul|ol|li|strong|em|br|table)\b/i.test(s);
  const hasMd = /\$.+\$|^\s*#{1,3}\s|\n\s*\n/.test(s);
  return !hasHtml || hasMd;
}
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
                  : 'bg-[var(--c-bg2)] text-[var(--c-ink3)] dark:bg-[var(--c-bg2)]'
            }`}>
              <Icon size={11} />
              <span className="hidden sm:block">{s.label}</span>
            </div>
            {i < GROUP_STEPS.length - 1 && (
              <ArrowRight size={12} className="text-[var(--c-ink3)] dark:text-[var(--c-ink3)] flex-shrink-0" />
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
          <h2 className="text-xl font-bold text-[var(--c-ink)]">Assignment Submitted!</h2>
          <p className="text-[var(--c-ink2)] max-w-sm">
            Your work has been submitted successfully. Your instructor will review it and may leave feedback.
          </p>
          <div className="mt-2 text-sm text-[var(--c-ink3)]">
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
        <h2 className="text-xl font-bold text-[var(--c-ink)]">
          {mergeComplete ? 'All portions merged!' : 'Your portion is submitted!'}
        </h2>
        <p className="text-[var(--c-ink2)] mt-2 max-w-sm">
          {mergeComplete
            ? 'The group\'s work has been combined into one document. Review it together and submit to your instructor.'
            : `Waiting for teammates to finish. ${submittedCount} of ${totalCount} submitted so far.`}
        </p>
      </div>

      {/* Team progress */}
      <div className="w-full max-w-xs space-y-2">
        {group?.members.map(m => (
          <div key={m.id} className="flex items-center justify-between bg-[var(--c-bg2)] dark:bg-[var(--c-bg2)] rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <User size={13} className="text-[var(--c-ink3)]" />
              <span className="text-[var(--c-ink)] dark:text-[var(--c-ink2)] truncate max-w-[120px]">
                {m.learner.full_name}
              </span>
              {m.portion_label && (
                <span className="text-xs text-[var(--c-ink3)]">({m.portion_label})</span>
              )}
            </div>
            {m.submitted_at
              ? <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
              : <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--c-rule)] flex-shrink-0" />
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
        <div className="w-full max-w-xs border border-[var(--c-rule)] rounded-xl p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-[var(--c-ink3)] uppercase tracking-wider">Meetings</p>
          {group?.kickoff_meeting_id && (
            <div className="flex items-center gap-2 text-xs text-[var(--c-ink2)]">
              <Calendar size={12} className="text-blue-500 flex-shrink-0" />
              Kickoff meeting scheduled
              <CheckCircle size={11} className="text-green-500" />
            </div>
          )}
          {group?.review_meeting_id && (
            <div className="flex items-center gap-2 text-xs text-[var(--c-ink2)]">
              <Calendar size={12} className="text-green-500 flex-shrink-0" />
              Review meeting scheduled
              <CheckCircle size={11} className="text-green-500" />
            </div>
          )}
          {!group?.review_meeting_id && (
            <div className="text-xs text-[var(--c-ink3)]">
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
      <div className="lg:col-span-2 bg-[var(--c-surf)] border border-[var(--c-rule)] rounded-xl overflow-hidden">
        <EditorContent editor={editor} />
      </div>
      {comments.length > 0 && (
        <div className="bg-[var(--c-surf)] border border-[var(--c-rule)] rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--c-rule)] text-xs font-semibold text-[var(--c-ink2)] uppercase tracking-wider">
            {comments.length} Comment{comments.length !== 1 ? 's' : ''}
          </div>
          <div className="p-3 space-y-2">
            {comments.map(c => (
              <div
                key={c.id}
                className="rounded-lg p-2.5 text-sm"
                style={{ backgroundColor: c.color + '33', borderLeft: `3px solid ${c.color}` }}
              >
                <p className="text-xs text-[var(--c-ink2)] italic mb-1 truncate">"{c.quote}"</p>
                <p className="text-[var(--c-ink)] dark:text-[var(--c-ink)]">{c.comment}</p>
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
          <p className="text-xs font-semibold text-[var(--c-ink2)] uppercase tracking-wider mb-2">
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
  const [briefOpen, setBriefOpen] = useState(false);

  // ── Resizable brief panel (desktop) — drag the divider to widen for wide
  //    equations/tables, or shrink to give the editor more room. Persisted. ──
  const BRIEF_MIN = 240;
  const BRIEF_MAX = 720;
  const [briefWidth, setBriefWidth] = useState<number>(() => {
    const saved = Number(localStorage.getItem('nest.briefWidth'));
    return saved >= BRIEF_MIN && saved <= BRIEF_MAX ? saved : 288;
  });
  const dragging = useRef(false);
  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      // The brief panel starts at the left edge of the window, so the pointer's
      // X position is the panel's new width.
      const w = Math.min(BRIEF_MAX, Math.max(BRIEF_MIN, ev.clientX));
      setBriefWidth(w);
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setBriefWidth(w => { localStorage.setItem('nest.briefWidth', String(w)); return w; });
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  if (loadingAssignment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-20 text-[var(--c-ink3)]">
        <AlertCircle size={40} className="mx-auto mb-3 opacity-40" />
        <p>Assignment not found.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-64px)] flex flex-col bg-[var(--c-bg2)] dark:bg-[var(--c-bg)]">

      {/* ─── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-[var(--c-surf)] border-b border-[var(--c-rule)]">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/assignments')}
              className="flex items-center gap-1 text-sm text-[var(--c-ink2)] hover:text-[var(--c-ink)] dark:hover:text-white transition"
            >
              <ChevronLeft size={16} /> <span className="hidden sm:inline">Assignments</span>
            </button>
            {/* Brief toggle — mobile only */}
            <button
              onClick={() => setBriefOpen(o => !o)}
              className="md:hidden flex items-center gap-1 text-xs text-[var(--c-ink2)] hover:text-brand-600 border border-[var(--c-rule)] rounded-lg px-2 py-1 transition"
            >
              <PanelLeftOpen size={13} /> Brief
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {saveMutation.isPending && (
              <span className="text-xs text-[var(--c-ink3)]">Saving…</span>
            )}

            {isSubmitted && !canEdit ? (
              // Deadline passed — locked
              <span className="flex items-center gap-1.5 text-sm text-[var(--c-ink2)] font-medium">
                <CheckCircle size={16} className="text-green-500" /> Submitted · Deadline passed
              </span>
            ) : (
              <>
                <button
                  onClick={autoSave}
                  disabled={saveMutation.isPending}
                  className="hidden sm:block px-3 py-1.5 text-sm text-[var(--c-ink2)] hover:text-[var(--c-ink)] dark:hover:text-white border border-[var(--c-rule)] rounded-lg transition disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saveMutation.isPending || !editorContent}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                >
                  <Send size={14} />
                  <span className="hidden sm:inline">{isSubmitted
                    ? 'Update Submission'
                    : assignment.type === 'group'
                      ? 'Submit Portion'
                      : 'Submit'}</span>
                  <span className="sm:hidden">{isSubmitted ? 'Update' : 'Submit'}</span>
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

        {/* Mobile overlay backdrop */}
        {briefOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-30"
            onClick={() => setBriefOpen(false)}
          />
        )}

        {/* Left panel — brief */}
        {/* Desktop: always visible, drag-resizable sidebar. Mobile: slide-in overlay toggled by briefOpen */}
        <div
          className={`
            flex-col border-r border-[var(--c-rule)] bg-[var(--c-surf)] overflow-y-auto
            md:flex md:flex-shrink-0 md:relative md:z-auto md:translate-x-0
            ${briefOpen
              ? 'flex fixed left-0 top-0 bottom-0 z-40 shadow-2xl transition-transform'
              : 'hidden'
            }
          `}
          style={
            briefOpen
              ? { width: 'min(320px, 85vw)' }               // mobile overlay
              : { width: briefWidth, minWidth: briefWidth } // desktop resizable
          }
        >
          {/* Mobile close button */}
          <div className="md:hidden flex items-center justify-between px-4 pt-4 pb-2 border-b border-[var(--c-rule)]">
            <span className="text-xs font-semibold text-[var(--c-ink3)] uppercase tracking-wider">Brief</span>
            <button onClick={() => setBriefOpen(false)} className="p-1 rounded-lg hover:bg-[var(--c-bg2)] dark:hover:bg-[var(--c-bg2)] transition">
              <X size={16} className="text-[var(--c-ink3)]" />
            </button>
          </div>
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
              <h1 className="text-base font-bold text-[var(--c-ink)] leading-snug">
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

            {/* Instructions — rendered rich (math, tables, headings) */}
            {assignment.description && (
              <div className="border-t border-[var(--c-rule)] pt-3">
                <ExpandableRich
                  title="Instructions"
                  icon={<FileText size={12} />}
                  content={assignment.description}
                />
              </div>
            )}

            {/* Worked example — a solved problem to learn from, beside your work */}
            {assignment.worked_example && (
              <div className="border-t border-[var(--c-rule)] pt-3">
                <ExpandableRich
                  title="Worked example"
                  icon={<Lightbulb size={12} />}
                  content={assignment.worked_example}
                  accent
                />
                <p className="text-[11px] text-[var(--c-ink3)] mt-2 italic">Study this, then solve your own in the answer area.</p>
              </div>
            )}

            {/* Team status (group only) */}
            {assignment.type === 'group' && group && (
              <div className="border-t border-[var(--c-rule)] pt-3">
                <p className="text-xs font-semibold text-[var(--c-ink3)] uppercase tracking-wider mb-2">Team Progress</p>
                <div className="space-y-2">
                  {group.members.map(m => (
                    <div key={m.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs">
                        <User size={11} className="text-[var(--c-ink3)] flex-shrink-0" />
                        <span className={`truncate max-w-[110px] ${m.learner_id === user?.id ? 'font-semibold text-[var(--c-ink)]' : 'text-[var(--c-ink2)] dark:text-[var(--c-ink3)]'}`}>
                          {m.learner_id === user?.id ? 'You' : m.learner.full_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {m.submitted_at
                          ? <CheckCircle size={12} className="text-green-500" />
                          : <div className="w-3 h-3 rounded-full border-2 border-[var(--c-rule)]" />
                        }
                        <span className="text-xs text-[var(--c-ink3)] truncate max-w-[60px]">{m.portion_label}</span>
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
              <div className="border-t border-[var(--c-rule)] pt-3 space-y-1.5">
                <p className="text-xs font-semibold text-[var(--c-ink3)] uppercase tracking-wider mb-2">Meetings</p>
                <div className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 ${
                  group.kickoff_meeting_id
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-[var(--c-bg2)] text-[var(--c-ink3)] dark:bg-[var(--c-bg2)]'
                }`}>
                  <Calendar size={11} />
                  <span>Kickoff Meeting</span>
                  {group.kickoff_meeting_id && <CheckCircle size={11} className="ml-auto" />}
                </div>
                <div className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 ${
                  group.review_meeting_id
                    ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                    : 'bg-[var(--c-bg2)] text-[var(--c-ink3)] dark:bg-[var(--c-bg2)]'
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

        {/* Drag handle — desktop only. Drag left/right to resize the brief. */}
        <div
          onMouseDown={startDrag}
          onDoubleClick={() => { setBriefWidth(288); localStorage.setItem('nest.briefWidth', '288'); }}
          className="hidden md:flex flex-shrink-0 w-1.5 cursor-col-resize group relative items-center justify-center hover:bg-brand-500/10 transition-colors"
          title="Drag to resize · double-click to reset"
          role="separator"
          aria-orientation="vertical"
        >
          <div className="w-0.5 h-8 rounded-full bg-[var(--c-rule)] group-hover:bg-brand-500 transition-colors" />
        </div>

        {/* Right panel — editor (always if editable) or locked submitted panel */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
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
