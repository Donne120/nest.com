import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import api from '../../api/client';
import type { ModuleAnalytics, DashboardStats } from '../../types';
import { Skeleton } from '../../components/UI/Skeleton';
import { TrendingUp, Clock, Users, MessageSquare, Zap } from 'lucide-react';
import type { ElementType } from 'react';

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

function KpiCard({
  label, value, icon: Icon, iconBg, iconColor,
}: {
  label: string;
  value: string | number;
  icon: ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon size={15} className={iconColor} />
        </div>
      </div>
      <p className="text-[28px] font-bold text-gray-900 tabular-nums leading-none">{value}</p>
    </div>
  );
}

const chartStyle = {
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  fontSize: 12,
};

export default function AdminAnalyticsPage() {
  const { data: moduleAnalytics = [], isLoading } = useQuery<ModuleAnalytics[]>({
    queryKey: ['module-analytics'],
    queryFn: () => api.get('/analytics/modules').then(r => r.data),
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/analytics/dashboard').then(r => r.data),
  });

  const barData = moduleAnalytics.map(m => ({
    name: m.module_title.split(':')[0].trim().substring(0, 18),
    Answered: m.answered_questions,
    Pending: m.pending_questions,
  }));

  const resolutionData = moduleAnalytics.map(m => ({
    name: m.module_title.split(':')[0].trim().substring(0, 18),
    rate: m.total_questions > 0
      ? Math.round((m.answered_questions / m.total_questions) * 100)
      : 0,
  }));

  const resolutionRate = stats && stats.total_questions > 0
    ? Math.round((stats.answered_questions / stats.total_questions) * 100)
    : 0;

  const confusionModules = moduleAnalytics.filter(m => m.top_confusion_timestamps.length > 0);

  return (
    <div className="p-6 lg:p-8 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">Knowledge gaps, response metrics, and engagement data</p>
      </div>

      {/* KPI strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard
            label="Total Q&A"
            value={stats.total_questions}
            icon={MessageSquare}
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
          />
          <KpiCard
            label="Avg Response"
            value={`${stats.avg_response_time_hours}h`}
            icon={Clock}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
          />
          <KpiCard
            label="Resolution Rate"
            value={`${resolutionRate}%`}
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-500"
          />
          <KpiCard
            label="Active Employees"
            value={stats.total_employees ?? '—'}
            icon={Users}
            iconBg="bg-violet-50"
            iconColor="text-violet-500"
          />
        </div>
      )}

      {/* Charts */}
      {isLoading ? (
        <div className="space-y-5">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : moduleAnalytics.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-20 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={22} className="text-gray-300" />
          </div>
          <p className="text-gray-700 font-semibold">No analytics data yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Data will appear once employees start asking questions
          </p>
        </div>
      ) : (
        <div className="space-y-5">

          {/* Questions per module */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900">Questions per Module</h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-5">Stacked view of answered vs pending per module</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip contentStyle={chartStyle} cursor={{ fill: '#f9fafb' }} />
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 12, color: '#6b7280' }}>{v}</span>}
                />
                <Bar dataKey="Answered" fill="#10b981" radius={[3, 3, 0, 0]} stackId="a" />
                <Bar dataKey="Pending" fill="#f59e0b" radius={[3, 3, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Resolution rate */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900">Resolution Rate by Module</h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-5">Percentage of questions answered per module (%)</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={resolutionData} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip contentStyle={chartStyle} cursor={false} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ fill: '#2563eb', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  name="Resolution %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Confusion timestamps */}
          {confusionModules.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-sm font-semibold text-gray-900">Top Confusion Points</h2>
                <Zap size={13} className="text-amber-400" />
              </div>
              <p className="text-xs text-gray-400 mb-5">
                Timestamps in videos where employees ask the most questions
              </p>
              <div className="space-y-5">
                {confusionModules.map((m) => (
                  <div key={m.module_id}>
                    <p className="text-[13px] font-semibold text-gray-700 mb-2">{m.module_title}</p>
                    <div className="flex gap-2 flex-wrap">
                      {m.top_confusion_timestamps.map((ts, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold"
                        >
                          {formatTime(ts)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
