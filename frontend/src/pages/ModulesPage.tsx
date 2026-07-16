import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, Award, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import type { Module, Certificate } from '../types';
import ModuleCard from '../components/ModuleLibrary/ModuleCard';
import { Skeleton } from '../components/UI/Skeleton';
import { useState, useMemo } from 'react';
import { useAuthStore } from '../store';

// ── Design tokens — theme-aware (follow light/dark via CSS vars) ────────────
// These map to --c-* in index.css, so the page follows the learner's theme.
const GOLD    = 'var(--c-acc)';    // brand purple
const TERRA   = 'var(--c-go)';     // lime green
const DARK    = 'var(--c-bg)';     // page background
const DARK2   = 'var(--c-bg2)';    // raised surface
const DARK3   = 'var(--c-bg2)';    // pills / hover
const INK     = 'var(--c-ink)';    // primary text
const INK2    = 'var(--c-ink2)';   // secondary text
const INK3    = 'var(--c-ink3)';   // muted text
const BORDER  = 'var(--c-rule)';
// Unified type system (matches the rest of the product)
const DISP    = "'Cormorant Garamond', Georgia, serif";
const UIFONT  = "'Inter Tight', 'Inter', system-ui, sans-serif";
const MONO    = "'DM Mono', ui-monospace, monospace";

type FilterKey = 'all' | 'in_progress' | 'completed' | 'not_started';

const FILTERS: { key: FilterKey; label: string; color: string }[] = [
  { key: 'all',         label: 'All',         color: INK2  },
  { key: 'in_progress', label: 'In Progress',  color: GOLD  },
  { key: 'completed',   label: 'Completed',    color: '#34d399' },
  { key: 'not_started', label: 'Not Started',  color: INK3  },
];

