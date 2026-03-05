import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, ExternalLink, Send, CheckCircle2, Archive } from 'lucide-react';
import api from '../../api/client';
import type { Question, Video, QuestionStatus } from '../../types';
import Avatar from '../../components/UI/Avatar';
import Badge from '../../components/UI/Badge';
import Button from '../../components/UI/Button';
import { Skeleton } from '../../components/UI/Skeleton';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

export default function AdminQuestionDetail() {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [answerText, setAnswerText] = useState('');

  const { data: question, isLoading } = useQuery<Question>({
    queryKey: ['question', questionId],
    queryFn: () => api.get(`/questions/${questionId}`).then(r => r.data),
    enabled: !!questionId,
  });

  const { data: video } = useQuery<Video>({
    queryKey: ['video', question?.video_id],
    queryFn: () => api.get(`/videos/${question!.video_id}`).then(r => r.data),
    enabled: !!question?.video_id,
  });

  const submitAnswer = useMutation({
    mutationFn: () =>
      api.post(`/questions/${questionId}/answers`, {
        answer_text: answerText.trim(),
        is_official: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question', questionId] });
      queryClient.invalidateQueries({ queryKey: ['pending-questions'] });
      queryClient.invalidateQueries({ queryKey: ['all-questions'] });
      setAnswerText('');
      toast.success('Answer posted!');
    },
    onError: () => toast.error('Failed to post answer'),
  });

  const updateStatus = useMutation({
    mutationFn: (status: QuestionStatus) =>
      api.put(`/questions/${questionId}`, { status }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['question', questionId] });
      queryClient.invalidateQueries({ queryKey: ['all-questions'] });
      toast.success(`Status updated to ${status}`);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!question) return <div className="p-8 text-gray-500">Question not found.</div>;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate('/admin/questions')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Questions
      </button>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-card mb-5">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Avatar name={question.asked_by_user.full_name} url={question.asked_by_user.avatar_url} size="md" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{question.asked_by_user.full_name}</p>
                <p className="text-xs text-gray-500">{question.asked_by_user.department}</p>
              </div>
            </div>
            <Badge variant={question.status} />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-gray-900 leading-relaxed">{question.question_text}</p>
          </div>

          {/* Context */}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg font-mono text-xs">
              <Clock size={13} />
              {formatTime(question.timestamp_seconds)}
            </span>
            {video && (
              <button
                onClick={() => navigate(`/video/${video.id}`)}
                className="flex items-center gap-1 text-brand-600 hover:text-brand-800 transition-colors text-xs"
              >
                <ExternalLink size={12} />
                Watch at this moment
              </button>
            )}
            <span className="ml-auto text-xs">
              {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>

      {/* Existing answers */}
      {question.answers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card mb-5">
          <div className="px-6 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">
              {question.answers.length} Answer{question.answers.length > 1 ? 's' : ''}
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {question.answers.map((ans) => (
              <div key={ans.id} className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Avatar name={ans.answered_by_user.full_name} url={ans.answered_by_user.avatar_url} size="sm" />
                  <span className="text-sm font-medium text-gray-800">{ans.answered_by_user.full_name}</span>
                  {ans.is_official && (
                    <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                      Official Answer
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {formatDistanceToNow(new Date(ans.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed pl-8">{ans.answer_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answer form */}
      {question.status !== 'archived' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card mb-5">
          <div className="px-6 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">
              {question.status === 'answered' ? 'Add Another Reply' : 'Post Official Answer'}
            </h3>
          </div>
          <div className="p-6">
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Write a clear, helpful answer that future employees will benefit from..."
              rows={5}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-400">
                This will be marked as an official answer and notify the employee.
              </p>
              <Button
                icon={<Send size={14} />}
                onClick={() => submitAnswer.mutate()}
                loading={submitAnswer.isPending}
                disabled={!answerText.trim()}
              >
                Post Answer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status actions */}
      <div className="flex gap-3">
        {question.status !== 'answered' && (
          <Button
            variant="secondary"
            icon={<CheckCircle2 size={15} />}
            onClick={() => updateStatus.mutate('answered')}
            loading={updateStatus.isPending}
          >
            Mark Answered
          </Button>
        )}
        {question.status !== 'archived' && (
          <Button
            variant="ghost"
            icon={<Archive size={15} />}
            onClick={() => updateStatus.mutate('archived')}
            loading={updateStatus.isPending}
          >
            Archive
          </Button>
        )}
      </div>
    </div>
  );
}
