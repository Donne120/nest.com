import { useEffect, useRef, useState } from 'react';
import { X, Sparkles, Loader2, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react';
import { useUIStore } from '../../store';
import { useQueryClient } from '@tanstack/react-query';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface Props {
  questionId: string;
  questionText: string;
  videoId: string;
}

// ─── Math + Markdown renderer ─────────────────────────────────────────────────

function renderToken(text: string): string {
  // Block math  $$...$$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      return `<div class="wb-math-block">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<code class="wb-math-fallback">$$${math}$$</code>`;
    }
  });

  // Inline math  $...$
  text = text.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math, { displayMode: false, throwOnError: false });
    } catch {
      return `<code>$${math}$</code>`;
    }
  });

  // ### sub-heading
  text = text.replace(/^### (.+)$/gm, '<h3 class="wb-h3">$1</h3>');
  // ## section heading
  text = text.replace(/^## (.+)$/gm, '<h2 class="wb-h2">$1</h2>');
  // # main heading
  text = text.replace(/^# (.+)$/gm, '<h1 class="wb-h1">$1</h1>');

  // **bold**
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // *italic*
  text = text.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');

  // `code`
  text = text.replace(/`([^`]+?)`/g, '<code class="wb-code">$1</code>');

  // Bullet points
  text = text.replace(/^[-•] (.+)$/gm, '<li class="wb-li">$1</li>');
  text = text.replace(/(<li[\s\S]+?<\/li>)/g, '<ul class="wb-ul">$1</ul>');

  // Numbered lists
  text = text.replace(/^\d+\. (.+)$/gm, '<li class="wb-li wb-li-num">$1</li>');

  // Paragraph breaks (double newline)
  text = text.replace(/\n\n/g, '</p><p class="wb-p">');
  text = `<p class="wb-p">${text}</p>`;

  // Single newlines (inside paragraphs)
  text = text.replace(/\n/g, '<br/>');

  return text;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WhiteboardModal({ questionId, questionText, videoId }: Props) {
  const { closeWhiteboard } = useUIStore();
  const queryClient = useQueryClient();
  const [streamedText, setStreamedText] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [rendered, setRendered] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  // Auto-scroll as text streams in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamedText]);

  // Render full markdown+math when streaming completes
  useEffect(() => {
    if (isDone && streamedText) {
      setRendered(renderToken(streamedText));
      // Invalidate questions so AI answer appears in sidebar
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-in">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-brand-50 to-indigo-50 flex-shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 text-white shadow-sm flex-shrink-0">
            <Sparkles size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-brand-700">AI Teacher</span>
              {!isDone && !hasError && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Loader2 size={11} className="animate-spin" />
                  Thinking...
                </span>
              )}
              {isDone && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle size={11} />
                  Done
                </span>
              )}
              {hasError && (
                <span className="flex items-center gap-1 text-xs text-red-500">
                  <AlertTriangle size={11} />
                  Error
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              <BookOpen size={10} className="inline mr-1" />
              {questionText}
            </p>
          </div>
          <button
            onClick={closeWhiteboard}
            className="p-1.5 hover:bg-white/80 rounded-lg transition-colors flex-shrink-0"
            title="Close"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Content area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
          {hasError && (
            <div className="flex flex-col items-center justify-center h-40 text-center gap-3">
              <AlertTriangle size={32} className="text-amber-400" />
              <div>
                <p className="text-gray-700 font-medium">Couldn't reach the AI</p>
                <p className="text-gray-400 text-sm mt-1">Check that GROQ_API_KEY is set in your .env</p>
              </div>
            </div>
          )}

          {!hasError && !isDone && (
            /* Streaming: show raw text with cursor effect */
            <div className="whiteboard-stream font-mono text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {streamedText}
              <span className="inline-block w-0.5 h-4 bg-brand-500 ml-0.5 animate-pulse align-middle" />
            </div>
          )}

          {!hasError && isDone && rendered && (
            /* Rendered: full markdown + math */
            <div
              className="whiteboard-rendered"
              dangerouslySetInnerHTML={{ __html: rendered }}
            />
          )}

          {!hasError && !streamedText && !isDone && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 size={16} className="animate-spin" />
              Connecting to AI...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/60 flex-shrink-0">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Sparkles size={11} className="text-brand-400" />
            AI-generated · your instructor will review this answer
          </p>
          {isDone && (
            <button
              onClick={closeWhiteboard}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              Continue watching
            </button>
          )}
        </div>
      </div>

      {/* Whiteboard styles */}
      <style>{`
        .whiteboard-rendered .wb-h1 {
          font-size: 1.35rem; font-weight: 700; color: #1e1b4b; margin: 1.2rem 0 0.5rem;
          border-bottom: 2px solid #e0e7ff; padding-bottom: 0.3rem;
        }
        .whiteboard-rendered .wb-h2 {
          font-size: 1.1rem; font-weight: 700; color: #3730a3;
          margin: 1.4rem 0 0.5rem; display: flex; align-items: center; gap: 0.4rem;
        }
        .whiteboard-rendered .wb-h2::before {
          content: '▸'; color: #6366f1; font-size: 0.85rem;
        }
        .whiteboard-rendered .wb-h3 {
          font-size: 0.95rem; font-weight: 600; color: #4338ca; margin: 1rem 0 0.3rem;
        }
        .whiteboard-rendered .wb-p {
          font-size: 0.95rem; color: #374151; line-height: 1.75; margin-bottom: 0.75rem;
        }
        .whiteboard-rendered .wb-math-block {
          margin: 1rem 0; padding: 1rem; background: #f5f3ff;
          border-left: 3px solid #6366f1; border-radius: 0 0.5rem 0.5rem 0;
          overflow-x: auto;
        }
        .whiteboard-rendered .wb-code {
          background: #f1f5f9; color: #0f172a; padding: 0.1rem 0.35rem;
          border-radius: 0.3rem; font-size: 0.85rem; font-family: monospace;
        }
        .whiteboard-rendered .wb-ul {
          margin: 0.5rem 0 0.75rem 1.2rem; list-style: none; padding: 0;
        }
        .whiteboard-rendered .wb-li {
          font-size: 0.92rem; color: #374151; line-height: 1.65;
          padding: 0.15rem 0; padding-left: 1rem; position: relative;
        }
        .whiteboard-rendered .wb-li::before {
          content: '→'; position: absolute; left: 0; color: #6366f1; font-weight: 700;
        }
        .whiteboard-rendered strong { color: #1e1b4b; }
        .whiteboard-rendered em { color: #4338ca; font-style: italic; }
        .katex-display { overflow-x: auto; }
      `}</style>
    </div>
  );
}