export default function ModulesPage() {
  const { user } = useAuthStore();
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<FilterKey>('all');

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

  const completed   = modules.filter(m => m.status === 'completed').length;
  const inProgress  = modules.filter(m => m.status === 'in_progress').length;
  const notStarted  = modules.length - completed - inProgress;

  const overallPct = modules.length > 0 ? Math.round((completed / modules.length) * 100) : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] ?? '';

  const filtered = useMemo(() => {
    let list = modules;
    if (filter !== 'all') list = list.filter(m => (m.status ?? 'not_started') === filter);
    if (search) list = list.filter(m => m.title.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [modules, filter, search]);

  return (
    <div style={{ background: DARK, minHeight: '100vh', fontFamily: UIFONT }}>

      {/* ══ HERO ═══════════════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(28px,5vw,48px) 0 clamp(24px,4vw,40px)' }}>
        {/* Background photo — subtle wash. Subject sits on the right; a
            white-to-transparent gradient keeps the left (where text lives) clean. */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <img
            src="/learning-hub-bg.jpg"
            alt=""
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'right center',
              opacity: 0.5,
            }}
          />
          {/* Scrim: fade to white on the left + bottom so text stays crisp */}
          <div style={{
            position: 'absolute', inset: 0,
            // Fades the photo into the page bg (works in light AND dark).
            background: 'linear-gradient(90deg, var(--c-bg) 8%, color-mix(in srgb, var(--c-bg) 85%, transparent) 34%, color-mix(in srgb, var(--c-bg) 55%, transparent) 60%, color-mix(in srgb, var(--c-bg) 35%, transparent) 100%), linear-gradient(0deg, var(--c-bg) 0%, transparent 45%)',
          }} />
        </div>

        {/* (Animated particles/orbs/grid removed — the background photo now
            carries the hero, and stacking moving layers over it felt busy.) */}

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 2 }}>

          {/* Eyebrow */}
          <div style={{
            fontFamily: MONO, fontSize: 11, letterSpacing: '0.24em',
            textTransform: 'uppercase', color: GOLD, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 9,
          }}>
            <span style={{ width: 22, height: 1.5, background: GOLD, display: 'inline-block', borderRadius: 2, opacity: 0.55 }} />
            Learning Hub
          </div>

          {/* Greeting headline */}
          <h1 style={{
            fontFamily: DISP,
            fontSize: 'clamp(34px, 5.5vw, 52px)',
            fontWeight: 700, lineHeight: 1.08,
            letterSpacing: '-0.03em', color: INK,
            marginBottom: 14, maxWidth: 640,
          }}>
            {greeting}{firstName && (
              <>, <span style={{ color: GOLD }}>{firstName}</span></>
            )}
          </h1>

          <p style={{ fontSize: 16, color: INK2, lineHeight: 1.55, marginBottom: 28, maxWidth: 460 }}>
            Your courses are ready. Pick up where you left off or start something new.
          </p>

          {/* Progress summary card */}
          {modules.length > 0 && (
            <div className="hub-progress-card" style={{
              display: 'flex', alignItems: 'center', gap: 24,
              background: 'var(--c-surf)', border: `1px solid ${BORDER}`,
              borderRadius: 16, padding: '20px 26px',
              marginBottom: 0, maxWidth: 'fit-content',
              boxShadow: '0 1px 2px rgba(31,31,36,0.04), 0 8px 24px -12px rgba(31,31,36,0.12)',
            }}>
              {/* Donut */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                  {(() => {
                    const R = 24, C = 2 * Math.PI * R;
                    const filled = (overallPct / 100) * C;
                    return (
                      <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="28" cy="28" r={R} fill="none" stroke="rgba(31,31,36,0.08)" strokeWidth="5" />
                        <circle cx="28" cy="28" r={R} fill="none" stroke={GOLD} strokeWidth="5"
                          strokeLinecap="round" strokeDasharray={`${filled} ${C}`}
                          style={{ transition: 'stroke-dasharray 1.2s ease' }}
                        />
                      </svg>
                    );
                  })()}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: GOLD }}>{overallPct}%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: INK, letterSpacing: '-0.01em' }}>Overall progress</span>
                  <span style={{ fontSize: 12, color: INK3 }}>{completed} of {modules.length} complete</span>
                </div>
              </div>

              <div className="hub-progress-divider" style={{ borderLeft: `1px solid ${BORDER}`, alignSelf: 'stretch' }} />

              {/* Stat pills */}
              <div className="hub-progress-stats" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                <StatItem value={modules.length}  label="Total"       />
                <StatItem value={completed}        label="Completed"   color="#34d399" />
                <StatItem value={inProgress}       label="In Progress" color={GOLD} />
                {notStarted > 0 && <StatItem value={notStarted} label="Not Started" />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ TOOLBAR ═══════════════════════════════════════════════════════ */}
      {/* top:56px clears the sticky 56px Navbar (z-40) so it doesn't hide behind it */}
      <div style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, background: 'color-mix(in srgb, var(--c-bg) 92%, transparent)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', position: 'sticky', top: 56, zIndex: 20 }}>
        <div className="toolbar-inner" style={{ maxWidth: 1400, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', flex: '1 1 auto' }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  fontFamily: MONO,
                  fontSize: 11, fontWeight: filter === f.key ? 700 : 500,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '8px 16px', borderRadius: 100,
                  border: filter === f.key ? `1px solid rgba(142,45,158,0.28)` : `1px solid ${BORDER}`,
                  cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                  minHeight: 36,
                  background: filter === f.key ? 'rgba(142,45,158,0.09)' : 'transparent',
                  color: filter === f.key ? f.color : INK3,
                  whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="toolbar-search" style={{ position: 'relative', flex: '0 0 280px', maxWidth: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: INK3, pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search modules…"
              style={{
                width: '100%', boxSizing: 'border-box',
                paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
                fontSize: 14, /* 14px+ prevents iOS zoom */
                background: DARK2, border: `1px solid ${BORDER}`,
                borderRadius: 10, color: INK, outline: 'none',
                fontFamily: 'inherit', transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = `rgba(142,45,158,0.4)`)}
              onBlur={e => (e.target.style.borderColor = BORDER)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(31,31,36,0.05)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: INK3,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══ MODULE GRID ═══════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 'clamp(16px,3vw,24px) clamp(12px,4vw,32px) 24px' }}>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: DARK2, borderRadius: 14, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                <div style={{ aspectRatio: '16/9', background: DARK3, animation: 'pulse 2s infinite' }} />
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{
              width: 56, height: 56, background: DARK2, border: `1px solid ${BORDER}`,
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <BookOpen size={22} style={{ color: INK3 }} />
            </div>
            <p style={{ fontFamily: DISP, fontSize: 20, fontWeight: 700, color: INK, marginBottom: 8, letterSpacing: '-0.01em' }}>
              {search ? `No results for "${search}"` : 'No courses yet'}
            </p>
            <p style={{ fontSize: 13.5, color: INK3, lineHeight: 1.6 }}>
              {search ? 'Try a different search term or browse all courses.' : 'Your instructor will add courses here soon.'}
            </p>
          </div>
        ) : (
          <div className="modules-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filtered.map(m => (
              <div key={m.id} style={{ position: 'relative' }}>
                <ModuleCard module={m} />
                {certByModule[m.id] && (
                  <Link
                    to={`/certificate/${certByModule[m.id].id}`}
                    style={{
                      position: 'absolute', top: 14, right: 14,
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: GOLD, color: '#ffffff',
                      fontSize: 10.5, fontWeight: 700, fontFamily: MONO,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      padding: '4px 10px', borderRadius: 100,
                      textDecoration: 'none', boxShadow: '0 2px 12px rgba(142,45,158,0.4)',
                      transition: 'opacity 0.2s',
                    }}
                    title="View your certificate"
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.88')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                  >
                    <Award size={11} /> Certificate
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

        /* ── Mobile overrides ── */
        @media (max-width: 640px) {
          .hero-desktop-only { display: none !important; }
          .modules-grid { grid-template-columns: 1fr !important; }
          .toolbar-inner { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; padding: 10px 16px !important; }
          .toolbar-search { flex: 1 1 auto !important; max-width: 100% !important; }
          /* Progress card: stack so it never overflows the viewport width */
          .hub-progress-card { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; max-width: 100% !important; width: 100% !important; box-sizing: border-box; padding: 16px 18px !important; }
          .hub-progress-divider { display: none !important; }
          .hub-progress-stats { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 14px 24px !important; width: 100%; }
        }
        @media (max-width: 480px) {
          .modules-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
        }
      `}</style>
    </div>
  );
}

// ── StatItem ──────────────────────────────────────────────────────────────
function StatItem({ value, label, color = '#1f1f24' }: { value: number; label: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
      <span style={{ fontFamily: DISP, fontSize: 26, fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}
      </span>
      <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9b96a3', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  );
}
