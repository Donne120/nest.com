import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Audio, staticFile } from 'remotion';
import type { ThemeComponents, SlideData, Caption } from './types';

// ── CHALKBOARD — genuine chalk-on-blackboard aesthetic ─────────────────────
// Dark slate background, cream chalk strokes that draw themselves,
// slightly imperfect edges, equations write stroke by stroke.

const BG      = '#1a1f2e';
const CHALK   = '#f5f0e6';
const YELLOW  = '#ffd166';
const GREEN   = '#06d6a0';
const PINK    = '#ef476f';
const DIM     = 'rgba(245,240,230,0.35)';
const FAINT   = 'rgba(245,240,230,0.14)';
const MONO    = '"Courier New", monospace';
const SERIF   = '"Georgia", "Times New Roman", serif';

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function ease(t: number) { return 1 - Math.pow(1 - clamp(t, 0, 1), 3); }

// ── Chalk stroke animation — draws SVG paths ───────────────────────────────

function ChalkLine({ x1, y1, x2, y2, progress, color = DIM, width = 1.5 }: {
  x1: number; y1: number; x2: number; y2: number;
  progress: number; color?: string; width?: number;
}) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const offset = len * (1 - clamp(progress, 0, 1));
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color} strokeWidth={width}
      strokeDasharray={len} strokeDashoffset={offset}
      strokeLinecap="round"
    />
  );
}

// ── Typewriter with chalk character feel ──────────────────────────────────

