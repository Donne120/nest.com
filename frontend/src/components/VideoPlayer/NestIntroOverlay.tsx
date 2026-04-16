/**
 * NestIntroOverlay — CSS-animated brand pre-roll that sits over the video area.
 *
 * Phases (total ~9 s):
 *   0 ms       → 400 ms   fade-in from black
 *   300 ms     → 1 100 ms N logo spring-pops in with glow ring
 *   900 ms     → 1 800 ms "Nest" wordmark slides up
 *   1 700 ms   → 3 200 ms tagline types in character by character
 *   3 200 ms   → 6 500 ms hold — ambient pulse, shimmer
 *   6 500 ms   → 7 500 ms fade to black
 *   7 500 ms              onComplete fires
 *
 * Skip button appears at 2 500 ms.
 */

import { useEffect, useRef, useState } from 'react';

const TAGLINE   = 'Your knowledge. Always accessible.';
const TOTAL_MS  = 7_500;
const SKIP_AT   = 2_500;

interface Props {
  orgName?: string;
  orgLogoUrl?: string | null;
  onComplete: () => void;
}

export default function NestIntroOverlay({ orgName, orgLogoUrl, onComplete }: Props) {
  const [elapsed, setElapsed]         = useState(0);
  const [skippable, setSkippable]     = useState(false);
  const [skipped, setSkipped]         = useState(false);
  const startRef                      = useRef<number | null>(null);
  const rafRef                        = useRef<number>(0);

  // ── animation loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const ms = now - startRef.current;
      setElapsed(ms);
      if (ms >= SKIP_AT) setSkippable(true);
      if (ms >= TOTAL_MS) {
        onComplete();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onComplete]);

  const handleSkip = () => {
    cancelAnimationFrame(rafRef.current);
    setSkipped(true);
    // short fade-out before calling onComplete
    setTimeout(onComplete, 350);
  };

  // ── derived visibility values ───────────────────────────────────────────────
  const t = elapsed;

  const masterOpacity = skipped
    ? 0
    : t < 400
      ? t / 400
      : t > 6_500
        ? 1 - (t - 6_500) / 1_000
        : 1;

  const logoOpacity  = clamp01((t - 300) / 500);
  const logoScale    = springApprox(t, 300, 700);
  const ringOpacity  = t < 300 ? 0 : t < 600 ? (t - 300) / 300 * 0.5 : clamp01(1 - (t - 600) / 600) * 0.5;
  const ringScale    = t < 300 ? 0.6 : Math.min(2.4, 0.6 + (t - 300) / 400 * 1.8);
  const glowPulse    = 0.18 + 0.07 * Math.sin(t * 0.0045);

  // horizontal shift: logo moves left when wordmark appears
  const logoX        = t > 900 ? -clamp01((t - 900) / 400) * 64 : 0;

  const wordOpacity  = clamp01((t - 900) / 500);
  const wordY        = t > 900 ? (1 - clamp01((t - 900) / 500)) * 44 : 44;

  const typeLen      = t < 1_700 ? 0 : Math.floor(clamp01((t - 1_700) / 1_500) * TAGLINE.length);
  const tagOpacity   = clamp01((t - 1_700) / 300);
  const cursorOn     = t > 1_700 && t < 3_300 && Math.floor(t / 500) % 2 === 0;

  const dividerW     = t > 3_000 ? clamp01((t - 3_000) / 600) * 260 : 0;
  const badgeOpacity = clamp01((t - 3_400) / 500);
  const badgeY       = t > 3_400 ? (1 - clamp01((t - 3_400) / 500)) * 12 : 12;

  // shimmer sweep (once, at t=4500-5000)
  const shimmerX     = t > 4_500 ? clamp01((t - 4_500) / 500) * 180 - 60 : -60;
  const shimmerAlpha = t > 4_500 && t < 5_200 ? Math.sin(clamp01((t - 4_500) / 700) * Math.PI) * 0.55 : 0;

  const skipOpacity  = skippable ? clamp01((t - SKIP_AT) / 400) : 0;

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div style={{
        position: 'absolute', inset: 0,
        background: '#080705',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        opacity: masterOpacity,
        transition: skipped ? 'opacity 0.35s ease' : 'none',
        zIndex: 20,
        borderRadius: 'inherit',
        overflow: 'hidden',
        userSelect: 'none',
      }}>

        {/* Grain */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.038,
          backgroundImage: GRAIN_SVG,
          backgroundSize: '256px 256px',
          pointerEvents: 'none',
        }} />

        {/* Ambient radial glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse 70% 55% at 50% 50%, rgba(200,169,110,${glowPulse}) 0%, transparent 70%)`,
        }} />

        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }} />

        {/* ── Logo + wordmark row ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 24,
          transform: `translateX(${logoX}px)`,
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>

          {/* Glow ring */}
          <div style={{
            position: 'absolute',
            width: 90, height: 90,
            borderRadius: 18,
            border: '1.5px solid rgba(200,169,110,1)',
            opacity: ringOpacity,
            transform: `scale(${ringScale})`,
            pointerEvents: 'none',
          }} />

          {/* N box */}
          <div style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            width: 90, height: 90,
            border: '2px solid rgba(200,169,110,0.5)',
            borderRadius: 18,
            background: 'rgba(200,169,110,0.07)',
            boxShadow: `0 0 60px rgba(200,169,110,${glowPulse}),
                        0 0 28px rgba(200,169,110,0.14),
                        inset 0 1px 0 rgba(200,169,110,0.18)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', position: 'relative',
          }}>
            {/* Shimmer sweep */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0, width: 50,
              transform: `translateX(${shimmerX}px)`,
              opacity: shimmerAlpha,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
              pointerEvents: 'none',
            }} />
            <span style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 48, fontWeight: 700,
              color: '#c8a96e', letterSpacing: '-0.02em',
            }}>N</span>
          </div>

          {/* Wordmark */}
          <div style={{ opacity: wordOpacity, transform: `translateY(${wordY}px)` }}>
            <span style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 72, fontWeight: 300, fontStyle: 'italic',
              color: '#f0ebe2', letterSpacing: '-0.03em', lineHeight: 1,
            }}>Nest</span>
          </div>
        </div>

        {/* Tagline */}
        <div style={{
          marginTop: 30,
          opacity: tagOpacity,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 11, letterSpacing: '0.24em',
          textTransform: 'uppercase', color: '#e8d4a0',
          fontWeight: 400, minHeight: 18,
        }}>
          {TAGLINE.slice(0, typeLen)}
          <span style={{ opacity: 0.7 }}>{cursorOn ? '|' : ''}</span>
        </div>

        {/* Divider */}
        <div style={{
          marginTop: 30,
          width: dividerW,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(200,169,110,0.3), transparent)',
          transition: 'width 0.6s ease',
        }} />

        {/* Org badge */}
        <div style={{
          opacity: badgeOpacity,
          transform: `translateY(${badgeY}px)`,
          marginTop: 18,
          display: 'flex', alignItems: 'center', gap: 8,
          border: '1px solid rgba(200,169,110,0.18)',
          borderRadius: 100,
          padding: '5px 18px',
          background: 'rgba(200,169,110,0.05)',
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: '#e8d4a0',
            boxShadow: '0 0 7px #e8d4a0',
          }} />
          {orgLogoUrl ? (
            <img src={orgLogoUrl} alt={orgName ?? 'Org'} style={{ height: 16, objectFit: 'contain', maxWidth: 80 }} />
          ) : (
            <span style={{
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10.5,
              letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8a8070',
            }}>
              {orgName ?? 'Nest Cameroon'}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 2,
          background: 'rgba(200,169,110,0.1)',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (elapsed / TOTAL_MS) * 100)}%`,
            background: 'linear-gradient(90deg, rgba(200,169,110,0.4), rgba(232,212,160,0.7))',
            transition: 'width 0.1s linear',
          }} />
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          style={{
            position: 'absolute', bottom: 20, right: 20,
            opacity: skipOpacity,
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            padding: '6px 14px',
            color: 'rgba(255,255,255,0.55)',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 11.5, letterSpacing: '0.04em',
            cursor: 'pointer',
            transition: 'opacity 0.4s, background 0.15s, color 0.15s',
            pointerEvents: skipOpacity > 0.1 ? 'auto' : 'none',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(200,169,110,0.12)';
            (e.currentTarget as HTMLElement).style.color = '#e8d4a0';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,169,110,0.3)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
          }}
        >
          Skip intro
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
        </button>

      </div>
    </>
  );
}

// ─── utils ─────────────────────────────────────────────────────────────────────

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function springApprox(t: number, startMs: number, settleMs: number): number {
  if (t < startMs) return 0;
  const p = clamp01((t - startMs) / (settleMs - startMs));
  // approximate spring: overshoot then settle
  return 1 + 0.12 * Math.sin(p * Math.PI * 2.5) * (1 - p);
}

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

const KEYFRAMES = `
  @keyframes nestIntroGlow {
    0%, 100% { opacity: 0.18; }
    50% { opacity: 0.26; }
  }
`;
