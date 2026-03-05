import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StickyNote, Clock, Trash2, Pencil, Check, X, Download, Plus } from 'lucide-react';
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

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface Props {
  videoId: string;
  onSeek: (t: number) => void;
}

export default function NotesPanel({ videoId, onSeek }: Props) {
  const qc = useQueryClient();
  const { currentTime } = usePlayerStore();
  const [draft, setDraft] = useState('');
  const [pinToTime, setPinToTime] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['notes', videoId],
    queryFn: () => api.get(`/notes/video/${videoId}`).then(r => r.data),
    enabled: !!videoId,
  });

  const createNote = useMutation({
    mutationFn: (payload: { content: string; timestamp_seconds?: number }) =>
      api.post(`/notes/video/${videoId}`, payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes', videoId] });
      setDraft('');
      setPinToTime(false);
      toast.success('Note saved');
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes', videoId] });
      toast.success('Note deleted');
    },
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
      `${n.timestamp_seconds != null ? `[${fmtTime(n.timestamp_seconds)}] ` : ''}${n.content}`
    );
    const blob = new Blob([lines.join('\n\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-${videoId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  return (
    <div className="mt-6 pt-5 border-t border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <StickyNote size={16} className="text-brand-600" />
          <h2 className="text-sm font-semibold text-gray-900">My Notes</h2>
          {notes.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
              {notes.length}
            </span>
          )}
        </div>
        {notes.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600 transition-colors"
          >
            <Download size={13} /> Export
          </button>
        )}
      </div>

      {/* Input area */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave(); }}
          placeholder="Type a note... (Ctrl+Enter to save)"
          rows={3}
          className="w-full bg-transparent text-sm text-gray-800 placeholder-amber-400 resize-none focus:outline-none"
        />
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-200">
          {/* Pin to timestamp toggle */}
          <button
            onClick={() => setPinToTime(!pinToTime)}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
              pinToTime
                ? 'bg-brand-600 text-white'
                : 'text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Clock size={11} />
            {pinToTime ? `Pinned at ${fmtTime(currentTime)}` : 'Pin to timestamp'}
          </button>

          <button
            onClick={handleSave}
            disabled={!draft.trim() || createNote.isPending}
            className="flex items-center gap-1 text-xs font-semibold bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={12} /> Save note
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">
          No notes yet. Start taking notes while watching.
        </p>
      ) : (
        <div className="space-y-2">
          {notes.map(note => (
            <div
              key={note.id}
              className="group bg-white border border-gray-100 hover:border-gray-200 rounded-xl p-3 transition-all"
            >
              {editingId === note.id ? (
                /* Edit mode */
                <div>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    autoFocus
                    rows={3}
                    className="w-full text-sm text-gray-800 border border-brand-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => updateNote.mutate({ id: note.id, content: editContent.trim() })}
                      disabled={!editContent.trim()}
                      className="flex items-center gap-1 text-xs bg-brand-600 text-white px-2.5 py-1 rounded-lg hover:bg-brand-700 disabled:opacity-40"
                    >
                      <Check size={11} /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200"
                    >
                      <X size={11} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    {note.timestamp_seconds != null && (
                      <button
                        onClick={() => onSeek(note.timestamp_seconds!)}
                        className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-mono font-semibold mb-1 hover:underline"
                      >
                        <Clock size={10} />
                        {fmtTime(note.timestamp_seconds)}
                      </button>
                    )}
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                      {note.content}
                    </p>
                  </div>
                  {/* Actions — visible on hover */}
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => startEdit(note)}
                      className="text-gray-400 hover:text-brand-600 p-1 rounded transition-colors"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => deleteNote.mutate(note.id)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
