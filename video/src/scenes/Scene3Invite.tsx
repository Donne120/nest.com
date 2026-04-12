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
const ACC   = '#c45c2c';

export const Scene3Invite: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneOpacity = interpolate(frame, [0, 18, 230, 250], [0, 1, 1, 0], { extrapolateRight: 'clamp' });

  // Heading
  const headOp = interpolate(frame, [8, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headY  = interpolate(frame, [8, 30], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Email card slides down
  const emailScale = spring({ frame: frame - 35, fps, config: { damping: 14, stiffness: 100 }, from: 0.9, to: 1 });
  const emailOp = interpolate(frame, [35, 55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Invite link types character by character
  const inviteLink = 'nest-com.vercel.app/invite/abc123';
  const charsVisible = Math.floor(interpolate(frame, [80, 120], [0, inviteLink.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const cursor = frame > 80 && frame < 122 && Math.floor(frame / 6) % 2 === 0 ? '|' : '';

  // Signup form slides up
  const formY = interpolate(frame, [130, 158], [60, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const formOp = interpolate(frame, [130, 158], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Name fills in
  const nameChars = 'Amara Diallo';
  const nameVisible = Math.floor(interpolate(frame, [160, 185], [0, nameChars.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  // Welcome flash
  const welcomeScale = spring({ frame: frame - 200, fps, config: { damping: 10, stiffness: 180 }, from: 0.7, to: 1 });
  const welcomeOp = interpolate(frame, [200, 215], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse 900px 500px at 70% 50%, rgba(200,169,110,0.05) 0%, transparent 65%)`,
      }} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, padding: '0 80px' }}>

        {/* Heading */}
        <div style={{ opacity: headOp, transform: `translateY(${headY}px)`, textAlign: 'center' }}>
          <div style={{ fontFamily: 'sans-serif', fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: GOLD, marginBottom: 14 }}>
            — Invite students
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 52, fontWeight: 300, fontStyle: 'italic', color: INK, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            They sign up.<br />
            <span style={{ color: GOLD }}>You get paid.</span>
          </div>
        </div>

        {/* Email invite card */}
        <div style={{
          opacity: emailOp, transform: `scale(${emailScale})`,
          background: CARD, border: `1px solid rgba(200,169,110,0.18)`,
          borderRadius: 14, width: 520, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          {/* Email header */}
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${RULE}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(200,169,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: 'sans-serif', fontSize: 12, fontWeight: 600, color: INK }}>You've been invited to Nest</div>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: INK2 }}>from: your-educator@nest.com</div>
            </div>
          </div>

          <div style={{ padding: '20px 24px' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 300, fontStyle: 'italic', color: INK, marginBottom: 8 }}>
              Join <em style={{ color: GOLD2 }}>Introduction to Data Science</em>
            </div>
            <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK2, lineHeight: 1.6, marginBottom: 20 }}>
              Your educator has invited you to start learning today.<br />
              Click the link to create your account.
            </div>

            {/* Invite link box */}
            <div style={{
              background: 'rgba(200,169,110,0.06)', border: `1px solid rgba(200,169,110,0.2)`,
              borderRadius: 6, padding: '10px 16px',
              fontFamily: 'monospace', fontSize: 12, color: GOLD2,
              letterSpacing: '0.03em',
            }}>
              {inviteLink.slice(0, charsVisible)}{cursor}
            </div>
          </div>
        </div>

        {/* Sign up form */}
        <div style={{
          opacity: formOp, transform: `translateY(${formY}px)`,
          background: CARD, border: `1px solid rgba(200,169,110,0.15)`,
          borderRadius: 14, width: 520, padding: '24px 32px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          position: 'relative',
        }}>
          <div style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600, color: INK, marginBottom: 16 }}>Create your account</div>

          {/* Name field */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK2, marginBottom: 6 }}>Full name</div>
            <div style={{
              background: INK3, border: `1px solid rgba(200,169,110,0.2)`,
              borderRadius: 6, padding: '9px 14px',
              fontFamily: 'sans-serif', fontSize: 13, color: INK,
            }}>
              {nameChars.slice(0, nameVisible)}{nameVisible < nameChars.length && frame > 160 ? '|' : ''}
            </div>
          </div>

          {/* Password field */}
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK2, marginBottom: 6 }}>Password</div>
            <div style={{
              background: INK3, border: `1px solid rgba(200,169,110,0.2)`,
              borderRadius: 6, padding: '9px 14px',
              fontFamily: 'sans-serif', fontSize: 13, color: INK2, letterSpacing: '0.3em',
            }}>
              {nameVisible > 6 ? '••••••••' : ''}
            </div>
          </div>

          {/* Welcome pop */}
          {frame >= 200 && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(10,9,7,0.92)',
              borderRadius: 14,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
              opacity: welcomeOp, transform: `scale(${welcomeScale})`,
            }}>
              <div style={{ fontSize: 36 }}>🎉</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontStyle: 'italic', color: GOLD2 }}>Welcome, Amara!</div>
              <div style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK2, letterSpacing: '0.1em' }}>Access granted · Let's learn</div>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
