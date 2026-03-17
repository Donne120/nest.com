import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, Award, Layers, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import type { Module, Certificate } from '../types';
import ModuleCard from '../components/ModuleLibrary/ModuleCard';
import { Skeleton } from '../components/UI/Skeleton';
import { useState } from 'react';
import { useAuthStore } from '../store';
import clsx from 'clsx';

export default function ModulesPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');

  const { data: modules = [], isLoading } = useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: () => api.get('/modules').then(r => r.data),
  });

  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey: ['my-certificates'],
    queryFn: () => api.get('/certificates/me').then(r => r.data),
    enabled: !!user,
  });

  const certByModule = Object.fromEntries(certificates.map(c => [c.module.id, c]));

  const filtered = modules.filter(m =>
    !search || m.title.toLowerCase().includes(search.toLowerCase())
  );

  const completed = modules.filter(m => m.status === 'completed').length;
  const inProgress = modules.filter(m => m.status === 'in_progress').length;
  const notStarted = modules.length - completed - inProgress;
  const firstName = user?.full_name?.split(' ')[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1">
              Learning Hub
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
              {firstName ? `Welcome back, ${firstName}` : 'Learning Modules'}
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">
              Continue your flight path below.
            </p>
          </div>
        </div>

        {/* Stats row */}
        {modules.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <StatChip
              icon={<Layers size={12} />}
              value={modules.length}
              label="total"
              colorClass="text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
            />
            <StatChip
              icon={<CheckCircle size={12} />}
              value={completed}
              label="completed"
              colorClass="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/80 dark:border-emerald-800/40"
            />
            <StatChip
              icon={<Clock size={12} />}
              value={inProgress}
              label="in progress"
              colorClass="text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 border-brand-200/80 dark:border-brand-800/40"
            />
            {notStarted > 0 && (
              <StatChip
                icon={<BookOpen size={12} />}
                value={notStarted}
                label="not started"
                colorClass="text-gray-500 dark:text-slate-500 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
              />
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search modules..."
          className={clsx(
            'w-full pl-10 pr-4 py-2.5 text-sm',
            'bg-white dark:bg-slate-800/80',
            'border border-gray-200 dark:border-slate-700',
            'rounded-xl',
            'placeholder:text-gray-400 dark:placeholder:text-slate-500',
            'text-gray-900 dark:text-slate-100',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400',
            'transition-all duration-150',
            'shadow-card hover:shadow-card-md'
          )}
        />
      </div>

      {/* Module grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-card">
              <div className="aspect-video shimmer" />
              <div className="p-4 space-y-2.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-gray-300 dark:text-slate-600" />
          </div>
          {search ? (
            <>
              <p className="text-gray-700 dark:text-slate-300 font-semibold">No modules match "{search}"</p>
              <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Try a different search term</p>
            </>
          ) : (
            <p className="text-gray-500 dark:text-slate-400 font-medium">No modules available yet</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((m) => (
            <div key={m.id} className="relative">
              <ModuleCard module={m} />
              {certByModule[m.id] && (
                <Link
                  to={`/certificate/${certByModule[m.id].id}`}
                  className={clsx(
                    'absolute top-3 right-3 flex items-center gap-1.5',
                    'bg-amber-400 hover:bg-amber-500 text-amber-900',
                    'text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm',
                    'transition-all duration-150 hover:-translate-y-px hover:shadow-md'
                  )}
                  title="View your certificate"
                >
                  <Award size={11} />
                  Certificate
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatChip({
  icon, value, label, colorClass
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  colorClass: string;
}) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border',
      colorClass
    )}>
      {icon}
      <span className="font-bold">{value}</span>
      <span className="font-medium opacity-70">{label}</span>
    </span>
  );
}
