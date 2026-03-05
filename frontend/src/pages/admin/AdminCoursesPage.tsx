import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, Video, MessageSquare, GripVertical } from 'lucide-react';
import api from '../../api/client';
import type { Module } from '../../types';
import Button from '../../components/UI/Button';
import { Skeleton } from '../../components/UI/Skeleton';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function formatDuration(s: number) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function AdminCoursesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: modules = [], isLoading } = useQuery<Module[]>({
    queryKey: ['admin-modules'],
    queryFn: () => api.get('/modules').then(r => r.data),
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      api.put(`/modules/${id}`, { is_published: published }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
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

  const publishedCount = modules.filter(m => m.is_published).length;
  const draftCount = modules.length - publishedCount;

  return (
    <div className="p-6 lg:p-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Manager</h1>
          <p className="text-sm text-gray-400 mt-1">Create and manage your onboarding modules</p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => navigate('/admin/courses/new')}>
          New Module
        </Button>
      </div>

      {/* Summary strip */}
      {!isLoading && modules.length > 0 && (
        <div className="flex items-center gap-6 mb-5 px-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-600 font-medium">{publishedCount} published</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="text-gray-400">{draftCount} draft{draftCount !== 1 ? 's' : ''}</span>
          </div>
          <span className="text-gray-300">·</span>
          <span className="text-sm text-gray-400">{modules.length} total</span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : modules.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl py-20 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={22} className="text-gray-400" />
          </div>
          <p className="text-gray-700 font-semibold">No modules yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Create your first onboarding module to get started</p>
          <Button icon={<Plus size={14} />} onClick={() => navigate('/admin/courses/new')}>
            Create your first module
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto] px-5 py-2.5 border-b border-gray-100 bg-gray-50/50">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Module</span>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</span>
          </div>

          {/* Module rows */}
          <div className="divide-y divide-gray-100">
            {modules.map((m, idx) => (
              <div
                key={m.id}
                className={clsx(
                  'flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors group',
                  !m.is_published && 'opacity-70'
                )}
              >
                {/* Drag handle */}
                <GripVertical size={14} className="text-gray-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />

                {/* Thumbnail */}
                {m.thumbnail_url ? (
                  <img
                    src={m.thumbnail_url}
                    alt={m.title}
                    className="w-14 h-9 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                  />
                ) : (
                  <div className="w-14 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                    <BookOpen size={14} className="text-gray-400" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-gray-300 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-[14px] font-semibold text-gray-900 truncate">{m.title}</h3>
                    {!m.is_published && (
                      <span className="inline-flex items-center text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                        DRAFT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[12px] text-gray-400">
                      <Video size={11} className="text-gray-300" /> {m.video_count} video{m.video_count !== 1 ? 's' : ''}
                    </span>
                    <span className="text-gray-200">·</span>
                    <span className="flex items-center gap-1 text-[12px] text-gray-400">
                      <MessageSquare size={11} className="text-gray-300" /> {m.question_count} Q&A
                    </span>
                    <span className="text-gray-200">·</span>
                    <span className="text-[12px] text-gray-400">{formatDuration(m.duration_seconds)}</span>
                  </div>
                </div>

                {/* Status */}
                <button
                  onClick={() => togglePublish.mutate({ id: m.id, published: !m.is_published })}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                    m.is_published
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                      : 'text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100 hover:text-gray-700'
                  )}
                >
                  {m.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
                  {m.is_published ? 'Published' : 'Draft'}
                </button>

                {/* Edit */}
                <button
                  onClick={() => navigate(`/admin/courses/${m.id}/edit`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-all"
                >
                  <Pencil size={12} /> Edit
                </button>

                {/* Delete */}
                <button
                  onClick={() => {
                    if (confirm(`Delete "${m.title}"? This will also delete all videos and Q&A.`)) {
                      deleteModule.mutate(m.id);
                    }
                  }}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete module"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
