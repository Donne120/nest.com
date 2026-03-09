import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import api from '../../api/client';
import type { ModuleAnalytics, DashboardStats } from '../../types';
import { Skeleton } from '../../components/UI/Skeleton';
import {
  TrendingUp, Clock, Users, MessageSquare, Zap,
  CheckCircle2, AlertCircle, BarChart2,
} from 'lucide-react';
import type { ElementType } from 'react';

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: ElementType;
  accent: string; // tailwind bg class for icon area
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
        <div className={`w-9 h-9 ${accent} rounded-xl flex items-center justify-center`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-gray-900 leading-none tabular-nums">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  title, description, badge, children,
}: {
  title: string;
  description: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          {badge}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

// ─── Tooltip styles ───────────────────────────────────────────────────────────
const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  fontSize: 12,
  fontFamily: 'inherit',
};

// ─── Main ─────────────────────────────────────────────────────────────────────
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
    name: m.module_title.split(':')[0].trim().substring(0, 20),
    Answered: m.answered_questions,
    Pending: m.pending_questions,
  }));

  const resolutionData = moduleAnalytics.map(m => ({
    name: m.module_title.split(':')[0].trim().substring(0, 20),
    rate: m.total_questions > 0
      ? Math.round((m.answered_questions / m.total_questions) * 100)
      : 0,
  }));

  const resolutionRate = stats && stats.total_questions > 0
    ? Math.round((stats.answered_questions / stats.total_questions) * 100)
    : 0;

  const confusionModules = moduleAnalytics.filter(m => m.top_confusion_timestamps.length > 0);

  return (
    <div className="p-6 lg:p-10 max-w-6xl">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <BarChart2 size={16} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics</h1>
        </div>
        <p className="text-sm text-gray-500 ml-10">
          Knowledge gaps, response metrics, and learner engagement
        </p>
      </div>

      {/* ── KPI strip ── */}
      {stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            label="Total Questions"
            value={stats.total_questions}
            sub="across all modules"
            icon={MessageSquare}
            accent="bg-blue-500"
          />
          <KpiCard
            label="Avg Response Time"
            value={`${stats.avg_response_time_hours}h`}
            sub="from question to answer"
            icon={Clock}
            accent="bg-amber-500"
          />
          <KpiCard
            label="Resolution Rate"
            value={`${resolutionRate}%`}
            sub={`${stats.answered_questions} of ${stats.total_questions} answered`}
            icon={TrendingUp}
            accent="bg-emerald-500"
          />
          <KpiCard
            label="Active Learners"
            value={stats.total_employees ?? '—'}
            sub="enrolled employees"
            icon={Users}
            accent="bg-violet-500"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-2xl" />)}
        </div>
      )}

      {/* ── Resolution bar (inline summary) ── */}
      {stats && stats.total_questions > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-6 flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold">
            <CheckCircle2 size={16} className="text-emerald-500" />
            {stats.answered_questions} answered
          </div>
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
              style={{ width: `${resolutionRate}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-amber-600 font-semibold">
            <AlertCircle size={16} className="text-amber-400" />
            {stats.total_questions - stats.answered_questions} pending
          </div>
        </div>
      )}

      {/* ── Charts ── */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : moduleAnalytics.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-24 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <BarChart2 size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-900 font-semibold">No data yet</p>
          <p className="text-sm text-gray-400 mt-1.5">
            Analytics will appear once learners start asking questions.
          </p>
        </div>
      ) : (
        <div className="space-y-5">

          {/* Questions per Module */}
          <Section
            title="Questions per Module"
            description="Answered vs pending questions stacked by module"
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ left: -16, right: 8, top: 4, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'inherit' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'inherit' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingTop: 16 }}
                  formatter={v => (
                    <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'inherit' }}>{v}</span>
                  )}
                />
                <Bar dataKey="Answered" fill="#10b981" radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="Pending"  fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {/* Resolution Rate */}
          <Section
            title="Resolution Rate by Module"
            description="Percentage of questions answered per module"
          >
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={resolutionData} margin={{ left: -16, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'inherit' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'inherit' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={false}
                  formatter={(v: number) => [`${v}%`, 'Resolution']}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ fill: '#6366f1', r: 5, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#4f46e5', strokeWidth: 0 }}
                  name="Resolution %"
                />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          {/* Confusion Points */}
          {confusionModules.length > 0 && (
            <Section
              title="Top Confusion Points"
              description="Moments in videos where learners ask the most questions — review these timestamps"
              badge={
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                  <Zap size={10} /> Insight
                </span>
              }
            >
              <div className="space-y-6">
                {confusionModules.map(m => (
                  <div key={m.module_id}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                      <p className="text-sm font-semibold text-gray-800 truncate">{m.module_title}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap pl-3.5">
                      {m.top_confusion_timestamps.map((ts, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold shadow-sm"
                        >
                          <Zap size={10} className="text-amber-400" />
                          {fmt(ts)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
