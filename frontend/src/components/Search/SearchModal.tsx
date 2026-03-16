import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Play, MessageSquare, X, ArrowRight } from 'lucide-react';
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
  module:   { icon: BookOpen,     color: 'text-brand-500',  bg: 'bg-brand-50 dark:bg-brand-900/30'  },
  video:    { icon: Play,         color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/30'    },
  question: { icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30'  },
};

const TYPE_LABEL = { module: 'Module', video: 'Lesson', question: 'Q&A' };

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results = [], isFetching } = useQuery<SearchResult[]>({
    queryKey: ['search', query],
    queryFn: () => api.get(`/search?q=${encodeURIComponent(query)}`).then(r => r.data),
    enabled: query.trim().length >= 2,
    staleTime: 10_000,
  });

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelected(0);
    }
  }, [open]);

  // Reset selection when results change
  useEffect(() => { setSelected(0); }, [results]);

  const go = useCallback((url: string) => {
    navigate(url);
    onClose();
  }, [navigate, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && results[selected]) { go(results[selected].url); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, selected, go, onClose]);

  if (!open) return null;

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  const allResults = Object.values(grouped).flat();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-slate-700">
          <Search size={18} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search modules, lessons, Q&A..."
            className="flex-1 text-sm text-gray-900 dark:text-slate-100 bg-transparent outline-none placeholder-gray-400 dark:placeholder-slate-500"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
              <X size={15} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-700 rounded px-1.5 py-0.5 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length < 2 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-gray-400 dark:text-slate-500">Type to search across modules, lessons, and Q&A</p>
            </div>
          ) : isFetching ? (
            <div className="px-4 py-10 text-center">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : allResults.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-gray-500 dark:text-slate-400">No results for <span className="font-medium">"{query}"</span></p>
            </div>
          ) : (
            <div className="py-2">
              {(Object.entries(grouped) as [string, SearchResult[]][]).map(([type, items]) => (
                <div key={type}>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                    {type === 'module' ? 'Modules' : type === 'video' ? 'Lessons' : 'Q&A'}
                  </p>
                  {items.map((result) => {
                    const globalIdx = allResults.indexOf(result);
                    const { icon: Icon, color, bg } = TYPE_ICON[result.type as keyof typeof TYPE_ICON];
                    return (
                      <button
                        key={result.id}
                        onClick={() => go(result.url)}
                        onMouseEnter={() => setSelected(globalIdx)}
                        className={clsx(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          globalIdx === selected
                            ? 'bg-brand-50 dark:bg-brand-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                        )}
                      >
                        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', bg)}>
                          <Icon size={14} className={color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{result.title}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{result.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded', bg, color)}>
                            {TYPE_LABEL[result.type as keyof typeof TYPE_LABEL]}
                          </span>
                          <ArrowRight size={13} className="text-gray-300 dark:text-slate-600" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {allResults.length > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 flex items-center gap-4 text-[10px] text-gray-400 dark:text-slate-500">
            <span><kbd className="font-mono bg-gray-100 dark:bg-slate-700 rounded px-1">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono bg-gray-100 dark:bg-slate-700 rounded px-1">↵</kbd> open</span>
            <span><kbd className="font-mono bg-gray-100 dark:bg-slate-700 rounded px-1">ESC</kbd> close</span>
          </div>
        )}
      </div>
    </div>
  );
}
