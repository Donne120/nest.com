import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, MessageSquare, Clock, CheckCircle2, Pencil, Trash2, X, Check, Sparkles } from 'lucide-react';
import { usePlayerStore, useUIStore, useAuthStore } from '../../store';
import type { Question, Answer } from '../../types';
import Avatar from '../UI/Avatar';
import Badge from '../UI/Badge';
import api from '../../api/client';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

interface Props {
  question: Question;
  isActive: boolean;
  onReply?: (questionId: string) => void;
}

export default function QuestionCard({ question, isActive, onReply }: Props) {
  const [expanded, setExpanded] = useState(isActive || question.status === 'answered');
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [editText, setEditText] = useState(question.question_text);
  const { seekTo } = usePlayerStore();
  const { setActiveQuestion } = useUIStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const isMine = question.asked_by_user.id === user?.id;
  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';
  const canEdit = isMine;
  const canDelete = isMine || isManagerOrAdmin;

  const editQuestion = useMutation({
    mutationFn: () => api.put(`/questions/${question.id}`, { question_text: editText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setEditingQuestion(false);
      toast.success('Question updated');
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteQuestion = useMutation({
    mutationFn: () => api.delete(`/questions/${question.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Question deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const handleTimestampClick = () => {
    seekTo(question.timestamp_seconds);
    setActiveQuestion(question.id);
  };

  return (
    <div
      className={clsx(
        'rounded-xl border transition-all duration-200 overflow-hidden animate-fade-in',
        isActive
          ? 'border-brand-300 bg-brand-50/40 shadow-md'
          : isMine
            ? 'border-gray-200 bg-amber-50/20'
            : 'border-gray-100 bg-white hover:border-gray-200',
        question.status === 'pending' && !isActive && 'border-l-4 border-l-amber-400'
      )}
    >
      {/* Card Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-2">
          <button
            onClick={handleTimestampClick}
            className="flex-shrink-0 flex items-center gap-1 bg-gray-900 text-white text-xs font-mono font-medium px-2 py-1 rounded-md hover:bg-brand-700 transition-colors"
            title="Jump to this moment"
          >
            <Clock size={11} />
            {formatTime(question.timestamp_seconds)}
          </button>

          <div className="flex-1 min-w-0">
            {editingQuestion ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  rows={2}
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="w-full border border-brand-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={() => editQuestion.mutate()}
                    disabled={editQuestion.isPending || !editText.trim()}
                    className="flex items-center gap-1 px-2.5 py-1 bg-brand-600 text-white text-xs rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  >
                    <Check size={12} /> Save
                  </button>
                  <button
                    onClick={() => { setEditingQuestion(false); setEditText(question.question_text); }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={12} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-900 leading-relaxed font-medium line-clamp-3">
                {question.question_text}
              </p>
            )}
          </div>

          <Badge variant={question.status} className="flex-shrink-0" />
        </div>

        {/* Meta + actions */}
        <div className="flex items-center gap-2 mt-3">
          <Avatar name={question.asked_by_user.full_name} url={question.asked_by_user.avatar_url} size="sm" />
          <span className="text-xs text-gray-500">
            {question.asked_by_user.full_name}
            {isMine && <span className="ml-1 text-brand-600 font-medium">(you)</span>}
          </span>
          <span className="text-xs text-gray-400 ml-auto">
            {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
          </span>
          {/* Edit / Delete */}
          {!editingQuestion && (
            <div className="flex gap-0.5 ml-1">
              {canEdit && (
                <button
                  onClick={() => setEditingQuestion(true)}
                  className="p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                  title="Edit question"
                >
                  <Pencil size={12} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => { if (confirm('Delete this question?')) deleteQuestion.mutate(); }}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete question"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Answers section */}
      {question.answers.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center gap-2 px-4 py-2 bg-gray-50/80 border-t border-gray-100 text-xs text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <CheckCircle2 size={13} className="text-emerald-500" />
            {question.answers.length} answer{question.answers.length > 1 ? 's' : ''}
            <span className="ml-auto">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>

          {expanded && (
            <div className="border-t border-gray-100">
              {question.answers.map((answer) => (
                <AnswerRow
                  key={answer.id}
                  answer={answer}
                  questionId={question.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-50 flex items-center gap-2">
        <button
          onClick={() => onReply?.(question.id)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600 transition-colors"
        >
          <MessageSquare size={12} />
          Reply
        </button>
        {question.view_count > 0 && (
          <span className="text-xs text-gray-400 ml-auto">{question.view_count} views</span>
        )}
      </div>
    </div>
  );
}

// ─── Answer row with edit/delete ──────────────────────────────────────────────

function AnswerRow({ answer, questionId }: { answer: Answer; questionId: string }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(answer.answer_text);

  const isMine = answer.answered_by_user.id === user?.id;
  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';
  const canEdit = isMine;
  const canDelete = isMine || isManagerOrAdmin;

  const editAnswer = useMutation({
    mutationFn: () => api.put(`/questions/${questionId}/answers/${answer.id}`, { answer_text: editText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setEditing(false);
      toast.success('Answer updated');
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteAnswer = useMutation({
    mutationFn: () => api.delete(`/questions/${questionId}/answers/${answer.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Answer deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  return (
    <div className="px-4 py-3 border-b border-gray-50 last:border-0 group">
      <div className="flex items-center gap-2 mb-2">
        {!answer.is_ai_generated && (
          <Avatar name={answer.answered_by_user.full_name} url={answer.answered_by_user.avatar_url} size="sm" />
        )}
        <div className="flex-1">
          {answer.is_ai_generated ? (
            <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">
              <Sparkles size={9} /> AI Teacher
            </span>
          ) : (
            <span className="text-xs font-medium text-gray-800">{answer.answered_by_user.full_name}</span>
          )}
          {answer.is_official && !answer.is_ai_generated && (
            <span className="ml-1.5 text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-medium">Official</span>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}
        </span>
        {/* Edit/Delete - visible on hover */}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
              title="Edit answer"
            >
              <Pencil size={11} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => { if (confirm('Delete this answer?')) deleteAnswer.mutate(); }}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete answer"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="pl-8 space-y-2">
          <textarea
            autoFocus
            rows={3}
            value={editText}
            onChange={e => setEditText(e.target.value)}
            className="w-full border border-brand-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="flex gap-1.5">
            <button
              onClick={() => editAnswer.mutate()}
              disabled={editAnswer.isPending || !editText.trim()}
              className="flex items-center gap-1 px-2.5 py-1 bg-brand-600 text-white text-xs rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              <Check size={12} /> Save
            </button>
            <button
              onClick={() => { setEditing(false); setEditText(answer.answer_text); }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed pl-8">{editText}</p>
      )}
    </div>
  );
}
