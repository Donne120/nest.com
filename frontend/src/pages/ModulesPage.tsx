import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, Award, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import type { Module, Certificate } from '../types';
import ModuleCard from '../components/ModuleLibrary/ModuleCard';
import DashboardHero from '../components/ModuleLibrary/DashboardHero';
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

type FilterKey = 'all' | 'in_progress' | 'completed';

// Verbs, not statuses. And no "Not Started" filter — nobody wants to filter
// FOR the things they haven't done yet.
const FILTERS: { key: FilterKey; label: string; color: string }[] = [
  { key: 'all',         label: 'All courses', color: INK2  },
  { key: 'in_progress', label: 'Learning',    color: GOLD  },
  { key: 'completed',   label: 'Finished',    color: 'var(--c-ok)' },
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

  // Learner momentum: streak + how close to a certificate (drives the hero).
  const { data: summary } = useQuery<{ streak: number; at_risk: boolean; nudge: { lessons_left: number; lessons_done: number; lessons_total: number; module_id: string } | null }>({
    queryKey: ['progress-summary'],
    queryFn: () => api.get('/progress/summary').then(r => r.data),
    enabled: !!user,
  });

  const certByModule = Object.fromEntries(certificates.map(c => [c.module.id, c]));

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
    <div style={{ background: DARK, minHeight: '100dvh', fontFamily: UIFONT }}>

      {/* ══ DASHBOARD HERO — the approved Calm Purple design ═══════════════
          A violet "continue learning" card + a progress ring, so a learner
          lands on their momentum and one next action. */}
      <div style={{ padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,24px) clamp(16px,3vw,24px)', maxWidth: 1400, margin: '0 auto' }}>
        <DashboardHero
          modules={modules}
          firstName={firstName}
          greeting={greeting}
          streak={summary?.streak ?? 0}
        />
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
                  border: filter === f.key ? `1px solid rgba(109,74,224,0.28)` : `1px solid ${BORDER}`,
                  cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                  minHeight: 36,
                  background: filter === f.key ? 'rgba(109,74,224,0.09)' : 'transparent',
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
              placeholder="What do you want to learn?"
              style={{
                width: '100%', boxSizing: 'border-box',
                paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
                fontSize: 14, /* 14px+ prevents iOS zoom */
                background: DARK2, border: `1px solid ${BORDER}`,
                borderRadius: 10, color: INK, outline: 'none',
                fontFamily: 'inherit', transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = `rgba(109,74,224,0.4)`)}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: DARK2, borderRadius: 14, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                <div style={{ aspectRatio: '3/4', background: DARK3, animation: 'pulse 2s infinite' }} />
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
            <p style={{ fontFamily: DISP, fontSize: 22, fontWeight: 600, color: INK, marginBottom: 8, letterSpacing: '-0.01em' }}>
              {search ? `Nothing matches “${search}”.` : 'Nothing here yet.'}
            </p>
            <p style={{ fontSize: 14, color: INK2, lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
              {search
                ? 'Try fewer words — or browse everything.'
                : 'Your trainer is still building. Check back — it won’t be long.'}
            </p>
            {/* Never leave a dead end */}
            {(search || filter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setFilter('all'); }}
                className="press"
                style={{
                  marginTop: 18, minHeight: 44, padding: '0 20px',
                  background: GOLD, color: 'var(--c-on-acc)',
                  border: 'none', borderRadius: 10, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700,
                }}
              >
                Show all courses
              </button>
            )}
          </div>
        ) : (
          <div className="modules-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>
            {filtered.map(m => (
              <div key={m.id} style={{ position: 'relative' }}>
                <ModuleCard module={m} />
                {/* Certificate — a trophy, so it's GOLD (purple is for actions).
                    Sits at the bottom so it can't collide with the card's own
                    status/price chips at the top. */}
                {certByModule[m.id] && (
                  <Link
                    to={`/certificate/${certByModule[m.id].id}`}
                    className="press"
                    style={{
                      position: 'absolute', left: 12, right: 12, bottom: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: '#23B99A', color: '#FFFFFF',
                      fontSize: 10.5, fontWeight: 700, fontFamily: MONO,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      minHeight: 34, borderRadius: 100,
                      textDecoration: 'none', boxShadow: '0 6px 18px rgba(35,185,154,0.4)',
                      zIndex: 3,
                    }}
                    title="View your certificate"
                  >
                    <Award size={11} /> View certificate
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
        @media (max-width: 820px) {
          .dash-hero { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .hero-desktop-only { display: none !important; }
          .modules-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
          .toolbar-inner { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; padding: 10px 16px !important; }
          .toolbar-search { flex: 1 1 auto !important; max-width: 100% !important; }
        }
        @media (max-width: 480px) {
          .modules-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
        }
      `}</style>
    </div>
  );
}


