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
        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        title="Actions"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil size={14} className="text-gray-400" />
            Edit module
          </button>
          <button
            onClick={() => { onToggle(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {m.is_published
              ? <EyeOff size={14} className="text-gray-400" />
              : <Eye size={14} className="text-gray-400" />}
            {m.is_published ? 'Unpublish' : 'Publish'}
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
            <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
            <p className="text-base text-gray-500 mt-2">Build and manage your learning content library</p>
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
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-24 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Layers size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-900 font-semibold text-lg">No modules yet</p>
          <p className="text-sm text-gray-400 mt-1.5 mb-6">Create your first learning module to get started.</p>
          <button
            onClick={() => navigate('/admin/courses/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus size={15} /> Create module
          </button>
        </div>

      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

          {/* Table head */}
          <div className="grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/50">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 cursor-pointer"
              title="Select all"
            />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 w-7">#</span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Module</span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Status</span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 pr-1"></span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {modules.map((m, idx) => {
              const duration = formatDuration(m.duration_seconds);
              const isChecked = selected.has(m.id);
              return (
                <div
                  key={m.id}
                  className={clsx(
                    'grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-4 px-6 py-4 hover:bg-slate-50/70 transition-colors group',
                    isChecked && 'bg-red-50/40',
                  )}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelect(m.id)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-600 cursor-pointer"
                  />

                  {/* Index */}
                  <span className="text-sm font-bold text-gray-300 tabular-nums w-7 text-center">
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* Module info */}
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Thumbnail */}
                    {m.thumbnail_url ? (
                      <img
                        src={m.thumbnail_url}
                        alt={m.title}
                        className="w-16 h-10 object-cover rounded-lg flex-shrink-0 border border-gray-100"
                      />
                    ) : (
                      <div className="w-16 h-10 bg-gradient-to-br from-indigo-50 to-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-100">
                        <BookOpen size={15} className="text-indigo-300" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate leading-snug">{m.title}</p>
                      <div className="flex items-center gap-3 mt-1">
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

                  {/* Status badge */}
                  <span className={clsx(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold',
                    m.is_published
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  )}>
                    <span className={clsx(
                      'w-1.5 h-1.5 rounded-full',
                      m.is_published ? 'bg-emerald-500' : 'bg-amber-400'
                    )} />
                    {m.is_published ? 'Published' : 'Draft'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/admin/courses/${m.id}/edit`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-100 rounded-lg transition-colors"
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
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {selected.size > 0
                ? <span className="text-red-600 font-semibold">{selected.size} selected — </span>
                : null}
              {modules.length} module{modules.length !== 1 ? 's' : ''} · {totalVideos} videos total
            </p>
            <div className="flex items-center gap-3">
              {selected.size > 0 && (
                <button onClick={() => setSelected(new Set())} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  Clear selection
                </button>
              )}
              <button
                onClick={() => navigate('/admin/courses/new')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
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
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'text-emerald-500', value: 'text-emerald-700' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-100',   icon: 'text-amber-500',   value: 'text-amber-700'   },
    indigo:  { bg: 'bg-brand-50',  border: 'border-brand-100',  icon: 'text-indigo-500',  value: 'text-indigo-700'  },
  }[color];

  return (
    <div className={clsx('rounded-2xl border p-5 flex items-center gap-4', palette.bg, palette.border)}>
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm', palette.icon)}>
        {icon}
      </div>
      <div>
        <p className={clsx('text-2xl font-bold leading-none', palette.value)}>{value}</p>
        <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}

function Meta({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-gray-400">
      <span className="text-gray-300">{icon}</span>
      {label}
    </span>
  );
}

function Dot() {
  return <span className="w-0.5 h-0.5 rounded-full bg-gray-300 flex-shrink-0" />;
}
