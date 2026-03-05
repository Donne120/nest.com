import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search } from 'lucide-react';
import api from '../api/client';
import type { Module } from '../types';
import ModuleCard from '../components/ModuleLibrary/ModuleCard';
import { Skeleton } from '../components/UI/Skeleton';
import { useState } from 'react';
import { useAuthStore } from '../store';

export default function ModulesPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');

  const { data: modules = [], isLoading } = useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: () => api.get('/modules').then(r => r.data),
  });

  const filtered = modules.filter(m =>
    !search || m.title.toLowerCase().includes(search.toLowerCase())
  );

  const completed = modules.filter(m => m.status === 'completed').length;
  const inProgress = modules.filter(m => m.status === 'in_progress').length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Onboarding Modules</h1>
        <p className="text-gray-500 mt-1">
          Welcome, {user?.full_name?.split(' ')[0]}! Complete your onboarding journey below.
        </p>

        {/* Progress summary */}
        {modules.length > 0 && (
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              {completed} completed
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2.5 h-2.5 bg-brand-500 rounded-full" />
              {inProgress} in progress
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
              {modules.length - completed - inProgress} not started
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search modules..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Module grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <Skeleton className="aspect-video" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No modules found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((m) => <ModuleCard key={m.id} module={m} />)}
        </div>
      )}
    </div>
  );
}
