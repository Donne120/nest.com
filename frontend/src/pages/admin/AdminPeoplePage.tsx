import { useQuery } from '@tanstack/react-query';
import {
  Star, AlertTriangle, Users, TrendingUp, Clock,
  Flame, CircleDot,
} from 'lucide-react';
import api from '../../api/client';
import type { PeopleReport, LearnerPeopleStats } from '../../types';
import { Skeleton } from '../../components/UI/Skeleton';
import Avatar from '../../components/UI/Avatar';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pctColor(pct: number) {
  if (pct === 100) return '#16a34a';
  if (pct >= 60) return '#d97706';
  if (pct > 0) return '#2563eb';
  return '#94a3b8';
}

function lastActiveLabel(days: number | null, pct: number): string {
  if (pct === 100) return 'Completed';
  if (days === null) return 'Never active';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

// ─── Employee card ─────────────────────────────────────────────────────────────

function LearnerCard({ emp }: { emp: LearnerPeopleStats }) {
  return (
    <div className={`bg-white rounded-2xl border p-4 flex flex-col gap-3 shadow-sm transition-all hover:shadow-md ${
      emp.is_at_risk ? 'border-amber-200' : emp.is_star ? 'border-emerald-200' : 'border-gray-200'
    }`}>
      <div className="flex items-start gap-3">
        <Avatar name={emp.name} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[13px] font-semibold text-gray-900 truncate">{emp.name}</p>
            {emp.is_star && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                <Star size={9} fill="currentColor" /> Star
              </span>
            )}
            {emp.is_at_risk && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                <AlertTriangle size={9} /> At Risk
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 truncate">{emp.email}</p>
        </div>
        <span className="text-[11px] font-bold tabular-nums flex-shrink-0" style={{ color: pctColor(emp.completion_pct) }}>
          {emp.completion_pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${emp.completion_pct}%`, backgroundColor: pctColor(emp.completion_pct) }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-[11px] text-gray-400">
        <span>{emp.completed_modules}/{emp.total_modules} modules</span>
        <div className="flex items-center gap-1">
          <Clock size={10} />
          <span>{lastActiveLabel(emp.days_since_active, emp.completion_pct)}</span>
        </div>
        {emp.time_to_complete_days !== null && (
          <span className="text-emerald-600 font-semibold">{emp.time_to_complete_days}d to finish</span>
        )}
      </div>
    </div>
  );
}

// ─── KPI strip ────────────────────────────────────────────────────────────────

function KpiStrip({ summary }: { summary: PeopleReport['summary'] }) {
  const kpis = [
    { label: 'Total People', value: summary.total, icon: Users, color: 'bg-blue-500' },
    { label: 'Stars (100%)', value: summary.stars, icon: Star, color: 'bg-emerald-500' },
    { label: 'At Risk', value: summary.at_risk, icon: AlertTriangle, color: 'bg-amber-500' },
    { label: 'Avg Completion', value: `${summary.avg_completion}%`, icon: TrendingUp, color: 'bg-violet-500' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {kpis.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
            <p className="text-2xl font-extrabold text-gray-900 leading-none mt-1 tabular-nums">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminPeoplePage() {
  const { data, isLoading } = useQuery<PeopleReport>({
    queryKey: ['people-analytics'],
    queryFn: () => api.get('/analytics/people').then(r => r.data),
    staleTime: 60_000,
  });

  const atRisk   = data?.learners.filter(e => e.is_at_risk) ?? [];
  const stars    = data?.learners.filter(e => e.is_star) ?? [];
  const active   = data?.learners.filter(e => !e.is_star && !e.is_at_risk && e.completion_pct > 0) ?? [];
  const notStarted = data?.learners.filter(e => e.completion_pct === 0 && !e.is_at_risk) ?? [];

  return (
    <div className="p-6 lg:p-10 max-w-6xl">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <Users size={16} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">People</h1>
        </div>
        <p className="text-sm text-gray-500 ml-10">
          Who's thriving, who's stuck, and who needs a nudge
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        </div>
      ) : !data ? null : (
        <>
          <KpiStrip summary={data.summary} />

          {/* At risk section */}
          {atRisk.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={14} className="text-amber-500" />
                <h2 className="text-sm font-bold text-gray-900">
                  Needs Attention
                  <span className="ml-2 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    {atRisk.length}
                  </span>
                </h2>
                <p className="text-xs text-gray-400 ml-1">No activity for 5+ days, not completed</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {atRisk.map(e => <LearnerCard key={e.id} emp={e} />)}
              </div>
            </section>
          )}

          {/* Stars */}
          {stars.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Flame size={14} className="text-emerald-500" />
                <h2 className="text-sm font-bold text-gray-900">
                  Stars
                  <span className="ml-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                    {stars.length}
                  </span>
                </h2>
                <p className="text-xs text-gray-400 ml-1">100% completed</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stars.map(e => <LearnerCard key={e.id} emp={e} />)}
              </div>
            </section>
          )}

          {/* In progress */}
          {active.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <CircleDot size={14} className="text-blue-500" />
                <h2 className="text-sm font-bold text-gray-900">
                  In Progress
                  <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                    {active.length}
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {active.map(e => <LearnerCard key={e.id} emp={e} />)}
              </div>
            </section>
          )}

          {/* Not started */}
          {notStarted.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />
                <h2 className="text-sm font-bold text-gray-900">
                  Not Started
                  <span className="ml-2 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">
                    {notStarted.length}
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {notStarted.map(e => <LearnerCard key={e.id} emp={e} />)}
              </div>
            </section>
          )}

          {data.learners.length === 0 && (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-24 text-center">
              <Users size={32} className="text-gray-200 mx-auto mb-4" />
              <p className="font-semibold text-gray-500">No team members yet</p>
              <p className="text-sm text-gray-400 mt-1">Invite learners to see their progress here.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
