import { useEffect, useRef, useState, useCallback } from 'react';
import {
  X, Sparkles, Loader2, CheckCircle, AlertTriangle, RotateCcw, PenLine, GripHorizontal,
} from 'lucide-react';
import { useUIStore, usePlayerStore } from '../../store';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// ─── Pen colours ──────────────────────────────────────────────────────────────
const FONT  = `font-family:'Caveat',cursive`;
const BLUE  = `color:#1e40af`;          // blue pen — body text
const RED   = `color:#dc2626`;          // red pen  — bold / emphasis
const BLACK = `color:#111827`;          // black pen — headings

// ─── Notebook renderer ────────────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  // Block math
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      return `<div style="margin:1rem 0;padding:0.9rem 1.1rem;background:rgba(30,64,175,0.05);border:1.5px dashed #93c5fd;border-radius:10px;overflow-x:auto;">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<code style="${FONT};${RED};font-size:1rem;">$$${math}$$</code>`;
    }
  });

  // Inline math
  text = text.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try { return katex.renderToString(math, { displayMode: false, throwOnError: false }); }
    catch { return `<code style="${FONT};${RED};">$${math}$</code>`; }
  });

  // Headings — BLACK pen
  text = text.replace(/^### (.+)$/gm,
    `<h3 style="${FONT};font-size:1.25rem;font-weight:700;${BLACK};margin:1.1rem 0 0.1rem;line-height:2.2rem;letter-spacing:0.01em;">$1</h3>`);
  text = text.replace(/^## (.+)$/gm,
    `<h2 style="${FONT};font-size:1.5rem;font-weight:700;${BLACK};border-bottom:2.5px solid #111827;padding-bottom:2px;margin:1.6rem 0 0.2rem;line-height:2.2rem;letter-spacing:0.01em;">$1</h2>`);
  text = text.replace(/^# (.+)$/gm,
    `<h1 style="${FONT};font-size:1.85rem;font-weight:700;${BLACK};text-decoration:underline;text-underline-offset:5px;margin:0.6rem 0 0.2rem;line-height:2.4rem;letter-spacing:0.01em;">$1</h1>`);

  // Bold → RED pen
  text = text.replace(/\*\*(.+?)\*\*/g,
    `<strong style="${FONT};${RED};font-weight:700;font-size:inherit;">$1</strong>`);
  // Italic → deeper blue
  text = text.replace(/\*([^*\n]+?)\*/g,
    `<em style="${FONT};color:#1d4ed8;font-style:italic;">$1</em>`);

  // Inline code
  text = text.replace(/`([^`]+?)`/g,
    `<code style="font-family:monospace;${RED};background:rgba(220,38,38,0.08);padding:0.15rem 0.4rem;border-radius:5px;font-size:0.92rem;">$1</code>`);

  // Bullet lists — BLUE, red dash
  text = text.replace(/^[-•] (.+)$/gm,
    `<li style="${FONT};font-size:1.15rem;${BLUE};line-height:2.2rem;padding-left:1.6rem;position:relative;list-style:none;"><span style="position:absolute;left:0.3rem;${RED};font-weight:700;font-size:1.1rem;">–</span>$1</li>`);
  text = text.replace(/(<li[\s\S]+?<\/li>)/g, `<ul style="padding:0;margin:0.3rem 0;">$1</ul>`);

  // Numbered lists
  text = text.replace(/^\d+\. (.+)$/gm,
    `<li style="${FONT};font-size:1.15rem;${BLUE};line-height:2.2rem;list-style:decimal;margin-left:1.6rem;">$1</li>`);

  // Paragraphs — BLUE pen
  const P = `style="${FONT};font-size:1.15rem;${BLUE};line-height:2.2rem;margin:0 0 0.2rem;"`;
  text = text.replace(/\n\n/g, `</p><p ${P}>`);
  text = `<p ${P}>${text}</p>`;
  text = text.replace(/\n/g, '<br/>');

  return text;
}

// ─── Component ────────────────────────────────────────────────────────────────

type Phase = 'input' | 'streaming' | 'done' | 'error';

export default function AskAIModal() {
  const { aiAskVideoId, aiAskTimestamp, closeAIAsk } = useUIStore();
  const { currentTime } = usePlayerStore();

  const [phase, setPhase]           = useState<Phase>('input');
  const [question, setQuestion]     = useState('');
  const [streamedText, setStreamedText] = useState('');
  const [rendered, setRendered]     = useState('');

  // Drag state
  const [pos, setPos]       = useState({ x: window.innerWidth / 2 - 440, y: window.innerHeight / 2 - 320 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const scrollRef   = useRef<HTMLDivElement>(null);
  const readerRef   = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef    = useRef<HTMLDivElement>(null);

  const timestamp = currentTime || aiAskTimestamp;

  useEffect(() => { textareaRef.current?.focus(); }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [streamedText]);

  useEffect(() => {
    if (phase === 'done' && streamedText) setRendered(renderMarkdown(streamedText));
  }, [phase, streamedText]);

  // ── Drag handlers ──
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  }, [pos]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const x = Math.max(0, Math.min(window.innerWidth  - 880, e.clientX - dragOffset.current.x));
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
    setPhase('input'); setQuestion(''); setStreamedText(''); setRendered('');
  }

  async function handleSubmit() {
    const q = question.trim();
    if (!q || !aiAskVideoId) return;
    setPhase('streaming'); setStreamedText(''); setRendered('');

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap');
        @keyframes nb-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .katex-display { overflow-x: auto; }
      `}</style>

      {/* Transparent overlay — doesn't block video clicks */}
      <div className="fixed inset-0 z-50 pointer-events-none" />

      {/* Draggable notebook panel */}
      <div
        ref={modalRef}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          width: 820,
          maxHeight: '82vh',
          zIndex: 51,
          display: 'flex',
          flexDirection: 'column',
          background: '#fffef5',
          border: '1px solid #d9cfa8',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          pointerEvents: 'all',
          userSelect: dragging ? 'none' : 'auto',
        }}
      >

        {/* ── Header / drag handle ── */}
        <div
          onMouseDown={onMouseDown}
          style={{
            background: '#1a3a5c',
            borderBottom: '3px solid #dc2626',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: dragging ? 'grabbing' : 'grab',
            flexShrink: 0,
          }}
        >
          <GripHorizontal size={16} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', flexShrink: 0 }}>
            <PenLine size={16} style={{ color: '#fff' }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'Caveat, cursive', fontSize: '1.25rem', color: '#fff', fontWeight: 700, letterSpacing: '0.02em' }}>
                Study Notes
              </span>
              {phase === 'streaming' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#93c5fd' }}>
                  <Loader2 size={11} className="animate-spin" /> writing...
                </span>
              )}
              {phase === 'done' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 500 }}>
                  <CheckCircle size={11} /> complete
                </span>
              )}
              {phase === 'error' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#fca5a5' }}>
                  <AlertTriangle size={11} /> error
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              Private · only visible to you · drag to move
            </p>
          </div>

          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={closeAIAsk}
            style={{ color: 'rgba(255,255,255,0.55)', padding: 6, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Notebook paper body ── */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            // Ruled lines aligned to Caveat line-height of 2.2rem
            backgroundImage: 'linear-gradient(#bfdbfe 1px, transparent 1px)',
            backgroundSize: '100% 2.2rem',
            backgroundPositionY: '2.15rem',
            // Red margin line
            borderLeft: '3px solid #dc2626',
            marginLeft: '3.5rem',
            paddingLeft: '1.4rem',
            paddingRight: '2.5rem',
            paddingTop: '1.1rem',
            paddingBottom: '2rem',
          }}
        >

          {/* Input phase */}
          {phase === 'input' && (
            <div>
              <p style={{ fontFamily: 'Caveat, cursive', fontSize: '1.1rem', color: '#1e40af', lineHeight: '2.2rem', marginBottom: '0.5rem' }}>
                What would you like to understand better?
              </p>
              <textarea
                ref={textareaRef}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={4}
                placeholder="Write your question here..."
                style={{
                  fontFamily: 'Caveat, cursive',
                  fontSize: '1.2rem',
                  color: '#1e40af',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  width: '100%',
                  lineHeight: '2.2rem',
                  caretColor: '#1e40af',
                }}
              />
              <p style={{ fontFamily: 'Caveat, cursive', fontSize: '0.9rem', color: '#9ca3af', marginTop: '0.3rem' }}>
                Press Enter to send · Shift+Enter for new line
              </p>

              <div style={{ marginTop: '1.4rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['Explain this simply', 'Give a real-world example', 'What was just covered?', 'Why does this matter?'].map(hint => (
                  <button
                    key={hint}
                    onClick={() => setQuestion(hint)}
                    style={{
                      fontFamily: 'Caveat, cursive',
                      fontSize: '0.95rem',
                      color: '#1e40af',
                      border: '1.5px dashed #93c5fd',
                      borderRadius: 999,
                      padding: '0.2rem 0.85rem',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Connecting */}
          {phase === 'streaming' && !streamedText && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Caveat, cursive', color: '#1e40af', fontSize: '1.1rem' }}>
              <Loader2 size={16} className="animate-spin" />
              Connecting...
            </div>
          )}

          {/* Streaming — blue ink, blinking cursor */}
          {phase === 'streaming' && streamedText && (
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: '1.2rem', color: '#1e40af', whiteSpace: 'pre-wrap', lineHeight: '2.2rem' }}>
              {streamedText}
              <span style={{ display: 'inline-block', width: 2, height: '1.25rem', background: '#1e40af', marginLeft: 2, verticalAlign: 'middle', animation: 'nb-blink 1s step-end infinite' }} />
            </div>
          )}

          {/* Done — rendered notebook */}
          {phase === 'done' && rendered && (
            <div dangerouslySetInnerHTML={{ __html: rendered }} />
          )}

          {/* Error */}
          {phase === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 160, textAlign: 'center', gap: 12 }}>
              <AlertTriangle size={36} style={{ color: '#f59e0b' }} />
              <p style={{ fontFamily: 'Caveat, cursive', fontSize: '1.15rem', color: '#dc2626' }}>
                Couldn't reach the AI — check GROQ_API_KEY in .env
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ background: '#f5f0dc', borderTop: '2px solid #e2d9b3', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Caveat, cursive', fontSize: '0.9rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={12} style={{ color: '#1e40af' }} />
            AI Tutor · private session
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {(phase === 'done' || phase === 'error') && (
              <button
                onClick={handleReset}
                style={{ fontFamily: 'Caveat, cursive', fontSize: '1rem', color: '#4b5563', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '4px 14px', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <RotateCcw size={13} /> Ask another
              </button>
            )}
            {phase === 'done' && (
              <button
                onClick={closeAIAsk}
                style={{ fontFamily: 'Caveat, cursive', fontSize: '1rem', color: '#fff', background: '#1a3a5c', border: 'none', borderRadius: 8, padding: '5px 18px', cursor: 'pointer' }}
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
