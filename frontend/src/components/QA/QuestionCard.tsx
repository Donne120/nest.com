import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, MessageSquare, Clock, CheckCircle2, Pencil, Trash2, X, Check, Sparkles } from 'lucide-react';
import { usePlayerStore, useUIStore, useAuthStore } from '../../store';
import type { Question, Answer } from '../../types';
import Avatar from '../UI/Avatar';
import api from '../../api/client';
import toast from 'react-hot-toast';
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
  const isManagerOrAdmin = user?.role === 'educator' || user?.role === 'owner';
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

  const isPending = question.status === 'pending';
  const isAnswered = question.status === 'answered';

  return (
    <div
      style={{
        borderRadius: 10,
        border: isActive
          ? '1px solid rgba(232,201,126,0.45)'
          : isPending
          ? '1px solid rgba(196,92,60,0.35)'
          : '1px solid rgba(255,255,255,0.08)',
        borderLeft: isPending && !isActive ? '3px solid #c45c3c' : undefined,
        background: isActive
          ? 'rgba(232,201,126,0.06)'
          : '#1c1e27',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Card Header */}
      <div style={{ padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>

          {/* Timestamp button */}
          <button
            onClick={handleTimestampClick}
            title="Jump to this moment"
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: '#0b0c0f',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#e8c97e',
              fontSize: 11,
              fontFamily: 'monospace',
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: 5,
              cursor: 'pointer',
              letterSpacing: '0.06em',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(232,201,126,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          >
            <Clock size={10} />
            {formatTime(question.timestamp_seconds)}
          </button>

          {/* Question text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingQuestion ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  autoFocus
                  rows={2}
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0b0c0f',
                    border: '1px solid rgba(232,201,126,0.4)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 13,
                    color: '#e8e4dc',
                    fontFamily: 'inherit',
                    resize: 'none',
                    outline: 'none',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => editQuestion.mutate()}
                    disabled={editQuestion.isPending || !editText.trim()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 5, border: 'none',
                      background: '#e8c97e', color: '#0b0c0f',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <Check size={11} /> Save
                  </button>
                  <button
                    onClick={() => { setEditingQuestion(false); setEditText(question.question_text); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 5,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: '#9ca3af',
                      fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <X size={11} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p style={{
                fontSize: 13.5,
                color: '#e8e4dc',
                lineHeight: 1.55,
                fontWeight: 500,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {question.question_text}
              </p>
            )}
          </div>

          {/* Status badge */}
          <span style={{
            flexShrink: 0,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            padding: '3px 8px',
            borderRadius: 100,
            background: isAnswered
              ? 'rgba(74,222,128,0.12)'
              : 'rgba(232,201,126,0.12)',
            color: isAnswered ? '#4ade80' : '#e8c97e',
            border: isAnswered
              ? '1px solid rgba(74,222,128,0.25)'
              : '1px solid rgba(232,201,126,0.25)',
          }}>
            {isPending ? '● Pending' : '✓ Answered'}
          </span>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <Avatar name={question.asked_by_user.full_name} url={question.asked_by_user.avatar_url} size="sm" />
          <span style={{ fontSize: 11.5, color: '#9ca3af' }}>
            {question.asked_by_user.full_name}
            {isMine && (
              <span style={{ marginLeft: 4, color: '#e8c97e', fontWeight: 600 }}>(you)</span>
            )}
          </span>
          <span style={{ fontSize: 11, color: '#6b6b78', marginLeft: 'auto' }}>
            {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
          </span>
          {!editingQuestion && (
            <div style={{ display: 'flex', gap: 2 }}>
              {canEdit && (
                <button
                  onClick={() => setEditingQuestion(true)}
                  title="Edit question"
                  style={{
                    padding: '3px 5px', background: 'none', border: 'none',
                    color: '#6b6b78', cursor: 'pointer', borderRadius: 4,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#e8c97e')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6b6b78')}
                >
                  <Pencil size={11} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => { if (confirm('Delete this question?')) deleteQuestion.mutate(); }}
                  title="Delete question"
                  style={{
                    padding: '3px 5px', background: 'none', border: 'none',
                    color: '#6b6b78', cursor: 'pointer', borderRadius: 4,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#c45c3c')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6b6b78')}
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Answers toggle */}
      {question.answers.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: 'rgba(74,222,128,0.05)',
              borderTop: '1px solid rgba(74,222,128,0.12)',
              borderBottom: expanded ? '1px solid rgba(255,255,255,0.06)' : 'none',
              borderLeft: 'none',
              borderRight: 'none',
              color: '#4ade80',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <CheckCircle2 size={13} />
            {question.answers.length} answer{question.answers.length > 1 ? 's' : ''}
            <span style={{ marginLeft: 'auto' }}>
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </span>
          </button>

          {expanded && (
            <div>
              {question.answers.map((answer) => (
                <AnswerRow key={answer.id} answer={answer} questionId={question.id} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <button
          onClick={() => onReply?.(question.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', border: 'none',
            color: '#6b6b78', fontSize: 11.5,
            cursor: 'pointer', fontFamily: 'inherit',
            padding: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#e8c97e')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6b6b78')}
        >
          <MessageSquare size={12} />
          Reply
        </button>
        {question.view_count > 0 && (
          <span style={{ fontSize: 11, color: '#6b6b78', marginLeft: 'auto' }}>
            {question.view_count} views
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Answer row ───────────────────────────────────────────────────────────────

function AnswerRow({ answer, questionId }: { answer: Answer; questionId: string }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(answer.answer_text);

  const isMine = answer.answered_by_user.id === user?.id;
  const isManagerOrAdmin = user?.role === 'educator' || user?.role === 'owner';
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
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(255,255,255,0.015)',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
    >
      {/* Answer meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
        {!answer.is_ai_generated && (
          <Avatar name={answer.answered_by_user.full_name} url={answer.answered_by_user.avatar_url} size="sm" />
        )}
        <div style={{ flex: 1 }}>
          {answer.is_ai_generated ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 10, background: 'rgba(99,102,241,0.15)',
              color: '#818cf8', padding: '2px 7px', borderRadius: 100,
              fontWeight: 700, letterSpacing: '0.06em',
            }}>
              <Sparkles size={9} /> AI Teacher
            </span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 600, color: answer.is_official ? '#e8c97e' : '#c4c0ba' }}>
              {answer.answered_by_user.full_name}
            </span>
          )}
          {answer.is_official && !answer.is_ai_generated && (
            <span style={{
              marginLeft: 6, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.08em', padding: '2px 6px',
              borderRadius: 100, background: 'rgba(232,201,126,0.15)',
              color: '#e8c97e',
            }}>
              OFFICIAL
            </span>
          )}
        </div>
        <span style={{ fontSize: 10.5, color: '#6b6b78' }}>
          {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}
        </span>
        <div style={{ display: 'flex', gap: 2 }}>
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              title="Edit answer"
              style={{
                padding: '3px 4px', background: 'none', border: 'none',
                color: '#6b6b78', cursor: 'pointer', borderRadius: 4,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e8c97e')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b6b78')}
            >
              <Pencil size={10} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => { if (confirm('Delete this answer?')) deleteAnswer.mutate(); }}
              title="Delete answer"
              style={{
                padding: '3px 4px', background: 'none', border: 'none',
                color: '#6b6b78', cursor: 'pointer', borderRadius: 4,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c45c3c')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b6b78')}
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Answer body */}
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 28 }}>
          <textarea
            autoFocus
            rows={3}
            value={editText}
            onChange={e => setEditText(e.target.value)}
            style={{
              width: '100%',
              background: '#0b0c0f',
              border: '1px solid rgba(232,201,126,0.4)',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 13,
              color: '#e8e4dc',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.5,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => editAnswer.mutate()}
              disabled={editAnswer.isPending || !editText.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 5, border: 'none',
                background: '#e8c97e', color: '#0b0c0f',
                fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Check size={11} /> Save
            </button>
            <button
              onClick={() => { setEditing(false); setEditText(answer.answer_text); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 5,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: '#9ca3af',
                fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <X size={11} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <p style={{
          fontSize: 13,
          color: '#c4c0ba',
          lineHeight: 1.65,
          margin: 0,
          paddingLeft: 28,
        }}>
          {editText}
        </p>
      )}
    </div>
  );
}
