import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const GOLD  = '#c8a96e';
const GOLD2 = '#e8d4a0';
const INK   = '#f0ebe2';
const INK2  = '#8a8070';

export const Scene5CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneOpacity = interpolate(frame, [0, 18, 135, 150], [0, 1, 1, 0], { extrapolateRight: 'clamp' });

  // Ambient glow pulse
  const glow = 0.10 + 0.05 * Math.sin(frame * 0.07);

  // Logo pops in
  const logoScale = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 130 }, from: 0, to: 1 });
  const logoOp = interpolate(frame, [10, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Headline lines stagger in
  const line1Op = interpolate(frame, [35, 58], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const line1Y  = interpolate(frame, [35, 58], [28, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const line2Op = interpolate(frame, [50, 73], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const line2Y  = interpolate(frame, [50, 73], [28, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Sub-copy fades in
  const subOp = interpolate(frame, [72, 92], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // CTA button springs in
  const btnScale = spring({ frame: frame - 95, fps, config: { damping: 11, stiffness: 180 }, from: 0.7, to: 1 });
  const btnOp = interpolate(frame, [95, 112], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // URL fades in
  const urlOp = interpolate(frame, [112, 130], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Button glow pulse
  const btnGlow = 0.35 + 0.15 * Math.sin(frame * 0.1);

  // Divider line draws in
  const lineW = interpolate(frame, [88, 110], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      {/* Deep ambient glow */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse 900px 600px at 50% 50%, rgba(200,169,110,${glow}) 0%, transparent 65%)`,
      }} />

      {/* Subtle grid */}
      <AbsoluteFill style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
      }} />

      {/* Center stage */}
      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 0,
      }}>

        {/* Logo */}
        <div style={{
          opacity: logoOp,
          transform: `scale(${logoScale})`,
          width: 80, height: 80,
          border: `2px solid rgba(200,169,110,0.5)`,
          borderRadius: 16,
          background: 'rgba(200,169,110,0.08)',
          boxShadow: `0 0 60px rgba(200,169,110,0.25), inset 0 1px 0 rgba(200,169,110,0.18)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 36,
        }}>
          <span style={{
            fontFamily: 'Georgia, serif',
            fontSize: 42, fontWeight: 700,
            color: GOLD, letterSpacing: '-0.02em',
          }}>N</span>
        </div>

        {/* Headline */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            opacity: line1Op, transform: `translateY(${line1Y}px)`,
            fontFamily: 'Georgia, serif', fontSize: 62, fontWeight: 300, fontStyle: 'italic',
            color: INK, lineHeight: 1.05, letterSpacing: '-0.02em',
          }}>
            Start teaching.
          </div>
          <div style={{
            opacity: line2Op, transform: `translateY(${line2Y}px)`,
            fontFamily: 'Georgia, serif', fontSize: 62, fontWeight: 300, fontStyle: 'italic',
            color: GOLD, lineHeight: 1.05, letterSpacing: '-0.02em',
          }}>
            Start learning.
          </div>
        </div>

        {/* Sub-copy */}
        <div style={{
          opacity: subOp,
          fontFamily: 'sans-serif', fontSize: 14,
          letterSpacing: '0.12em', color: INK2,
          textAlign: 'center', marginBottom: 10,
        }}>
          No setup fees. No contracts. Just results.
        </div>

        {/* Divider line */}
        <div style={{
          width: `${lineW}%`, maxWidth: 320, height: 1,
          background: `linear-gradient(90deg, transparent, rgba(200,169,110,0.3), transparent)`,
          marginBottom: 36,
        }} />

        {/* CTA Button */}
        <div style={{
          opacity: btnOp, transform: `scale(${btnScale})`,
          marginBottom: 32,
        }}>
          <div style={{
            background: `rgba(200,169,110,0.12)`,
            border: `1.5px solid rgba(200,169,110,${btnGlow})`,
            borderRadius: 100,
            padding: '16px 48px',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: `0 0 40px rgba(200,169,110,${btnGlow * 0.4}), inset 0 1px 0 rgba(200,169,110,0.12)`,
            cursor: 'pointer',
          }}>
            <span style={{
              fontFamily: 'Georgia, serif', fontSize: 22,
              fontStyle: 'italic', fontWeight: 300,
              color: GOLD2, letterSpacing: '0.02em',
            }}>
              Start for free
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>

        {/* URL */}
        <div style={{
          opacity: urlOp,
          fontFamily: 'monospace', fontSize: 12,
          letterSpacing: '0.14em', color: INK2,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: GOLD, opacity: 0.6 }} />
          nest-com.vercel.app
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: GOLD, opacity: 0.6 }} />
        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
