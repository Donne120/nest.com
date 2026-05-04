import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Play, MessageSquare, X, ArrowRight, ArrowUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import clsx from 'clsx';

interface SearchResult {
  type: 'module' | 'video' | 'question';
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

const TYPE_ICON = {
  module:   { icon: BookOpen,      color: 'text-brand-500',  bg: 'bg-brand-50 dark:bg-brand-900/30'  },
  video:    { icon: Play,          color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/30'    },
  question: { icon: MessageSquare, color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/30'  },
};

const TYPE_LABEL = { module: 'Module', video: 'Lesson', question: 'Q&A' };

interface Props { open: boolean; onClose: () => void; }

export default function SearchModal({ open, onClose }: Props) {
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState(0);
  const navigate                = useNavigate();
  const inputRef                = useRef<HTMLInputElement>(null);

  const { data: results = [], isFetching } = useQuery<SearchResult[]>({
    queryKey: ['search', query],
    queryFn:  () => api.get(`/search?q=${encodeURIComponent(query)}`).then(r => r.data),
    enabled:  query.trim().length >= 2,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setQuery('');
      setSelected(0);
    }
  }, [open]);

  useEffect(() => { setSelected(0); }, [results]);

  // Prevent body scroll when open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const go = useCallback((url: string) => {
    navigate(url);
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')    { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && results[selected]) { go(results[selected].url); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, selected, go, onClose]);

  if (!open) return null;

  const grouped    = results.reduce<Record<string, SearchResult[]>>((acc, r) => { (acc[r.type] ??= []).push(r); return acc; }, {});
  const allResults = Object.values(grouped).flat();

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="search-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          animation: 'searchFadeIn 0.18s ease both',
        }}
      />

