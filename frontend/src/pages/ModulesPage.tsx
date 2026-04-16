import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, Award, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import type { Module, Certificate } from '../types';
import ModuleCard from '../components/ModuleLibrary/ModuleCard';
import { Skeleton } from '../components/UI/Skeleton';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useAuthStore } from '../store';

// ── Design tokens ──────────────────────────────────────────────────────────
const GOLD    = '#e8c97e';
const TERRA   = '#c45c3c';
const DARK    = '#0b0c0f';
const DARK2   = '#13141a';
const DARK3   = '#1c1e27';
const INK     = '#e8e4dc';
const INK2    = '#9ca3af';
const INK3    = '#6b6b78';
const BORDER  = 'rgba(255,255,255,0.07)';

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

  // Payment gate — learners must have an approved payment
  if (user?.role === 'learner' && user.payment_verified === false) {
    return (
      <div style={{
        background: DARK, minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', sans-serif", padding: 24,
      }}>
        <div style={{
          background: DARK2, border: `1px solid ${BORDER}`,
          borderRadius: 16, padding: '48px 40px', maxWidth: 460,
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'rgba(232,201,126,0.1)',
            border: '1px solid rgba(232,201,126,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Clock size={24} style={{ color: GOLD }} />
          </div>
          <h2 style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 22, fontWeight: 700, color: INK,
            marginBottom: 10, letterSpacing: '-0.01em',
          }}>
            Payment pending approval
          </h2>
          <p style={{ fontSize: 14, color: INK2, lineHeight: 1.6, marginBottom: 24 }}>
            Your payment proof has been received. You'll get full access to all
            courses once an admin approves it — usually within 24 hours.
          </p>
          <Link
            to="/pay/submit"
            style={{
              display: 'inline-block', padding: '10px 24px',
              background: GOLD, color: DARK,
              borderRadius: 8, fontWeight: 700, fontSize: 13,
              textDecoration: 'none', letterSpacing: '0.01em',
            }}
          >
            Submit payment proof
          </Link>
        </div>
      </div>
    );
  }

  const filtered = useMemo(() => {
    let list = modules;
    if (filter !== 'all') list = list.filter(m => (m.status ?? 'not_started') === filter);
    if (search) list = list.filter(m => m.title.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [modules, filter, search]);

  return (
    <div style={{ background: DARK, minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ══ HERO ═══════════════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(28px,5vw,48px) 0 clamp(24px,4vw,40px)' }}>
        {/* Canvas particle field */}
        <ParticleCanvas />

        {/* Animated floating orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div className="orb orb-gold" />
          <div className="orb orb-terra" />
          <div className="orb orb-blue" />
          <div className="orb orb-gold2" />
        </div>

        {/* Animated grid lines */}
        <div className="hero-grid" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 2 }}>

          {/* Eyebrow */}
          <div style={{
            fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: GOLD, marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 18, height: 1, background: GOLD, display: 'inline-block', opacity: 0.6 }} />
            Learning Hub
          </div>

          {/* Greeting headline */}
          <h1 style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 'clamp(36px, 6vw, 56px)',
            fontWeight: 700, lineHeight: 1.1,
            letterSpacing: '-0.025em', color: INK,
            marginBottom: 12, maxWidth: 640,
          }}>
            {greeting}{firstName && (
              <>, <span style={{ color: GOLD }}>{firstName}</span></>
            )}
          </h1>

          <p style={{ fontSize: 15, color: INK3, lineHeight: 1.5, marginBottom: 20, maxWidth: 420 }}>
            Your courses are ready. Pick up where you left off or start something new.
          </p>

          {/* Progress summary bar */}
          {modules.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: DARK2, border: `1px solid ${BORDER}`,
              borderRadius: 8, padding: '14px 18px',
              marginBottom: 0, overflowX: 'auto', maxWidth: '100%',
            }}>
              {/* Donut */}
              <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                {(() => {
                  const R = 18, C = 2 * Math.PI * R;
                  const filled = (overallPct / 100) * C;
                  return (
                    <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="22" cy="22" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                      <circle cx="22" cy="22" r={R} fill="none" stroke={GOLD} strokeWidth="4"
                        strokeLinecap="round" strokeDasharray={`${filled} ${C}`}
                        style={{ transition: 'stroke-dasharray 1.2s ease' }}
                      />
                    </svg>
                  );
                })()}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 600, color: GOLD }}>{overallPct}%</span>
                </div>
              </div>

              <div style={{ borderLeft: `1px solid ${BORDER}`, height: 32 }} />

              {/* Stat pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
      <div style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, background: 'rgba(11,12,15,0.8)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px', minHeight: 52, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>

          {/* Filter tabs — horizontally scrollable on mobile */}
          <div style={{ display: 'flex', gap: 2, overflowX: 'auto', WebkitOverflowScrolling: 'touch', flexShrink: 0, scrollbarWidth: 'none' }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 11, fontWeight: 500,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '5px 12px', borderRadius: 6,
                  border: 'none', cursor: 'pointer',
                  transition: 'all 0.15s', flexShrink: 0,
                  background: filter === f.key ? DARK3 : 'transparent',
                  color: filter === f.key ? f.color : INK3,
                  outline: filter === f.key ? `1px solid ${BORDER}` : 'none',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (filter !== f.key) (e.currentTarget as HTMLElement).style.color = INK2; }}
                onMouseLeave={e => { if (filter !== f.key) (e.currentTarget as HTMLElement).style.color = INK3; }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search — grows to fill remaining space */}
          <div style={{ marginLeft: 'auto', position: 'relative', minWidth: 0 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: INK3, pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              style={{
                paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                width: 'clamp(100px, 30vw, 220px)', fontSize: 13,
                background: DARK2, border: `1px solid ${BORDER}`,
                borderRadius: 8, color: INK, outline: 'none',
                fontFamily: 'inherit', transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = `rgba(232,201,126,0.35)`)}
              onBlur={e => (e.target.style.borderColor = BORDER)}
            />
          </div>
        </div>
      </div>

      {/* ══ MODULE GRID ═══════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px clamp(16px, 4vw, 32px) 60px' }}>
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
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 20, fontWeight: 700, color: INK, marginBottom: 8, letterSpacing: '-0.01em' }}>
              {search ? `No results for "${search}"` : 'No courses yet'}
            </p>
            <p style={{ fontSize: 13.5, color: INK3, lineHeight: 1.6 }}>
              {search ? 'Try a different search term or browse all courses.' : 'Your instructor will add courses here soon.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filtered.map(m => (
              <div key={m.id} style={{ position: 'relative' }}>
                <ModuleCard module={m} />
                {certByModule[m.id] && (
                  <Link
                    to={`/certificate/${certByModule[m.id].id}`}
                    style={{
                      position: 'absolute', top: 14, right: 14,
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: GOLD, color: '#0b0c0f',
                      fontSize: 10.5, fontWeight: 700, fontFamily: 'monospace',
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      padding: '4px 10px', borderRadius: 100,
                      textDecoration: 'none', boxShadow: '0 2px 12px rgba(232,201,126,0.4)',
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

        /* ── Animated orbs ── */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(72px);
          will-change: transform, opacity;
        }
        .orb-gold {
          width: 520px; height: 520px;
          background: radial-gradient(circle, rgba(232,201,126,0.13) 0%, transparent 70%);
          top: -160px; left: -80px;
          animation: orbFloat1 18s ease-in-out infinite;
        }
        .orb-terra {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(196,92,60,0.1) 0%, transparent 70%);
          top: 40px; right: -60px;
          animation: orbFloat2 22s ease-in-out infinite;
        }
        .orb-blue {
          width: 360px; height: 360px;
          background: radial-gradient(circle, rgba(44,107,201,0.07) 0%, transparent 70%);
          bottom: -100px; left: 40%;
          animation: orbFloat3 26s ease-in-out infinite;
        }
        .orb-gold2 {
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(232,201,126,0.08) 0%, transparent 70%);
          top: 30%; right: 20%;
          animation: orbFloat4 20s ease-in-out infinite;
        }

        @keyframes orbFloat1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(60px,-40px) scale(1.08); }
          66%      { transform: translate(-30px,50px) scale(0.95); }
        }
        @keyframes orbFloat2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(-50px,30px) scale(1.1); }
          70%      { transform: translate(40px,-20px) scale(0.92); }
        }
        @keyframes orbFloat3 {
          0%,100% { transform: translate(0,0) scale(1); }
          30%      { transform: translate(30px,-60px) scale(1.05); }
          60%      { transform: translate(-40px,20px) scale(0.98); }
        }
        @keyframes orbFloat4 {
          0%,100% { transform: translate(0,0); opacity:0.8; }
          50%      { transform: translate(-25px,35px); opacity:1; }
        }

        /* ── Animated grid ── */
        .hero-grid {
          background-image:
            repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 80px),
            repeating-linear-gradient(0deg,  rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 80px);
          animation: gridDrift 30s linear infinite;
        }
        @keyframes gridDrift {
          from { background-position: 0 0; }
          to   { background-position: 80px 80px; }
        }
      `}</style>
    </div>
  );
}

// ── ParticleCanvas ─────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particles
    const N = 55;
    const particles = Array.from({ length: N }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r:  Math.random() * 1.4 + 0.4,
      alpha: Math.random() * 0.45 + 0.1,
      gold: Math.random() > 0.72,      // ~28% are gold
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connection lines
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const fade = (1 - dist / 110) * 0.08;
            ctx.strokeStyle = particles[i].gold || particles[j].gold
              ? `rgba(232,201,126,${fade})`
              : `rgba(255,255,255,${fade * 0.5})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw dots
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? `rgba(232,201,126,${p.alpha})`
          : `rgba(255,255,255,${p.alpha * 0.6})`;
        ctx.fill();

        // Move
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0)             { p.x = canvas.width; }
        if (p.x > canvas.width)  { p.x = 0; }
        if (p.y < 0)             { p.y = canvas.height; }
        if (p.y > canvas.height) { p.y = 0; }
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  );
}

// ── StatItem ──────────────────────────────────────────────────────────────
function StatItem({ value, label, color = '#6b6b78' }: { value: number; label: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 600, color, lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}
      </span>
      <span style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6b78' }}>
        {label}
      </span>
    </div>
  );
}
