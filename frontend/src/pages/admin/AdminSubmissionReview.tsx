import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { format, parseISO } from 'date-fns';
import {
  ChevronLeft, MessageSquare, Star, Send, Trash2,
  CheckCircle, Highlighter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { CommentMark } from '../../components/Editor/CommentMark';
import { sanitizeTiptap } from '../../components/Editor/sanitize';
import type { AssignmentSubmission } from '../../types';

const COMMENT_COLORS = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green',  value: '#bbf7d0' },
  { label: 'Blue',   value: '#bfdbfe' },
  { label: 'Pink',   value: '#fbcfe8' },
  { label: 'Orange', value: '#fed7aa' },
];

// ─── Comments sidebar ─────────────────────────────────────────────────────────

function CommentSidebar({
  comments,
  onDelete,
}: {
  comments: { id: string; comment: string; color: string; quote: string }[];
  onDelete: (id: string) => void;
}) {
  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-5 h-full">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <MessageSquare size={20} className="text-gray-300 dark:text-slate-600" />
        </div>
        <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">No annotations yet</p>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          Select text in the document, choose a highlight colour, then click Annotate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 p-3">
      {comments.map(c => (
        <div
          key={c.id}
          className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 group shadow-card"
          style={{ borderLeftColor: c.color, borderLeftWidth: 4 }}
        >
          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-slate-800/80 truncate leading-relaxed">
            "{c.quote}"
          </div>
          <div className="px-3 py-2.5 flex items-start justify-between gap-2 bg-white dark:bg-slate-900">
            <p className="text-sm text-gray-800 dark:text-white flex-1 leading-relaxed">{c.comment}</p>
            <button
              onClick={() => onDelete(c.id)}
              className="text-gray-300 hover:text-red-400 transition flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100"
              title="Remove annotation"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSubmissionReview() {
  const { assignmentId, submissionId } = useParams<{ assignmentId: string; submissionId: string }>();
  const navigate = useNavigate();

  const [grade, setGrade] = useState('');
  const [overallFeedback, setOveralFeedback] = useState('');
  const [activeColor, setActiveColor] = useState('#fef08a');
  const [pendingComment, setPendingComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comments, setComments] = useState<{ id: string; comment: string; color: string; quote: string }[]>([]);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const { data: sub, isLoading } = useQuery<AssignmentSubmission>({
    queryKey: ['submission', submissionId],
    queryFn: () =>
      api.get(`/assignments/${assignmentId}/submissions/${submissionId}`).then(r => r.data),
    enabled: !!submissionId,
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: { grade: string; reviewed_content: any; instructor_feedback: string }) =>
      api.put(`/assignments/${assignmentId}/submissions/${submissionId}/review`, payload).then(r => r.data),
    onSuccess: () => {
      toast.success('Review saved and learner notified');
      navigate(`/admin/assignments/${assignmentId}`);
    },
    onError: () => toast.error('Failed to save review'),
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      CommentMark,
    ],
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
        style: 'min-height: 480px; padding: 24px 28px;',
      },
    },
  });

  useEffect(() => {
    if (!editor || !sub) return;
    const doc = sub.reviewed_content ?? sub.content;
    if (doc) {
      editor.commands.setContent(sanitizeTiptap(doc));
      setGrade(sub.grade ?? '');
      setOveralFeedback(sub.instructor_feedback ?? '');
    }
    extractCommentsFromEditor(editor);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub, editor]);

  const extractCommentsFromEditor = useCallback((ed: typeof editor) => {
    if (!ed) return;
    const found: typeof comments = [];
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
    setComments(found);
  }, []);

  const handleAddComment = useCallback(() => {
    if (!editor) return;
    const { empty } = editor.state.selection;
    if (empty) {
      toast.error('Select some text first');
      return;
    }
    setShowCommentInput(true);
    setTimeout(() => commentInputRef.current?.focus(), 50);
  }, [editor]);

  const confirmComment = useCallback(() => {
    if (!editor || !pendingComment.trim()) return;
    const { from, to } = editor.state.selection;
    const quote = editor.state.doc.textBetween(from, to, ' ');
    const id = crypto.randomUUID();
    editor.chain().focus().setComment(pendingComment.trim(), activeColor, id).run();
    setComments(prev => [...prev, {
      id,
      comment: pendingComment.trim(),
      color: activeColor,
      quote: quote.slice(0, 80) + (quote.length > 80 ? '\u2026' : ''),
    }]);
    setPendingComment('');
    setShowCommentInput(false);
  }, [editor, pendingComment, activeColor]);

  const deleteComment = useCallback((id: string) => {
    if (!editor) return;
    editor.state.doc.descendants((node, pos) => {
      node.marks.forEach(mark => {
        if (mark.type.name === 'commentMark' && mark.attrs.commentId === id) {
          const tr = editor.state.tr.removeMark(pos, pos + node.nodeSize, mark.type);
          editor.view.dispatch(tr);
        }
      });
    });
    setComments(prev => prev.filter(c => c.id !== id));
  }, [editor]);

  const handleSubmitReview = useCallback(() => {
    if (!editor) return;
    if (!grade.trim() && !overallFeedback.trim() && comments.length === 0) {
      toast.error('Add a grade, feedback, or at least one annotation before saving.');
      return;
    }
    reviewMutation.mutate({
      grade: grade.trim(),
      reviewed_content: editor.getJSON(),
      instructor_feedback: overallFeedback.trim(),
    });
  }, [editor, grade, overallFeedback, comments, reviewMutation]);

  if (isLoading || !sub) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-28 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-96 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  const name = sub.learner?.full_name ?? sub.learner_id;
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-5">

      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(`/admin/assignments/${assignmentId}`)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white transition font-medium"
        >
          <ChevronLeft size={16} />
          <span className="text-gray-400">Assignment</span>
          <span className="text-gray-300 dark:text-slate-600 mx-1">/</span>
          <span className="text-gray-700 dark:text-gray-200">Review: {name}</span>
        </button>

        <button
          onClick={handleSubmitReview}
          disabled={reviewMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-50 shadow-elevated"
        >
          <Send size={14} />
          {reviewMutation.isPending ? 'Saving…' : 'Save & Notify Learner'}
        </button>
      </div>

      {/* ─── Learner info + grade ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center text-sm flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="font-serif text-base font-bold text-gray-800 dark:text-white">{name}</p>
              {sub.learner?.email && (
                <p className="text-xs text-gray-400 mt-0.5">{sub.learner.email}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5 font-mono">
                {sub.submitted_at
                  ? `Submitted ${format(parseISO(sub.submitted_at), 'MMM d, yyyy \u00b7 h:mm a')} \u00b7 ${sub.word_count} words`
                  : 'Draft'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Grade input */}
            <div className="flex items-center gap-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
              <Star size={16} className="text-amber-400 flex-shrink-0" />
              <input
                type="text"
                value={grade}
                onChange={e => setGrade(e.target.value)}
                placeholder="Grade (A, 85/100, Pass…)"
                className="text-sm bg-transparent outline-none text-gray-800 dark:text-white placeholder-amber-300 dark:placeholder-amber-700 w-44 font-medium"
              />
            </div>
            {sub.reviewed_at && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-2.5 py-1.5 rounded-lg">
                <CheckCircle size={12} /> Reviewed {format(parseISO(sub.reviewed_at), 'MMM d')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Document + sidebar ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Document column */}
        <div className="lg:col-span-2 space-y-3">

          {/* Annotation toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap shadow-card">
            <div className="flex items-center gap-2">
              <Highlighter size={13} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Colour</span>
            </div>
            <div className="flex items-center gap-1.5">
              {COMMENT_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setActiveColor(c.value)}
                  title={c.label}
                  className="w-6 h-6 rounded-full transition-all duration-150 hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    boxShadow: activeColor === c.value ? `0 0 0 2px white, 0 0 0 3.5px #6366f1` : '0 1px 3px rgba(0,0,0,0.15)',
                  }}
                />
              ))}
            </div>

            <div className="h-4 w-px bg-gray-200 dark:bg-slate-600" />

            <button
              onClick={handleAddComment}
              className="flex items-center gap-2 text-xs px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition font-bold shadow-card"
            >
              <MessageSquare size={12} /> Annotate
            </button>

            <p className="text-xs text-gray-400 italic hidden sm:block">
              Select text first, then click Annotate
            </p>
          </div>

          {/* Comment input */}
          {showCommentInput && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-3.5 flex items-center gap-3 shadow-elevated">
              <div
                className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-2 ring-white shadow"
                style={{ backgroundColor: activeColor }}
              />
              <input
                ref={commentInputRef}
                type="text"
                value={pendingComment}
                onChange={e => setPendingComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') confirmComment();
                  if (e.key === 'Escape') { setShowCommentInput(false); setPendingComment(''); }
                }}
                placeholder="Type your annotation… (Enter to confirm, Esc to cancel)"
                className="flex-1 text-sm bg-transparent outline-none text-gray-800 dark:text-white placeholder-gray-400"
              />
              <button
                onClick={confirmComment}
                className="text-xs px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold transition"
              >
                Add
              </button>
              <button
                onClick={() => { setShowCommentInput(false); setPendingComment(''); }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Document */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-card">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Annotations sidebar */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-card flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-gray-400" />
              <span className="text-sm font-bold text-gray-700 dark:text-white">
                Annotations
              </span>
            </div>
            {comments.length > 0 && (
              <span className="text-xs font-bold text-white bg-brand-500 rounded-full w-5 h-5 flex items-center justify-center">
                {comments.length}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <CommentSidebar comments={comments} onDelete={deleteComment} />
          </div>
        </div>
      </div>

      {/* ─── Overall feedback ────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-5 shadow-card">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3 font-mono">
          <MessageSquare size={12} className="text-gray-400" />
          Overall Feedback
        </label>
        <textarea
          rows={4}
          value={overallFeedback}
          onChange={e => setOveralFeedback(e.target.value)}
          placeholder="Write overall comments for the learner — your thoughts on their work, what they did well, and areas to improve…"
          className="w-full text-sm px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none transition leading-relaxed"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-400 font-mono">{overallFeedback.length} characters</p>
          <button
            onClick={handleSubmitReview}
            disabled={reviewMutation.isPending}
            className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-50 shadow-card"
          >
            <Send size={13} />
            {reviewMutation.isPending ? 'Saving…' : 'Save & Notify Learner'}
          </button>
        </div>
      </div>
    </div>
  );
}
