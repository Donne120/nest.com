import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Audio, staticFile } from 'remotion';
import type { ThemeComponents, SlideData, Caption } from './types';

// ── ORGANIC — warm breathing, wellness aesthetic ───────────────────────────
// Everything breathes. Soft morphing blobs. Rounded. Human. Alive.
// Think Headspace meets Apple Health meets a calm TED talk.

const BG      = '#12100e';
const SAGE    = '#7cb38a';
const TERRA   = '#c4785a';
const CREAM   = '#f0e6d4';
const WARM    = '#d4b896';
const LAVNDR  = '#a59cc8';
const DIM     = 'rgba(240,230,212,0.42)';
const FAINT   = 'rgba(240,230,212,0.14)';
const SANS    = '"Helvetica Neue", Arial, sans-serif';
const SERIF   = '"Georgia", "Palatino Linotype", serif';

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function ease(t: number) { return 1 - Math.pow(1 - clamp(t, 0, 1), 3); }
function breathe(frame: number, rate = 0.045, amplitude = 1) {
  return 1 + Math.sin(frame * rate) * 0.012 * amplitude;
}

// ── Morphing blob background ───────────────────────────────────────────────

function OrganicBackground() {
  const frame = useCurrentFrame();
  const b1x = 48 + Math.sin(frame * 0.018) * 6;
  const b1y = 38 + Math.cos(frame * 0.022) * 5;
  const b2x = 72 + Math.sin(frame * 0.015 + 2) * 5;
  const b2y = 62 + Math.cos(frame * 0.019 + 1) * 6;
  const b3x = 28 + Math.sin(frame * 0.02 + 4) * 7;
  const b3y = 70 + Math.cos(frame * 0.016 + 3) * 4;

  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* Soft blobs */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 55% 42% at ${b1x}% ${b1y}%, rgba(124,179,138,0.09) 0%, transparent 70%),
          radial-gradient(ellipse 48% 38% at ${b2x}% ${b2y}%, rgba(196,120,90,0.07) 0%, transparent 70%),
          radial-gradient(ellipse 44% 36% at ${b3x}% ${b3y}%, rgba(165,156,200,0.06) 0%, transparent 70%)
        `,
        pointerEvents: 'none',
      }} />
      {/* Subtle warm grain */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}>
        <filter id="o-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#o-grain)" />
      </svg>
      {/* Bottom strip */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
        background: `linear-gradient(90deg, ${SAGE}44, ${TERRA}44, ${LAVNDR}44)`,
      }} />
    </AbsoluteFill>
  );
}

// ── Caption bar — soft floating pill ──────────────────────────────────────

function CaptionBar({ captions, frame, fps }: { captions: Caption[]; frame: number; fps: number }) {
  const currentMs = (frame / fps) * 1000;
  let activeIdx = -1;
  for (let i = 0; i < captions.length; i++) {
    if (currentMs >= captions[i].start_ms) activeIdx = i;
    else break;
  }
  if (activeIdx === -1) return null;

  const BEFORE = 4; const AFTER = 4;
  const winStart = Math.max(0, activeIdx - BEFORE);
  const winEnd   = Math.min(captions.length, activeIdx + AFTER + 1);
  const win      = captions.slice(winStart, winEnd);
  const activeInWin = activeIdx - winStart;
  const floatY = Math.sin(frame * 0.05) * 4;

  return (
    <div style={{
      position: 'absolute', bottom: 60, left: 0, right: 0,
      display: 'flex', justifyContent: 'center',
      transform: `translateY(${floatY}px)`,
      zIndex: 200, pointerEvents: 'none',
    }}>
      <div style={{
        background: 'rgba(18,16,14,0.78)',
        borderRadius: 40, padding: '12px 36px',
        border: `1px solid rgba(240,230,212,0.12)`,
        backdropFilter: 'blur(12px)',
        display: 'flex', gap: 14, alignItems: 'baseline', flexWrap: 'nowrap',
        maxWidth: '82%',
      }}>
        {win.map((cap, i) => {
          const isActive = i === activeInWin;
          const dist = Math.abs(i - activeInWin);
          const wordAgeMs = isActive ? Math.max(0, currentMs - cap.start_ms) : 0;
          const popT = Math.min(1, wordAgeMs / 70);
          const scale = isActive ? interpolate(popT, [0, 1], [0.86, 1]) : 1;
          return (
            <span key={winStart + i} style={{
              fontFamily: SANS,
              fontSize: isActive ? 46 : dist === 1 ? 37 : 30,
              fontWeight: isActive ? 600 : 300,
              color: isActive ? CREAM : WARM,
              opacity: isActive ? 1 : dist === 1 ? 0.5 : 0.22,
              transform: `scale(${scale})`,
              transformOrigin: 'bottom center',
              display: 'inline-block',
              whiteSpace: 'nowrap',
              textShadow: isActive ? `0 0 24px rgba(124,179,138,0.5)` : 'none',
            }}>
              {cap.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Lesson intro — soft breath reveal ─────────────────────────────────────

function LessonIntro({ moduleTitle, lessonTitle, lessonNumber }: {
  moduleTitle: string; lessonTitle: string; lessonNumber: number;
}) {
  const frame = useCurrentFrame();
  const exitOp = interpolate(frame, [72, 88], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const circP  = ease(clamp((frame - 0) / 40, 0, 1));
  const numP   = ease(clamp((frame - 28) / 22, 0, 1));
  const titleP = ease(clamp((frame - 40) / 24, 0, 1));
  const subP   = clamp((frame - 56) / 18, 0, 1);
  const breatheScale = breathe(frame, 0.05, 1.5);

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <OrganicBackground />
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        {/* Breathing circle */}
        <div style={{
          width: 220, height: 220, borderRadius: '50%',
          border: `1.5px solid rgba(124,179,138,0.3)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `scale(${breatheScale * circP})`,
          boxShadow: `0 0 60px rgba(124,179,138,0.1), inset 0 0 40px rgba(124,179,138,0.04)`,
          marginBottom: 44,
          opacity: circP,
        }}>
          <div style={{
            width: 150, height: 150, borderRadius: '50%',
            border: `1px solid rgba(124,179,138,0.2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `scale(${breathe(frame + 20, 0.05, 1)})`,
          }}>
            <span style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 400, color: SAGE, opacity: numP }}>
              {String(lessonNumber).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div style={{ fontFamily: SANS, fontSize: 40, fontWeight: 300, color: CREAM, textAlign: 'center', maxWidth: 860, lineHeight: 1.35, opacity: titleP }}>
          {lessonTitle}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 16, color: DIM, letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 24, opacity: subP }}>
          {moduleTitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ── Title Slide ────────────────────────────────────────────────────────────

function TitleSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const circP  = ease(clamp((frame - 0) / 36, 0, 1));
  const headP  = ease(clamp((frame - 24) / 28, 0, 1));
  const subP   = clamp((frame - 48) / 18, 0, 1);
  const bs     = breathe(frame);

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, padding: '0 160px' }}>
      {/* Breathing orb */}
      <div style={{
        width: 110, height: 110, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(124,179,138,0.18) 0%, rgba(124,179,138,0.04) 70%)`,
        border: `1.5px solid rgba(124,179,138,0.35)`,
        marginBottom: 48,
        transform: `scale(${bs * circP})`,
        opacity: circP,
        boxShadow: `0 0 48px rgba(124,179,138,0.15)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: SERIF, fontSize: 36, color: SAGE, fontWeight: 400 }}>N</span>
      </div>

      <h1 style={{
        fontFamily: SANS, fontSize: 80, fontWeight: 300, lineHeight: 1.1,
        letterSpacing: '-0.02em', color: CREAM,
        textAlign: 'center', margin: 0, maxWidth: 1280,
        opacity: headP, transform: `translateY(${interpolate(headP,[0,1],[28,0])}px)`,
      }}>
        {slide.heading}
      </h1>

      {/* Organic divider — dot trail */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '36px 0', opacity: subP }}>
        {[SAGE, TERRA, LAVNDR].map((c, i) => (
          <div key={i} style={{ width: i === 1 ? 28 : 8, height: 8, borderRadius: 4, background: c, opacity: 0.7 }} />
        ))}
      </div>

      {slide.subheading && (
        <p style={{
          fontFamily: SANS, fontSize: 24, fontWeight: 300,
          color: DIM, textAlign: 'center', margin: 0,
          letterSpacing: '0.08em', opacity: subP,
        }}>
          {slide.subheading}
        </p>
      )}
    </AbsoluteFill>
  );
}

// ── Hook Slide ─────────────────────────────────────────────────────────────

function HookSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const storyText = slide.story ?? slide.subheading ?? '';
  const badgeP = ease(clamp((frame - 0) / 22, 0, 1));
  const headP  = ease(clamp((frame - 14) / 28, 0, 1));
  const storyP = ease(clamp((frame - 32) / 28, 0, 1));
  const ctaP   = clamp((frame - 52) / 18, 0, 1);

  return (
    <AbsoluteFill style={{ padding: '88px 120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 32 }}>
      {/* Soft badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start',
        background: 'rgba(196,120,90,0.12)', border: `1px solid rgba(196,120,90,0.3)`,
        borderRadius: 24, padding: '8px 20px',
        opacity: badgeP, transform: `translateY(${interpolate(badgeP,[0,1],[12,0])}px)`,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: TERRA }} />
        <span style={{ fontFamily: SANS, fontSize: 13, color: TERRA, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500 }}>
          Something to consider
        </span>
      </div>

      <h2 style={{
        fontFamily: SANS, fontSize: 62, fontWeight: 300, lineHeight: 1.2,
        color: CREAM, margin: 0, maxWidth: 1100,
        opacity: headP, transform: `translateY(${interpolate(headP,[0,1],[22,0])}px)`,
      }}>
        {slide.heading}
      </h2>

      {/* Story card */}
      <div style={{
        padding: '28px 36px', borderRadius: 20,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid rgba(240,230,212,0.1)`,
        opacity: storyP, transform: `translateY(${interpolate(storyP,[0,1],[16,0])}px)`,
      }}>
        <p style={{ fontFamily: SERIF, fontSize: 28, color: WARM, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
          "{storyText}"
        </p>
      </div>

      {/* Warm CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: ctaP }}>
        {[SAGE, TERRA, LAVNDR].map((c, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.8 }} />
        ))}
        <span style={{ fontFamily: SANS, fontSize: 22, color: SAGE, fontWeight: 400 }}>
          You can change this today.
        </span>
      </div>
    </AbsoluteFill>
  );
}

// ── Content Slide ──────────────────────────────────────────────────────────

function ContentSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const bullets = slide.bullets ?? [];
  const headP = ease(clamp((frame - 0) / 24, 0, 1));
  const colors = [SAGE, TERRA, LAVNDR, WARM];

  return (
    <AbsoluteFill style={{ padding: '80px 120px', display: 'flex', flexDirection: 'column', gap: 36 }}>
      <div style={{ opacity: headP, transform: `translateY(${interpolate(headP,[0,1],[18,0])}px)` }}>
        <h2 style={{ fontFamily: SANS, fontSize: 58, fontWeight: 300, color: CREAM, margin: '0 0 20px', lineHeight: 1.1 }}>
          {slide.heading}
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {colors.map((c, i) => <div key={i} style={{ width: 22, height: 3, borderRadius: 2, background: c, opacity: 0.7 }} />)}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1, justifyContent: 'center' }}>
        {bullets.map((bullet, i) => {
          const p = ease(clamp((frame - (24 + i * 18)) / 24, 0, 1));
          const bs = breathe(frame + i * 40);
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 22,
              padding: '20px 24px', borderRadius: 16,
              background: 'rgba(255,255,255,0.035)',
              border: `1px solid rgba(240,230,212,0.08)`,
              opacity: p, transform: `translateX(${interpolate(p,[0,1],[24,0])}px)`,
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: colors[i % 4], flexShrink: 0, marginTop: 8,
                transform: `scale(${bs})`,
                boxShadow: `0 0 12px ${colors[i % 4]}55`,
              }} />
              <p style={{ fontFamily: SANS, fontSize: 26, color: CREAM, margin: 0, lineHeight: 1.55, fontWeight: 300 }}>
                {bullet}
              </p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ── Walkthrough Slide ──────────────────────────────────────────────────────

function WalkthroughSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const steps = slide.steps ?? slide.bullets ?? [];
  const HEADING_FRAMES = 20;
  const framesPerStep = Math.max(1, (slide.duration_frames - HEADING_FRAMES) / Math.max(steps.length, 1));
  const activeStep = Math.min(steps.length - 1, Math.floor(Math.max(0, frame - HEADING_FRAMES) / framesPerStep));
  const headP = ease(clamp((frame - 0) / 22, 0, 1));
  const bs = breathe(frame, 0.06, 2);

  return (
    <AbsoluteFill style={{ padding: '64px 100px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: headP }}>
        <h2 style={{ fontFamily: SANS, fontSize: 48, fontWeight: 300, color: CREAM, margin: 0 }}>
          {slide.heading}
        </h2>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: `2px solid rgba(124,179,138,0.4)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `scale(${bs})`,
          boxShadow: `0 0 20px rgba(124,179,138,0.15)`,
        }}>
          <span style={{ fontFamily: SANS, fontSize: 18, color: SAGE, fontWeight: 500 }}>
            {activeStep + 1}/{steps.length}
          </span>
        </div>
      </div>

      {/* Step progress dots */}
      <div style={{ display: 'flex', gap: 10, opacity: headP }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < activeStep ? SAGE : i === activeStep ? TERRA : FAINT,
          }} />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {steps.map((step, i) => {
          const isDone = i < activeStep;
          const isActive = i === activeStep;
          const p = ease(clamp((frame - (HEADING_FRAMES + i * framesPerStep * 0.1)) / 20, 0, 1));
          const bsCard = isActive ? breathe(frame, 0.04, 0.8) : 1;

          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 20,
              padding: isActive ? '20px 22px' : '12px 22px',
              borderRadius: 14,
              background: isActive ? 'rgba(124,179,138,0.1)' : isDone ? 'rgba(124,179,138,0.04)' : 'transparent',
              border: `1px solid ${isActive ? 'rgba(124,179,138,0.35)' : isDone ? 'rgba(124,179,138,0.15)' : 'rgba(240,230,212,0.06)'}`,
              opacity: i > activeStep + 2 ? 0.15 : ease(p),
              transform: `scale(${isActive ? bsCard : 1}) translateX(${interpolate(p,[0,1],[18,0])}px)`,
            }}>
              <div style={{
                width: isActive ? 40 : 32, height: isActive ? 40 : 32,
                borderRadius: '50%', flexShrink: 0,
                background: isDone ? SAGE : isActive ? TERRA : 'transparent',
                border: `1.5px solid ${isDone ? SAGE : isActive ? TERRA : DIM}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: SANS, fontSize: isActive ? 16 : 13, color: isDone || isActive ? '#fff' : DIM, fontWeight: 600 }}>
                  {isDone ? '✓' : i + 1}
                </span>
              </div>
              <p style={{
                fontFamily: SANS, fontSize: isActive ? 24 : 17,
                color: isDone ? SAGE : isActive ? CREAM : DIM,
                margin: 0, lineHeight: 1.5, fontWeight: isActive ? 500 : 300,
              }}>
                {step}
              </p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ── Example Slide ──────────────────────────────────────────────────────────

function ExampleSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const bullets = slide.bullets ?? [];
  const headP = ease(clamp((frame - 0) / 22, 0, 1));

  return (
    <AbsoluteFill style={{ padding: '80px 120px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ opacity: headP }}>
        <h2 style={{ fontFamily: SANS, fontSize: 54, fontWeight: 300, color: CREAM, margin: '0 0 16px' }}>{slide.heading}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {[SAGE, TERRA].map((c, i) => <div key={i} style={{ width: 22, height: 3, borderRadius: 2, background: c, opacity: 0.7 }} />)}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, flex: 1 }}>
        {bullets.map((bullet, i) => {
          const p = ease(clamp((frame - (22 + i * 14)) / 22, 0, 1));
          const isBefore = i < 2;
          const color = isBefore ? TERRA : SAGE;
          return (
            <div key={i} style={{
              padding: '24px 26px', borderRadius: 18,
              background: `rgba(${isBefore ? '196,120,90' : '124,179,138'}, 0.07)`,
              border: `1px solid rgba(${isBefore ? '196,120,90' : '124,179,138'}, 0.2)`,
              opacity: p, transform: `translateY(${interpolate(p,[0,1],[14,0])}px)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ fontFamily: SANS, fontSize: 12, color, letterSpacing: '0.2em', fontWeight: 500, textTransform: 'uppercase' }}>
                  {isBefore ? 'Before' : 'After'}
                </span>
              </div>
              <p style={{ fontFamily: SANS, fontSize: 22, color: CREAM, margin: 0, lineHeight: 1.5, fontWeight: 300 }}>{bullet}</p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ── Practice Slide ─────────────────────────────────────────────────────────

function PracticeSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timer = slide.timer_seconds ?? 120;
  const remaining = Math.max(0, timer - Math.floor(frame / fps));
  const headP = ease(clamp((frame - 0) / 24, 0, 1));
  const bodyP = ease(clamp((frame - 18) / 24, 0, 1));
  const timerP = remaining / timer;
  const CIRCUM = 2 * Math.PI * 58;
  const bs = breathe(frame, 0.04, 2);

  return (
    <AbsoluteFill style={{ padding: '80px 120px', display: 'flex', gap: 72, alignItems: 'center' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ opacity: headP }}>
          <h2 style={{ fontFamily: SANS, fontSize: 54, fontWeight: 300, color: CREAM, margin: '0 0 16px' }}>{slide.heading}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {[SAGE, TERRA, LAVNDR].map((c, i) => <div key={i} style={{ width: 18, height: 3, borderRadius: 2, background: c, opacity: 0.7 }} />)}
          </div>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 26, color: WARM, margin: 0, lineHeight: 1.65, fontWeight: 300, opacity: bodyP }}>
          {slide.task}
        </p>
        {slide.example_prompt && (
          <div style={{
            padding: '18px 24px', borderRadius: 16,
            background: 'rgba(124,179,138,0.07)', border: `1px solid rgba(124,179,138,0.2)`,
            opacity: clamp((frame - 36) / 18, 0, 1),
          }}>
            <p style={{ fontFamily: SANS, fontSize: 16, color: SAGE, margin: 0, lineHeight: 1.6, fontWeight: 400 }}>
              {slide.example_prompt}
            </p>
          </div>
        )}
      </div>

      {/* Breathing timer */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ transform: `scale(${bs})` }}>
          <svg width={160} height={160}>
            <circle cx={80} cy={80} r={58} fill="none" stroke={FAINT} strokeWidth={3} />
            <circle cx={80} cy={80} r={58} fill="none" stroke={SAGE} strokeWidth={3}
              strokeDasharray={CIRCUM} strokeDashoffset={CIRCUM * (1 - timerP)}
              strokeLinecap="round" transform="rotate(-90 80 80)"
            />
            <circle cx={80} cy={80} r={42} fill="rgba(124,179,138,0.06)" />
            <text x={80} y={76} fontFamily={SANS} fontSize={28} fill={CREAM} textAnchor="middle" fontWeight="300">
              {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
            </text>
            <text x={80} y={96} fontFamily={SANS} fontSize={11} fill={DIM} textAnchor="middle" letterSpacing="2" fontWeight="300">
              breathe
            </text>
          </svg>
        </div>
        <span style={{ fontFamily: SANS, fontSize: 13, color: DIM, letterSpacing: '0.2em', fontWeight: 300, textTransform: 'uppercase' }}>
          take your time
        </span>
      </div>
    </AbsoluteFill>
  );
}

