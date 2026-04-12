import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const GOLD  = '#c8a96e';
const GOLD2 = '#e8d4a0';
const INK   = '#f0ebe2';
const INK2  = '#8a8070';
const INK3  = '#3a3028';
const CARD  = '#161410';
const RULE  = 'rgba(255,255,255,0.07)';
const GO    = '#4a9a6a';

export const Scene2Educator: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneOpacity = interpolate(frame, [0, 18, 180, 200], [0, 1, 1, 0], { extrapolateRight: 'clamp' });

  // Label & heading
  const labelY = interpolate(frame, [10, 35], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const labelOp = interpolate(frame, [10, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Upload card slides in
  const cardScale = spring({ frame: frame - 30, fps, config: { damping: 16, stiffness: 110 }, from: 0.88, to: 1 });
  const cardOp = interpolate(frame, [30, 55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Progress bar fills frames 70-120
  const progress = interpolate(frame, [70, 120], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Published badge pops in
  const badgeScale = spring({ frame: frame - 130, fps, config: { damping: 12, stiffness: 200 }, from: 0, to: 1 });
  const badgeOp = interpolate(frame, [130, 145], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Course card slides in after publish
  const courseX = interpolate(frame, [145, 170], [80, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const courseOp = interpolate(frame, [145, 170], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const uploadText = frame < 70 ? 'Uploading course video…' : frame < 120 ? `Uploading… ${Math.round(progress)}%` : '✓ Upload complete';
  const uploadColor = frame >= 120 ? GO : INK2;

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse 1000px 500px at 30% 50%, rgba(200,169,110,0.05) 0%, transparent 65%)`,
      }} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40, padding: '0 80px' }}>

        {/* Label + heading */}
        <div style={{ opacity: labelOp, transform: `translateY(${labelY}px)`, textAlign: 'center' }}>
          <div style={{ fontFamily: 'sans-serif', fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: GOLD, marginBottom: 14 }}>
            — For Educators
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 52, fontWeight: 300, fontStyle: 'italic', color: INK, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            Create your course<br />
            <span style={{ color: GOLD, fontWeight: 300 }}>in minutes.</span>
          </div>
        </div>

        {/* Upload card */}
        <div style={{
          opacity: cardOp,
          transform: `scale(${cardScale})`,
          background: CARD,
          border: `1px solid rgba(200,169,110,0.18)`,
          borderRadius: 14,
          padding: '32px 40px',
          width: 520,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(200,169,110,0.1)', border: `1px solid rgba(200,169,110,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: 'sans-serif', fontSize: 14, fontWeight: 600, color: INK }}>Introduction to Data Science</div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: INK2, marginTop: 2 }}>lecture_01_intro.mp4 · 248 MB</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 4, background: INK3, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(progress, 100)}%`, height: '100%', borderRadius: 2,
                background: frame >= 120 ? GO : `linear-gradient(90deg, ${GOLD}, ${GOLD2})`,
                transition: 'background 0.3s',
              }} />
            </div>
            <div style={{ marginTop: 10, fontFamily: 'monospace', fontSize: 12, color: uploadColor, letterSpacing: '0.04em' }}>
              {uploadText}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: RULE, margin: '16px 0' }} />

          {/* Publish button row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: INK2, letterSpacing: '0.08em' }}>
              AI transcription: <span style={{ color: GOLD }}>enabled</span>
            </div>

            {/* Published badge */}
            <div style={{
              opacity: badgeOp,
              transform: `scale(${badgeScale})`,
              background: 'rgba(74,154,106,0.12)',
              border: '1px solid rgba(74,154,106,0.35)',
              borderRadius: 100, padding: '6px 16px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: GO, boxShadow: `0 0 8px ${GO}` }} />
              <span style={{ fontFamily: 'sans-serif', fontSize: 12, fontWeight: 700, color: GO, letterSpacing: '0.06em' }}>PUBLISHED</span>
            </div>
          </div>
        </div>

        {/* Course live card */}
        <div style={{
          opacity: courseOp,
          transform: `translateX(${courseX}px)`,
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'rgba(74,154,106,0.06)',
          border: '1px solid rgba(74,154,106,0.2)',
          borderRadius: 10, padding: '14px 24px',
          width: 520,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GO} strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK2 }}>
            Course live · <strong style={{ color: INK }}>0 students enrolled</strong> · Share your invite link to grow
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
