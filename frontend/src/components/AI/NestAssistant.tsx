import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, RotateCcw, ChevronDown } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useUIStore } from '../../store';
import api from '../../api/client';

const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['strong', 'em', 'code', 'p', 'br', 'ul', 'ol', 'li', 'span'],
  ALLOWED_ATTR: ['style'],
  FORCE_BODY: true,
} as const;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'How do I ask a question during a video?',
  'Where can I find my assignments?',
  'How do I book a meeting?',
  'What does the AI Study Notebook do?',
];

function renderMarkdown(text: string) {
  // Bold
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:12px;font-family:monospace">$1</code>');
  // Headers
  html = html.replace(/^### (.+)$/gm, '<p style="font-weight:700;color:#e8c97e;font-size:13px;margin:10px 0 4px">$1</p>');
  html = html.replace(/^## (.+)$/gm, '<p style="font-weight:700;color:#e8c97e;font-size:14px;margin:12px 0 4px">$1</p>');
  // Bullet points
  html = html.replace(/^[-•] (.+)$/gm, '<li style="margin:2px 0;padding-left:4px">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul style="margin:4px 0 4px 12px;list-style:disc">${m}</ul>`);
  // Newlines
  html = html.replace(/\n{2,}/g, '<br/><br/>');
  html = html.replace(/\n/g, '<br/>');
  return html;
}

export default function NestAssistant() {
  const { nestAssistantOpen, closeNestAssistant } = useUIStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (nestAssistantOpen && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [nestAssistantOpen, minimized]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  if (!nestAssistantOpen) return null;

  async function send(text?: string) {
    const question = (text ?? input).trim();
    if (!question || streaming) return;
    setInput('');
    setMinimized(false);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const userMsg: Message = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMsg]);
    setStreaming(true);

    let collected = '';
    let stopped = false;

    abortRef.current = () => { stopped = true; };

    try {
      const res = await api.post('/ai/platform-ask', {
        question,
        history,
      }, { responseType: 'text', headers: { Accept: 'text/event-stream' } });

      // Parse SSE from buffered text response
      const lines = (res.data as string).split('\n');
      for (const line of lines) {
        if (stopped) break;
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') break;
        try {
          const chunk = JSON.parse(data);
          if (chunk.token) {
            collected += chunk.token;
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: 'assistant', content: collected };
              return copy;
            });
          }
          if (chunk.done || chunk.error) break;
        } catch { continue; }
      }
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: 'assistant',
          content: 'Sorry, I had trouble connecting. Please try again.',
        };
        return copy;
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function clearChat() {
    if (streaming) abortRef.current?.();
    setMessages([]);
    setStreaming(false);
  }

  const isEmpty = messages.length === 0;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 360,
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.09)',
        background: 'rgba(14,15,20,0.98)',
        backdropFilter: 'blur(20px)',
        transition: 'height 0.25s ease',
        height: minimized ? 52 : 520,
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 52,
          minHeight: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 14px',
          borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(20,21,28,0.95)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onClick={() => setMinimized((m) => !m)}
      >
        <span style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg,#e8c97e22,#c45c3c22)',
          border: '1px solid rgba(232,201,126,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Sparkles size={14} style={{ color: '#e8c97e' }} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#e8e4dc', margin: 0 }}>Nest Assistant</p>
          {!minimized && (
            <p style={{ fontSize: 11, color: '#6b6b78', margin: 0 }}>Ask anything about the platform</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
          {!isEmpty && (
            <button
              onClick={clearChat}
              title="Clear chat"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#6b6b78', padding: 4, borderRadius: 6,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#9ca3af')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b6b78')}
            >
              <RotateCcw size={13} />
            </button>
          )}
          <button
            onClick={() => setMinimized((m) => !m)}
            title={minimized ? 'Expand' : 'Minimise'}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#6b6b78', padding: 4, borderRadius: 6,
              transform: minimized ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={closeNestAssistant}
            title="Close"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#6b6b78', padding: 4, borderRadius: 6,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c45c3c')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b6b78')}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isEmpty ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', paddingTop: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'linear-gradient(135deg,#e8c97e22,#c45c3c22)',
                  border: '1px solid rgba(232,201,126,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={22} style={{ color: '#e8c97e' }} />
                </div>
                <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 1.5, maxWidth: 260 }}>
                  Hi! Ask me anything about using Nest — features, how-to, or troubleshooting.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 12.5,
                        color: '#9ca3af',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(232,201,126,0.08)';
                        e.currentTarget.style.borderColor = 'rgba(232,201,126,0.2)';
                        e.currentTarget.style.color = '#e8c97e';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                        e.currentTarget.style.color = '#9ca3af';
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    gap: 8,
                    alignItems: 'flex-start',
                  }}
                >
                  {msg.role === 'assistant' && (
                    <span style={{
                      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                      background: 'linear-gradient(135deg,#e8c97e22,#c45c3c22)',
                      border: '1px solid rgba(232,201,126,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 2,
                    }}>
                      <Sparkles size={11} style={{ color: '#e8c97e' }} />
                    </span>
                  )}
                  <div
                    style={{
                      maxWidth: '82%',
                      padding: '8px 11px',
                      borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      fontSize: 13,
                      lineHeight: 1.55,
                      background: msg.role === 'user'
                        ? 'rgba(232,201,126,0.12)'
                        : 'rgba(255,255,255,0.05)',
                      border: msg.role === 'user'
                        ? '1px solid rgba(232,201,126,0.2)'
                        : '1px solid rgba(255,255,255,0.07)',
                      color: msg.role === 'user' ? '#e8e4dc' : '#c8c4bc',
                    }}
                  >
                    {msg.role === 'assistant' ? (
                      <span dangerouslySetInnerHTML={{ __html: String(DOMPurify.sanitize(
                        renderMarkdown(msg.content) || (streaming && i === messages.length - 1 ? '<span style="opacity:0.5">▍</span>' : ''),
                        PURIFY_CONFIG
                      )) }} />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about Nest…"
              rows={1}
              disabled={streaming}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 10,
                padding: '8px 10px',
                fontSize: 13,
                color: '#e8e4dc',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                maxHeight: 80,
                overflow: 'auto',
                opacity: streaming ? 0.6 : 1,
              }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 80) + 'px';
              }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || streaming}
              style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: input.trim() && !streaming ? '#e8c97e' : 'rgba(255,255,255,0.06)',
                border: 'none', cursor: input.trim() && !streaming ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              <Send size={14} style={{ color: input.trim() && !streaming ? '#0b0c0f' : '#6b6b78' }} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
