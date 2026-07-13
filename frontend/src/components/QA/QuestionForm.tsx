import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Clock, Send } from 'lucide-react';
import { useUIStore, usePlayerStore } from '../../store';
import api from '../../api/client';
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
    <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ zIndex: 9999, background: 'rgba(11,10,15,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full sm:max-w-md animate-slide-in"
        style={{ background: '#171219', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '20px 20px 0 0', boxShadow: '0 40px 90px -20px rgba(0,0,0,0.75)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="font-semibold" style={{ color: '#ECE8F0', fontSize: 16 }}>Ask a Question</h3>
          <button onClick={closeQuestionForm} className="flex items-center justify-center rounded-lg transition-colors" style={{ minWidth: 40, minHeight: 40, color: '#756D80' }}>
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Timestamp */}
          <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Clock size={15} style={{ color: '#756D80' }} />
            <span className="text-sm" style={{ color: '#A79FB0' }}>Linked to</span>
            <span className="font-mono font-semibold ml-auto text-sm" style={{ color: '#b259c4' }}>
              {formatTime(timestamp)}
            </span>
          </div>

          {/* Question text */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#ECE8F0' }}>
              What's your question?
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe what you're confused about or want to know more about…"
              rows={4}
              autoFocus
              className="w-full rounded-xl px-4 py-3 resize-none focus:outline-none transition-all"
              style={{ fontSize: 15, color: '#ECE8F0', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(178,89,196,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <p className="text-xs mt-1" style={{ color: '#756D80' }}>{text.length}/500 characters</p>
          </div>

          {/* Visibility */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="sr-only peer" />
              <div className="w-10 h-6 rounded-full peer peer-checked:bg-brand-600 transition-colors" style={{ background: 'rgba(255,255,255,0.15)' }} />
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#ECE8F0' }}>Visible to others</p>
              <p className="text-xs" style={{ color: '#A79FB0' }}>
                {isPublic ? 'Other learners can see this Q&A' : 'Only you and your instructor can see this'}
              </p>
            </div>
          </label>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={closeQuestionForm} className="flex-1 rounded-xl transition-colors" style={{ minHeight: 48, color: '#A79FB0', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', fontWeight: 500, fontSize: 14 }}>
            Cancel
          </button>
          <button
            onClick={() => submit.mutate()}
            disabled={!text.trim() || text.length > 500 || submit.isPending}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-50"
            style={{ minHeight: 48, color: '#fff', background: '#b259c4', border: 'none', fontWeight: 600, fontSize: 14 }}
          >
            {submit.isPending ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Send size={15} />}
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
