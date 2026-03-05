import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  StickyNote, X, Clock, Trash2, Pencil, Check,
  Download, Plus, ChevronDown,
} from 'lucide-react';
import api from '../../api/client';
import { usePlayerStore } from '../../store';
import toast from 'react-hot-toast';

interface Note {
  id: string;
  content: string;
  timestamp_seconds: number | null;
  created_at: string;
  updated_at: string | null;
}

function fmt(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface Props {
  videoId: string;
  onSeek: (t: number) => void;
}

export default function FloatingNotes({ videoId, onSeek }: Props) {
  const qc = useQueryClient();
  const { currentTime } = usePlayerStore();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [pinToTime, setPinToTime] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['notes', videoId],
    queryFn: () => api.get(`/notes/video/${videoId}`).then(r => r.data),
    enabled: !!videoId,
  });

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const createNote = useMutation({
    mutationFn: (payload: { content: string; timestamp_seconds?: number }) =>
      api.post(`/notes/video/${videoId}`, payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes', videoId] });
      setDraft('');
      setPinToTime(false);
    },
    onError: () => toast.error('Could not save note'),
  });

  const updateNote = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api.put(`/notes/${id}`, { content }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes', videoId] });
      setEditingId(null);
    },
  });

  const deleteNote = useMutation({
    mutationFn: (id: string) => api.delete(`/notes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes', videoId] }),
  });

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    createNote.mutate({
      content: trimmed,
      timestamp_seconds: pinToTime ? currentTime : undefined,
    });
  };

  const handleExport = () => {
    const lines = notes.map(n =>
      `${n.timestamp_seconds != null ? `[${fmt(n.timestamp_seconds)}] ` : ''}${n.content}`
    );
    const blob = new Blob([lines.join('\n\n')], { type: 'text/plain' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `notes.txt`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div ref={panelRef} className="absolute top-3 left-3 z-30">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        title="My notes"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shadow-lg text-xs font-semibold transition-all ${
          open
            ? 'bg-amber-400 text-amber-900'
            : 'bg-black/50 hover:bg-amber-400 text-white hover:text-amber-900 backdrop-blur-sm'
        }`}
      >
        <StickyNote size={13} />
        Notes
        {notes.length > 0 && (
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
            open ? 'bg-amber-900/20 text-amber-900' : 'bg-white/20 text-white'
          }`}>
            {notes.length}
          </span>
        )}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Panel */}
      {open && (
        <div className="mt-1.5 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[420px]">

          {/* Panel header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 bg-amber-50 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <StickyNote size={13} className="text-amber-600" />
              <span className="text-xs font-semibold text-gray-800">My Notes</span>
              {notes.length > 0 && (
                <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 rounded-full font-bold">
                  {notes.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notes.length > 0 && (
                <button
                  onClick={handleExport}
                  title="Export notes"
                  className="text-gray-400 hover:text-brand-600 p-1 rounded transition-colors"
                >
                  <Download size={12} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Note input */}
          <div className="px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave(); }}
              placeholder="Write a note… (Ctrl+Enter to save)"
              rows={2}
              className="w-full text-xs text-gray-800 placeholder-gray-400 resize-none focus:outline-none leading-relaxed"
              autoFocus
            />
            <div className="flex items-center justify-between mt-1.5">
              <button
                onClick={() => setPinToTime(v => !v)}
                className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg transition-colors ${
                  pinToTime
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Clock size={9} />
                {pinToTime ? fmt(currentTime) : 'Pin timestamp'}
              </button>
              <button
                onClick={handleSave}
                disabled={!draft.trim() || createNote.isPending}
                className="flex items-center gap-1 text-[10px] font-semibold bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-amber-900 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Plus size={10} /> Save
              </button>
            </div>
          </div>

          {/* Notes list */}
          <div className="overflow-y-auto flex-1">
            {notes.length === 0 ? (
              <p className="text-[11px] text-gray-400 text-center py-5 px-3">
                No notes yet. Pause the video and jot something down.
              </p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notes.map(note => (
                  <li key={note.id} className="group px-3 py-2.5 hover:bg-gray-50 transition-colors">
                    {editingId === note.id ? (
                      <div>
                        <textarea
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          autoFocus
                          rows={2}
                          className="w-full text-xs text-gray-800 border border-brand-300 rounded-lg px-2 py-1.5 focus:outline-none resize-none"
                        />
                        <div className="flex gap-1.5 mt-1.5">
                          <button
                            onClick={() => updateNote.mutate({ id: note.id, content: editContent.trim() })}
                            disabled={!editContent.trim()}
                            className="flex items-center gap-1 text-[10px] bg-brand-600 text-white px-2 py-1 rounded-lg"
                          >
                            <Check size={9} /> Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex items-center gap-1 text-[10px] text-gray-500 border border-gray-200 px-2 py-1 rounded-lg"
                          >
                            <X size={9} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="flex-1 min-w-0">
                          {note.timestamp_seconds != null && (
                            <button
                              onClick={() => { onSeek(note.timestamp_seconds!); setOpen(false); }}
                              className="flex items-center gap-0.5 text-[10px] text-brand-600 font-mono font-semibold hover:underline mb-0.5"
                            >
                              <Clock size={9} /> {fmt(note.timestamp_seconds)}
                            </button>
                          )}
                          <p className="text-xs text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                            {note.content}
                          </p>
                        </div>
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pt-0.5">
                          <button
                            onClick={() => { setEditingId(note.id); setEditContent(note.content); }}
                            className="text-gray-400 hover:text-brand-600 p-0.5 rounded"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => deleteNote.mutate(note.id)}
                            className="text-gray-400 hover:text-red-500 p-0.5 rounded"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
