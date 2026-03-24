import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/client';
import type { DashboardStats, ModuleAnalytics, Question } from '../../types';
import { Skeleton } from '../../components/UI/Skeleton';
import Avatar from '../../components/UI/Avatar';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuthStore } from '../../store';

// Design tokens
const INK   = '#1a1714';
const INK2  = '#6b6460';
const INK3  = '#a09990';
const RULE  = '#d4cdc6';
const SURF  = '#fffcf8';
const BG    = '#f2ede8';
const BG2   = '#e8e2db';
const ACC   = '#c94f2c';
const ACC2  = '#2c6bc9';
const GO    = '#2a7a4b';
const WARN  = '#c97a2c';

// ── KPI Card ──────────────────────────────────────────────────────────────
type IconVariant = 'blue' | 'amber' | 'green' | 'red';
const ICON_COLORS: Record<IconVariant, { bg: string; color: string }> = {
  blue:  { bg: 'rgba(44,107,201,0.1)',  color: ACC2 },
  amber: { bg: 'rgba(201,122,44,0.1)',  color: WARN },
  green: { bg: 'rgba(42,122,75,0.1)',   color: GO },
  red:   { bg: 'rgba(201,79,44,0.1)',   color: ACC },
};

function KpiCard({
  label, value, sub, iconSvg, variant, trend,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  iconSvg: React.ReactNode;
  variant: IconVariant;
  trend?: { label: string; positive?: boolean };
}) {
  const ic = ICON_COLORS[variant];
  return (
    <div
      style={{ background: SURF, padding: '22px 24px 20px', position: 'relative', cursor: 'default', transition: 'background 0.2s' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#fffef9')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = SURF)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK3 }}>
          {label}
        </span>
        <div style={{ width: 18, height: 18, borderRadius: 3, background: ic.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ic.color }}>
          {iconSvg}
        </div>
      </div>
      <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 42, fontWeight: 600, lineHeight: 1, color: INK, letterSpacing: '-0.03em' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: INK3, marginTop: 8, fontWeight: 400 }}>{sub}</div>}
      {trend && (
        <div style={{
          position: 'absolute', bottom: 14, right: 16,
          fontFamily: "'Inconsolata', monospace", fontSize: 10, letterSpacing: '0.06em',
          color: trend.positive ? GO : INK3,
        }}>
          {trend.label}
        </div>
      )}
    </div>
  );
}

// ── Resolution cell ────────────────────────────────────────────────────────
function ResCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: BG, padding: '14px 16px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK3, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 24, fontWeight: 600, color: INK3 }}>
        {value}
      </div>
    </div>
  );
}

