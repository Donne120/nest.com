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

  const statusConfig = {
    not_started: { border: 'border-gray-200', icon: null },
    in_progress: { border: 'border-brand-400', icon: null },
    completed: { border: 'border-emerald-400', icon: <CheckCircle2 size={16} className="text-emerald-500" /> },
  };

  const config = statusConfig[module.status ?? 'not_started'];

  return (
    <div
      onClick={() => navigate(`/modules/${module.id}`)}
      className={clsx(
        'group bg-white rounded-2xl border-2 overflow-hidden cursor-pointer',
        'hover:shadow-elevated transition-all duration-200 hover:-translate-y-0.5',
        config.border
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {module.thumbnail_url ? (
          <img
            src={module.thumbnail_url}
            alt={module.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={32} className="text-gray-300" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
            <Play size={20} className="text-brand-700 ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-2.5 left-2.5">
          <Badge variant={module.status ?? 'not_started'} />
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
          <Clock size={11} />
          {formatDuration(module.duration_seconds)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 flex-1">
            {module.title}
          </h3>
          {config.icon}
        </div>

        {module.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{module.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Play size={11} />
            {module.video_count} video{module.video_count !== 1 ? 's' : ''}
          </span>
          {module.question_count > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare size={11} />
              {module.question_count} Q&A
            </span>
          )}
        </div>

        {/* Progress bar */}
        {(module.status === 'in_progress' || module.status === 'completed') && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-500',
                  module.status === 'completed' ? 'bg-emerald-500' : 'bg-brand-500'
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