      {/* ── Panel — Desktop: centred card | Mobile: bottom sheet ── */}
      <div
        className="search-panel"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', zIndex: 201,
          display: 'flex', flexDirection: 'column',
          background: 'var(--search-bg, #fff)',
          overflow: 'hidden',
        }}
      >
        {/* ── Mobile drag handle ── */}
        <div className="search-handle-wrap">
          <div className="search-handle" />
        </div>

        {/* ── Input row ── */}
        <div
          className="flex items-center gap-3 px-4"
          style={{
            borderBottom: '1px solid var(--search-border, rgba(0,0,0,0.08))',
            paddingTop: 14, paddingBottom: 14,
            flexShrink: 0,
          }}
        >
          <Search size={18} style={{ color: 'var(--search-icon, #9ca3af)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search modules, lessons, Q&A…"
            style={{
              flex: 1,
              fontSize: 16, /* 16px prevents iOS zoom */
              color: 'var(--search-text, #111)',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              minWidth: 0,
            }}
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--search-clear-bg, rgba(0,0,0,0.06))',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                color: 'var(--search-icon, #9ca3af)',
              }}
            >
              <X size={13} />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="hidden sm:flex items-center justify-center"
              style={{
                height: 26, padding: '0 8px', borderRadius: 6,
                background: 'var(--search-clear-bg, rgba(0,0,0,0.06))',
                border: 'none', cursor: 'pointer',
                fontSize: 10, fontFamily: 'monospace',
                color: 'var(--search-icon, #9ca3af)',
                letterSpacing: '0.04em',
                flexShrink: 0,
              }}
            >
              ESC
            </button>
          )}
        </div>

        {/* ── Results ── */}
        <div className="search-results-scroll" style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {query.trim().length < 2 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
              <Search size={28} style={{ color: 'var(--search-icon, #d1d5db)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontSize: 14, color: 'var(--search-hint, #9ca3af)', lineHeight: 1.5 }}>
                Search across modules, lessons, and Q&A
              </p>
              <p style={{ fontSize: 12, color: 'var(--search-hint, #9ca3af)', marginTop: 6, opacity: 0.7 }}>
                Type at least 2 characters
              </p>
            </div>
          ) : isFetching ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                border: '2.5px solid #e8c97e', borderTopColor: 'transparent',
                animation: 'searchSpin 0.7s linear infinite',
                margin: '0 auto',
              }} />
            </div>
          ) : allResults.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--search-hint, #9ca3af)' }}>
                No results for <strong style={{ color: 'var(--search-text, #111)' }}>"{query}"</strong>
              </p>
            </div>
          ) : (
            <div style={{ paddingBottom: 12 }}>
              {(Object.entries(grouped) as [string, SearchResult[]][]).map(([type, items]) => (
                <div key={type}>
                  <p style={{
                    padding: '12px 16px 4px',
                    fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'var(--search-hint, #9ca3af)',
                  }}>
                    {type === 'module' ? 'Modules' : type === 'video' ? 'Lessons' : 'Q&A'}
                  </p>
                  {items.map(result => {
                    const globalIdx    = allResults.indexOf(result);
                    const { icon: Icon, color, bg } = TYPE_ICON[result.type as keyof typeof TYPE_ICON];
                    const isActive     = globalIdx === selected;
                    return (
                      <button
                        key={result.id}
                        onClick={() => go(result.url)}
                        onMouseEnter={() => setSelected(globalIdx)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                          padding: '11px 16px', textAlign: 'left', border: 'none', cursor: 'pointer',
                          background: isActive ? 'var(--search-active, rgba(232,201,126,0.08))' : 'transparent',
                          borderLeft: isActive ? '2px solid #e8c97e' : '2px solid transparent',
                          transition: 'all 0.12s',
                          fontFamily: 'inherit',
                        }}
                      >
                        <div className={clsx('flex items-center justify-center flex-shrink-0', bg)}
                          style={{ width: 36, height: 36, borderRadius: 10 }}>
                          <Icon size={15} className={color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: 14, fontWeight: 500,
                            color: 'var(--search-text, #111)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            marginBottom: 2,
                          }}>
                            {result.title}
                          </p>
                          <p style={{
                            fontSize: 12, color: 'var(--search-hint, #9ca3af)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {result.subtitle}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full', bg, color)}>
                            {TYPE_LABEL[result.type as keyof typeof TYPE_LABEL]}
                          </span>
                          <ArrowRight size={13} style={{ color: 'var(--search-hint, #d1d5db)' }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer — desktop only ── */}
        {allResults.length > 0 && (
          <div
            className="hidden sm:flex items-center gap-4 px-4 py-2.5"
            style={{
              borderTop: '1px solid var(--search-border, rgba(0,0,0,0.08))',
              fontSize: 10, color: 'var(--search-hint, #9ca3af)',
            }}
          >
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-gray-100 dark:bg-slate-700 rounded px-1 py-0.5">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-gray-100 dark:bg-slate-700 rounded px-1 py-0.5">↵</kbd> open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-gray-100 dark:bg-slate-700 rounded px-1 py-0.5">ESC</kbd> close
            </span>
          </div>
        )}

        {/* ── Mobile close strip ── */}
        <div
          className="flex sm:hidden items-center justify-between px-4 py-3"
          style={{ borderTop: '1px solid var(--search-border, rgba(0,0,0,0.08))', flexShrink: 0 }}
        >
          <span style={{ fontSize: 12, color: 'var(--search-hint, #9ca3af)' }}>
            {allResults.length > 0 ? `${allResults.length} result${allResults.length !== 1 ? 's' : ''}` : 'Search Nest'}
          </span>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 100,
              background: 'var(--search-active, rgba(0,0,0,0.06))',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              color: 'var(--search-text, #111)', fontFamily: 'inherit',
            }}
          >
            <ArrowUp size={13} /> Close
          </button>
        </div>
      </div>

      <style>{`
        /* ── Light/dark tokens ── */
        .search-panel {
          --search-bg:       #ffffff;
          --search-border:   rgba(0,0,0,0.08);
          --search-text:     #111827;
          --search-hint:     #9ca3af;
          --search-icon:     #9ca3af;
          --search-active:   rgba(232,201,126,0.10);
          --search-clear-bg: rgba(0,0,0,0.06);
        }
        @media (prefers-color-scheme: dark) {
          .search-panel {
            --search-bg:       #1e2030;
            --search-border:   rgba(255,255,255,0.08);
            --search-text:     #e8e4dc;
            --search-hint:     #6b6b78;
            --search-icon:     #6b6b78;
            --search-active:   rgba(232,201,126,0.10);
            --search-clear-bg: rgba(255,255,255,0.07);
          }
        }
        .dark .search-panel {
          --search-bg:       #1e2030;
          --search-border:   rgba(255,255,255,0.08);
          --search-text:     #e8e4dc;
          --search-hint:     #6b6b78;
          --search-icon:     #6b6b78;
          --search-active:   rgba(232,201,126,0.10);
          --search-clear-bg: rgba(255,255,255,0.07);
        }

        /* ── Desktop: centred card ── */
        .search-panel {
          top: 12vh;
          left: 50%;
          transform: translateX(-50%);
          width: min(560px, calc(100vw - 32px));
          max-height: 72vh;
          border-radius: 20px;
          border: 1px solid var(--search-border);
          box-shadow: 0 32px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06);
          animation: searchSlideDown 0.22s cubic-bezier(0.16,1,0.3,1) both;
        }
        .search-handle-wrap { display: none; }

        /* ── Mobile: bottom sheet ── */
        @media (max-width: 639px) {
          .search-panel {
            top: auto !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            transform: none !important;
            width: 100% !important;
            max-height: 88vh !important;
            border-radius: 24px 24px 0 0 !important;
            border-bottom: none !important;
            animation: searchSlideUp 0.28s cubic-bezier(0.16,1,0.3,1) both !important;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
          .search-handle-wrap {
            display: flex;
            justify-content: center;
            padding: 10px 0 4px;
            flex-shrink: 0;
          }
          .search-handle {
            width: 36px; height: 4px;
            background: var(--search-border, rgba(0,0,0,0.15));
            border-radius: 2px;
          }
          .search-results-scroll {
            max-height: none !important;
          }
        }

        @keyframes searchFadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes searchSlideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.97); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)      scale(1);   }
        }
        @keyframes searchSlideUp {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes searchSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
