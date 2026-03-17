import { useNavigate } from 'react-router-dom';
import { Play, Clock, MessageSquare, CheckCircle2, BookOpen } from 'lucide-react';
import type { Module } from '../../types';
import Badge from '../UI/Badge';
import clsx from 'clsx';

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

interface Props {
  module: Module;
}

export default function ModuleCard({ module }: Props) {
  const navigate = useNavigate();
  const progress = module.duration_seconds > 0
    ? Math.round(((module.progress_seconds ?? 0) / module.duration_seconds) * 100)
    : 0;

  const statusRing = {
    not_started: '',
    in_progress:  'ring-2 ring-brand-400/40 ring-offset-1',
    completed:    'ring-2 ring-emerald-400/40 ring-offset-1',
  };

  const ring = statusRing[module.status ?? 'not_started'];

  return (
    <div
      onClick={() => navigate(`/modules/${module.id}`)}
      className={clsx(
        'group relative bg-white dark:bg-slate-800/80 rounded-2xl overflow-hidden cursor-pointer',
        'border border-gray-100 dark:border-slate-700/60',
        'shadow-card hover:shadow-elevated',
        'transition-all duration-250 ease-out hover:-translate-y-1',
        ring
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 dark:bg-slate-700 overflow-hidden">
        {module.thumbnail_url ? (
          <img
            src={module.thumbnail_url}
            alt={module.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-700 dark:to-slate-800">
            <BookOpen size={28} className="text-gray-300 dark:text-slate-500" />
          </div>
        )}

        {/* Dark gradient overlay (always subtle, stronger on hover) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-200" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={clsx(
            'w-11 h-11 rounded-full flex items-center justify-center',
            'bg-white/90 dark:bg-white/95 shadow-float',
            'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100',
            'transition-all duration-200 ease-out'
          )}>
            <Play size={18} className="text-brand-700 ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-2.5 left-2.5">
          <Badge variant={module.status ?? 'not_started'} />
        </div>

        {/* Duration chip */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-1 rounded-lg">
          <Clock size={10} />
          {formatDuration(module.duration_seconds)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm leading-snug line-clamp-2 flex-1 tracking-tight">
            {module.title}
          </h3>
          {module.status === 'completed' && (
            <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
          )}
        </div>

        {module.description && (
          <p className="text-xs text-gray-400 dark:text-slate-500 line-clamp-2 mb-3 leading-relaxed">{module.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <Play size={10} />
            {module.video_count} video{module.video_count !== 1 ? 's' : ''}
          </span>
          {module.question_count > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare size={10} />
              {module.question_count} Q&A
            </span>
          )}
        </div>

        {/* Progress bar */}
        {(module.status === 'in_progress' || module.status === 'completed') && (
          <div className="mt-3">
            <div className="flex justify-between text-[11px] font-medium mb-1.5">
              <span className="text-gray-400 dark:text-slate-500">Progress</span>
              <span className={module.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-600 dark:text-brand-400'}>
                {progress}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-700 ease-out',
                  module.status === 'completed'
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                    : 'bg-gradient-to-r from-brand-400 to-brand-600'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
