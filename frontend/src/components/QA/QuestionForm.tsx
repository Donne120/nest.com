import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Clock, Send } from 'lucide-react';
import { useUIStore, usePlayerStore } from '../../store';
import api from '../../api/client';
import Button from '../UI/Button';
import toast from 'react-hot-toast';

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

interface Props {
  videoId: string;
}

export default function QuestionForm({ videoId }: Props) {
  const { closeQuestionForm, questionFormTimestamp } = useUIStore();
  const { currentTime } = usePlayerStore();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const timestamp = questionFormTimestamp != null ? questionFormTimestamp : currentTime;

  const submit = useMutation({
    mutationFn: () =>
      api.post('/questions', {
        video_id: videoId,
        timestamp_seconds: timestamp,
        question_text: text.trim(),
        is_public: isPublic,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', videoId] });
      queryClient.invalidateQueries({ queryKey: ['timeline', videoId] });
      toast.success('Question submitted!');
      closeQuestionForm();
    },
    onError: () => toast.error('Failed to submit question'),
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-md animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Ask a Question</h3>
          <button onClick={closeQuestionForm} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Timestamp */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
            <Clock size={15} className="text-gray-500" />
            <span className="text-sm text-gray-600">Your question is linked to</span>
            <span className="font-mono font-semibold text-brand-700 ml-auto text-sm">
              {formatTime(timestamp)}
            </span>
          </div>

          {/* Question text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              What's your question?
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe what you're confused about or want to know more about..."
              rows={4}
              autoFocus
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">{text.length}/500 characters</p>
          </div>

          {/* Visibility */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-brand-600 transition-colors" />
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Visible to others</p>
              <p className="text-xs text-gray-500">
                {isPublic ? 'Future employees can see this Q&A' : 'Only you and managers can see this'}
              </p>
            </div>
          </label>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <Button variant="secondary" onClick={closeQuestionForm} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => submit.mutate()}
            loading={submit.isPending}
            disabled={!text.trim() || text.length > 500}
            icon={<Send size={14} />}
            className="flex-1"
          >
            Submit Question
          </Button>
        </div>
      </div>
    </div>
  );
}
