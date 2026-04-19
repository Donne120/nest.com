import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Audio, staticFile } from 'remotion';
import type { ThemeComponents, SlideData, Caption } from './types';

// ── KINETIC — editorial magazine energy ───────────────────────────────────
// Black, white, brutal red. Text slams in. Asymmetric layouts.
// Think Bloomberg cover meets Fast Company in motion.

const BG      = '#080808';
const WHITE   = '#f2f2f2';
const RED     = '#ff2255';
const YELLOW  = '#ffe600';
const GRAY    = '#404040';
const LGRAY   = '#a0a0a0';
const SANS    = '"Helvetica Neue", "Arial Black", Arial, sans-serif';
const MONO    = '"Courier New", monospace';

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function easeOutExpo(t: number) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t, 0, 1)); }
function easeOutBack(t: number) { const c = 1.70158; const t1 = clamp(t,0,1) - 1; return t1 * t1 * ((c + 1) * t1 + c) + 1; }

// ── Kinetic background ─────────────────────────────────────────────────────

function KineticBackground() {
  const frame = useCurrentFrame();
  // Horizontal scan lines that slowly drift
  const drift = (frame * 0.4) % 60;
  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* Subtle horizontal rule lines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 60px)`,
        backgroundPositionY: `${drift}px`,
        pointerEvents: 'none',
      }} />
      {/* Corner accent — red top-right */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 180, height: 6, background: RED }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: 6, height: 180, background: RED }} />
      {/* Bottom left */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 120, height: 4, background: GRAY }} />
    </AbsoluteFill>
  );
}

// ── Caption bar — brutal strip ─────────────────────────────────────────────

function CaptionBar({ captions, frame, fps }: { captions: Caption[]; frame: number; fps: number }) {
  const currentMs = (frame / fps) * 1000;
  let activeIdx = -1;
  for (let i = 0; i < captions.length; i++) {
    if (currentMs >= captions[i].start_ms) activeIdx = i;
    else break;
  }
  if (activeIdx === -1) return null;

  const BEFORE = 3; const AFTER = 4;
  const winStart = Math.max(0, activeIdx - BEFORE);
  const winEnd   = Math.min(captions.length, activeIdx + AFTER + 1);
  const win      = captions.slice(winStart, winEnd);
  const activeInWin = activeIdx - winStart;

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'rgba(8,8,8,0.94)', borderTop: `3px solid ${RED}`,
      padding: '12px 80px 16px',
      display: 'flex', alignItems: 'center', gap: 14,
      zIndex: 200, pointerEvents: 'none',
    }}>
      <div style={{ width: 4, height: 32, background: RED, flexShrink: 0 }} />
      <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', flexWrap: 'nowrap' }}>
        {win.map((cap, i) => {
          const isActive = i === activeInWin;
          const dist = Math.abs(i - activeInWin);
          const wordAgeMs = isActive ? Math.max(0, currentMs - cap.start_ms) : 0;
          const popT = Math.min(1, wordAgeMs / 55);
          const popScale = isActive ? interpolate(popT, [0, 1], [0.78, 1]) : 1;
          return (
            <span key={winStart + i} style={{
              fontFamily: SANS,
              fontSize: isActive ? 46 : dist === 1 ? 37 : 30,
              fontWeight: isActive ? 900 : 400,
              color: isActive ? WHITE : LGRAY,
              opacity: isActive ? 1 : dist === 1 ? 0.5 : 0.22,
              transform: `scale(${popScale})`,
              transformOrigin: 'bottom left',
              letterSpacing: isActive ? '-0.03em' : '-0.01em',
              display: 'inline-block',
              whiteSpace: 'nowrap',
              textTransform: isActive ? 'uppercase' : 'none',
            }}>
              {cap.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Lesson intro — impact sequence ─────────────────────────────────────────

function LessonIntro({ moduleTitle, lessonTitle, lessonNumber }: {
  moduleTitle: string; lessonTitle: string; lessonNumber: number;
}) {
  const frame = useCurrentFrame();
  const exitOp  = interpolate(frame, [72, 88], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const numP    = easeOutBack(clamp((frame - 0) / 22, 0, 1));
  const lineW   = easeOutExpo(clamp((frame - 18) / 28, 0, 1));
  const titleP  = easeOutExpo(clamp((frame - 30) / 24, 0, 1));
  const subP    = clamp((frame - 44) / 18, 0, 1);

  return (
    <AbsoluteFill style={{ background: BG, opacity: exitOp }}>
      <KineticBackground />
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 100px' }}>
        {/* Giant lesson number — background element */}
        <div style={{
          position: 'absolute', right: 80, top: '50%',
          transform: `translateY(-50%) scale(${numP})`,
          fontFamily: SANS, fontSize: 420, fontWeight: 900,
          color: 'rgba(255,255,255,0.04)',
          lineHeight: 1, letterSpacing: '-0.06em',
          userSelect: 'none',
        }}>
          {String(lessonNumber).padStart(2, '0')}
        </div>

        {/* Red bar */}
        <div style={{ width: `${lineW * 80}px`, height: 6, background: RED, marginBottom: 40 }} />

        {/* Lesson title */}
        <div style={{
          fontFamily: SANS, fontSize: 88, fontWeight: 900,
          color: WHITE, lineHeight: 0.95, letterSpacing: '-0.04em',
          textTransform: 'uppercase', maxWidth: 1100,
          transform: `translateX(${interpolate(titleP, [0, 1], [-60, 0])}px)`,
          opacity: titleP,
        }}>
          {lessonTitle}
        </div>

        {/* Module label */}
        <div style={{
          fontFamily: MONO, fontSize: 16, color: RED,
          letterSpacing: '0.3em', textTransform: 'uppercase',
          marginTop: 36, opacity: subP,
        }}>
          {moduleTitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ── Title Slide ────────────────────────────────────────────────────────────

function TitleSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const numP   = easeOutBack(clamp((frame - 0) / 28, 0, 1));
  const lineP  = easeOutExpo(clamp((frame - 20) / 22, 0, 1));
  const headP  = easeOutExpo(clamp((frame - 28) / 26, 0, 1));
  const subP   = clamp((frame - 48) / 18, 0, 1);
  const redBarH = interpolate(lineP, [0, 1], [0, 6]);

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 100px' }}>
      {/* Background lesson number */}
      <div style={{
        position: 'absolute', right: 60, top: '50%',
        transform: `translateY(-50%) scale(${numP})`,
        fontFamily: SANS, fontSize: 380, fontWeight: 900,
        color: 'rgba(255,34,85,0.07)', lineHeight: 1, letterSpacing: '-0.05em',
      }}>
        {String(slide.start_frame).slice(0, 2) || '01'}
      </div>

      {/* Red accent line grows in */}
      <div style={{ width: `${lineP * 100}px`, height: redBarH, background: RED, marginBottom: 44 }} />

      {/* Main heading — slams from left */}
      <h1 style={{
        fontFamily: SANS, fontSize: 96, fontWeight: 900, lineHeight: 0.92,
        letterSpacing: '-0.04em', color: WHITE,
        textTransform: 'uppercase', margin: 0, maxWidth: 1300,
        transform: `translateX(${interpolate(headP, [0, 1], [-80, 0])}px)`,
        opacity: headP,
      }}>
        {slide.heading}
      </h1>

      {/* Horizontal white rule */}
      <div style={{ width: `${lineP * 340}px`, height: 1, background: GRAY, margin: '40px 0 28px', opacity: subP }} />

      {slide.subheading && (
        <div style={{
          fontFamily: MONO, fontSize: 20, color: LGRAY,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          opacity: subP,
        }}>
          {slide.subheading}
        </div>
      )}
    </AbsoluteFill>
  );
}

// ── Hook Slide — impact split ──────────────────────────────────────────────

function HookSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const storyText = slide.story ?? slide.subheading ?? '';
  const leftP  = easeOutExpo(clamp((frame - 0) / 28, 0, 1));
  const rightP = easeOutExpo(clamp((frame - 14) / 32, 0, 1));
  const statsP = clamp((frame - 36) / 22, 0, 1);

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'row' }}>
      {/* Left — red panel */}
      <div style={{
        flex: '0 0 48%', background: RED,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '80px 64px',
        transform: `translateX(${interpolate(leftP, [0, 1], [-100, 0])}%)`,
      }}>
        <div style={{ fontFamily: MONO, fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 28 }}>
          THE PROBLEM
        </div>
        <h2 style={{
          fontFamily: SANS, fontSize: 54, fontWeight: 900, lineHeight: 1.0,
          letterSpacing: '-0.03em', color: WHITE, textTransform: 'uppercase', margin: 0,
        }}>
          {slide.heading}
        </h2>
      </div>

      {/* Right — story + stat */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '80px 72px',
        transform: `translateX(${interpolate(rightP, [0, 1], [60, 0])}px)`,
        opacity: rightP,
      }}>
        <p style={{
          fontFamily: SANS, fontSize: 30, lineHeight: 1.55,
          color: WHITE, margin: '0 0 48px', fontWeight: 300,
        }}>
          {storyText}
        </p>

        {/* Impact stat */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, opacity: statsP }}>
          <div style={{ width: 4, height: 64, background: YELLOW, flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: SANS, fontSize: 72, fontWeight: 900, color: YELLOW, lineHeight: 1, letterSpacing: '-0.04em' }}>
              TODAY
            </div>
            <div style={{ fontFamily: MONO, fontSize: 15, color: LGRAY, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 6 }}>
              YOU CHANGE THIS
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Content Slide — numbered impact list ───────────────────────────────────

function ContentSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const bullets = slide.bullets ?? [];
  const headP = easeOutExpo(clamp((frame - 0) / 24, 0, 1));

  return (
    <AbsoluteFill style={{ padding: '80px 100px', display: 'flex', gap: 72, alignItems: 'flex-start' }}>

      {/* Left header column */}
      <div style={{ flex: '0 0 36%', paddingTop: 12, opacity: headP, transform: `translateY(${interpolate(headP,[0,1],[24,0])}px)` }}>
        <div style={{ width: 48, height: 5, background: RED, marginBottom: 28 }} />
        <h2 style={{
          fontFamily: SANS, fontSize: 58, fontWeight: 900, lineHeight: 0.95,
          letterSpacing: '-0.035em', textTransform: 'uppercase', color: WHITE, margin: 0,
        }}>
          {slide.heading}
        </h2>
        <div style={{ fontFamily: MONO, fontSize: 13, color: LGRAY, letterSpacing: '0.2em', marginTop: 24 }}>
          KEY POINTS ↓
        </div>
      </div>

      {/* Right — numbered bullets */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {bullets.map((bullet, i) => {
          const p = easeOutExpo(clamp((frame - (22 + i * 18)) / 24, 0, 1));
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 28,
              padding: '22px 0',
              borderBottom: `1px solid ${GRAY}`,
              opacity: p,
              transform: `translateX(${interpolate(p, [0, 1], [40, 0])}px)`,
            }}>
              <span style={{
                fontFamily: SANS, fontSize: 60, fontWeight: 900,
                color: i === 0 ? RED : 'rgba(255,255,255,0.12)',
                lineHeight: 1, flexShrink: 0, width: 70,
                letterSpacing: '-0.04em',
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <p style={{ fontFamily: SANS, fontSize: 26, color: WHITE, margin: 0, lineHeight: 1.45, paddingTop: 10, fontWeight: 400 }}>
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
  const headP = easeOutExpo(clamp((frame - 0) / 22, 0, 1));

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', padding: '72px 100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48, opacity: headP }}>
        <div>
          <div style={{ width: 40, height: 4, background: RED, marginBottom: 18 }} />
          <h2 style={{ fontFamily: SANS, fontSize: 52, fontWeight: 900, color: WHITE, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.03em' }}>
            {slide.heading}
          </h2>
        </div>
        <div style={{
          fontFamily: SANS, fontSize: 72, fontWeight: 900,
          color: `rgba(255,34,85,${activeStep === 0 ? 1 : 0.15})`,
          letterSpacing: '-0.04em', lineHeight: 1,
        }}>
          {String(activeStep + 1).padStart(2, '0')}
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1 }}>
        {steps.map((step, i) => {
          const isDone = i < activeStep;
          const isActive = i === activeStep;
          const entryP = easeOutExpo(clamp((frame - (HEADING_FRAMES + i * framesPerStep * 0.1)) / 18, 0, 1));

          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 28,
              padding: isActive ? '20px 24px' : '12px 24px',
              background: isActive ? RED : isDone ? 'rgba(255,255,255,0.04)' : 'transparent',
              borderLeft: `4px solid ${isDone ? LGRAY : isActive ? RED : GRAY}`,
              marginBottom: 4,
              opacity: i > activeStep + 2 ? 0.2 : easeOutExpo(entryP),
              transform: `translateX(${interpolate(entryP, [0, 1], [24, 0])}px)`,
            }}>
              <span style={{
                fontFamily: SANS, fontSize: isActive ? 26 : 18,
                fontWeight: 900, color: isDone ? LGRAY : WHITE,
                flexShrink: 0, width: 32, letterSpacing: '-0.02em',
              }}>
                {isDone ? '✓' : `${i + 1}.`}
              </span>
              <p style={{
                fontFamily: SANS, fontSize: isActive ? 26 : 18,
                fontWeight: isActive ? 700 : 400,
                color: isDone ? LGRAY : WHITE,
                margin: 0, lineHeight: 1.35,
              }}>
                {step}
              </p>
            </div>
          );
        })}
      </div>

      {/* Prompt/response */}
      {activeStep >= Math.floor(steps.length * 0.6) && slide.example_prompt && (
        <div style={{ marginTop: 24, padding: '18px 24px', background: 'rgba(255,255,255,0.06)', borderLeft: `4px solid ${YELLOW}` }}>
          <div style={{ fontFamily: MONO, fontSize: 12, color: YELLOW, letterSpacing: '0.2em', marginBottom: 8 }}>PROMPT</div>
          <p style={{ fontFamily: MONO, fontSize: 16, color: WHITE, margin: 0, lineHeight: 1.55 }}>{slide.example_prompt}</p>
        </div>
      )}
    </AbsoluteFill>
  );
}

// ── Example Slide ──────────────────────────────────────────────────────────

function ExampleSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const bullets = slide.bullets ?? [];
  const headP = easeOutExpo(clamp((frame - 0) / 22, 0, 1));

  return (
    <AbsoluteFill style={{ padding: '80px 100px', display: 'flex', flexDirection: 'column', gap: 40 }}>
      <div style={{ opacity: headP, transform: `translateY(${interpolate(headP,[0,1],[20,0])}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16 }}>
          <div style={{ width: 40, height: 5, background: YELLOW }} />
          <span style={{ fontFamily: MONO, fontSize: 13, color: YELLOW, letterSpacing: '0.28em', textTransform: 'uppercase' }}>REAL RESULT</span>
        </div>
        <h2 style={{ fontFamily: SANS, fontSize: 62, fontWeight: 900, color: WHITE, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.95 }}>
          {slide.heading}
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1 }}>
        {bullets.map((bullet, i) => {
          const p = easeOutExpo(clamp((frame - (22 + i * 14)) / 22, 0, 1));
          const isBefore = i < 2;
          return (
            <div key={i} style={{
              padding: '28px 28px',
              background: isBefore ? 'rgba(255,255,255,0.03)' : 'rgba(255,34,85,0.08)',
              borderTop: `4px solid ${isBefore ? GRAY : RED}`,
              opacity: p, transform: `translateY(${interpolate(p,[0,1],[20,0])}px)`,
            }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: isBefore ? LGRAY : RED, letterSpacing: '0.25em', marginBottom: 14, textTransform: 'uppercase' }}>
                {isBefore ? `BEFORE ${i + 1}` : `AFTER ${i - 1}`}
              </div>
              <p style={{ fontFamily: SANS, fontSize: 22, color: WHITE, margin: 0, lineHeight: 1.45, fontWeight: isBefore ? 300 : 600 }}>{bullet}</p>
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
  const timer   = slide.timer_seconds ?? 120;
  const elapsed = Math.min(timer, Math.floor(frame / fps));
  const remaining = timer - elapsed;
  const headP = easeOutExpo(clamp((frame - 0) / 22, 0, 1));
  const bodyP = easeOutExpo(clamp((frame - 18) / 24, 0, 1));

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'row' }}>
      {/* Timer block */}
      <div style={{
        flex: '0 0 340px', background: RED,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <div style={{ fontFamily: MONO, fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>TIME LEFT</div>
        <div style={{ fontFamily: SANS, fontSize: 96, fontWeight: 900, color: WHITE, letterSpacing: '-0.05em', lineHeight: 1 }}>
          {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em' }}>PAUSE → DO → RETURN</div>
      </div>

      {/* Task */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 72px', gap: 32 }}>
        <div style={{ opacity: headP, transform: `translateX(${interpolate(headP,[0,1],[40,0])}px)` }}>
          <div style={{ width: 40, height: 5, background: YELLOW, marginBottom: 24 }} />
          <h2 style={{ fontFamily: SANS, fontSize: 56, fontWeight: 900, color: WHITE, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.95 }}>
            {slide.heading}
          </h2>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 26, color: WHITE, margin: 0, lineHeight: 1.55, fontWeight: 300, opacity: bodyP }}>
          {slide.task}
        </p>
        {slide.example_prompt && (
          <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.05)', borderLeft: `4px solid ${YELLOW}`, opacity: clamp((frame - 36) / 20, 0, 1) }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: YELLOW, letterSpacing: '0.25em', marginBottom: 8 }}>YOUR PROMPT</div>
            <p style={{ fontFamily: MONO, fontSize: 15, color: WHITE, margin: 0, lineHeight: 1.55 }}>{slide.example_prompt}</p>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}

// ── Summary Slide ──────────────────────────────────────────────────────────

function SummarySlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const bullets = slide.bullets ?? [];
  const headP = easeOutExpo(clamp((frame - 0) / 22, 0, 1));

  return (
    <AbsoluteFill style={{ padding: '80px 100px', display: 'flex', flexDirection: 'column', gap: 36 }}>
      <div style={{ opacity: headP, transform: `translateY(${interpolate(headP,[0,1],[20,0])}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16 }}>
          <div style={{ width: 40, height: 5, background: RED }} />
          <span style={{ fontFamily: MONO, fontSize: 13, color: RED, letterSpacing: '0.28em', textTransform: 'uppercase' }}>WHAT YOU LEARNED</span>
        </div>
        <h2 style={{ fontFamily: SANS, fontSize: 72, fontWeight: 900, color: WHITE, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.04em', lineHeight: 0.9 }}>
          {slide.heading}
        </h2>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {bullets.map((bullet, i) => {
          const p = easeOutExpo(clamp((frame - (22 + i * 16)) / 22, 0, 1));
          return (
            <div key={i} style={{
              display: 'flex', gap: 24, alignItems: 'flex-start',
              padding: '18px 0', borderBottom: `1px solid ${GRAY}`,
              opacity: p, transform: `translateX(${interpolate(p,[0,1],[30,0])}px)`,
            }}>
              <span style={{ fontFamily: SANS, fontSize: 20, fontWeight: 900, color: RED, flexShrink: 0, width: 28, marginTop: 4 }}>✓</span>
              <p style={{ fontFamily: SANS, fontSize: 24, color: WHITE, margin: 0, lineHeight: 1.45, fontWeight: 400 }}>{bullet}</p>
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
  const headP = easeOutExpo(clamp((frame - 0) / 20, 0, 1));

  return (
    <AbsoluteFill style={{ padding: '72px 100px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ opacity: headP }}>
        <div style={{ width: 40, height: 5, background: RED, marginBottom: 20 }} />
        <h2 style={{ fontFamily: SANS, fontSize: 48, fontWeight: 900, color: WHITE, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.03em' }}>
          {slide.heading}
        </h2>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map((step, i) => {
          const p = easeOutExpo(clamp((frame - i * framesPerStep) / 18, 0, 1));
          if (p <= 0) return null;
          const isActive = i === activeStep;
          const isDone   = i < activeStep;
          return (
            <div key={i} style={{
              display: 'flex', gap: 24, alignItems: 'center',
              padding: '16px 24px',
              background: isActive ? RED : isDone ? 'rgba(255,255,255,0.04)' : 'transparent',
              opacity: p,
            }}>
              <span style={{ fontFamily: MONO, fontSize: 14, color: isActive ? WHITE : LGRAY, flexShrink: 0, width: 28 }}>{i + 1}.</span>
              <span style={{ fontFamily: MONO, fontSize: isActive ? 38 : 28, fontWeight: 700, color: WHITE, flex: 1, letterSpacing: '0.02em' }}>
                {step.expression}
              </span>
              {step.annotation && (
                <span style={{ fontFamily: MONO, fontSize: 13, color: isActive ? 'rgba(255,255,255,0.7)' : LGRAY }}>
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

export const KineticTheme: ThemeComponents = {
  SlideBackground:    KineticBackground,
  TitleSlide, HookSlide, ContentSlide, WalkthroughSlide,
  ExampleSlide, PracticeSlide, SummarySlide, WorkedExampleSlide,
  CaptionBar, LessonIntro,
};
