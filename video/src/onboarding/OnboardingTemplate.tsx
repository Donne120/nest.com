import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { OnboardingVideoConfig } from './data';

const GOLD   = '#c8a96e';
const GOLD2  = '#e8d4a0';
const INK    = '#f0ebe2';
const INK2   = '#8a8070';
const INK3   = '#2a2620';
const CARD   = '#161410';
const BG     = '#0a0907';

// Card accent colours per slot
const ACCENTS = [
  'rgba(200,169,110,0.12)',
  'rgba(100,140,200,0.10)',
  'rgba(100,180,130,0.10)',
  'rgba(190,110,100,0.10)',
];
const ACCENT_BORDERS = [
  'rgba(200,169,110,0.3)',
  'rgba(100,140,200,0.25)',
  'rgba(100,180,130,0.25)',
  'rgba(190,110,100,0.25)',
];
const ACCENT_ICONS = ['#c8a96e', '#6a8fc8', '#64b482', '#be6e64'];

// Total: 900 frames = 30s
// Intro: 0-120 | Cards: 120-760 | Outro: 760-900

interface Props { config: OnboardingVideoConfig; }

export const OnboardingTemplate: React.FC<Props> = ({ config }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalVideos = 12;
  const progressPct = (config.id / totalVideos) * 100;

  // Scene fade
  const sceneOp = interpolate(frame, [0, 20, 860, 900], [0, 1, 1, 0], { extrapolateRight: 'clamp' });

  // Progress bar at top
  const barW = interpolate(frame, [0, 120], [0, progressPct], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Logo
  const logoOp = interpolate(frame, [10, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Tag badge
  const tagOp  = interpolate(frame, [20, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tagY   = interpolate(frame, [20, 50], [16, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Headline
  const headOp = interpolate(frame, [45, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headY  = interpolate(frame, [45, 80], [22, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Subtitle
  const subOp = interpolate(frame, [70, 100], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Divider line
  const divW = interpolate(frame, [95, 130], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // 4 cards staggered — each starts 120 frames apart
  const cardStarts = [130, 250, 370, 490];
  const cardProps = cardStarts.map(start => ({
    scale: spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 120 }, from: 0.88, to: 1 }),
    op: interpolate(frame, [start, start + 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    y: interpolate(frame, [start, start + 30], [24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
  }));

  // Outro
  const outroOp  = interpolate(frame, [770, 800], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outroScale = spring({ frame: frame - 770, fps, config: { damping: 12, stiffness: 160 }, from: 0.85, to: 1 });

  // Ambient glow pulse
  const glow = 0.05 + 0.02 * Math.sin(frame * 0.05);

  return (
    <AbsoluteFill style={{ background: BG, opacity: sceneOp }}>

      {/* Ambient radial */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse 900px 500px at 50% 30%, rgba(200,169,110,${glow}) 0%, transparent 65%)`,
        pointerEvents: 'none',
      }} />

      {/* Subtle grid */}
      <AbsoluteFill style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
        pointerEvents: 'none',
      }} />

      {/* Top progress bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: INK3,
      }}>
        <div style={{ width: `${barW}%`, height: '100%', background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})` }} />
      </div>

      {/* Logo mark — top left */}
      <div style={{
        position: 'absolute', top: 28, left: 48,
        opacity: logoOp,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          border: `1.5px solid rgba(200,169,110,0.45)`,
          background: 'rgba(200,169,110,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: GOLD }}>N</span>
        </div>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontStyle: 'italic', fontWeight: 300, color: INK2 }}>Nest</span>
      </div>

      {/* Module counter — top right */}
      <div style={{
        position: 'absolute', top: 28, right: 48,
        opacity: logoOp,
        fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em',
        color: INK2, textTransform: 'uppercase',
      }}>
        {String(config.id).padStart(2, '0')} / {String(totalVideos).padStart(2, '0')}
      </div>

      {/* Main layout */}
      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        paddingTop: 90, paddingLeft: 80, paddingRight: 80,
      }}>

        {/* Tag */}
        <div style={{
          opacity: tagOp, transform: `translateY(${tagY}px)`,
          fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.24em',
          textTransform: 'uppercase', color: GOLD,
          marginBottom: 16,
        }}>
          {config.tag}
        </div>

        {/* Headline */}
        <div style={{
          opacity: headOp, transform: `translateY(${headY}px)`,
          fontFamily: 'Georgia, serif', fontSize: 48, fontWeight: 300, fontStyle: 'italic',
          color: INK, letterSpacing: '-0.02em', lineHeight: 1.05,
          textAlign: 'center', marginBottom: 16,
        }}>
          {config.title}
        </div>

        {/* Subtitle */}
        <div style={{
          opacity: subOp,
          fontFamily: 'sans-serif', fontSize: 14, color: INK2, lineHeight: 1.6,
          textAlign: 'center', maxWidth: 680, marginBottom: 20,
        }}>
          {config.subtitle}
        </div>

        {/* Divider */}
        <div style={{
          width: `${divW}%`, maxWidth: 320, height: 1,
          background: `linear-gradient(90deg, transparent, rgba(200,169,110,0.3), transparent)`,
          marginBottom: 32,
        }} />

        {/* Cards grid — 2×2 */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 16, width: '100%', maxWidth: 1100,
        }}>
          {config.sections.map((section, i) => (
            <div key={i} style={{
              opacity: cardProps[i].op,
              transform: `scale(${cardProps[i].scale}) translateY(${cardProps[i].y}px)`,
              background: CARD,
              border: `1px solid ${ACCENT_BORDERS[i]}`,
              borderRadius: 12,
              padding: '20px 24px',
              display: 'flex', alignItems: 'flex-start', gap: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              {/* Icon */}
              <div style={{
                flexShrink: 0,
                width: 40, height: 40, borderRadius: 10,
                background: ACCENTS[i],
                border: `1px solid ${ACCENT_BORDERS[i]}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke={ACCENT_ICONS[i]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={section.icon} />
                </svg>
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Number */}
                <div style={{
                  fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.2em',
                  color: ACCENT_ICONS[i], textTransform: 'uppercase', marginBottom: 6, opacity: 0.8,
                }}>
                  0{i + 1}
                </div>
                <div style={{
                  fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 400,
                  color: INK, marginBottom: 6, lineHeight: 1.3,
                }}>
                  {section.title}
                </div>
                <div style={{
                  fontFamily: 'sans-serif', fontSize: 12, color: INK2, lineHeight: 1.6,
                }}>
                  {section.body}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Outro — "Next up" */}
        {frame >= 770 && (
          <div style={{
            position: 'absolute', bottom: 48,
            opacity: outroOp, transform: `scale(${outroScale})`,
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(200,169,110,0.06)',
            border: '1px solid rgba(200,169,110,0.2)',
            borderRadius: 100, padding: '10px 24px',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, boxShadow: `0 0 6px ${GOLD}` }} />
            <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK2 }}>
              Next:
            </span>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontStyle: 'italic', color: GOLD2 }}>
              {config.nextTitle}
            </span>
          </div>
        )}

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