// ── Panel wrapper ──────────────────────────────────────────────────────────
function Panel({ title, sub, action, children }: {
  title: string; sub?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: SURF, border: `1px solid ${RULE}`, borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ padding: '16px 22px', borderBottom: `1px solid ${RULE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.01em', color: INK }}>{title}</div>
          {sub && <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, color: INK3, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1 }}>{sub}</div>}
        </div>
        {action}
      </div>
      <div style={{ padding: 22 }}>{children}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
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

  return (
    <div style={{ padding: 32, fontFamily: "'Syne', 'Inter', sans-serif" }}>

      {/* ── Greeting ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, animation: 'dash-slideUp 0.5s ease both' }}>
        <div>
          <h1 style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 'clamp(28px, 3vw, 42px)',
            fontWeight: 300, fontStyle: 'italic',
            letterSpacing: '-0.02em', lineHeight: 1.1, color: INK,
          }}>
            {greeting},{' '}
            <strong style={{ fontWeight: 400, fontStyle: 'normal', color: ACC }}>{firstName}</strong>
          </h1>
          <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11, color: INK3, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6 }}>
            {todayLabel}
          </div>
        </div>
      </div>

      {/* ── KPI grid ─────────────────────────────────────────── */}
      {statsLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4, marginBottom: 28 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded" />)}
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
          gap: '1px', background: RULE,
          border: `1px solid ${RULE}`, borderRadius: 6,
          overflow: 'hidden', marginBottom: 28,
          animation: 'dash-slideUp 0.5s ease both 0.08s',
        }}>
          <KpiCard
            label="Total Questions"
            value={<>{stats?.total_questions ?? 0}</>}
            sub="Across all modules"
            variant="blue"
            trend={{ label: '– no change' }}
            iconSvg={
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M8 2a6 6 0 110 12A6 6 0 018 2zM8 7v2M8 11h.01"/>
              </svg>
            }
          />
          <KpiCard
            label="Needs Response"
            value={<>{stats?.pending_questions ?? 0}</>}
            sub="Awaiting your reply"
            variant="amber"
            trend={{ label: '– idle' }}
            iconSvg={
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M8 3v5l3 3"/><circle cx="8" cy="8" r="6"/>
              </svg>
            }
          />
          <KpiCard
            label="Resolution Rate"
            value={<>{resolutionRate}<span style={{ fontSize: 20, letterSpacing: 0 }}>%</span></>}
            sub={`${stats?.answered_questions ?? 0} questions resolved`}
            variant="green"
            trend={{ label: resolutionRate > 0 ? `↑ ${resolutionRate}% rate` : '– no data', positive: resolutionRate > 0 }}
            iconSvg={
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 8l3.5 3.5L13 5"/>
              </svg>
            }
          />
          <KpiCard
            label="Avg Response"
            value={<>{stats?.avg_response_time_hours ?? 0}<span style={{ fontSize: 20, letterSpacing: 0 }}>h</span></>}
            sub="Mean time to answer"
            variant="red"
            trend={{ label: '– no activity' }}
            iconSvg={
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="8" cy="8" r="6"/><path d="M8 5v3.5L10.5 11"/>
              </svg>
            }
          />
        </div>
      )}

      {/* ── Lower grid ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, animation: 'dash-slideUp 0.55s ease both 0.16s' }}>

        {/* Pending questions */}
        <Panel
          title="Pending Questions"
          sub="Awaiting instructor response"
          action={
            <button
              onClick={() => navigate('/admin/questions')}
              style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11, color: ACC2, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4, transition: 'opacity 0.2s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.65')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            >
              View all →
            </button>
          }
        >
          {pendingQuestions.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', gap: 8 }}>
              <div style={{ width: 40, height: 40, border: `1.5px solid ${RULE}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: INK3, marginBottom: 6 }}>
                ✓
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>All caught up</div>
              <div style={{ fontSize: 12, color: INK3, textAlign: 'center', lineHeight: 1.5 }}>No pending questions right now.<br/>Check back later.</div>
            </div>
          ) : (
            <div style={{ margin: -22 }}>
              {pendingQuestions.map((q, i) => (
                <div
                  key={q.id}
                  onClick={() => navigate(`/admin/questions/${q.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '13px 22px',
                    borderBottom: i < pendingQuestions.length - 1 ? `1px solid rgba(212,205,198,0.5)` : 'none',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = BG2)}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <Avatar name={q.asked_by_user.full_name} url={q.asked_by_user.avatar_url} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                      {q.question_text}
                    </p>
                    <p style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11, color: INK3, letterSpacing: '0.02em' }}>
                      {q.asked_by_user.full_name} · {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      fontFamily: "'Inconsolata', monospace", fontSize: 10, fontWeight: 600,
                      color: WARN, background: 'rgba(201,122,44,0.08)',
                      border: '1px solid rgba(201,122,44,0.2)',
                      borderRadius: 100, padding: '2px 8px', letterSpacing: '0.04em',
                    }}>
                      PENDING
                    </span>
                    <ArrowRight size={13} style={{ color: RULE }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Resolution status */}
        <Panel title="Resolution Status" sub="Overall Q&A breakdown">
          {/* 2×2 cell grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 4, overflow: 'hidden', marginBottom: 16, margin: '-22px -22px 16px' }}>
            <ResCell label="Open"     value={stats ? stats.pending_questions : 0} />
            <ResCell label="Resolved" value={stats ? stats.answered_questions : 0} />
            <ResCell label="Pending"  value={stats ? stats.pending_questions : 0} />
            <ResCell label="Avg Days" value="—" />
          </div>

          {/* Mini bar chart or no-data */}
          {moduleAnalytics.length > 0 ? (
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={moduleAnalytics.slice(0, 7)} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="module_title" tick={{ fontSize: 9, fill: INK3, fontFamily: 'Inconsolata, monospace' }} tickFormatter={v => v.substring(0, 4).toUpperCase()} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 4, border: `1px solid ${RULE}`, fontSize: 11, background: SURF }}
                  cursor={{ fill: BG2 }}
                />
                <Bar dataKey="answered_questions" fill={GO} radius={[2, 2, 0, 0]} stackId="a" />
                <Bar dataKey="pending_questions" fill={WARN} radius={[2, 2, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <>
              <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, color: INK3, letterSpacing: '0.08em', textAlign: 'center', padding: '20px 0 4px' }}>
                NO CHART DATA YET
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 56, paddingTop: 8 }}>
                {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => (
                  <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', height: 4, borderRadius: '2px 2px 0 0', background: RULE, minHeight: 4 }} />
                    <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 9, color: INK3, marginTop: 5, letterSpacing: '0.04em' }}>{d}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${RULE}`, marginTop: 6 }} />
            </>
          )}
        </Panel>
      </div>

      {/* ── Module bar chart (full width, if data) ───────────── */}
      {moduleAnalytics.length > 0 && (
        <div style={{ background: SURF, border: `1px solid ${RULE}`, borderRadius: 6, padding: 22, marginTop: 20, animation: 'dash-slideUp 0.6s ease both 0.22s' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>Questions by Module</div>
              <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, color: INK3, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1 }}>
                Identify which modules generate the most confusion
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={moduleAnalytics} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="module_title"
                tick={{ fontSize: 11, fill: INK3, fontFamily: 'Inconsolata, monospace' }}
                tickFormatter={v => v.split(':')[0].trim().substring(0, 18)}
                axisLine={false} tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: INK3 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 4, border: `1px solid ${RULE}`, fontSize: 12, background: SURF }}
                cursor={{ fill: BG2 }}
              />
              <Bar dataKey="answered_questions" name="Answered" fill={GO} radius={[3, 3, 0, 0]} stackId="a" />
              <Bar dataKey="pending_questions" name="Pending" fill={WARN} radius={[3, 3, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <style>{`
        @keyframes dash-slideUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
