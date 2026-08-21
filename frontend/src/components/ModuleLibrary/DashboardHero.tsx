import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import type { Module } from '../../types';

// ── Calm Purple dashboard hero ──────────────────────────────────────────────
// The violet "continue learning" card + a progress ring, matching the approved
// design. Greets the learner with one next action and their momentum at a glance.

const DISP = "'Fraunces', 'Cormorant Garamond', Georgia, serif";
const UI   = "'Inter Tight', 'Inter', system-ui, sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";
const GRAD = 'linear-gradient(135deg, #8B6FE8 0%, #6D4AE0 55%, #5A38C7 100%)';

function pct(m: Module): number {
  if (!m.duration_seconds) return m.status === 'completed' ? 100 : 0;
  return Math.min(100, Math.round(((m.progress_seconds ?? 0) / m.duration_seconds) * 100));
}

// Ring that draws the overall completion — the "78%" donut from the design.
function ProgressRing({ value }: { value: number }) {
  const R = 50, C = 2 * Math.PI * R;
  const off = C - (value / 100) * C;
  return (
    <svg width="112" height="112" viewBox="0 0 120 120" style={{ flexShrink: 0 }} aria-hidden>
      <defs>
        <linearGradient id="dash-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8B6FE8" />
          <stop offset="1" stopColor="#6D4AE0" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r={R} fill="none" stroke="#EEEAFB" strokeWidth="12" />
      <circle
        cx="60" cy="60" r={R} fill="none" stroke="url(#dash-ring)" strokeWidth="12"
        strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }}
      />
      <text x="60" y="67" textAnchor="middle" style={{ fontFamily: DISP, fontSize: 24, fontWeight: 600, fill: '#1E1B2E' }}>
        {value}%
      </text>
    </svg>
  );
}

function SkillBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13.5 }}>
      <span style={{ color: '#1E1B2E', minWidth: 62 }}>{label}</span>
      <span style={{ flex: 1, height: 7, background: '#EEEAFB', borderRadius: 99, margin: '0 12px', overflow: 'hidden' }}>
        <i style={{ display: 'block', height: '100%', width: `${value}%`, background: color, borderRadius: 99 }} />
      </span>
      <b style={{ fontVariantNumeric: 'tabular-nums', color: '#1E1B2E', fontWeight: 600, minWidth: 34, textAlign: 'right' }}>{value}%</b>
    </div>
  );
}

export default function DashboardHero({
  modules,
  firstName,
  greeting,
  streak,
}: {
  modules: Module[];
  firstName: string;
  greeting: string;
  streak: number;
}) {
  // Pick the lesson to resume: the in-progress module with the most progress,
  // else the first not-yet-finished module.
  const inProgress = modules.filter(m => (m.status ?? 'not_started') === 'in_progress');
  const resume =
    inProgress.sort((a, b) => pct(b) - pct(a))[0] ??
    modules.find(m => (m.status ?? 'not_started') !== 'completed') ??
    modules[0];

  // Overall progress across everything that has runtime.
  const withTime = modules.filter(m => (m.duration_seconds ?? 0) > 0);
  const overall = withTime.length
    ? Math.round(withTime.reduce((s, m) => s + pct(m), 0) / withTime.length)
    : 0;

  const done = modules.filter(m => (m.status ?? 'not_started') === 'completed').length;
  const started = modules.filter(m => (m.status ?? 'not_started') === 'in_progress').length;

  return (
    <div className="dash-hero" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 20, marginBottom: 8 }}>

      {/* ── Continue-learning card (violet) ── */}
      <div style={{
        background: GRAD, borderRadius: 22, padding: 'clamp(22px,3vw,30px)',
        color: '#fff', position: 'relative', overflow: 'hidden', minHeight: 210,
        boxShadow: '0 18px 46px rgba(84,52,180,0.20), 0 6px 16px rgba(84,52,180,0.10)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div aria-hidden style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 8 }}>
            {greeting}{firstName ? `, ${firstName}` : ''}
          </div>
          {resume ? (
            <>
              <h2 style={{ fontFamily: DISP, fontSize: 'clamp(22px,3vw,28px)', fontWeight: 600, margin: '0 0 6px', lineHeight: 1.1 }}>
                {resume.title}
              </h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: 14, maxWidth: '34ch' }}>
                {pct(resume) > 0
                  ? `You're ${pct(resume)}% through — pick up where you left off.`
                  : 'Start your first lesson and build your streak.'}
              </p>
            </>
          ) : (
            <h2 style={{ fontFamily: DISP, fontSize: 26, fontWeight: 600, margin: 0 }}>
              Your courses are on the way.
            </h2>
          )}
        </div>

        {resume && (
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
            <Link
              to={`/modules/${resume.id}`}
              className="press"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#fff', color: '#5A38C7', fontFamily: UI, fontWeight: 700,
                fontSize: 14, padding: '11px 20px', borderRadius: 12, textDecoration: 'none',
              }}
            >
              <Play size={15} fill="#5A38C7" /> {pct(resume) > 0 ? 'Resume' : 'Start learning'}
            </Link>
            <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600 }}>
              {pct(resume)}% complete
            </span>
            {streak > 0 && (
              <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600 }}>
                🔥 {streak}-day streak
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Progress card (white) ── */}
      <div style={{
        background: '#fff', border: '1px solid #ECE9F7', borderRadius: 22,
        padding: 'clamp(20px,3vw,26px)', display: 'flex', alignItems: 'center', gap: 22,
        boxShadow: '0 4px 14px rgba(84,52,180,0.06)',
      }}>
        <ProgressRing value={overall} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <SkillBar label="Overall"   value={overall} color="#6D4AE0" />
          <SkillBar label="Finished"  value={modules.length ? Math.round((done / modules.length) * 100) : 0} color="#23B99A" />
          <SkillBar label="Started"   value={modules.length ? Math.round((started / modules.length) * 100) : 0} color="#F0894A" />
        </div>
      </div>
    </div>
  );
}
