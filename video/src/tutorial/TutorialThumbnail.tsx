/**
 * Nest Tutorial Thumbnail — 1280 × 720
 * Rendered as a <Still> composition for each of the 12 tutorial videos.
 */
import React from 'react';
import { GOLD, GOLD2, INK, INK2, INK3, BG, CARD, RULE } from './NestUI';

export interface ThumbnailProps {
  lessonNumber: number;   // 1-12
  title: string;
  steps: string[];        // 2-3 step titles shown as bullet list
  icon: string;           // SVG path for the main icon
  accentColor?: string;   // optional second-accent (default GOLD)
}

export const TutorialThumbnail: React.FC<ThumbnailProps> = ({
  lessonNumber, title, steps, icon, accentColor = GOLD,
}) => {
  const num = String(lessonNumber).padStart(2, '0');

  return (
    <div style={{
      width: 1280, height: 720,
      background: BG,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'sans-serif',
    }}>

      {/* ── Subtle grid ──────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
      }} />

      {/* ── Ambient radial glow ───────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 900px 600px at 30% 50%, rgba(200,169,110,0.12) 0%, transparent 65%)`,
      }} />

      {/* ── Right-side decorative circle ─────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        right: -160, top: '50%',
        transform: 'translateY(-50%)',
        width: 700, height: 700,
        borderRadius: '50%',
        border: `1px solid rgba(200,169,110,0.08)`,
        background: 'transparent',
      }} />
      <div style={{
        position: 'absolute',
        right: -80, top: '50%',
        transform: 'translateY(-50%)',
        width: 500, height: 500,
        borderRadius: '50%',
        border: `1px solid rgba(200,169,110,0.06)`,
      }} />

      {/* ── Large icon — right side ───────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        right: 120, top: '50%',
        transform: 'translateY(-50%)',
        width: 220, height: 220,
        borderRadius: 40,
        background: `rgba(200,169,110,0.07)`,
        border: `1.5px solid rgba(200,169,110,0.18)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 80px rgba(200,169,110,0.1)`,
      }}>
        <svg width="96" height="96" viewBox="0 0 24 24" fill="none"
          stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${GOLD}, ${GOLD2}, transparent)`,
      }} />

      {/* ── Nest logo — top left ──────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 48, left: 72,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11,
          border: `1.5px solid rgba(200,169,110,0.5)`,
          background: 'rgba(200,169,110,0.09)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: GOLD }}>N</span>
        </div>
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontStyle: 'italic', fontWeight: 300, color: INK }}>Nest</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: INK2, letterSpacing: '0.12em', marginTop: 1 }}>ACADEMY</div>
        </div>
      </div>

      {/* ── Lesson badge — top right ──────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 48, right: 72,
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(200,169,110,0.08)',
        border: '1px solid rgba(200,169,110,0.2)',
        borderRadius: 100, padding: '8px 20px',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, boxShadow: `0 0 6px ${GOLD}` }} />
        <span style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>
          Lesson {num}
        </span>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        left: 72, top: '50%',
        transform: 'translateY(-50%)',
        maxWidth: 720,
      }}>

        {/* Tutorial label */}
        <div style={{
          fontFamily: 'monospace', fontSize: 12, letterSpacing: '0.28em',
          textTransform: 'uppercase', color: INK2, marginBottom: 20,
        }}>
          Tutorial · Step-by-step
        </div>

        {/* Big lesson number */}
        <div style={{
          fontFamily: 'Georgia, serif', fontSize: 110, fontWeight: 300,
          color: `rgba(200,169,110,0.12)`,
          lineHeight: 1, marginBottom: -16,
          letterSpacing: '-0.04em',
          userSelect: 'none',
        }}>
          {num}
        </div>

        {/* Title */}
        <div style={{
          fontFamily: 'Georgia, serif', fontSize: 64, fontWeight: 300,
          fontStyle: 'italic', color: INK,
          lineHeight: 1.05, letterSpacing: '-0.02em',
          marginBottom: 32,
        }}>
          {title}
        </div>

        {/* Divider */}
        <div style={{
          width: 60, height: 2,
          background: `linear-gradient(90deg, ${GOLD}, transparent)`,
          marginBottom: 28,
        }} />

        {/* Steps list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'rgba(200,169,110,0.12)',
                border: `1px solid rgba(200,169,110,0.3)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'monospace', fontSize: 10, color: GOLD,
                flexShrink: 0,
              }}>{i + 1}</div>
              <span style={{ fontFamily: 'sans-serif', fontSize: 18, color: INK2, fontWeight: 400 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 56,
        borderTop: `1px solid rgba(255,255,255,0.05)`,
        background: 'rgba(10,9,7,0.8)',
        display: 'flex', alignItems: 'center',
        padding: '0 72px',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: INK2, letterSpacing: '0.1em' }}>
          nest-com.vercel.app
        </span>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: INK2, letterSpacing: '0.1em' }}>
          {num} / 12
        </span>
      </div>

    </div>
  );
};
