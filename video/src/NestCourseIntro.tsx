/**
 * NestCourseIntro — 10-second branded pre-roll that plays before every course.
 *
 * Timeline (300 frames @ 30 fps):
 *   0  – 20   fade from black
 *   8  – 70   N logo spring pops in, gold glow ring expands
 *   60 – 110  "Nest" wordmark slides up, N shifts left
 *   105 – 200 tagline types in character by character
 *   200 – 240 divider line draws, org badge fades in
 *   240 – 280 hold — N box pulses, shimmer passes
 *   270 – 300 fade to black
 */
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ─── design tokens ─────────────────────────────────────────────────────────────
const BG    = '#080705';
const GOLD  = '#c8a96e';
const GOLD2 = '#e8d4a0';
const INK   = '#f0ebe2';
const INK2  = '#8a8070';

const TAGLINE = 'Your knowledge. Always accessible.';

// ─── helpers ───────────────────────────────────────────────────────────────────
const cl = (v: number) => ({ extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const });

// ─── component ─────────────────────────────────────────────────────────────────
export const NestCourseIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── master fade in / fade out ──────────────────────────────────────────────
  const masterOpacity = interpolate(frame, [0, 20, 270, 300], [0, 1, 1, 0], cl(0));

  // ── N logo ─────────────────────────────────────────────────────────────────
  const logoScale = spring({ frame: frame - 8, fps, config: { damping: 13, stiffness: 140 }, from: 0, to: 1 });
  const logoOpacity = interpolate(frame, [8, 30], [0, 1], cl(0));
  // horizontal shift to make room for wordmark
  const logoX = interpolate(frame, [60, 100], [0, -68], cl(0));
  // ambient glow pulse after lock-in
  const glowSize = 80 + 30 * Math.sin(frame * 0.055);
  const glowAlpha = 0.18 + 0.08 * Math.sin(frame * 0.055);

  // glow ring that expands outward on entry
  const ringScale = interpolate(frame, [8, 55], [0.5, 2.2], cl(0));
  const ringOpacity = interpolate(frame, [8, 35, 55, 80], [0, 0.55, 0.25, 0], cl(0));

  // shimmer sweep across N box (frame 240-280)
  const shimmerX = interpolate(frame, [240, 280], [-120, 120], cl(0));
  const shimmerOpacity = interpolate(frame, [240, 255, 270, 280], [0, 0.6, 0.6, 0], cl(0));

  // ── Nest wordmark ──────────────────────────────────────────────────────────
  const wordY = interpolate(frame, [60, 100], [50, 0], cl(0));
  const wordOpacity = interpolate(frame, [60, 95], [0, 1], cl(0));

  // ── tagline typing ─────────────────────────────────────────────────────────
  const visibleChars = Math.floor(interpolate(frame, [105, 200], [0, TAGLINE.length], cl(0)));
  const taglineOpacity = interpolate(frame, [105, 125], [0, 1], cl(0));
  const cursor = frame > 105 && frame < 205 && Math.floor(frame / 8) % 2 === 0 ? '|' : '';

  // ── divider line ────────────────────────────────────────────────────────────
  const dividerW = interpolate(frame, [200, 235], [0, 220], cl(0));
  const dividerOpacity = interpolate(frame, [200, 220], [0, 1], cl(0));

  // ── org badge ───────────────────────────────────────────────────────────────
  const badgeOpacity = interpolate(frame, [220, 245], [0, 1], cl(0));
  const badgeY = interpolate(frame, [220, 245], [12, 0], cl(0));

  // ── background grain ────────────────────────────────────────────────────────
  const grainOpacity = interpolate(frame, [0, 20], [0, 0.04], cl(0));

  return (
    <AbsoluteFill style={{ background: BG, opacity: masterOpacity }}>

      {/* Grain texture */}
      <AbsoluteFill style={{
        opacity: grainOpacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '256px 256px',
      }} />

      {/* Radial ambient glow */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse ${glowSize * 14}px ${glowSize * 10}px at 50% 50%, rgba(200,169,110,${glowAlpha}) 0%, transparent 68%)`,
      }} />

      {/* Subtle perspective grid */}
      <AbsoluteFill style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)`,
        backgroundSize: '90px 90px',
      }} />

      {/* ── Logo + wordmark stage ── */}
      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 0,
      }}>

        {/* Logo row: N box + wordmark side by side */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 28,
          transform: `translateX(${logoX}px)`,
        }}>

          {/* Expanding glow ring */}
          <div style={{
            position: 'absolute',
            width: 110, height: 110,
            borderRadius: 24,
            border: `1.5px solid rgba(200,169,110,${ringOpacity})`,
            transform: `scale(${ringScale})`,
            pointerEvents: 'none',
          }} />

          {/* N logo box */}
          <div style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            width: 110, height: 110,
            border: `2px solid rgba(200,169,110,0.5)`,
            borderRadius: 22,
            background: 'rgba(200,169,110,0.06)',
            boxShadow: `0 0 ${glowSize}px rgba(200,169,110,${glowAlpha + 0.05}),
                        0 0 40px rgba(200,169,110,0.12),
                        inset 0 1px 0 rgba(200,169,110,0.18)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Shimmer sweep */}
            <div style={{
              position: 'absolute',
              top: 0, bottom: 0,
              width: 60,
              transform: `translateX(${shimmerX}px)`,
              opacity: shimmerOpacity,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
              pointerEvents: 'none',
            }} />
            <span style={{
              fontFamily: 'Georgia, serif',
              fontSize: 58, fontWeight: 700,
              color: GOLD, letterSpacing: '-0.02em',
            }}>N</span>
          </div>

          {/* Nest wordmark */}
          <div style={{
            opacity: wordOpacity,
            transform: `translateY(${wordY}px)`,
          }}>
            <span style={{
              fontFamily: 'Georgia, serif',
              fontSize: 90, fontWeight: 300, fontStyle: 'italic',
              color: INK, letterSpacing: '-0.03em', lineHeight: 1,
            }}>Nest</span>
          </div>
        </div>

        {/* Tagline */}
        <div style={{
          opacity: taglineOpacity,
          marginTop: 36,
          fontFamily: 'sans-serif',
          fontSize: 14, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: GOLD2,
          fontWeight: 400,
          minHeight: 20,
        }}>
          {TAGLINE.slice(0, visibleChars)}<span style={{ opacity: 0.7 }}>{cursor}</span>
        </div>

        {/* Divider */}
        <div style={{
          marginTop: 40,
          width: dividerW,
          height: 1,
          opacity: dividerOpacity,
          background: `linear-gradient(90deg, transparent, rgba(200,169,110,0.35), transparent)`,
        }} />

        {/* Org badge */}
        <div style={{
          opacity: badgeOpacity,
          transform: `translateY(${badgeY}px)`,
          marginTop: 22,
          display: 'flex', alignItems: 'center', gap: 10,
          border: `1px solid rgba(200,169,110,0.2)`,
          borderRadius: 100,
          padding: '7px 22px',
          background: 'rgba(200,169,110,0.05)',
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: GOLD2, boxShadow: `0 0 7px ${GOLD2}`,
          }} />
          <span style={{
            fontFamily: 'sans-serif', fontSize: 11.5,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: INK2,
          }}>
            Powered by Nest · Africa
          </span>
        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
