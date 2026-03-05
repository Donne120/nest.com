import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Clock, CheckCircle2, AlertCircle, ArrowRight,
  TrendingUp, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../api/client';
import type { DashboardStats, ModuleAnalytics, Question } from '../../types';
import { Skeleton } from '../../components/UI/Skeleton';
import Avatar from '../../components/UI/Avatar';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuthStore } from '../../store';
import type { ElementType } from 'react';

function KpiCard({
  label, value, sub, icon: Icon, iconBg, iconColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon size={15} className={iconColor} />
        </div>
      </div>
      <p className="text-[28px] font-bold text-gray-900 tabular-nums leading-none">{value}</p>
      {sub && <p className="text-[12px] text-gray-400 mt-2 leading-none">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] ?? 'Admin';
  const todayLabel = format(new Date(), "EEEE, MMMM d, yyyy");

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/analytics/dashboard').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: moduleAnalytics = [] } = useQuery<ModuleAnalytics[]>({
    queryKey: ['module-analytics'],
    queryFn: () => api.get('/analytics/modules').then(r => r.data),
  });

  const { data: pendingQuestions = [] } = useQuery<Question[]>({
    queryKey: ['pending-questions'],
    queryFn: () => api.get('/questions/pending?limit=6').then(r => r.data),
    refetchInterval: 15000,
  });

  const resolutionRate = stats && stats.total_questions > 0
    ? Math.round((stats.answered_questions / stats.total_questions) * 100)
    : 0;

  const pieData = stats ? [
    { name: 'Answered', value: stats.answered_questions },
    { name: 'Pending', value: stats.pending_questions },
  ] : [];

  return (
    <div className="p-6 lg:p-8 max-w-7xl">

      {/* ─── Page header ─── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-1">{todayLabel}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-400">
          <Activity size={12} className="text-emerald-500" />
          Live dashboard
        </div>
      </div>

      {/* ─── KPI cards ─── */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            label="Total Questions"
            value={stats.total_questions}
            sub="Across all modules"
            icon={MessageSquare}
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
          />
          <KpiCard
            label="Needs Response"
            value={stats.pending_questions}
            sub="Awaiting your reply"
            icon={AlertCircle}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
          />
          <KpiCard
            label="Resolution Rate"
            value={`${resolutionRate}%`}
            sub={`${stats.answered_questions} questions resolved`}
            icon={CheckCircle2}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-500"
          />
          <KpiCard
            label="Avg Response"
            value={`${stats.avg_response_time_hours}h`}
            sub="Mean time to answer"
            icon={Clock}
            iconBg="bg-violet-50"
            iconColor="text-violet-500"
          />
        </div>
      ) : null}

      {/* ─── Main grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Pending questions queue */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Pending Questions</h2>
              {pendingQuestions.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {pendingQuestions.length} question{pendingQuestions.length !== 1 ? 's' : ''} need attention
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/admin/questions')}
              className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>

          <div className="divide-y divide-gray-50 flex-1">
            {pendingQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-5">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-gray-800">All caught up!</p>
                <p className="text-xs text-gray-400 mt-1">No pending questions right now.</p>
              </div>
            ) : (
              pendingQuestions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => navigate(`/admin/questions/${q.id}`)}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/80 cursor-pointer transition-colors group"
                >
                  <Avatar name={q.asked_by_user.full_name} url={q.asked_by_user.avatar_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-800 line-clamp-1 group-hover:text-brand-600 transition-colors">
                      {q.question_text}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {q.asked_by_user.full_name} &middot; {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                      Pending
                    </span>
                    <ArrowRight size={13} className="text-gray-300 group-hover:text-brand-400 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Donut chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-gray-900">Resolution Status</h2>
          <p className="text-xs text-gray-400 mt-0.5 mb-2">Overall Q&A breakdown</p>
          {stats && pieData.some(d => d.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={74}
                    paddingAngle={3} dataKey="value"
                    strokeWidth={0}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8, border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12
                    }}
                    cursor={false}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 mt-auto pt-2">
                <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  Answered ({stats.answered_questions})
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
                  Pending ({stats.pending_questions})
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-300">No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Module bar chart ─── */}
      {moduleAnalytics.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Questions by Module</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Identify which modules generate the most confusion
              </p>
            </div>
            <TrendingUp size={16} className="text-gray-300 mt-0.5" />
          </div>
          <div className="mt-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={moduleAnalytics} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="module_title"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={(v) => v.split(':')[0].trim().substring(0, 18)}
                  axisLine={false} tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8, border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12
                  }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar dataKey="answered_questions" name="Answered" fill="#10b981" radius={[3, 3, 0, 0]} stackId="a" />
                <Bar dataKey="pending_questions" name="Pending" fill="#f59e0b" radius={[3, 3, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