function ChalkWrite({ text, startFrame, speed = 2.8, style = {} }: {
  text: string; startFrame: number; speed?: number; style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const chars = Math.min(text.length, Math.floor(Math.max(0, frame - startFrame) * speed));
  return (
    <span style={style}>{text.slice(0, chars)}</span>
  );
}

// ── Chalkboard background ──────────────────────────────────────────────────

function ChalkboardBackground() {
  const frame = useCurrentFrame();
  // Subtle chalk dust particles
  const particles = Array.from({ length: 8 }, (_, i) => ({
    x: ((i * 237 + frame * (0.3 + i * 0.07)) % 1900) + 10,
    y: ((i * 173 + frame * (0.15 + i * 0.05)) % 1040) + 20,
    op: 0.04 + (i % 3) * 0.02,
    r: 1 + (i % 4) * 0.8,
  }));

  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* Chalkboard texture — subtle grid lines like ruled board */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          repeating-linear-gradient(0deg, rgba(245,240,230,0.025) 0px, rgba(245,240,230,0.025) 1px, transparent 1px, transparent 88px),
          repeating-linear-gradient(90deg, rgba(245,240,230,0.012) 0px, rgba(245,240,230,0.012) 1px, transparent 1px, transparent 120px)
        `,
      }} />
      {/* Chalk dust */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {particles.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={CHALK} opacity={p.op} />
        ))}
        {/* Board border */}
        <rect x={20} y={20} width={1880} height={1040}
          fill="none" stroke={DIM} strokeWidth={2} strokeDasharray="8 12"
        />
      </svg>
      {/* Board tray / bottom ledge */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
        background: 'rgba(255,255,255,0.04)', borderTop: `2px solid ${FAINT}`,
      }} />
      {/* Erased area texture — very subtle lighter patches */}
      <div style={{
        position: 'absolute', top: '15%', left: '8%', width: '22%', height: '18%',
        background: 'radial-gradient(ellipse, rgba(245,240,230,0.022) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
    </AbsoluteFill>
  );
}

// ── Caption bar — chalk underline style ────────────────────────────────────

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

  return (
    <div style={{
      position: 'absolute', bottom: 52, left: 0, right: 0,
      display: 'flex', justifyContent: 'center',
      zIndex: 200, pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', gap: 14, alignItems: 'baseline', flexWrap: 'nowrap',
        padding: '10px 32px 14px',
        background: 'rgba(26,31,46,0.78)',
        borderBottom: `2px solid rgba(245,240,230,0.3)`,
      }}>
        {win.map((cap, i) => {
          const isActive = i === activeInWin;
          const dist = Math.abs(i - activeInWin);
          const wordAgeMs = isActive ? Math.max(0, currentMs - cap.start_ms) : 0;
          const popT = Math.min(1, wordAgeMs / 60);
          return (
            <span key={winStart + i} style={{
              fontFamily: SERIF,
              fontSize: isActive ? 48 : dist === 1 ? 38 : 31,
              fontWeight: isActive ? 700 : 400,
              color: isActive ? YELLOW : CHALK,
              opacity: isActive ? 1 : dist === 1 ? 0.48 : 0.22,
              transform: `scale(${isActive ? interpolate(popT,[0,1],[0.84,1]) : 1})`,
              transformOrigin: 'bottom center',
              display: 'inline-block',
              textShadow: isActive ? `0 0 28px rgba(255,209,102,0.6)` : 'none',
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
            }}>
              {cap.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Lesson intro — chalk title reveal ─────────────────────────────────────

function LessonIntro({ moduleTitle, lessonTitle, lessonNumber }: {
  moduleTitle: string; lessonTitle: string; lessonNumber: number;
}) {
  const frame = useCurrentFrame();
  const exitOp  = interpolate(frame, [72, 88], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lineP   = ease(clamp((frame - 0) / 30, 0, 1));
  const numP    = ease(clamp((frame - 24) / 22, 0, 1));
  const titleP  = ease(clamp((frame - 38) / 24, 0, 1));
  const subP    = clamp((frame - 56) / 16, 0, 1);
  const LEN     = 600;

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <ChalkboardBackground />
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={900} height={460} style={{ overflow: 'visible' }}>
          {/* Horizontal chalk lines frame */}
          <ChalkLine x1={(900 - LEN) / 2} y1={40} x2={(900 + LEN) / 2} y2={40} progress={lineP} color={DIM} width={1.5} />
          <ChalkLine x1={(900 - LEN) / 2} y1={420} x2={(900 + LEN) / 2} y2={420} progress={lineP} color={DIM} width={1.5} />
          {/* Lesson number */}
          <text x={450} y={180} fontFamily={SERIF} fontSize={140} fontWeight={700}
            fill={CHALK} textAnchor="middle"
            opacity={numP} letterSpacing="-4"
          >
            {String(lessonNumber).padStart(2, '0')}
          </text>
          {/* Title */}
          <text x={450} y={280} fontFamily={SERIF} fontSize={42} fontWeight={400}
            fill={CHALK} textAnchor="middle"
            opacity={titleP}
          >
            {lessonTitle.length > 44 ? lessonTitle.slice(0, 44) + '…' : lessonTitle}
          </text>
          {/* Module label */}
          <text x={450} y={380} fontFamily={MONO} fontSize={16}
            fill={DIM} textAnchor="middle" letterSpacing="4"
            opacity={subP}
          >
            {moduleTitle.toUpperCase()}
          </text>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ── Title Slide ────────────────────────────────────────────────────────────

function TitleSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const lineP  = ease(clamp((frame - 0) / 28, 0, 1));
  const headP  = ease(clamp((frame - 22) / 28, 0, 1));
  const subP   = clamp((frame - 44) / 18, 0, 1);
  const W = 1400; const CX = 960; const CY = 540;

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={W} height={520} style={{ overflow: 'visible' }}>
        {/* Underline rule that draws itself */}
        <ChalkLine x1={CX - W / 2} y1={340} x2={CX + W / 2} y2={340} progress={lineP} color={DIM} width={1.5} />
        <ChalkLine x1={CX - 80} y1={356} x2={CX + 80} y2={356} progress={lineP * 0.7} color={YELLOW} width={2.5} />

        {/* Main heading */}
        <text x={CX} y={290} fontFamily={SERIF} fontSize={82} fontWeight={700}
          fill={CHALK} textAnchor="middle" opacity={headP} letterSpacing="-1"
        >
          {slide.heading.length > 36 ? slide.heading.slice(0, 36) + '…' : slide.heading}
        </text>
        {slide.heading.length > 36 && (
          <text x={CX} y={372} fontFamily={SERIF} fontSize={82} fontWeight={700}
            fill={CHALK} textAnchor="middle" opacity={headP} letterSpacing="-1"
          >
            {slide.heading.slice(36)}
          </text>
        )}

        {/* Subheading */}
        {slide.subheading && (
          <text x={CX} y={430} fontFamily={MONO} fontSize={20}
            fill={DIM} textAnchor="middle" letterSpacing="4" opacity={subP}
          >
            {slide.subheading.toUpperCase()}
          </text>
        )}

        {/* Corner chalk marks */}
        <ChalkLine x1={CX - W / 2} y1={100} x2={CX - W / 2 + 32} y2={100} progress={lineP} color={FAINT} width={1} />
        <ChalkLine x1={CX - W / 2} y1={100} x2={CX - W / 2} y2={132} progress={lineP} color={FAINT} width={1} />
        <ChalkLine x1={CX + W / 2} y1={100} x2={CX + W / 2 - 32} y2={100} progress={lineP} color={FAINT} width={1} />
        <ChalkLine x1={CX + W / 2} y1={100} x2={CX + W / 2} y2={132} progress={lineP} color={FAINT} width={1} />
      </svg>
    </AbsoluteFill>
  );
}

// ── Hook Slide ─────────────────────────────────────────────────────────────

function HookSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const storyText = slide.story ?? slide.subheading ?? '';
  const headP = ease(clamp((frame - 0) / 26, 0, 1));
  const storyP = ease(clamp((frame - 22) / 28, 0, 1));
  const ctaP  = clamp((frame - 42) / 18, 0, 1);

  return (
    <AbsoluteFill style={{ padding: '80px 120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 36 }}>
      {/* Problem badge — drawn box */}
      <svg style={{ position: 'absolute', top: 100, left: 120, overflow: 'visible' }} width={240} height={38}>
        <ChalkLine x1={0} y1={0} x2={240} y2={0} progress={headP} color={PINK} width={1.5} />
        <ChalkLine x1={240} y1={0} x2={240} y2={38} progress={headP * 0.8} color={PINK} width={1.5} />
        <ChalkLine x1={240} y1={38} x2={0} y2={38} progress={headP * 0.6} color={PINK} width={1.5} />
        <ChalkLine x1={0} y1={38} x2={0} y2={0} progress={headP * 0.4} color={PINK} width={1.5} />
        <text x={14} y={26} fontFamily={MONO} fontSize={14} fill={PINK} letterSpacing="3" opacity={headP}>
          THE PROBLEM
        </text>
      </svg>

      <div style={{ marginTop: 48 }}>
        <h2 style={{
          fontFamily: SERIF, fontSize: 64, fontWeight: 700, lineHeight: 1.15,
          color: CHALK, margin: '0 0 32px',
          opacity: headP, transform: `translateY(${interpolate(headP,[0,1],[20,0])}px)`,
        }}>
          {slide.heading}
        </h2>

        {/* Story — drawn underline appears as you read */}
        <div style={{ position: 'relative', opacity: storyP, transform: `translateY(${interpolate(storyP,[0,1],[16,0])}px)` }}>
          <p style={{ fontFamily: SERIF, fontSize: 30, color: DIM, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
            {storyText}
          </p>
          <svg style={{ position: 'absolute', bottom: -8, left: 0, width: '100%', height: 4, overflow: 'visible' }}>
            <ChalkLine x1={0} y1={2} x2={700} y2={2} progress={storyP * 0.6} color={YELLOW} width={2} />
          </svg>
        </div>
      </div>

      {/* Call to action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, opacity: ctaP }}>
        <svg width={40} height={2}><line x1={0} y1={1} x2={40} y2={1} stroke={YELLOW} strokeWidth={2} /></svg>
        <span style={{ fontFamily: SERIF, fontSize: 26, color: YELLOW, fontStyle: 'italic' }}>
          Let us change this today.
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

  return (
    <AbsoluteFill style={{ padding: '80px 120px', display: 'flex', flexDirection: 'column', gap: 36 }}>
      <div style={{ opacity: headP, transform: `translateY(${interpolate(headP,[0,1],[18,0])}px)` }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 58, fontWeight: 700, color: CHALK, margin: '0 0 12px', lineHeight: 1.1 }}>
          {slide.heading}
        </h2>
        <svg width={180} height={4}><line x1={0} y1={2} x2={180} y2={2} stroke={YELLOW} strokeWidth={2.5} /></svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, flex: 1, justifyContent: 'center' }}>
        {bullets.map((bullet, i) => {
          const p = ease(clamp((frame - (24 + i * 18)) / 22, 0, 1));
          const icons = ['○', '△', '□', '◇'];
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 24,
              opacity: p, transform: `translateX(${interpolate(p,[0,1],[20,0])}px)`,
            }}>
              <span style={{ fontFamily: SERIF, fontSize: 28, color: YELLOW, flexShrink: 0, marginTop: 2, lineHeight: 1 }}>
                {icons[i % 4]}
              </span>
              <p style={{ fontFamily: SERIF, fontSize: 28, color: CHALK, margin: 0, lineHeight: 1.55 }}>{bullet}</p>
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
  const glowP = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.5, 1]);

  return (
    <AbsoluteFill style={{ padding: '64px 100px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: headP }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: CHALK, margin: 0 }}>
          {slide.heading}
        </h2>
        <div style={{ fontFamily: MONO, fontSize: 16, color: DIM, border: `1px solid ${DIM}`, padding: '6px 18px', borderRadius: 2 }}>
          {activeStep + 1} / {steps.length}
        </div>
      </div>

      {/* Steps as numbered chalk list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'center' }}>
        {steps.map((step, i) => {
          const isDone = i < activeStep;
          const isActive = i === activeStep;
          const p = ease(clamp((frame - (HEADING_FRAMES + i * framesPerStep * 0.12)) / 18, 0, 1));

          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 22,
              padding: isActive ? '16px 18px' : '10px 18px',
              borderLeft: `3px solid ${isDone ? GREEN : isActive ? YELLOW : FAINT}`,
              background: isActive ? 'rgba(255,209,102,0.07)' : 'transparent',
              opacity: i > activeStep + 2 ? 0.15 : ease(p),
              transform: `translateX(${interpolate(p,[0,1],[16,0])}px)`,
            }}>
              <span style={{
                fontFamily: SERIF, fontSize: isActive ? 24 : 18,
                color: isDone ? GREEN : isActive ? YELLOW : DIM,
                flexShrink: 0, width: 24, paddingTop: 2,
              }}>
                {isDone ? '✓' : `${i + 1}.`}
              </span>
              <p style={{
                fontFamily: SERIF, fontSize: isActive ? 26 : 18,
                color: isDone ? GREEN : isActive ? CHALK : DIM,
                margin: 0, lineHeight: 1.45,
                fontWeight: isActive ? 700 : 400,
              }}>
                {step}
              </p>
            </div>
          );
        })}
      </div>

      {/* Prompt box */}
      {activeStep >= Math.floor(steps.length * 0.6) && slide.example_prompt && (
        <div style={{
          padding: '16px 20px',
          border: `1px dashed ${DIM}`, borderRadius: 2,
          opacity: clamp((frame - activeStep * framesPerStep) / 20, 0, 1),
        }}>
          <p style={{ fontFamily: MONO, fontSize: 16, color: YELLOW, margin: 0, lineHeight: 1.6 }}>
            &gt; {slide.example_prompt}
          </p>
        </div>
      )}
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
        <h2 style={{ fontFamily: SERIF, fontSize: 54, fontWeight: 700, color: CHALK, margin: '0 0 12px' }}>{slide.heading}</h2>
        <svg width={120} height={4}><line x1={0} y1={2} x2={120} y2={2} stroke={GREEN} strokeWidth={2.5} /></svg>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1 }}>
        {bullets.map((bullet, i) => {
          const p = ease(clamp((frame - (22 + i * 14)) / 20, 0, 1));
          const isBefore = i < 2;
          return (
            <div key={i} style={{
              padding: '22px 24px', border: `1px dashed ${isBefore ? PINK + '55' : GREEN + '55'}`,
              opacity: p, transform: `translateY(${interpolate(p,[0,1],[14,0])}px)`,
            }}>
              <div style={{ fontFamily: MONO, fontSize: 13, color: isBefore ? PINK : GREEN, letterSpacing: '0.2em', marginBottom: 12 }}>
                {isBefore ? `✗ BEFORE` : `✓ AFTER`}
              </div>
              <p style={{ fontFamily: SERIF, fontSize: 22, color: CHALK, margin: 0, lineHeight: 1.5 }}>{bullet}</p>
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
  const headP = ease(clamp((frame - 0) / 22, 0, 1));
  const bodyP = ease(clamp((frame - 18) / 22, 0, 1));
  const CIRCUM = 2 * Math.PI * 56;
  const timerP = remaining / timer;

  return (
    <AbsoluteFill style={{ padding: '80px 120px', display: 'flex', gap: 72, alignItems: 'center' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ opacity: headP }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 700, color: CHALK, margin: '0 0 16px' }}>{slide.heading}</h2>
          <svg width={120} height={4}><line x1={0} y1={2} x2={120} y2={2} stroke={YELLOW} strokeWidth={2.5} /></svg>
        </div>
        <p style={{ fontFamily: SERIF, fontSize: 26, color: DIM, margin: 0, lineHeight: 1.65, opacity: bodyP, fontStyle: 'italic' }}>
          {slide.task}
        </p>
        {slide.example_prompt && (
          <div style={{ border: `1px dashed ${DIM}`, padding: '14px 18px', opacity: clamp((frame - 36) / 18, 0, 1) }}>
            <p style={{ fontFamily: MONO, fontSize: 15, color: YELLOW, margin: 0, lineHeight: 1.6 }}>&gt; {slide.example_prompt}</p>
          </div>
        )}
      </div>
      {/* Timer circle */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <svg width={150} height={150}>
          <circle cx={75} cy={75} r={56} fill="none" stroke={FAINT} strokeWidth={3} />
          <circle cx={75} cy={75} r={56} fill="none" stroke={YELLOW} strokeWidth={3}
            strokeDasharray={CIRCUM} strokeDashoffset={CIRCUM * (1 - timerP)}
            strokeLinecap="round" transform="rotate(-90 75 75)"
          />
          <text x={75} y={72} fontFamily={MONO} fontSize={24} fill={CHALK} textAnchor="middle" fontWeight="700">
            {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
          </text>
          <text x={75} y={90} fontFamily={MONO} fontSize={11} fill={DIM} textAnchor="middle" letterSpacing="2">MINUTES</text>
        </svg>
        <span style={{ fontFamily: MONO, fontSize: 12, color: DIM, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          YOUR TURN
        </span>
      </div>
    </AbsoluteFill>
  );
}

// ── Summary Slide ──────────────────────────────────────────────────────────

function SummarySlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const bullets = slide.bullets ?? [];
  const headP = ease(clamp((frame - 0) / 22, 0, 1));

  return (
    <AbsoluteFill style={{ padding: '80px 120px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ opacity: headP }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 58, fontWeight: 700, color: CHALK, margin: '0 0 16px' }}>{slide.heading}</h2>
        <svg width={200} height={3}><line x1={0} y1={1.5} x2={200} y2={1.5} stroke={GREEN} strokeWidth={2.5} /></svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
        {bullets.map((bullet, i) => {
          const p = ease(clamp((frame - (22 + i * 16)) / 22, 0, 1));
          return (
            <div key={i} style={{
              display: 'flex', gap: 20, alignItems: 'flex-start',
              opacity: p, transform: `translateX(${interpolate(p,[0,1],[18,0])}px)`,
            }}>
              <span style={{ fontFamily: SERIF, fontSize: 26, color: GREEN, flexShrink: 0 }}>✓</span>
              <p style={{ fontFamily: SERIF, fontSize: 26, color: CHALK, margin: 0, lineHeight: 1.5 }}>{bullet}</p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ── Worked Example — chalk equation steps ─────────────────────────────────

function WorkedExampleSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const steps = slide.math_steps ?? [];
  const framesPerStep = Math.max(1, slide.duration_frames / Math.max(steps.length, 1));
  const activeStep = Math.min(steps.length - 1, Math.floor(frame / framesPerStep));
  const headP = ease(clamp((frame - 0) / 20, 0, 1));

  return (
    <AbsoluteFill style={{ padding: '64px 120px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ opacity: headP }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 46, fontWeight: 700, color: CHALK, margin: '0 0 12px' }}>{slide.heading}</h2>
        <svg width={140} height={3}><line x1={0} y1={1.5} x2={140} y2={1.5} stroke={YELLOW} strokeWidth={2.5} /></svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, justifyContent: 'center' }}>
        {steps.map((step, i) => {
          const p = ease(clamp((frame - i * framesPerStep) / 18, 0, 1));
          if (p <= 0) return null;
          const isActive = i === activeStep;
          const isDone   = i < activeStep;
          return (
            <div key={i} style={{
              display: 'flex', gap: 28, alignItems: 'center',
              padding: '14px 0',
              borderBottom: `1px solid ${FAINT}`,
              opacity: ease(p),
            }}>
              <span style={{ fontFamily: MONO, fontSize: 14, color: DIM, width: 24, flexShrink: 0 }}>{i + 1}.</span>
              <span style={{
                fontFamily: SERIF, fontStyle: 'italic',
                fontSize: isActive ? 46 : 34,
                color: isDone ? GREEN : isActive ? YELLOW : DIM,
                fontWeight: isActive ? 700 : 400,
                flex: 1, lineHeight: 1.3,
              }}>
                {step.expression}
              </span>
              {step.annotation && (
                <span style={{ fontFamily: MONO, fontSize: 14, color: DIM, fontStyle: 'italic', maxWidth: 280, lineHeight: 1.4 }}>
                  ← {step.annotation}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

export const ChalkboardTheme: ThemeComponents = {
  SlideBackground:    ChalkboardBackground,
  TitleSlide, HookSlide, ContentSlide, WalkthroughSlide,
  ExampleSlide, PracticeSlide, SummarySlide, WorkedExampleSlide,
  CaptionBar, LessonIntro,
};
