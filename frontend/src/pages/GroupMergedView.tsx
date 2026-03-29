import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TiptapLink from '@tiptap/extension-link';
import { format, parseISO } from 'date-fns';
import {
  ChevronLeft, Send, CheckCircle, Users, Star,
  MessageSquare, ArrowLeft, Save, Clock, FileText,
  Highlighter, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuthStore } from '../store';
import type { AssignmentGroup, Assignment } from '../types';
import AssignmentEditor from '../components/Editor/AssignmentEditor';
import { CommentMark } from '../components/Editor/CommentMark';
import { sanitizeTiptap } from '../components/Editor/sanitize';

// ─── Annotation colour palette ────────────────────────────────────────────────

const COMMENT_COLORS = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green',  value: '#bbf7d0' },
  { label: 'Blue',   value: '#bfdbfe' },
  { label: 'Pink',   value: '#fbcfe8' },
  { label: 'Orange', value: '#fed7aa' },
];

// ─── Annotations sidebar ──────────────────────────────────────────────────────

function AnnotationSidebar({
  comments,
  onDelete,
}: {
  comments: { id: string; comment: string; color: string; quote: string }[];
  onDelete: (id: string) => void;
}) {
  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-8 px-4 h-full">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-2">
          <MessageSquare size={17} className="text-gray-300 dark:text-slate-600" />
        </div>
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">No annotations yet</p>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          Select text, pick a colour, click Annotate.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2 p-3">
      {comments.map(c => (
        <div
          key={c.id}
          className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 group shadow-card"
          style={{ borderLeftColor: c.color, borderLeftWidth: 4 }}
        >
          <div className="px-3 py-1.5 text-xs text-gray-500 italic bg-gray-50 dark:bg-slate-800/80 truncate">
            "{c.quote}"
          </div>
          <div className="px-3 py-2 flex items-start justify-between gap-2 bg-white dark:bg-slate-900">
            <p className="text-sm text-gray-800 dark:text-white flex-1 leading-relaxed">{c.comment}</p>
            <button
              onClick={() => onDelete(c.id)}
              className="text-gray-300 hover:text-red-400 transition flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupMergedView() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group_id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isInstructor = user?.role === 'educator' || user?.role === 'owner';

  // Learner editor state
  const [docContent, setDocContent] = useState<any>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);

  // Instructor review state
  const [grade, setGrade] = useState('');
  const [overallFeedback, setOverallFeedback] = useState('');
  const [activeColor, setActiveColor] = useState('#fef08a');
  const [pendingComment, setPendingComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [annotations, setAnnotations] = useState<{ id: string; comment: string; color: string; quote: string }[]>([]);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: assignment } = useQuery<Assignment>({
    queryKey: ['assignment', assignmentId],
    queryFn: () => api.get(`/assignments/${assignmentId}`).then(r => r.data),
    enabled: !!assignmentId,
  });

  const { data: group, isLoading, error } = useQuery<AssignmentGroup>({
    queryKey: ['merged', assignmentId, groupId],
    queryFn: () =>
      api.get(`/assignments/${assignmentId}/merged`, {
        params: groupId ? { group_id: groupId } : undefined,
      }).then(r => r.data),
    enabled: !!assignmentId,
    retry: false,
    select: (data) => {
      if (!docContent && data.merged_document) {
        setDocContent(data.merged_document);
      }
      return data;
    },
  });

  // ── Instructor TipTap editor (annotation mode) ────────────────────────────────

  const reviewEditor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TiptapLink.configure({ openOnClick: false }),
      CommentMark,
    ],
    editable: true,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
        style: 'min-height: 640px; padding: 28px 36px;',
      },
    },
  });

  // Load merged doc into instructor editor once group data arrives
  useEffect(() => {
    if (!isInstructor || !reviewEditor || !group) return;
    // Prefer previously reviewed content over raw merged doc
    const doc = group.reviewed_merged_content ?? group.merged_document;
    if (doc) {
      reviewEditor.commands.setContent(sanitizeTiptap(doc), false);
    }
    setGrade(group.grade ?? '');
    setOverallFeedback(group.instructor_feedback ?? '');
    extractAnnotations(reviewEditor);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, reviewEditor, isInstructor]);

  const extractAnnotations = useCallback((ed: typeof reviewEditor) => {
    if (!ed) return;
    const found: typeof annotations = [];
    ed.state.doc.descendants((node) => {
      node.marks.forEach(mark => {
        if (mark.type.name === 'commentMark' && mark.attrs.commentId) {
          if (!found.find(c => c.id === mark.attrs.commentId)) {
            found.push({
              id: mark.attrs.commentId,
              comment: mark.attrs.comment ?? '',
              color: mark.attrs.color ?? '#fef08a',
              quote: node.text ?? '',
            });
          }
        }
      });
    });
    setAnnotations(found);
  }, []);

  const handleAddAnnotation = useCallback(() => {
    if (!reviewEditor) return;
    if (reviewEditor.state.selection.empty) {
      toast.error('Select some text first');
      return;
    }
    setShowCommentInput(true);
    setTimeout(() => commentInputRef.current?.focus(), 50);
  }, [reviewEditor]);

  const confirmAnnotation = useCallback(() => {
    if (!reviewEditor || !pendingComment.trim()) return;
    const { from, to } = reviewEditor.state.selection;
    const quote = reviewEditor.state.doc.textBetween(from, to, ' ');
    const id = crypto.randomUUID();
    reviewEditor.chain().focus().setComment(pendingComment.trim(), activeColor, id).run();
    setAnnotations(prev => [...prev, {
      id,
      comment: pendingComment.trim(),
      color: activeColor,
      quote: quote.slice(0, 80) + (quote.length > 80 ? '…' : ''),
    }]);
    setPendingComment('');
    setShowCommentInput(false);
  }, [reviewEditor, pendingComment, activeColor]);

  const deleteAnnotation = useCallback((id: string) => {
    if (!reviewEditor) return;
    reviewEditor.state.doc.descendants((node, pos) => {
      node.marks.forEach(mark => {
        if (mark.type.name === 'commentMark' && mark.attrs.commentId === id) {
          const tr = reviewEditor.state.tr.removeMark(pos, pos + node.nodeSize, mark.type);
          reviewEditor.view.dispatch(tr);
        }
      });
    });
    setAnnotations(prev => prev.filter(c => c.id !== id));
  }, [reviewEditor]);

  // ── Mutations ────────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (content: any) =>
      api.put(`/assignments/${assignmentId}/my-group/merged-document`, {
        content,
        word_count: 0,
      }).then(r => r.data),
    onSuccess: (data: AssignmentGroup) => {
      queryClient.setQueryData(['merged', assignmentId, groupId], data);
      setLastSaved(new Date());
      setDirty(false);
    },
    onError: () => toast.error('Failed to save'),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post(`/assignments/${assignmentId}/my-group/submit`).then(r => r.data),
    onSuccess: (data: AssignmentGroup) => {
      queryClient.setQueryData(['merged', assignmentId, groupId], data);
      queryClient.invalidateQueries({ queryKey: ['assignments', 'my'] });
      toast.success('Submitted to your instructor!');
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err.response?.data?.detail ?? 'Submission failed');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: { grade: string; reviewed_merged_content: any; instructor_feedback: string }) =>
      api.put(`/assignments/${assignmentId}/groups/${group?.id}/review`, payload).then(r => r.data),
    onSuccess: (data: AssignmentGroup) => {
      queryClient.setQueryData(['merged', assignmentId, groupId], data);
      toast.success('Review saved — group members notified');
      navigate(`/admin/assignments/${assignmentId}`);
    },
    onError: () => toast.error('Failed to save review'),
  });

  const handleSaveReview = useCallback(() => {
    if (!reviewEditor) return;
    if (!grade.trim() && !overallFeedback.trim() && annotations.length === 0) {
      toast.error('Add a grade, feedback, or at least one annotation.');
      return;
    }
    reviewMutation.mutate({
      grade: grade.trim(),
      reviewed_merged_content: reviewEditor.getJSON(),
      instructor_feedback: overallFeedback.trim(),
    });
  }, [reviewEditor, grade, overallFeedback, annotations, reviewMutation]);

  const handleChange = useCallback((json: any) => {
    setDocContent(json);
    setDirty(true);
  }, []);

  const handleAutoSave = useCallback(() => {
    if (docContent && !group?.final_submitted_at) {
      saveMutation.mutate(docContent);
    }
  }, [docContent, group?.final_submitted_at, saveMutation]);

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
        <div className="h-36 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        <div className="h-96 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center mx-auto mb-5">
          <Users size={34} className="text-purple-400 dark:text-purple-500" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Waiting for Your Team
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
          The merged document isn't ready yet. All team members need to submit their
          portions first.
        </p>
        <Link
          to={`/assignments/${assignmentId}/work`}
          className="mt-7 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition shadow-card"
        >
          <ArrowLeft size={14} /> Back to workspace
        </Link>
      </div>
    );
  }

  const alreadySubmitted = !!group.final_submitted_at;
  const submittedCount = group.members.filter(m => m.submitted_at).length;
  const editorValue = docContent ?? group.merged_document;
  const learnerViewOnly = alreadySubmitted; // learner can't edit after final submit

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">

      {/* ─── Hero banner ─────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-purple-600 via-purple-500 to-brand-500 rounded-2xl px-6 py-5 text-white shadow-elevated overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute right-12 -bottom-8 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/60 font-mono mb-1 flex items-center gap-1.5">
              <Star size={10} /> Merged Document
            </p>
            <h1 className="font-serif text-2xl font-bold text-white leading-tight">
              {assignment?.title ?? 'Group Assignment'}
            </h1>
            <p className="text-purple-200 text-sm mt-1">
              {submittedCount}/{group.members.length} portions combined
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="font-mono text-3xl font-bold text-white">
              {submittedCount}
              <span className="text-purple-300 text-xl">/{group.members.length}</span>
            </div>
            {group.grade && (
              <p className="text-xs text-purple-200 mt-0.5 font-semibold">Grade: {group.grade}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 relative">
          {group.members.map(m => (
            <div
              key={m.id}
              className="flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-full px-2.5 py-1"
            >
              <div className="w-5 h-5 rounded-full bg-white/30 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {m.learner.full_name[0]}
              </div>
              <span className="text-xs text-white font-medium">{m.learner.full_name}</span>
              {m.portion_label && (
                <span className="text-[10px] text-purple-200">— {m.portion_label}</span>
              )}
              <CheckCircle size={10} className="text-green-300 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* ─── Sticky control bar (instructor) ────────────────────────────────── */}
      {isInstructor && (
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur border border-gray-200 dark:border-slate-700 rounded-2xl shadow-elevated px-4 py-3 space-y-2.5">

          {/* Row 1: Back · Grade · Feedback · Save */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white transition font-medium flex-shrink-0"
            >
              <ChevronLeft size={16} /> Back
            </button>

            <div className="h-5 w-px bg-gray-200 dark:bg-slate-600 flex-shrink-0" />

            {/* Grade input */}
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-1.5 flex-shrink-0">
              <Star size={13} className="text-amber-400" />
              <input
                type="text"
                value={grade}
                onChange={e => setGrade(e.target.value)}
                placeholder="Grade (A, 85/100, Pass…)"
                className="text-sm bg-transparent outline-none text-gray-800 dark:text-white placeholder-amber-400 dark:placeholder-amber-700 w-40 font-medium"
              />
            </div>

            {/* Feedback input */}
            <input
              type="text"
              value={overallFeedback}
              onChange={e => setOverallFeedback(e.target.value)}
              placeholder="Overall feedback for the team…"
              className="flex-1 min-w-[180px] text-sm px-3 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 outline-none transition"
            />

            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
              {group.reviewed_merged_at && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-2.5 py-1.5 rounded-lg">
                  <CheckCircle size={12} /> Reviewed {format(parseISO(group.reviewed_merged_at), 'MMM d')}
                </span>
              )}
              <button
                onClick={handleSaveReview}
                disabled={reviewMutation.isPending}
                className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-50 shadow-card"
              >
                <Send size={13} />
                {reviewMutation.isPending ? 'Saving…' : 'Save & Notify Team'}
              </button>
            </div>
          </div>

          {/* Row 2: Annotation toolbar */}
          <div className="flex items-center gap-3 flex-wrap border-t border-gray-100 dark:border-slate-700 pt-2.5">
            <div className="flex items-center gap-1.5">
              <Highlighter size={12} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Colour</span>
            </div>
            <div className="flex items-center gap-1.5">
              {COMMENT_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setActiveColor(c.value)}
                  title={c.label}
                  className="w-5 h-5 rounded-full transition-all duration-150 hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    boxShadow: activeColor === c.value
                      ? '0 0 0 2px white, 0 0 0 3px #6366f1'
                      : '0 1px 3px rgba(0,0,0,0.15)',
                  }}
                />
              ))}
            </div>
            <div className="h-4 w-px bg-gray-200 dark:bg-slate-600" />
            <button
              onClick={handleAddAnnotation}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition font-bold shadow-card"
            >
              <MessageSquare size={11} /> Annotate
            </button>
            <p className="text-xs text-gray-400 italic hidden sm:block">
              Select text first, then click Annotate
            </p>

            {/* Pending annotation input inline */}
            {showCommentInput && (
              <div className="flex items-center gap-2 flex-1 min-w-[260px] bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-1.5">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: activeColor }}
                />
                <input
                  ref={commentInputRef}
                  type="text"
                  value={pendingComment}
                  onChange={e => setPendingComment(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') confirmAnnotation();
                    if (e.key === 'Escape') { setShowCommentInput(false); setPendingComment(''); }
                  }}
                  placeholder="Type annotation… Enter to confirm, Esc to cancel"
                  className="flex-1 text-sm bg-transparent outline-none text-gray-800 dark:text-white placeholder-amber-400"
                />
                <button onClick={confirmAnnotation} className="text-xs px-2.5 py-1 bg-brand-600 text-white rounded-md font-semibold transition hover:bg-brand-700">Add</button>
                <button onClick={() => { setShowCommentInput(false); setPendingComment(''); }} className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Learner action bar ───────────────────────────────────────────────── */}
      {!isInstructor && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white transition font-medium"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            {!learnerViewOnly && (
              <>
                {lastSaved && !dirty && (
                  <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800">
                    <CheckCircle size={11} />
                    Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {dirty && (
                  <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">
                    <Clock size={11} /> Unsaved changes
                  </span>
                )}
                <button
                  onClick={() => docContent && saveMutation.mutate(docContent)}
                  disabled={saveMutation.isPending || !dirty}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition disabled:opacity-40 shadow-card"
                >
                  <Save size={13} />
                  {saveMutation.isPending ? 'Saving…' : 'Save'}
                </button>
              </>
            )}
            {alreadySubmitted ? (
              <span className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm font-semibold rounded-xl border border-green-200 dark:border-green-800 shadow-card">
                <CheckCircle size={15} /> Submitted to Instructor
              </span>
            ) : (
              <button
                onClick={() => {
                  if (dirty) { toast.error('Save first before submitting.'); return; }
                  if (window.confirm('Submit this merged document to your instructor?\n\nMake sure your whole team has reviewed it first.')) {
                    submitMutation.mutate();
                  }
                }}
                disabled={submitMutation.isPending}
                className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 shadow-elevated"
              >
                <Send size={14} /> Submit to Instructor
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Main content ────────────────────────────────────────────────────── */}

      {isInstructor ? (
        /* ════════════════════════════════════════════════════════════════════
           INSTRUCTOR LAYOUT: sticky bar above + split view below
           ════════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">

          {/* Document + annotations sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-card">
              <EditorContent editor={reviewEditor} />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-card flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={13} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-700 dark:text-white">Annotations</span>
                </div>
                {annotations.length > 0 && (
                  <span className="text-[11px] font-bold text-white bg-brand-500 rounded-full w-5 h-5 flex items-center justify-center">
                    {annotations.length}
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                <AnnotationSidebar comments={annotations} onDelete={deleteAnnotation} />
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════════
           LEARNER LAYOUT: team sidebar + editable document
           ════════════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          {/* Left sidebar */}
          <div className="space-y-4">
            {/* Team card */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-card">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
                <Users size={13} className="text-gray-400" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Team</span>
              </div>
              <div className="p-4 space-y-3">
                {group.members.map(m => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {m.learner.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{m.learner.full_name}</p>
                      {m.portion_label && <p className="text-xs text-gray-400 truncate">{m.portion_label}</p>}
                    </div>
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Action guide */}
            {!learnerViewOnly && (
              <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-mono">
                  <Star size={11} /> What to do now
                </p>
                <ol className="space-y-2.5">
                  {[
                    'Read and polish the merged document together.',
                    'Save changes and discuss in your review meeting.',
                    'When satisfied, click Submit to Instructor.',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-purple-700 dark:text-purple-300">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Instructor review feedback (learner view) */}
            {(group.grade || group.instructor_feedback) && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Star size={11} /> Instructor Review
                </p>
                {group.grade && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-600 dark:text-amber-400">Grade:</span>
                    <span className="font-mono text-xl font-bold text-amber-700 dark:text-amber-300">{group.grade}</span>
                  </div>
                )}
                {group.instructor_feedback && (
                  <p className="text-sm text-amber-900 dark:text-amber-200 whitespace-pre-wrap leading-relaxed">
                    {group.instructor_feedback}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-2.5">
              <FileText size={13} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Document</span>
              {!learnerViewOnly && (
                <span className="text-xs text-gray-400 italic ml-auto">Auto-saved every 30s</span>
              )}
            </div>
            <div className="rounded-xl overflow-hidden shadow-card" style={{ minHeight: 640 }}>
              <AssignmentEditor
                value={editorValue}
                onChange={handleChange}
                onAutoSave={learnerViewOnly ? undefined : handleAutoSave}
                readOnly={learnerViewOnly}
                minHeight={640}
                autoSaveInterval={30_000}
              />
            </div>
          </div>
        </div>
      )}

      {/* Learner: post-submit confirmation */}
      {!isInstructor && alreadySubmitted && !group.instructor_feedback && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center shadow-card">
          <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <p className="font-serif text-lg font-bold text-green-700 dark:text-green-300">
            Successfully submitted to your instructor
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            Your instructor will review the merged document and may leave feedback here.
          </p>
        </div>
      )}
    </div>
  );
}
