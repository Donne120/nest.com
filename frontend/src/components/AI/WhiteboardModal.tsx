import { useEffect, useRef, useState } from 'react';
import { X, Sparkles, Loader2, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react';
import { useUIStore } from '../../store';
import { useQueryClient } from '@tanstack/react-query';
import RichText from '../UI/RichText';

interface Props {
  questionId: string;
  questionText: string;
  videoId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WhiteboardModal({ questionId, questionText, videoId }: Props) {
  const { closeWhiteboard } = useUIStore();
  const queryClient = useQueryClient();
  const [streamedText, setStreamedText] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [hasError, setHasError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  // Auto-scroll as text streams in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamedText]);

  // When streaming completes, refresh the sidebar so the AI answer appears there
  useEffect(() => {
    if (isDone && streamedText) {
      queryClient.invalidateQueries({ queryKey: ['questions', videoId] });
    }
  }, [isDone, streamedText, videoId, queryClient]);

  // Start SSE stream on mount
  useEffect(() => {
    const token = localStorage.getItem('nest_token');
    if (!token) return;

    const apiBase = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/api`
      : '/api';

    let cancelled = false;

    async function startStream() {
      try {
        const response = await fetch(`${apiBase}/ai/stream/${questionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok || !response.body) {
          setHasError(true);
          return;
        }

        const reader = response.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.token) {
                setStreamedText(prev => prev + parsed.token);
              }
              if (parsed.done) {
                setIsDone(true);
              }
              if (parsed.error) {
                setHasError(true);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch {
        if (!cancelled) setHasError(true);
      }
    }

    startStream();

    return () => {
      cancelled = true;
      readerRef.current?.cancel();
    };
  }, [questionId]);

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4"
      style={{ background: 'rgba(11,10,15,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="nai-katex w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
        style={{ background: SURFACE, border: `1px solid ${EDGE}`, borderRadius: 16, boxShadow: '0 40px 90px -20px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04) inset', animation: 'nai-rise 0.25s cubic-bezier(0.16,1,0.3,1) both' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 flex-shrink-0" style={{ background: RAISED, borderBottom: `1px solid ${EDGE}` }}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ background: ACC_SOFT, border: '1px solid rgba(176,108,198,0.3)', color: ACC }}>
            <Sparkles size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: UIFONT, fontSize: 14, fontWeight: 700, color: TXT }}>Nest AI</span>
              {!isDone && !hasError && (
                <span className="flex items-center gap-1" style={{ fontFamily: MONO, fontSize: 11, color: ACC }}>
                  <Loader2 size={11} className="animate-spin" /> thinking
                </span>
              )}
              {isDone && (
                <span className="flex items-center gap-1" style={{ fontFamily: MONO, fontSize: 11, color: '#8BD450' }}>
                  <CheckCircle size={11} /> answered
                </span>
              )}
              {hasError && (
                <span className="flex items-center gap-1" style={{ fontFamily: MONO, fontSize: 11, color: '#E0765A' }}>
                  <AlertTriangle size={11} /> error
                </span>
              )}
            </div>
            <p className="truncate mt-0.5 flex items-center gap-1" style={{ fontFamily: MONO, fontSize: 10.5, color: TXT3 }}>
              <BookOpen size={10} /> {questionText}
            </p>
          </div>
          <button onClick={closeWhiteboard} className="p-1.5 rounded-lg flex-shrink-0" title="Close"
            style={{ color: TXT3, background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = TXT)}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = TXT3)}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">
          {hasError && (
            <div className="flex flex-col items-center justify-center h-40 text-center gap-3">
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(224,118,90,0.12)', border: '1px solid rgba(224,118,90,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E0765A' }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <p style={{ fontFamily: UIFONT, fontSize: 14.5, color: TXT, fontWeight: 500 }}>Couldn't reach the AI right now</p>
                <p style={{ fontFamily: MONO, fontSize: 11, color: TXT3, marginTop: 4 }}>Please try again in a moment, or contact your instructor.</p>
              </div>
            </div>
          )}

          {!hasError && !isDone && streamedText && (
            <div className="whitespace-pre-wrap" style={{ fontFamily: UIFONT, fontSize: 15, color: TXT, lineHeight: 1.7 }}>
              {streamedText}
              <span className="inline-block align-middle" style={{ width: 2, height: '1.05rem', background: GOLD, marginLeft: 2, animation: 'nai-blink 0.8s step-end infinite' }} />
            </div>
          )}

          {!hasError && isDone && streamedText && (
            <RichText tone="on-dark">{streamedText}</RichText>
          )}

          {!hasError && !streamedText && !isDone && (
            <div className="flex items-center gap-2" style={{ fontFamily: UIFONT, fontSize: 14, color: TXT2 }}>
              <Loader2 size={16} className="animate-spin" style={{ color: ACC }} /> Reading the lesson…
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ background: RAISED, borderTop: `1px solid ${EDGE}` }}>
          <p className="flex items-center gap-1.5" style={{ fontFamily: MONO, fontSize: 10.5, color: TXT3 }}>
            <Sparkles size={11} style={{ color: ACC }} />
            AI-generated · your instructor will review this
          </p>
          {isDone && (
            <button onClick={closeWhiteboard} className="flex items-center gap-1.5"
              style={{ fontFamily: UIFONT, fontSize: 12.5, fontWeight: 600, color: '#fff', background: ACC, borderRadius: 8, padding: '7px 16px', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#9a4fb0')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = ACC)}>
              Continue watching
            </button>
          )}
        </div>
      </div>

      <style>{`
        .nai-katex .katex, .nai-katex .katex * { color: ${TXT} !important; }
        .katex-display { overflow-x: auto; }
      `}</style>
    </div>
  );
}

// Shared Nest AI palette (kept in sync with AskAIModal)
const SURFACE = '#171219';
const RAISED  = '#1f1826';
const EDGE    = 'rgba(255,255,255,0.09)';
const TXT     = '#ECE8F0';
const TXT2    = '#A79FB0';
const TXT3    = '#756D80';
const ACC     = '#6D4AE0';   // Calm Purple violet (was off-palette orchid #B06CC6)
const ACC_SOFT = 'rgba(109,74,224,0.14)';
const GOLD    = '#E8B04B';
const UIFONT  = "'Inter Tight','Inter',system-ui,sans-serif";
const MONO    = "'DM Mono',ui-monospace,monospace";
