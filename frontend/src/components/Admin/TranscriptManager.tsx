import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Sparkles, Loader2, CheckCircle, AlertTriangle, Clock,
  PenLine, RotateCcw, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface Transcript {
  id: string;
  video_id: string;
  full_text: string | null;
  segments: { start: number; end: number; text: string }[] | null;
  language: string | null;
  status: 'pending' | 'processing' | 'done' | 'failed' | 'too_large' | 'manual';
  error_message: string | null;
  word_count: number | null;
  created_at: string;
  updated_at: string | null;
}

interface Props {
  videoId: string;
  videoTitle: string;
  hasVideoUrl: boolean;
}

const STATUS_CONFIG = {
  pending:    { label: 'No transcript', color: 'text-gray-400', bg: 'bg-gray-100', Icon: FileText },
  processing: { label: 'Transcribing…', color: 'text-blue-600', bg: 'bg-blue-50', Icon: Loader2 },
  done:       { label: 'Transcribed', color: 'text-emerald-600', bg: 'bg-emerald-50', Icon: CheckCircle },
  failed:     { label: 'Failed', color: 'text-red-500', bg: 'bg-red-50', Icon: AlertTriangle },
  too_large:  { label: 'File too large', color: 'text-amber-600', bg: 'bg-amber-50', Icon: AlertTriangle },
  manual:     { label: 'Manual', color: 'text-indigo-600', bg: 'bg-indigo-50', Icon: PenLine },
};

export default function TranscriptManager({ videoId, videoTitle, hasVideoUrl }: Props) {
  const queryClient = useQueryClient();
  const [showText, setShowText] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualText, setManualText] = useState('');

  const { data: transcript, isLoading } = useQuery<Transcript | null>({
    queryKey: ['transcript', videoId],
    queryFn: () =>
      api.get(`/videos/${videoId}/transcript`).then(r => r.data).catch(e => {
        if (e.response?.status === 404) return null;
        throw e;
      }),
    refetchInterval: (query) =>
      (query.state.data as Transcript | null)?.status === 'processing' ? 3000 : false,
  });

  const triggerTranscription = useMutation({
    mutationFn: () => api.post(`/videos/${videoId}/transcribe`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcript', videoId] });
      toast.success('Transcription started — this may take a minute');
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to start transcription'),
  });

  const saveManual = useMutation({
    mutationFn: () => api.put(`/videos/${videoId}/transcript`, { text: manualText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcript', videoId] });
      setManualMode(false);
      toast.success('Transcript saved');
    },
    onError: () => toast.error('Failed to save transcript'),
  });

  const deleteTranscript = useMutation({
    mutationFn: () => api.delete(`/videos/${videoId}/transcript`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcript', videoId] });
      setManualMode(false);
      setManualText('');
      toast.success('Transcript deleted');
    },
    onError: () => toast.error('Failed to delete transcript'),
  });

  const status = transcript?.status ?? 'pending';
  const cfg = STATUS_CONFIG[status];
  const hasContent = !!transcript?.full_text;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
        <Loader2 size={14} className="animate-spin" /> Loading transcript…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.bg, cfg.color)}>
          <cfg.Icon size={12} className={status === 'processing' ? 'animate-spin' : ''} />
          {cfg.label}
          {transcript?.word_count ? ` · ${transcript.word_count.toLocaleString()} words` : ''}
        </div>

        {transcript?.language && transcript.status === 'done' && (
          <span className="text-xs text-gray-400 uppercase tracking-wide">{transcript.language}</span>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Auto-transcribe */}
          {hasVideoUrl && status !== 'processing' && (
            <button
              onClick={() => triggerTranscription.mutate()}
              disabled={triggerTranscription.isPending}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold transition-colors disabled:opacity-50"
              title="Auto-transcribe using Groq Whisper"
            >
              <Sparkles size={11} />
              {status === 'done' || status === 'manual' ? 'Re-transcribe' : 'Auto-transcribe'}
            </button>
          )}

          {/* Manual input */}
          {!manualMode && (
            <button
              onClick={() => {
                setManualText(transcript?.full_text ?? '');
                setManualMode(true);
              }}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700 font-semibold transition-colors"
            >
              <PenLine size={11} />
              {hasContent ? 'Edit' : 'Manual'}
            </button>
          )}

          {/* Delete */}
          {hasContent && !manualMode && (
            <button
              onClick={() => { if (confirm('Delete this transcript?')) deleteTranscript.mutate(); }}
              className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete transcript"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {transcript?.error_message && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          {transcript.error_message}
        </div>
      )}

      {/* Processing info */}
      {status === 'processing' && (
        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
          <Loader2 size={12} className="animate-spin" />
          Transcribing video… this page will update automatically when done.
        </div>
      )}

      {/* Manual input area */}
      {manualMode && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-600">
            Transcript text <span className="font-normal text-gray-400">(paste or type the video content)</span>
          </label>
          <textarea
            autoFocus
            rows={10}
            value={manualText}
            onChange={e => setManualText(e.target.value)}
            placeholder="Paste or type the transcript here. The AI will use this to answer student questions in context…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition font-mono leading-relaxed"
          />
          <p className="text-xs text-gray-400">{manualText.split(/\s+/).filter(Boolean).length} words</p>
          <div className="flex gap-2">
            <button
              onClick={() => { setManualMode(false); setManualText(''); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => saveManual.mutate()}
              disabled={!manualText.trim() || saveManual.isPending}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 font-semibold disabled:opacity-50 transition-colors"
            >
              {saveManual.isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
              Save Transcript
            </button>
          </div>
        </div>
      )}

      {/* Transcript preview (collapsible) */}
      {hasContent && !manualMode && (
        <div>
          <button
            onClick={() => setShowText(!showText)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 font-medium transition-colors"
          >
            {showText ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showText ? 'Hide' : 'Preview'} transcript
          </button>

          {showText && (
            <div className="mt-2 max-h-48 overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700 leading-relaxed font-mono">
              {transcript!.full_text}
            </div>
          )}
        </div>
      )}

      {/* AI context info */}
      {hasContent && (
        <p className="text-xs text-indigo-600 flex items-center gap-1">
          <Sparkles size={10} />
          AI Teacher will use this transcript to answer student questions in context
        </p>
      )}
    </div>
  );
}
