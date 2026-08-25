import { useEffect, useRef, useState, useCallback } from 'react';
import {
  X, Sparkles, Loader2, CheckCircle, AlertTriangle, RotateCcw, GripHorizontal,
} from 'lucide-react';
import { useUIStore, usePlayerStore } from '../../store';
import RichText from '../UI/RichText';

// ─── Nest AI palette (dark, premium — matches the video player & landing) ─────
const SURFACE = '#171219';   // panel body
const RAISED  = '#1f1826';   // header / footer
const EDGE    = 'rgba(255,255,255,0.09)';
const TXT     = '#ECE8F0';
const TXT2    = '#A79FB0';
const TXT3    = '#756D80';
const ACC     = '#6D4AE0';   // Calm Purple violet (was off-palette orchid #B06CC6)
const ACC_SOFT = 'rgba(109,74,224,0.14)';
const GOLD    = '#E8B04B';   // streaming caret / signature
const UIFONT  = "'Inter Tight','Inter',system-ui,sans-serif";
const MONO    = "'DM Mono',ui-monospace,monospace";

type Phase = 'input' | 'streaming' | 'done' | 'error';

export default function AskAIModal() {
  const { aiAskVideoId, aiAskTimestamp, aiAskHasTranscript, closeAIAsk } = useUIStore();
  const { currentTime } = usePlayerStore();

  const [phase, setPhase]           = useState<Phase>('input');
  const [question, setQuestion]     = useState('');
  const [streamedText, setStreamedText] = useState('');

  const [pos, setPos]       = useState({ x: window.innerWidth / 2 - 320, y: window.innerHeight / 2 - 280 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const scrollRef   = useRef<HTMLDivElement>(null);
  const readerRef   = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef    = useRef<HTMLDivElement>(null);

  const timestamp = currentTime || aiAskTimestamp;

  useEffect(() => { textareaRef.current?.focus(); }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [streamedText]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  }, [pos]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const x = Math.max(0, Math.min(window.innerWidth  - 660, e.clientX - dragOffset.current.x));
      const y = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y));
      setPos({ x, y });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging]);

  function handleReset() {
    readerRef.current?.cancel();
    setPhase('input'); setQuestion(''); setStreamedText('');
  }

  async function handleSubmit() {
    const q = question.trim();
    if (!q || !aiAskVideoId) return;
    setPhase('streaming'); setStreamedText('');

    const token = localStorage.getItem('nest_token');
    if (!token) { setPhase('error'); return; }

    const apiBase = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

    try {
      const response = await fetch(`${apiBase}/ai/direct-ask`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, video_id: aiAskVideoId, timestamp }),
      });
      if (!response.ok || !response.body) { setPhase('error'); return; }

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const p = JSON.parse(line.slice(6));
            if (p.token) setStreamedText(prev => prev + p.token);
            if (p.done)  setPhase('done');
            if (p.error) setPhase('error');
          } catch { /* ignore */ }
        }
      }
    } catch { setPhase('error'); }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      <style>{`
        @keyframes nai-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes nai-rise  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .nai-katex .katex, .nai-katex .katex * { color: ${TXT} !important; }
        .katex-display { overflow-x: auto; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 89 }} />

      <div
        ref={modalRef}
        className="nai-katex"
        style={{
          position: 'fixed',
          left: isMobile ? 8 : pos.x,
          top: isMobile ? 64 : pos.y,
          width: isMobile ? 'calc(100vw - 16px)' : 620,
          maxHeight: isMobile ? 'calc(100dvh - 148px)' : '80vh',
          zIndex: 90,
          display: 'flex', flexDirection: 'column',
          background: SURFACE,
          border: `1px solid ${EDGE}`,
          borderRadius: 16,
          boxShadow: '0 40px 90px -20px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04) inset',
          overflow: 'hidden',
          pointerEvents: 'all',
          userSelect: dragging ? 'none' : 'auto',
          animation: 'nai-rise 0.25s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {/* Header / drag handle */}
        <div
          onMouseDown={onMouseDown}
          style={{
            background: RAISED, borderBottom: `1px solid ${EDGE}`,
            padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 11,
            cursor: dragging ? 'grabbing' : 'grab', flexShrink: 0,
          }}
        >
          <GripHorizontal size={15} style={{ color: TXT3, flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: ACC_SOFT, border: `1px solid rgba(176,108,198,0.3)`, flexShrink: 0, color: ACC }}>
            <Sparkles size={15} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: UIFONT, fontSize: 14, color: TXT, fontWeight: 700, letterSpacing: '-0.01em' }}>Nest AI</span>
              {phase === 'streaming' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: ACC, fontFamily: MONO }}>
                  <Loader2 size={11} className="animate-spin" /> thinking
                </span>
              )}
              {phase === 'done' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#8BD450', fontFamily: MONO }}>
                  <CheckCircle size={11} /> answered
                </span>
              )}
              {phase === 'error' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#E0765A', fontFamily: MONO }}>
                  <AlertTriangle size={11} /> error
                </span>
              )}
            </div>
            <p style={{ fontFamily: MONO, fontSize: 10, color: TXT3, marginTop: 2, letterSpacing: '0.02em' }}>
              Private to you · drag to move
            </p>
          </div>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={closeAIAsk}
            style={{ color: TXT3, padding: 6, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}
            title="Close"
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = TXT)}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = TXT3)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 20px' }}>

          {phase === 'input' && (
            <div>
              <p style={{ fontFamily: UIFONT, fontSize: 15, color: TXT, lineHeight: 1.5, marginBottom: 12, fontWeight: 500 }}>
                What would you like to understand better?
              </p>
              <textarea
                ref={textareaRef}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder="Ask anything about this moment in the video…"
                style={{
                  fontFamily: UIFONT, fontSize: 15, color: TXT,
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${EDGE}`,
                  outline: 'none', resize: 'none', width: '100%', lineHeight: 1.6,
                  caretColor: ACC, borderRadius: 10, padding: '12px 14px', boxSizing: 'border-box',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(176,108,198,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = EDGE)}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
                <p style={{ fontFamily: MONO, fontSize: 10.5, color: TXT3 }}>Enter to send · Shift+Enter for a new line</p>
                <p style={{ fontFamily: MONO, fontSize: 10.5, color: aiAskHasTranscript ? '#8BD450' : GOLD, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: aiAskHasTranscript ? '#8BD450' : GOLD, display: 'inline-block' }} />
                  {aiAskHasTranscript ? 'Grounded in this video' : 'Using course context'}
                </p>
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Explain this simply', 'Give a real-world example', 'What was just covered?', 'Why does this matter?'].map(hint => (
                  <button
                    key={hint}
                    onClick={() => setQuestion(hint)}
                    style={{
                      fontFamily: UIFONT, fontSize: 12.5, fontWeight: 500, color: TXT2,
                      border: `1px solid ${EDGE}`, borderRadius: 999, padding: '6px 13px',
                      background: 'transparent', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(176,108,198,0.5)'; el.style.color = TXT; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = EDGE; el.style.color = TXT2; }}
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === 'streaming' && !streamedText && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: UIFONT, color: TXT2, fontSize: 14 }}>
              <Loader2 size={16} className="animate-spin" style={{ color: ACC }} />
              Reading the lesson…
            </div>
          )}

          {phase === 'streaming' && streamedText && (
            <div style={{ fontFamily: UIFONT, fontSize: 15, color: TXT, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {streamedText}
              <span style={{ display: 'inline-block', width: 2, height: '1.05rem', background: GOLD, marginLeft: 2, verticalAlign: 'middle', animation: 'nai-blink 0.8s step-end infinite' }} />
            </div>
          )}

          {phase === 'done' && streamedText && (
            <RichText tone="on-dark">{streamedText}</RichText>
          )}

          {phase === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 150, textAlign: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(224,118,90,0.12)', border: '1px solid rgba(224,118,90,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E0765A' }}>
                <AlertTriangle size={22} />
              </div>
              <p style={{ fontFamily: UIFONT, fontSize: 14.5, color: TXT }}>
                Couldn't reach the AI right now — please try again in a moment.
              </p>
              <p style={{ fontFamily: MONO, fontSize: 11, color: TXT3 }}>
                If this keeps happening, contact your instructor.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ background: RAISED, borderTop: `1px solid ${EDGE}`, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: TXT3, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={11} style={{ color: ACC }} />
            Nest AI · private session
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {(phase === 'done' || phase === 'error') && (
              <button
                onClick={handleReset}
                style={{ fontFamily: UIFONT, fontSize: 12.5, fontWeight: 500, color: TXT2, border: `1px solid ${EDGE}`, borderRadius: 8, padding: '6px 13px', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = TXT)}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = TXT2)}
              >
                <RotateCcw size={13} /> Ask another
              </button>
            )}
            {phase === 'done' && (
              <button
                onClick={closeAIAsk}
                style={{ fontFamily: UIFONT, fontSize: 12.5, fontWeight: 600, color: '#fff', background: ACC, border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#9a4fb0')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = ACC)}
              >
                Continue watching
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
