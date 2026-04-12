import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const GOLD  = '#c8a96e';
const GOLD2 = '#e8d4a0';
const INK   = '#f0ebe2';
const INK2  = '#8a8070';
const INK3  = '#3a3028';
const CARD  = '#161410';
const RULE  = 'rgba(255,255,255,0.07)';

const AI_ANSWER = "Great question! A neural network is a system of interconnected layers that learns patterns from data. Think of each layer as asking a more refined question about your input — until the final layer gives you an answer.";

export const Scene4AI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneOpacity = interpolate(frame, [0, 18, 200, 220], [0, 1, 1, 0], { extrapolateRight: 'clamp' });

  // Heading
  const headOp = interpolate(frame, [8, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headY  = interpolate(frame, [8, 30], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Video player card
  const playerScale = spring({ frame: frame - 32, fps, config: { damping: 14, stiffness: 100 }, from: 0.9, to: 1 });
  const playerOp = interpolate(frame, [32, 55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Playhead position (animates across)
  const playhead = interpolate(frame, [55, 160], [5, 65], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Question bubble slides up
  const questionY = interpolate(frame, [75, 98], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const questionOp = interpolate(frame, [75, 98], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // AI badge pops
  const aiBadgeScale = spring({ frame: frame - 105, fps, config: { damping: 10, stiffness: 200 }, from: 0, to: 1 });
  const aiBadgeOp = interpolate(frame, [105, 118], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // AI answer types in
  const answerChars = Math.floor(interpolate(frame, [115, 185], [0, AI_ANSWER.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const answerCursor = frame < 187 && frame > 115 && Math.floor(frame / 5) % 2 === 0 ? '▌' : '';

  // Highlight glow on key phrase "learns patterns"
  const highlightOp = interpolate(frame, [185, 200], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Timestamp badge
  const tsOp = interpolate(frame, [60, 75], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse 800px 500px at 50% 40%, rgba(200,169,110,0.06) 0%, transparent 65%)`,
      }} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: '0 80px' }}>

        {/* Heading */}
        <div style={{ opacity: headOp, transform: `translateY(${headY}px)`, textAlign: 'center' }}>
          <div style={{ fontFamily: 'sans-serif', fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: GOLD, marginBottom: 14 }}>
            — AI-Powered Learning
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 52, fontWeight: 300, fontStyle: 'italic', color: INK, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            Every question answered<br />
            <span style={{ color: GOLD }}>instantly.</span>
          </div>
        </div>

        {/* Video player */}
        <div style={{
          opacity: playerOp, transform: `scale(${playerScale})`,
          background: CARD, border: `1px solid rgba(200,169,110,0.18)`,
          borderRadius: 14, width: 560, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          {/* Video area */}
          <div style={{
            height: 140,
            background: 'linear-gradient(135deg, #1a1710 0%, #0f0d09 100%)',
            position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Grid overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }} />
            {/* Ambient */}
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 40% 50%, rgba(200,169,110,0.08), transparent 60%)` }} />
            {/* Play button */}
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: `1.5px solid rgba(200,169,110,0.45)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1,
            }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill={GOLD}><path d="M5 4l12 6-12 6V4z"/></svg>
            </div>
            {/* Timestamp badge */}
            <div style={{
              position: 'absolute', bottom: 10, left: 12,
              opacity: tsOp,
              background: 'rgba(10,9,7,0.85)', borderRadius: 4,
              padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, boxShadow: `0 0 6px ${GOLD}` }} />
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: GOLD, letterSpacing: '0.06em' }}>07:43 · Question here</span>
            </div>
            {/* Duration */}
            <div style={{ position: 'absolute', bottom: 10, right: 12, fontFamily: 'monospace', fontSize: 10, color: INK2, background: 'rgba(10,9,7,0.7)', padding: '3px 8px', borderRadius: 4 }}>12:34</div>
          </div>

          {/* Timeline */}
          <div style={{ padding: '10px 20px 0', background: '#0f0d09' }}>
            <div style={{ height: 3, background: INK3, borderRadius: 2, position: 'relative' }}>
              <div style={{ width: `${playhead}%`, height: '100%', background: GOLD, borderRadius: 2 }} />
              <div style={{
                position: 'absolute', top: '50%', left: `${playhead}%`,
                transform: 'translate(-50%, -50%)',
                width: 10, height: 10, borderRadius: '50%',
                background: GOLD2, boxShadow: `0 0 8px ${GOLD}`,
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 10px', fontFamily: 'monospace', fontSize: 9, color: INK3 }}>
              <span>07:43</span><span>12:34</span>
            </div>
          </div>

          {/* Q&A section */}
          <div style={{ padding: '16px 20px 20px', borderTop: `1px solid ${RULE}` }}>
            {/* Student question */}
            <div style={{
              opacity: questionOp, transform: `translateY(${questionY}px)`,
              background: 'rgba(200,169,110,0.07)', border: `1px solid rgba(200,169,110,0.18)`,
              borderRadius: '12px 12px 12px 0', padding: '10px 14px',
              marginBottom: 12, maxWidth: 360,
            }}>
              <div style={{ fontFamily: 'sans-serif', fontSize: 12, fontWeight: 600, color: GOLD2, marginBottom: 4 }}>Amara asked:</div>
              <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK, lineHeight: 1.5 }}>
                What exactly is a neural network and how does it learn?
              </div>
            </div>

            {/* AI badge */}
            <div style={{ opacity: aiBadgeOp, transform: `scale(${aiBadgeScale})`, display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                background: 'rgba(200,169,110,0.1)', border: `1px solid rgba(200,169,110,0.25)`,
                borderRadius: 6, padding: '4px 10px',
                fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: GOLD,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, boxShadow: `0 0 5px ${GOLD}` }} />
                Nest AI
              </div>
            </div>

            {/* AI answer */}
            {frame >= 115 && (
              <div style={{
                fontFamily: 'sans-serif', fontSize: 12, color: INK2, lineHeight: 1.65,
              }}>
                {(() => {
                  const text = AI_ANSWER.slice(0, answerChars);
                  const hi = 'learns patterns';
                  const idx = text.indexOf(hi);
                  if (idx === -1 || highlightOp < 0.1) return <>{text}{answerCursor}</>;
                  return (
                    <>
                      {text.slice(0, idx)}
                      <span style={{ color: GOLD2, background: 'rgba(200,169,110,0.12)', borderRadius: 3, padding: '0 4px' }}>{hi}</span>
                      {text.slice(idx + hi.length)}{answerCursor}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
