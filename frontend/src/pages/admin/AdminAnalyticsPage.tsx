import type { ReactNode, ElementType } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import api from '../../api/client';
import type { ModuleAnalytics, DashboardStats, BenchmarkData } from '../../types';
import { Skeleton } from '../../components/UI/Skeleton';
import {
  TrendingUp, Clock, Users, MessageSquare, Zap,
  CheckCircle2, AlertCircle, BarChart2, Download, Circle,
} from 'lucide-react';

// ─── Completion report types ───────────────────────────────────────────────────

interface EmployeeCompletion {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  joined: string;
  completed_modules: number;
  total_modules: number;
  completion_pct: number;
}

interface CompletionReport {
  modules: { id: string; title: string }[];
  employees: EmployeeCompletion[];
  summary: { total: number; completed: number; in_progress: number; not_started: number };
}

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

// ─── Benchmarks ───────────────────────────────────────────────────────────────

function BenchmarksSection() {
  const { data } = useQuery<BenchmarkData>({
    queryKey: ['benchmarks'],
    queryFn: () => api.get('/analytics/benchmarks').then(r => r.data),
    staleTime: 300_000,
  });

  if (!data) return null;

  const pct = (val: number, max: number) => Math.min(Math.round((val / max) * 100), 100);
  const maxRate = Math.max(data.org_completion_rate, data.platform_avg_completion_rate, 1);
  const maxDays = Math.max(data.org_avg_days_to_complete ?? 0, data.platform_avg_days_to_complete ?? 0, 1);

  const rankColor =
    data.org_rank_percentile >= 75 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    data.org_rank_percentile >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200' :
    'text-red-600 bg-red-50 border-red-200';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900">Platform Benchmarks</h2>
            <span className={`text-[10px] font-bold uppercase tracking-wider border rounded-full px-2 py-0.5 ${rankColor}`}>
              Top {100 - data.org_rank_percentile}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Your org vs. {data.total_orgs_compared} companies on Nest
          </p>
        </div>
      </div>
      <div className="px-6 py-5 space-y-5">
        {/* Completion rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600">Completion Rate</span>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-brand-700">You: {data.org_completion_rate}%</span>
              <span className="text-gray-400">Avg: {data.platform_avg_completion_rate}%</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-brand-600 font-semibold w-7">You</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct(data.org_completion_rate, maxRate)}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-semibold w-7">Avg</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-300 rounded-full transition-all" style={{ width: `${pct(data.platform_avg_completion_rate, maxRate)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Time to complete */}
        {(data.org_avg_days_to_complete !== null || data.platform_avg_days_to_complete !== null) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Avg Days to Complete</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-bold text-brand-700">
                  You: {data.org_avg_days_to_complete !== null ? `${data.org_avg_days_to_complete}d` : '—'}
                </span>
                <span className="text-gray-400">Avg: {data.platform_avg_days_to_complete}d</span>
              </div>
            </div>
            <div className="space-y-1.5">
              {data.org_avg_days_to_complete !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-brand-600 font-semibold w-7">You</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct(data.org_avg_days_to_complete, maxDays)}%` }} />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-semibold w-7">Avg</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-300 rounded-full" style={{ width: `${pct(data.platform_avg_days_to_complete ?? 0, maxDays)}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Completion Report ────────────────────────────────────────────────────────

function CompletionReportSection() {
  const { data, isLoading } = useQuery<CompletionReport>({
    queryKey: ['completion-report'],
    queryFn: () => api.get('/analytics/completion-report').then(r => r.data),
  });

  const downloadCsv = async () => {
    try {
      const response = await api.get('/analytics/export.csv', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nest-onboarding-report.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  };

  const pctColor = (pct: number) =>
    pct === 100 ? '#16a34a' : pct >= 50 ? '#d97706' : pct > 0 ? '#2563eb' : '#94a3b8';

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (!data) return null;

  const { summary, employees } = data;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Completion Report</h2>
          <p className="text-xs text-gray-400 mt-0.5">Who's finished, who's stuck, who hasn't started</p>
        </div>
        <button
          onClick={downloadCsv}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 border border-brand-200 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Download size={12} />
          Export CSV
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap px-6 py-4 border-b border-gray-50 bg-gray-50/50">
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-700">{summary.completed} completed</span>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5">
          <AlertCircle size={13} className="text-amber-500" />
          <span className="text-xs font-semibold text-amber-700">{summary.in_progress} in progress</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5">
          <Circle size={13} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-500">{summary.not_started} not started</span>
        </div>
      </div>

      {/* Table */}
      {employees.length === 0 ? (
        <div className="py-16 text-center">
          <Users size={24} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No employees yet. Invite your team to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Employee</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Role</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Joined</th>
                <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <p className="text-[13px] font-semibold text-gray-900">{emp.name}</p>
                    <p className="text-[11px] text-gray-400">{emp.email}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className="text-[11px] font-medium capitalize text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-[12px] text-gray-400">
                      {new Date(emp.joined).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${emp.completion_pct}%`, backgroundColor: pctColor(emp.completion_pct) }}
                        />
                      </div>
                      <span className="text-[12px] font-bold tabular-nums" style={{ color: pctColor(emp.completion_pct) }}>
                        {emp.completion_pct}%
                      </span>
                      <span className="text-[11px] text-gray-400 hidden sm:inline">
                        {emp.completed_modules}/{emp.total_modules}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

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

      {/* ── Benchmarks ── */}
      <BenchmarksSection />

      {/* ── Completion Report ── */}
      <div className="mb-6">
        <CompletionReportSection />
      </div>

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
