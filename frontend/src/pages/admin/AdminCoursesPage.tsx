import type { ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, BookOpen,
  Video, MessageSquare, Clock, MoreVertical, Layers,
} from 'lucide-react';
import api from '../../api/client';
import type { Module } from '../../types';
import { Skeleton } from '../../components/UI/Skeleton';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useState, useRef, useEffect, useCallback } from 'react';

function formatDuration(s: number) {
  if (!s) return null;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

// ─── Row action menu ───────────────────────────────────────────────────────────
function ActionMenu({
  module: m,
  onEdit,
  onToggle,
  onDelete,
}: {
  module: Module;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="p-2 rounded-lg text-[var(--c-ink3)] hover:text-[var(--c-ink2)] hover:bg-[var(--c-bg2)] transition-colors"
        title="Actions"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-[var(--c-surf)] border border-[var(--c-rule)] rounded-xl shadow-lg z-20 py-1 overflow-hidden">
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--c-ink2)] hover:bg-[var(--c-bg2)] transition-colors"
          >
            <Pencil size={14} className="text-[var(--c-ink3)]" />
            Edit module
          </button>
          <button
            onClick={() => { onToggle(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--c-ink2)] hover:bg-[var(--c-bg2)] transition-colors"
          >
            {m.is_published
              ? <EyeOff size={14} className="text-[var(--c-ink3)]" />
              : <Eye size={14} className="text-[var(--c-ink3)]" />}
            {m.is_published ? 'Unpublish' : 'Publish'}
          </button>
          <div className="border-t border-[var(--c-rule)] my-1" />
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function AdminCoursesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const { data: modules = [], isLoading } = useQuery<Module[]>({
    queryKey: ['admin-modules'],
    queryFn: () => api.get('/modules').then(r => r.data),
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      api.put(`/modules/${id}`, { is_published: published }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success(vars.published ? 'Module published' : 'Module unpublished');
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteModule = useMutation({
    mutationFn: (id: string) => api.delete(`/modules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Module deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const allSelected = modules.length > 0 && selected.size === modules.length;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(modules.map(m => m.id)));

  const handleBulkDelete = async () => {
    const count = selected.size;
    if (!confirm(`Delete ${count} module${count > 1 ? 's' : ''}?\n\nThis will permanently remove all videos, Q&A, and quiz data inside them.`)) return;
    setBulkDeleting(true);
    let failed = 0;
    for (const id of selected) {
      try { await api.delete(`/modules/${id}`); }
      catch { failed++; }
    }
    setBulkDeleting(false);
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
    queryClient.invalidateQueries({ queryKey: ['modules'] });
    if (failed === 0) toast.success(`Deleted ${count} module${count > 1 ? 's' : ''}`);
    else toast.error(`${count - failed} deleted, ${failed} failed`);
  };

  const publishedCount = modules.filter(m => m.is_published).length;
  const draftCount     = modules.length - publishedCount;
  const totalVideos    = modules.reduce((s, m) => s + (m.video_count ?? 0), 0);

  return (
    <div>
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-8 lg:py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--c-ink)]">Courses</h1>
            <p className="text-base text-[var(--c-ink2)] mt-2">Build and manage your learning content library</p>
          </div>
          <button
            onClick={() => navigate('/admin/courses/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus size={15} />
            New Module
          </button>
        </div>

      {/* ── Stat cards ── */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Published"
            value={publishedCount}
            icon={<Eye size={16} />}
            color="emerald"
          />
          <StatCard
            label="Drafts"
            value={draftCount}
            icon={<EyeOff size={16} />}
            color="amber"
          />
          <StatCard
            label="Total Videos"
            value={totalVideos}
            icon={<Video size={16} />}
            color="indigo"
          />
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[76px] rounded-2xl" />)}
        </div>

      ) : modules.length === 0 ? (
        <div className="bg-[var(--c-surf)] border-2 border-dashed border-[var(--c-rule)] rounded-2xl py-24 text-center">
          <div className="w-14 h-14 bg-[var(--c-bg2)] rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Layers size={24} className="text-[var(--c-ink3)]" />
          </div>
          <p className="text-[var(--c-ink)] font-semibold text-lg">No modules yet</p>
          <p className="text-sm text-[var(--c-ink3)] mt-1.5 mb-6">Create your first learning module to get started.</p>
          <button
            onClick={() => navigate('/admin/courses/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus size={15} /> Create module
          </button>
        </div>

      ) : (
        <div className="bg-[var(--c-surf)] border border-[var(--c-rule)] rounded-2xl overflow-hidden shadow-sm">

          {/* Table head — desktop only (mobile rows are self-labelling cards) */}
          <div className="hidden sm:grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-4 px-6 py-3 border-b border-[var(--c-rule)] bg-[var(--c-bg2)]/50">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-[var(--c-rule)] text-brand-600 cursor-pointer"
              title="Select all"
            />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--c-ink3)] w-7">#</span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--c-ink3)]">Module</span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--c-ink3)]">Status</span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--c-ink3)] pr-1"></span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[var(--c-rule)]">
            {modules.map((m, idx) => {
              const duration = formatDuration(m.duration_seconds);
              const isChecked = selected.has(m.id);
              return (
                <div
                  key={m.id}
                  className={clsx(
                    // Mobile: stacked flex card. Desktop (sm+): the original 5-col table grid.
                    'flex flex-wrap items-center gap-x-3 gap-y-3 px-4 py-4 sm:grid sm:grid-cols-[auto_auto_1fr_auto_auto] sm:gap-4 sm:px-6 hover:bg-[var(--c-bg2)]/70 transition-colors group',
                    isChecked && 'bg-red-500/5',
                  )}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelect(m.id)}
                    className="w-4 h-4 rounded border-[var(--c-rule)] text-brand-600 cursor-pointer flex-shrink-0"
                  />

                  {/* Index */}
                  <span className="text-sm font-bold text-[var(--c-ink3)] tabular-nums w-7 text-center flex-shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* Module info — takes remaining width; wraps to full row on mobile */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 basis-[60%]">
                    {/* Thumbnail */}
                    {m.thumbnail_url ? (
                      <img
                        src={m.thumbnail_url}
                        alt={m.title}
                        className="w-14 h-9 object-cover rounded-lg flex-shrink-0 border border-[var(--c-rule)]"
                      />
                    ) : (
                      <div className="w-14 h-9 bg-[var(--c-bg2)] rounded-lg flex items-center justify-center flex-shrink-0 border border-[var(--c-rule)]">
                        <BookOpen size={15} className="text-brand-400/50" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--c-ink)] truncate leading-snug">{m.title}</p>
                      <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                        <Meta icon={<Video size={11} />} label={`${m.video_count} video${m.video_count !== 1 ? 's' : ''}`} />
                        <Dot />
                        <Meta icon={<MessageSquare size={11} />} label={`${m.question_count} Q&A`} />
                        {duration && (
                          <>
                            <Dot />
                            <Meta icon={<Clock size={11} />} label={duration} />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status + actions — on mobile they sit together on their own row,
                      pushed right; on desktop they occupy the grid's last two columns. */}
                  <span className={clsx(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ml-auto sm:ml-0',
                    m.is_published
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  )}>
                    <span className={clsx(
                      'w-1.5 h-1.5 rounded-full',
                      m.is_published ? 'bg-emerald-500' : 'bg-amber-400'
                    )} />
                    {m.is_published ? 'Published' : 'Draft'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/admin/courses/${m.id}/edit`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-brand-500/10 hover:bg-brand-500/15 border border-brand-500/25 rounded-lg transition-colors"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                    <ActionMenu
                      module={m}
                      onEdit={() => navigate(`/admin/courses/${m.id}/edit`)}
                      onToggle={() => togglePublish.mutate({ id: m.id, published: !m.is_published })}
                      onDelete={() => {
                        if (confirm(`Delete "${m.title}"?\n\nThis will permanently remove all videos and Q&A.`)) {
                          deleteModule.mutate(m.id);
                        }
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-[var(--c-rule)] bg-[var(--c-bg2)] flex items-center justify-between">
            <p className="text-xs text-[var(--c-ink3)]">
              {selected.size > 0
                ? <span className="text-red-600 font-semibold">{selected.size} selected — </span>
                : null}
              {modules.length} module{modules.length !== 1 ? 's' : ''} · {totalVideos} videos total
            </p>
            <div className="flex items-center gap-3">
              {selected.size > 0 && (
                <button onClick={() => setSelected(new Set())} className="text-xs text-[var(--c-ink3)] hover:text-[var(--c-ink2)] transition-colors">
                  Clear selection
                </button>
              )}
              <button
                onClick={() => navigate('/admin/courses/new')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-400 transition-colors"
              >
                <Plus size={13} />
                Add module
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, color,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  color: 'emerald' | 'amber' | 'indigo';
}) {
  const palette = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', icon: 'text-emerald-500', value: 'text-emerald-400' },
    amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   icon: 'text-amber-500',   value: 'text-amber-400'   },
    indigo:  { bg: 'bg-brand-500/10',  border: 'border-brand-500/25',  icon: 'text-indigo-500',  value: 'text-indigo-400'  },
  }[color];

  return (
    <div className={clsx(
      // Mobile: compact stacked card (icon top, value+label below) so 3 fit a
      // narrow phone cleanly. Desktop: icon beside the value.
      'rounded-2xl border p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4',
      palette.bg, palette.border,
    )}>
      <div className={clsx('w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0', palette.bg, palette.icon)}
        style={{ background: 'color-mix(in srgb, currentColor 16%, transparent)' }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={clsx('text-xl sm:text-2xl font-bold leading-none', palette.value)}>{value}</p>
        <p className="text-[11px] sm:text-xs text-[var(--c-ink2)] mt-1 font-medium leading-tight">{label}</p>
      </div>
    </div>
  );
}

function Meta({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-[var(--c-ink3)]">
      <span className="text-[var(--c-ink3)]">{icon}</span>
      {label}
    </span>
  );
}

function Dot() {
  return <span className="w-0.5 h-0.5 rounded-full bg-[var(--c-ink3)] flex-shrink-0" />;
}
