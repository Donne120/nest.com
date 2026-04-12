import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const GOLD  = '#c8a96e';
const GOLD2 = '#e8d4a0';
const INK   = '#f0ebe2';

export const Scene1Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneOpacity = interpolate(frame, [0, 18, 140, 160], [0, 1, 1, 0], { extrapolateRight: 'clamp' });

  // N logo: spring pop-in
  const logoScale = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 130 }, from: 0, to: 1 });
  const logoOpacity = interpolate(frame, [8, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // "Nest" wordmark slides up
  const wordY = interpolate(frame, [35, 65], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const wordOpacity = interpolate(frame, [35, 65], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Tagline fades in
  const tagOpacity = interpolate(frame, [70, 100], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Invite badge slides in from bottom
  const badgeY = interpolate(frame, [100, 125], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const badgeOpacity = interpolate(frame, [100, 125], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Gentle ambient pulse
  const glow = 0.07 + 0.03 * Math.sin(frame * 0.06);

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      {/* Ambient radial glow */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse 900px 600px at 50% 50%, rgba(200,169,110,${glow}) 0%, transparent 70%)`,
      }} />

      {/* Subtle grid */}
      <AbsoluteFill style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
      }} />

      {/* Center stage */}
      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 28,
      }}>
        {/* N logo box */}
        <div style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          width: 96, height: 96,
          border: `2px solid rgba(200,169,110,0.45)`,
          borderRadius: 18,
          background: 'rgba(200,169,110,0.07)',
          boxShadow: `0 0 80px rgba(200,169,110,0.22), inset 0 1px 0 rgba(200,169,110,0.15)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'Georgia, serif',
            fontSize: 50, fontWeight: 700,
            color: GOLD, letterSpacing: '-0.02em',
          }}>N</span>
        </div>

        {/* Nest wordmark */}
        <div style={{ opacity: wordOpacity, transform: `translateY(${wordY}px)`, textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: 80, fontWeight: 300, fontStyle: 'italic',
            color: INK, letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            Nest
          </div>
        </div>

        {/* Tagline */}
        <div style={{ opacity: tagOpacity, textAlign: 'center' }}>
          <div style={{
            fontFamily: 'sans-serif',
            fontSize: 13, letterSpacing: '0.28em',
            textTransform: 'uppercase', color: GOLD, fontWeight: 400,
          }}>
            The future of learning is here
          </div>
        </div>

        {/* Invite nudge badge */}
        <div style={{
          opacity: badgeOpacity, transform: `translateY(${badgeY}px)`,
          marginTop: 8,
          border: `1px solid rgba(200,169,110,0.25)`,
          borderRadius: 100, padding: '8px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(200,169,110,0.06)',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: GOLD2,
            boxShadow: `0 0 8px ${GOLD2}`,
          }} />
          <span style={{
            fontFamily: 'sans-serif', fontSize: 12,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: GOLD2,
          }}>
            Join thousands of learners
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