// ── Summary Slide ──────────────────────────────────────────────────────────

function SummarySlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const bullets = slide.bullets ?? [];
  const headP = ease(clamp((frame - 0) / 24, 0, 1));
  const colors = [SAGE, TERRA, LAVNDR, WARM];

  return (
    <AbsoluteFill style={{ padding: '80px 120px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ opacity: headP }}>
        <h2 style={{ fontFamily: SANS, fontSize: 56, fontWeight: 300, color: CREAM, margin: '0 0 18px' }}>{slide.heading}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {colors.map((c, i) => <div key={i} style={{ width: 18, height: 3, borderRadius: 2, background: c, opacity: 0.7 }} />)}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, justifyContent: 'center' }}>
        {bullets.map((bullet, i) => {
          const p = ease(clamp((frame - (24 + i * 16)) / 22, 0, 1));
          const bs = breathe(frame + i * 60);
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 20,
              padding: '18px 22px', borderRadius: 14,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid rgba(240,230,212,0.07)`,
              opacity: p, transform: `translateX(${interpolate(p,[0,1],[18,0])}px)`,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: colors[i % 4], flexShrink: 0, marginTop: 9,
                transform: `scale(${bs})`,
              }} />
              <p style={{ fontFamily: SANS, fontSize: 24, color: CREAM, margin: 0, lineHeight: 1.5, fontWeight: 300 }}>{bullet}</p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ── Worked Example ─────────────────────────────────────────────────────────

function WorkedExampleSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const steps = slide.math_steps ?? [];
  const framesPerStep = Math.max(1, slide.duration_frames / Math.max(steps.length, 1));
  const activeStep = Math.min(steps.length - 1, Math.floor(frame / framesPerStep));
  const headP = ease(clamp((frame - 0) / 20, 0, 1));

  return (
    <AbsoluteFill style={{ padding: '64px 120px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ opacity: headP }}>
        <h2 style={{ fontFamily: SANS, fontSize: 46, fontWeight: 300, color: CREAM, margin: '0 0 12px' }}>{slide.heading}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {[SAGE, TERRA].map((c, i) => <div key={i} style={{ width: 16, height: 3, borderRadius: 2, background: c, opacity: 0.7 }} />)}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'center' }}>
        {steps.map((step, i) => {
          const p = ease(clamp((frame - i * framesPerStep) / 18, 0, 1));
          if (p <= 0) return null;
          const isActive = i === activeStep;
          const isDone   = i < activeStep;
          return (
            <div key={i} style={{
              display: 'flex', gap: 22, alignItems: 'center',
              padding: '16px 22px', borderRadius: 12,
              background: isActive ? 'rgba(124,179,138,0.08)' : isDone ? 'rgba(124,179,138,0.03)' : 'transparent',
              border: `1px solid ${isActive ? 'rgba(124,179,138,0.3)' : 'rgba(240,230,212,0.06)'}`,
              opacity: ease(p),
            }}>
              <span style={{ fontFamily: SANS, fontSize: 14, color: isDone ? SAGE : isActive ? TERRA : DIM, flexShrink: 0, width: 22, fontWeight: 500 }}>
                {isDone ? '✓' : `${i + 1}.`}
              </span>
              <span style={{
                fontFamily: SERIF, fontStyle: 'italic',
                fontSize: isActive ? 40 : 30,
                color: isDone ? SAGE : isActive ? CREAM : DIM,
                fontWeight: 400, flex: 1, lineHeight: 1.3,
              }}>
                {step.expression}
              </span>
              {step.annotation && (
                <span style={{ fontFamily: SANS, fontSize: 14, color: DIM, fontWeight: 300, maxWidth: 260, lineHeight: 1.4 }}>
                  {step.annotation}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

export const OrganicTheme: ThemeComponents = {
  SlideBackground:    OrganicBackground,
  TitleSlide, HookSlide, ContentSlide, WalkthroughSlide,
  ExampleSlide, PracticeSlide, SummarySlide, WorkedExampleSlide,
  CaptionBar, LessonIntro,
};
