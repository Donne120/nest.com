import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import api from '../../api/client';
import type { ModuleAnalytics, DashboardStats, BenchmarkData } from '../../types';
import { Skeleton } from '../../components/UI/Skeleton';
import { Download, Zap } from 'lucide-react';

import { BG, BG2, SURF, RULE, INK, INK2, INK3, ACC, ACC2, GO } from '../../lib/colors';
const WARN = '#c97a2c';
const UI     = "'Syne', 'Inter', sans-serif";
const MONO   = "'Inconsolata', monospace";
const DISP   = "'Fraunces', Georgia, serif";

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

const ttStyle = {
  borderRadius: 4, border: `1px solid ${RULE}`,
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  fontSize: 11, fontFamily: MONO,
  background: SURF, color: INK,
};

// ── Panel wrapper ─────────────────────────────────────────────────────────────
function Panel({ title, sub, action, noPad, children }: {
  title: string; sub?: string;
  action?: ReactNode;
  noPad?: boolean;
  children: ReactNode;
}) {
  return (
    <div style={{ background: SURF, border: `1px solid ${RULE}`, borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ padding: '16px 22px', borderBottom: `1px solid ${RULE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.01em', color: INK, fontFamily: UI }}>{title}</div>
          {sub && <div style={{ fontFamily: MONO, fontSize: 10, color: INK3, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{sub}</div>}
        </div>
        {action}
      </div>
      <div style={noPad ? {} : { padding: 22 }}>{children}</div>
    </div>
  );
}

// ── KPI grid ──────────────────────────────────────────────────────────────────
function KpiGrid({ stats }: { stats: DashboardStats }) {
  const resolutionRate = stats.total_questions > 0
    ? Math.round((stats.answered_questions / stats.total_questions) * 100) : 0;

  const kpis = [
    {
      label: 'Total Questions',
      value: <>{stats.total_questions}</>,
      sub: 'Across all modules',
      variant: 'blue' as const,
      trend: '— no change',
      icon: (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M8 2a6 6 0 110 12A6 6 0 018 2zM8 7v2M8 11h.01"/>
        </svg>
      ),
    },
    {
      label: 'Avg Response Time',
      value: <>{stats.avg_response_time_hours}<span style={{ fontSize: 20, letterSpacing: 0 }}>h</span></>,
      sub: 'From question to answer',
      variant: 'amber' as const,
      trend: stats.avg_response_time_hours === 0 ? '— idle' : `↑ ${stats.avg_response_time_hours}h avg`,
      icon: (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M8 3v5l3 3"/><circle cx="8" cy="8" r="6"/>
        </svg>
      ),
    },
    {
      label: 'Resolution Rate',
      value: <>{resolutionRate}<span style={{ fontSize: 20, letterSpacing: 0 }}>%</span></>,
      sub: `${stats.answered_questions} of ${stats.total_questions} answered`,
      variant: 'green' as const,
      trend: resolutionRate > 0 ? `↑ ${resolutionRate}% rate` : '— no data',
      icon: (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 8l3.5 3.5L13 5"/>
        </svg>
      ),
    },
    {
      label: 'Active Learners',
      value: <>{stats.total_learners ?? 0}</>,
      sub: 'Enrolled learners',
      variant: 'red' as const,
      trend: '— enrolled',
      icon: (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/>
        </svg>
      ),
    },
  ];

  const VARIANTS = {
    blue:  { bg: `rgba(44,107,201,0.1)`,  color: ACC2 },
    amber: { bg: `rgba(201,122,44,0.1)`,  color: WARN },
    green: { bg: `rgba(42,122,75,0.1)`,   color: GO },
    red:   { bg: `rgba(201,79,44,0.1)`,   color: ACC },
  };

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
      gap: '1px', background: RULE,
      border: `1px solid ${RULE}`, borderRadius: 6,
      overflow: 'hidden', marginBottom: 24,
    }}>
      {kpis.map(k => {
        const ic = VARIANTS[k.variant];
        return (
          <div key={k.label}
            style={{ background: SURF, padding: '22px 24px 20px', position: 'relative', transition: 'background 0.2s', cursor: 'default' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#fffef9')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = SURF)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK3 }}>{k.label}</span>
              <div style={{ width: 18, height: 18, borderRadius: 3, background: ic.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ic.color, flexShrink: 0 }}>{k.icon}</div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 42, fontWeight: 600, lineHeight: 1, color: INK, letterSpacing: '-0.03em' }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: 11.5, color: INK3, marginTop: 8, fontWeight: 400, fontFamily: UI }}>{k.sub}</div>}
            <div style={{ position: 'absolute', bottom: 14, right: 16, fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em', color: INK3 }}>{k.trend}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Benchmarks ────────────────────────────────────────────────────────────────
function BenchmarksPanel() {
  const { data } = useQuery<BenchmarkData>({
    queryKey: ['benchmarks'],
    queryFn: () => api.get('/analytics/benchmarks').then(r => r.data),
    staleTime: 300_000,
  });
  if (!data) return null;

  const pct = (val: number, max: number) => Math.min(Math.round((val / max) * 100), 100);
  const maxRate = Math.max(data.org_completion_rate, data.platform_avg_completion_rate, 1);
  const maxDays = Math.max(data.org_avg_days_to_complete ?? 0, data.platform_avg_days_to_complete ?? 0, 1);

  const rankPct  = 100 - data.org_rank_percentile;
  const rankColor = rankPct <= 25 ? GO : rankPct <= 50 ? WARN : ACC;

  return (
    <Panel
      title="Platform Benchmarks"
      sub={`Your org vs. ${data.total_orgs_compared} companies on Nest`}
      action={
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: rankColor, background: `${rankColor}14`, border: `1px solid ${rankColor}30`, borderRadius: 100, padding: '3px 10px' }}>
          Top {rankPct}%
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Completion rate */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK2 }}>Completion Rate</span>
            <div style={{ display: 'flex', gap: 14, fontFamily: MONO, fontSize: 11 }}>
              <span style={{ fontWeight: 600, color: ACC2 }}>You: {data.org_completion_rate}%</span>
              <span style={{ color: INK3 }}>Avg: {data.platform_avg_completion_rate}%</span>
            </div>
          </div>
          <BenchBar label="You" pct={pct(data.org_completion_rate, maxRate)} color={ACC2} />
          <BenchBar label="Avg" pct={pct(data.platform_avg_completion_rate, maxRate)} color={RULE} />
        </div>

        {/* Days to complete */}
        {(data.org_avg_days_to_complete !== null || data.platform_avg_days_to_complete !== null) && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK2 }}>Avg Days to Complete</span>
              <div style={{ display: 'flex', gap: 14, fontFamily: MONO, fontSize: 11 }}>
                <span style={{ fontWeight: 600, color: ACC2 }}>You: {data.org_avg_days_to_complete !== null ? `${data.org_avg_days_to_complete}d` : '—'}</span>
                <span style={{ color: INK3 }}>Avg: {data.platform_avg_days_to_complete}d</span>
              </div>
            </div>
            {data.org_avg_days_to_complete !== null && <BenchBar label="You" pct={pct(data.org_avg_days_to_complete, maxDays)} color={ACC2} />}
            <BenchBar label="Avg" pct={pct(data.platform_avg_days_to_complete ?? 0, maxDays)} color={RULE} />
          </div>
        )}
      </div>
    </Panel>
  );
}

function BenchBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', color: color === RULE ? INK3 : ACC2, width: 28, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: BG2, borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 100, background: color === RULE ? INK3 : color, width: `${pct}%`, opacity: color === RULE ? 0.35 : 1, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

// ── Completion types ──────────────────────────────────────────────────────────
interface LearnerCompletion {
  id: string; name: string; email: string; role: string;
  department: string | null; joined: string;
  completed_modules: number; total_modules: number; completion_pct: number;
}
interface CompletionReport {
  modules: { id: string; title: string }[];
  learners: LearnerCompletion[];
  summary: { total: number; completed: number; in_progress: number; not_started: number };
}

// ── Completion Report ─────────────────────────────────────────────────────────
function CompletionReportPanel() {
  const { data, isLoading } = useQuery<CompletionReport>({
    queryKey: ['completion-report'],
    queryFn: () => api.get('/analytics/completion-report').then(r => r.data),
  });

  const downloadCsv = async () => {
    try {
      const res = await api.get('/analytics/export.csv', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a'); a.href = url; a.download = 'nest-report.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  if (isLoading) return <Skeleton className="h-64 rounded" />;
  if (!data) return null;

  const { summary, learners } = data;

  const pctColor = (p: number) => p === 100 ? GO : p >= 50 ? WARN : p > 0 ? ACC2 : INK3;

  const summaryItems = [
    { label: 'Completed',   val: summary.completed,   color: GO },
    { label: 'In Progress', val: summary.in_progress,  color: WARN },
    { label: 'Not Started', val: summary.not_started,  color: INK3 },
  ];

  return (
    <Panel
      title="Completion Report"
      sub="Who's finished, who's stuck, who hasn't started"
      noPad
      action={
        <button onClick={downloadCsv} style={{
          fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em',
          color: ACC2, background: 'none',
          border: `1px solid rgba(44,107,201,0.25)`,
          borderRadius: 4, padding: '5px 12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
        >
          <Download size={11} /> Export CSV
        </button>
      }
    >
      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: RULE, borderBottom: `1px solid ${RULE}` }}>
        {summaryItems.map(s => (
          <div key={s.label} style={{ background: BG, padding: '14px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK3, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {learners.length === 0 ? (
        <div style={{ padding: '60px 22px', textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `1.5px solid ${RULE}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: INK3, fontSize: 16 }}>👤</div>
          <p style={{ fontFamily: UI, fontSize: 13.5, fontWeight: 700, color: INK, marginBottom: 4 }}>No learners yet</p>
          <p style={{ fontFamily: UI, fontSize: 12.5, color: INK3 }}>Invite your team to get started.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${RULE}` }}>
                {['Learner', 'Role', 'Joined', 'Progress'].map((h, i) => (
                  <th key={h} style={{
                    textAlign: i === 3 ? 'right' : 'left',
                    fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK3,
                    padding: '10px 22px', fontWeight: 500,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {learners.map((emp, idx) => (
                <tr key={emp.id}
                  style={{ borderBottom: idx < learners.length - 1 ? `1px solid rgba(212,205,198,0.4)` : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = BG2)}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 22px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: INK, fontFamily: UI, marginBottom: 2 }}>{emp.name}</p>
                    <p style={{ fontFamily: MONO, fontSize: 11, color: INK3, letterSpacing: '0.02em' }}>{emp.email}</p>
                  </td>
                  <td style={{ padding: '14px 22px' }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK3, background: BG2, border: `1px solid ${RULE}`, borderRadius: 100, padding: '3px 9px' }}>
                      {emp.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 22px' }}>
                    <span style={{ fontFamily: MONO, fontSize: 11.5, color: INK3 }}>
                      {new Date(emp.joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                  <td style={{ padding: '14px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                      <div style={{ width: 80, height: 3, background: BG2, borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 100, background: pctColor(emp.completion_pct), width: `${emp.completion_pct}%`, transition: 'width 0.7s ease' }} />
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: pctColor(emp.completion_pct), minWidth: 36, textAlign: 'right' }}>{emp.completion_pct}%</span>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: INK3 }}>{emp.completed_modules}/{emp.total_modules}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const { data: moduleAnalytics = [], isLoading } = useQuery<ModuleAnalytics[]>({
    queryKey: ['module-analytics'],
    queryFn: () => api.get('/analytics/modules').then(r => r.data),
  });
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/analytics/dashboard').then(r => r.data),
  });

  const resolutionRate = stats && stats.total_questions > 0
    ? Math.round((stats.answered_questions / stats.total_questions) * 100) : 0;

  const barData = moduleAnalytics.map(m => ({
    name: m.module_title.split(':')[0].trim().substring(0, 20),
    Answered: m.answered_questions,
    Pending: m.pending_questions,
  }));

  const lineData = moduleAnalytics.map(m => ({
    name: m.module_title.split(':')[0].trim().substring(0, 20),
    rate: m.total_questions > 0 ? Math.round((m.answered_questions / m.total_questions) * 100) : 0,
  }));

  const confusionModules = moduleAnalytics.filter(m => m.top_confusion_timestamps.length > 0);

  return (
    <div style={{ padding: 32, fontFamily: UI }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32, animation: 'dash-slideUp 0.5s ease both' }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: ACC, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 18, height: 1, background: ACC, display: 'inline-block', opacity: 0.6 }} />
          Admin
        </div>
        <h1 style={{ fontFamily: DISP, fontSize: 'clamp(28px,3vw,42px)', fontWeight: 300, fontStyle: 'italic', letterSpacing: '-0.02em', lineHeight: 1.1, color: INK, marginBottom: 6 }}>
          Analytics
        </h1>
        <p style={{ fontFamily: MONO, fontSize: 11, color: INK3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Knowledge gaps, response metrics, and learner engagement
        </p>
      </div>

      {/* ── KPI grid ── */}
      {stats ? (
        <KpiGrid stats={stats} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4, marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded" />)}
        </div>
      )}

      {/* ── Resolution summary bar ── */}
      {stats && stats.total_questions > 0 && (
        <div style={{
          background: SURF, border: `1px solid ${RULE}`, borderRadius: 6,
          padding: '14px 22px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: GO, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
            {stats.answered_questions} answered
          </span>
          <div style={{ flex: 1, height: 3, background: BG2, borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: GO, borderRadius: 100, width: `${resolutionRate}%`, transition: 'width 0.8s ease', boxShadow: `0 0 8px ${GO}55` }} />
          </div>
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: WARN, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
            {stats.total_questions - stats.answered_questions} pending
          </span>
        </div>
      )}

      {/* ── Lower grid: Benchmarks + Completion side-by-side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, marginBottom: 24 }}>
        <BenchmarksPanel />
        <CompletionReportPanel />
      </div>

      {/* ── Charts ── */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton className="h-64 rounded" />
          <Skeleton className="h-56 rounded" />
        </div>
      ) : moduleAnalytics.length === 0 ? (
        <div style={{ background: SURF, border: `1px solid ${RULE}`, borderRadius: 6, padding: '80px 20px', textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `1.5px solid ${RULE}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 18, color: INK3 }}>
            ▦
          </div>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: INK, marginBottom: 4, fontFamily: UI }}>No chart data yet</p>
          <p style={{ fontFamily: MONO, fontSize: 11, color: INK3, letterSpacing: '0.04em' }}>Analytics will appear once learners start asking questions.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Questions per Module */}
          <Panel title="Questions per Module" sub="Answered vs pending — stacked by module">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ left: -16, right: 8, top: 4, bottom: 0 }} barSize={24}>
                <CartesianGrid strokeDasharray="2 4" stroke={RULE} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: INK3, fontFamily: "'Inconsolata',monospace", letterSpacing: '0.04em' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: INK3, fontFamily: "'Inconsolata',monospace" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={ttStyle} cursor={{ fill: BG2 }} />
                <Bar dataKey="Answered" fill={GO}  radius={[0,0,0,0]} stackId="a" name="Answered" />
                <Bar dataKey="Pending"  fill={WARN} radius={[2,2,0,0]} stackId="a" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 20, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${RULE}` }}>
              <LegendDot color={GO}   label="Answered" />
              <LegendDot color={WARN} label="Pending" />
            </div>
          </Panel>

          {/* Resolution Rate */}
          <Panel title="Resolution Rate by Module" sub="Percentage of questions answered per module">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData} margin={{ left: -16, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={RULE} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: INK3, fontFamily: "'Inconsolata',monospace" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: INK3, fontFamily: "'Inconsolata',monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={ttStyle} cursor={false} formatter={(v: number) => [`${v}%`, 'Resolution']} />
                <Line type="monotone" dataKey="rate" stroke={ACC2} strokeWidth={2} dot={{ fill: ACC2, r: 4, strokeWidth: 0 }} activeDot={{ r: 5, fill: ACC2, strokeWidth: 2, stroke: SURF }} name="Resolution %" />
              </LineChart>
            </ResponsiveContainer>
          </Panel>

          {/* Confusion Points */}
          {confusionModules.length > 0 && (
            <Panel
              title="Top Confusion Points"
              sub="Video moments where learners ask the most — review these timestamps"
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: WARN, background: `${WARN}14`, border: `1px solid ${WARN}30`, borderRadius: 100, padding: '3px 10px' }}>
                  <Zap size={10} /> Insight
                </div>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {confusionModules.map(m => (
                  <div key={m.module_id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: ACC2, display: 'inline-block', flexShrink: 0 }} />
                      <p style={{ fontSize: 13, fontWeight: 600, color: INK, fontFamily: UI, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.module_title}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingLeft: 13 }}>
                      {m.top_confusion_timestamps.map((ts, i) => (
                        <span key={i} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: `${WARN}10`, color: WARN,
                          border: `1px solid ${WARN}30`,
                          borderRadius: 4, padding: '4px 10px',
                          fontFamily: MONO, fontSize: 11, fontWeight: 500, letterSpacing: '0.06em',
                        }}>
                          <Zap size={9} style={{ opacity: 0.7 }} /> {fmt(ts)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}

      <style>{`
        @keyframes dash-slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
      <span style={{ fontFamily: MONO, fontSize: 10.5, color: INK3, letterSpacing: '0.06em' }}>{label}</span>
    </div>
  );
}
