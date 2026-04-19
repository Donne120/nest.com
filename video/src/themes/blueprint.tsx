import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Audio, staticFile } from 'remotion';
import type { ThemeComponents, SlideData, Caption } from './types';

// ── Blueprint design tokens ────────────────────────────────────────────────
const BG       = '#010d1c';
const CYAN     = '#00b4d8';
const CYAN_LT  = '#90e0ef';
const CYAN_DIM = 'rgba(0,180,216,0.38)';
const ORANGE   = '#ff6b35';
const TEXT     = '#caf0f8';
const TEXT_DIM = '#4a7c8c';
const GREEN_OK = '#06d6a0';
const RED_WARN = '#ef476f';
const MONO     = '"Courier New", "Lucida Console", monospace';
const SANS     = '"Helvetica Neue", Arial, sans-serif';

// ── Shared helpers ─────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function easeOut(t: number) {
  return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
}

function useEnter(startFrame: number, durationFrames = 18) {
  const frame = useCurrentFrame();
  const t = easeOut(clamp((frame - startFrame) / durationFrames, 0, 1));
  return { t, opacity: t, y: interpolate(t, [0, 1], [28, 0]) };
}

// ── Blueprint grid background ──────────────────────────────────────────────

function BlueprintBackground() {
  const frame = useCurrentFrame();
  const scanX = interpolate(frame, [0, 50], [-40, 2000], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* Fine grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,180,216,0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,180,216,0.07) 1px, transparent 1px),
          linear-gradient(rgba(0,180,216,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,180,216,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
      }} />
      {/* Corner markers */}
      {[['12px','12px'], ['12px','auto'], ['auto','12px'], ['auto','auto']].map(([t,b], i) => (
        <div key={i} style={{
          position: 'absolute',
          top: t === 'auto' ? undefined : t, bottom: b === 'auto' ? undefined : b,
          left: i % 2 === 0 ? 12 : undefined, right: i % 2 === 1 ? 12 : undefined,
          width: 28, height: 28,
          borderTop: i < 2 ? `2px solid ${CYAN_DIM}` : 'none',
          borderBottom: i >= 2 ? `2px solid ${CYAN_DIM}` : 'none',
          borderLeft: i % 2 === 0 ? `2px solid ${CYAN_DIM}` : 'none',
          borderRight: i % 2 === 1 ? `2px solid ${CYAN_DIM}` : 'none',
        }} />
      ))}
      {/* Scan line on entry */}
      {frame < 55 && (
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: scanX, width: 2,
          background: `linear-gradient(to bottom, transparent, ${CYAN}, transparent)`,
          opacity: interpolate(frame, [40, 55], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          pointerEvents: 'none',
        }} />
      )}
      {/* System stamp */}
      <div style={{ position: 'absolute', top: 22, left: 50, fontFamily: MONO, fontSize: 11, color: CYAN_DIM, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
        NEST LEARNING SYSTEMS // BLUEPRINT v2
      </div>
      <div style={{ position: 'absolute', top: 22, right: 50, fontFamily: MONO, fontSize: 11, color: CYAN_DIM, letterSpacing: '0.18em' }}>
        SYSTEM: ACTIVE
      </div>
      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 36,
        borderTop: `1px solid ${CYAN_DIM}`,
        background: 'rgba(0,20,40,0.7)',
        display: 'flex', alignItems: 'center', paddingLeft: 50, gap: 40,
      }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT_DIM, letterSpacing: '0.2em' }}>NEST.EDU</span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT_DIM, letterSpacing: '0.15em' }}>MODULE IN PROGRESS</span>
      </div>
    </AbsoluteFill>
  );
}

// ── SVG draw-in helpers ────────────────────────────────────────────────────

function DrawRect({ x, y, w, h, progress, color = CYAN_DIM, strokeWidth = 1.5 }: {
  x: number; y: number; w: number; h: number; progress: number;
  color?: string; strokeWidth?: number;
}) {
  const perimeter = 2 * (w + h);
  const dash = perimeter;
  const offset = dash * (1 - clamp(progress, 0, 1));
  return (
    <rect x={x} y={y} width={w} height={h}
      fill="none" stroke={color} strokeWidth={strokeWidth}
      strokeDasharray={dash} strokeDashoffset={offset}
      strokeLinecap="square"
    />
  );
}

// ── Typewriter text ────────────────────────────────────────────────────────

function Typewriter({ text, startFrame, charsPerFrame = 2.2, style = {} }: {
  text: string; startFrame: number; charsPerFrame?: number; style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const chars = Math.min(text.length, Math.floor(Math.max(0, frame - startFrame) * charsPerFrame));
  const showCursor = frame > startFrame && chars < text.length;
  return (
    <span style={style}>
      {text.slice(0, chars)}
      {showCursor && <span style={{ opacity: Math.floor((frame - startFrame) / 8) % 2 === 0 ? 1 : 0, color: CYAN }}>▌</span>}
    </span>
  );
}

// ── Tech badge ─────────────────────────────────────────────────────────────

function TechBadge({ label, color = CYAN, opacity = 1 }: { label: string; color?: string; opacity?: number }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      border: `1px solid ${color}`, borderRadius: 4,
      padding: '5px 14px', opacity,
      background: `rgba(0,180,216,0.07)`,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.25em', textTransform: 'uppercase', color }}>{label}</span>
    </div>
  );
}

// ── Progress indicator ─────────────────────────────────────────────────────

function StepCounter({ current, total }: { current: number; total: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      border: `1px solid ${CYAN_DIM}`, borderRadius: 4, padding: '6px 16px',
      background: 'rgba(0,20,40,0.6)', flexShrink: 0,
    }}>
      <span style={{ fontFamily: MONO, fontSize: 16, color: CYAN }}>
        {String(current + 1).padStart(2, '0')}
      </span>
      <span style={{ fontFamily: MONO, fontSize: 14, color: TEXT_DIM }}>/</span>
      <span style={{ fontFamily: MONO, fontSize: 14, color: TEXT_DIM }}>
        {String(total).padStart(2, '0')}
      </span>
    </div>
  );
}

// ── Caption bar — teletype terminal style ──────────────────────────────────

function CaptionBar({ captions, frame, fps }: { captions: Caption[]; frame: number; fps: number }) {
  const currentMs = (frame / fps) * 1000;

  let activeIdx = -1;
  for (let i = 0; i < captions.length; i++) {
    if (currentMs >= captions[i].start_ms) activeIdx = i;
    else break;
  }
  if (activeIdx === -1) return null;

  const BEFORE = 5;
  const AFTER  = 5;
  const winStart    = Math.max(0, activeIdx - BEFORE);
  const winEnd      = Math.min(captions.length, activeIdx + AFTER + 1);
  const win         = captions.slice(winStart, winEnd);
  const activeInWin = activeIdx - winStart;

  const blink = Math.floor(frame / 8) % 2 === 0;

  return (
    <div style={{
      position: 'absolute', bottom: 36, left: 0, right: 0,
      display: 'flex', justifyContent: 'center',
      zIndex: 200, pointerEvents: 'none',
    }}>
      <div style={{
        background: 'rgba(1,13,28,0.88)',
        border: `1px solid ${CYAN_DIM}`,
        borderRadius: 3,
        padding: '8px 24px 8px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        maxWidth: '86%',
      }}>
        <span style={{ fontFamily: MONO, fontSize: 13, color: CYAN_DIM, letterSpacing: '0.15em', flexShrink: 0 }}>
          ▶ NARR
        </span>
        <div style={{ width: 1, height: 20, background: CYAN_DIM }} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'nowrap' }}>
          {win.map((cap, i) => {
            const isActive = i === activeInWin;
            const dist     = Math.abs(i - activeInWin);
            const wordAgeMs  = isActive ? Math.max(0, currentMs - cap.start_ms) : 0;
            const popT       = Math.min(1, wordAgeMs / 60);
            const popScale   = isActive ? interpolate(popT, [0, 1], [0.85, 1]) : 1;
            return (
              <span key={winStart + i} style={{
                fontFamily: MONO,
                fontSize: isActive ? 28 : dist === 1 ? 23 : 19,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? CYAN_LT : TEXT_DIM,
                opacity: isActive ? 1 : dist === 1 ? 0.55 : dist === 2 ? 0.3 : 0.15,
                transform: `scale(${popScale})`,
                transformOrigin: 'bottom center',
                display: 'inline-block',
                textShadow: isActive ? `0 0 20px ${CYAN}` : 'none',
                whiteSpace: 'nowrap',
                letterSpacing: isActive ? '0.04em' : '0.02em',
              }}>
                {cap.text}
              </span>
            );
          })}
        </div>
        <span style={{ fontFamily: MONO, fontSize: 13, color: CYAN, opacity: blink ? 1 : 0, marginLeft: 4 }}>█</span>
      </div>
    </div>
  );
}

// ── Lesson intro — system boot sequence ───────────────────────────────────

function LessonIntro({ moduleTitle, lessonTitle, lessonNumber }: {
  moduleTitle: string; lessonTitle: string; lessonNumber: number;
}) {
  const frame = useCurrentFrame();

  const bootLines = [
    'INITIALIZING LEARNING CORE...',
    'LOADING KNOWLEDGE BASE...',
    'CALIBRATING DELIVERY ENGINE...',
    'LESSON MODULE READY',
  ];

  const exitOp = interpolate(frame, [72, 88], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const barW   = interpolate(frame, [0, 55], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleOp = interpolate(frame, [55, 72], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: BG, opacity: exitOp }}>
      <BlueprintBackground />
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>

        {/* Boot log */}
        <div style={{ marginBottom: 52, display: 'flex', flexDirection: 'column', gap: 10, opacity: interpolate(frame, [52, 60], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
          {bootLines.map((line, i) => {
            const lineOp = interpolate(frame, [i * 10, i * 10 + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: lineOp }}>
                <span style={{ fontFamily: MONO, fontSize: 13, color: i < bootLines.length - 1 ? TEXT_DIM : GREEN_OK, letterSpacing: '0.18em' }}>
                  {i < bootLines.length - 1 ? '  ·' : '  ✓'} {line}
                </span>
              </div>
            );
          })}
        </div>

        {/* Loading bar */}
        <div style={{ width: 560, marginBottom: 48, opacity: interpolate(frame, [50, 60], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
          <div style={{ height: 2, background: 'rgba(0,180,216,0.15)', borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${barW}%`, background: `linear-gradient(90deg, ${CYAN}, ${CYAN_LT})` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT_DIM, letterSpacing: '0.15em' }}>LOADING</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: CYAN, letterSpacing: '0.1em' }}>{Math.round(barW)}%</span>
          </div>
        </div>

        {/* Lesson number + title reveal */}
        <div style={{ opacity: titleOp, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 120, height: 1, background: `linear-gradient(90deg, transparent, ${CYAN})` }} />
            <span style={{ fontFamily: MONO, fontSize: 13, color: CYAN_DIM, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
              LESSON {String(lessonNumber).padStart(2, '0')}
            </span>
            <div style={{ width: 120, height: 1, background: `linear-gradient(90deg, ${CYAN}, transparent)` }} />
          </div>
          <div style={{ fontFamily: MONO, fontSize: 38, fontWeight: 700, color: TEXT, textAlign: 'center', maxWidth: 900, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
            {lessonTitle}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 13, color: TEXT_DIM, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            {moduleTitle}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ── Title Slide — large technical reticle + typewriter ────────────────────

function TitleSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const RETICLE_R   = 295;
  const CIRCUM      = 2 * Math.PI * RETICLE_R;
  const reticleP    = clamp((frame - 0) / 48, 0, 1);
  const crosshairP  = clamp((frame - 30) / 22, 0, 1);
  const typeStart   = 46;
  const subOp       = clamp((frame - 100) / 16, 0, 1);
  const dotAngle    = (frame * 1.4 * Math.PI) / 180;
  const dotX        = 960 + Math.cos(dotAngle) * RETICLE_R;
  const dotY        = 540 + Math.sin(dotAngle) * RETICLE_R;

  const refNum = (Math.abs(slide.heading.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 9999).toString().padStart(4, '0');

  return (
    <AbsoluteFill>
      {/* SVG layer — reticle + crosshairs */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {/* Outer reticle draws itself */}
        <circle cx={960} cy={540} r={RETICLE_R}
          fill="none" stroke={CYAN_DIM} strokeWidth={1.5}
          strokeDasharray={CIRCUM} strokeDashoffset={CIRCUM * (1 - easeOut(reticleP))}
        />
        {/* Inner dashed circle */}
        <circle cx={960} cy={540} r={195}
          fill="none" stroke="rgba(0,180,216,0.12)" strokeWidth={1} strokeDasharray="6 14"
          opacity={reticleP}
        />
        {/* Crosshair H */}
        <line
          x1={960 - crosshairP * 290} y1={540}
          x2={960 + crosshairP * 290} y2={540}
          stroke={CYAN_DIM} strokeWidth={1}
        />
        {/* Crosshair V */}
        <line
          x1={960} y1={540 - crosshairP * 290}
          x2={960} y2={540 + crosshairP * 290}
          stroke={CYAN_DIM} strokeWidth={1}
        />
        {/* Tick marks on reticle at 0/90/180/270 */}
        {[0, 90, 180, 270].map(deg => {
          const r = (deg * Math.PI) / 180;
          const ox = 960 + Math.cos(r) * RETICLE_R;
          const oy = 540 + Math.sin(r) * RETICLE_R;
          const ix = 960 + Math.cos(r) * (RETICLE_R - 14);
          const iy = 540 + Math.sin(r) * (RETICLE_R - 14);
          return <line key={deg} x1={ox} y1={oy} x2={ix} y2={iy} stroke={CYAN} strokeWidth={2} opacity={crosshairP} />;
        })}
        {/* Orbiting dot */}
        <circle cx={dotX} cy={dotY} r={5} fill={CYAN} opacity={reticleP * 0.9}>
          <animate attributeName="opacity" values="0.9;1;0.9" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx={dotX} cy={dotY} r={12} fill={CYAN} opacity={reticleP * 0.18} />
        {/* Dimension bracket top */}
        <DrawRect x={760} y={320} w={400} h={2} progress={crosshairP} color="rgba(0,180,216,0.2)" />
        {/* REF label */}
        <text x={965} y={560 + RETICLE_R - 12} fontFamily={MONO} fontSize={11} fill={CYAN_DIM} textAnchor="middle" letterSpacing="3" opacity={subOp}>
          REF: NLS-{refNum}
        </text>
      </svg>

      {/* Text content — centered */}
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        {/* Classification */}
        <div style={{ fontFamily: MONO, fontSize: 12, color: CYAN_DIM, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 36, opacity: subOp }}>
          CLASSIFICATION: LEARNER MATERIAL
        </div>

        {/* Typewriter heading */}
        <h1 style={{
          fontFamily: MONO, fontSize: 72, fontWeight: 700, lineHeight: 1.1,
          letterSpacing: '-0.02em', color: TEXT,
          textAlign: 'center', margin: 0, maxWidth: 1100,
        }}>
          <Typewriter text={slide.heading} startFrame={typeStart} charsPerFrame={2.4} />
        </h1>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, margin: '36px 0',
          opacity: subOp,
        }}>
          <div style={{ width: 80, height: 1, background: `linear-gradient(90deg, transparent, ${CYAN})` }} />
          <div style={{ width: 8, height: 8, border: `1.5px solid ${CYAN}`, transform: 'rotate(45deg)' }} />
          <div style={{ width: 80, height: 1, background: `linear-gradient(90deg, ${CYAN}, transparent)` }} />
        </div>

        {/* Subheading */}
        {slide.subheading && (
          <div style={{ fontFamily: MONO, fontSize: 20, color: TEXT_DIM, letterSpacing: '0.28em', textTransform: 'uppercase', opacity: subOp }}>
            {slide.subheading}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ── Hook Slide — deficiency report aesthetic ───────────────────────────────

function HookSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftP   = clamp((frame - 0) / 32, 0, 1);
  const badgeOp = clamp((frame - 28) / 14, 0, 1);
  const storyOp = clamp((frame - 38) / 16, 0, 1);
  const storyY  = interpolate(storyOp, [0, 1], [20, 0]);
  const rightP  = clamp((frame - 18) / 36, 0, 1);
  const storyText = slide.story ?? slide.subheading ?? '';

  return (
    <AbsoluteFill style={{ padding: '72px 80px 72px', display: 'flex', gap: 60, alignItems: 'stretch' }}>

      {/* Left panel — deficiency report */}
      <div style={{ flex: '0 0 54%', display: 'flex', flexDirection: 'column', gap: 28, position: 'relative' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          <DrawRect x={0} y={0} w={980} h={860} progress={easeOut(leftP)} color={`rgba(239,71,111,0.45)`} strokeWidth={1.5} />
        </svg>

        <div style={{ padding: '28px 32px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Warning badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: badgeOp }}>
            <div style={{ width: 10, height: 10, background: RED_WARN, borderRadius: 2 }} />
            <span style={{ fontFamily: MONO, fontSize: 13, color: RED_WARN, letterSpacing: '0.28em', textTransform: 'uppercase' }}>
              DEFICIENCY DETECTED
            </span>
          </div>

          {/* Heading */}
          <h2 style={{
            fontFamily: MONO, fontSize: 46, fontWeight: 700, lineHeight: 1.2,
            color: TEXT, margin: 0,
            opacity: storyOp, transform: `translateY(${storyY}px)`,
          }}>
            {slide.heading}
          </h2>

          {/* Horizontal rule */}
          <div style={{ height: 1, background: `linear-gradient(90deg, ${RED_WARN}55, transparent)`, opacity: storyOp }} />

          {/* Story */}
          <p style={{
            fontFamily: SANS, fontSize: 26, lineHeight: 1.65,
            color: 'rgba(202,240,248,0.82)', margin: 0, fontStyle: 'italic',
            opacity: storyOp, transform: `translateY(${storyY * 0.5}px)`,
          }}>
            {storyText}
          </p>

          {/* Cost indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: storyOp }}>
            <div style={{ width: 3, height: 36, background: RED_WARN, borderRadius: 2 }} />
            <span style={{ fontFamily: MONO, fontSize: 14, color: RED_WARN, letterSpacing: '0.15em' }}>
              IMPACT: HIGH // RESOLUTION: PENDING
            </span>
          </div>
        </div>
      </div>

      {/* Right panel — solution schematic */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20, opacity: easeOut(rightP) }}>
        <svg style={{ width: '100%', height: 420, overflow: 'visible' }}>
          {/* Schematic of before→after */}
          <DrawRect x={10} y={10} w={640} h={400} progress={easeOut(rightP)} color={CYAN_DIM} strokeWidth={1} />
          {/* Before label */}
          <text x={30} y={48} fontFamily={MONO} fontSize={13} fill={RED_WARN} letterSpacing="3" opacity={rightP}>BEFORE</text>
          <line x1={30} y1={56} x2={200} y2={56} stroke={RED_WARN} strokeWidth={1} opacity={rightP * 0.5} strokeDasharray="4 6" />
          {/* Problem diagram — crossed box */}
          <rect x={30} y={72} width={180} height={110} rx={4}
            fill="rgba(239,71,111,0.07)" stroke="rgba(239,71,111,0.35)" strokeWidth={1}
            opacity={rightP}
          />
          <line x1={30} y1={72} x2={210} y2={182} stroke="rgba(239,71,111,0.3)" strokeWidth={1} strokeDasharray="4 4" opacity={rightP} />
          <line x1={210} y1={72} x2={30} y2={182} stroke="rgba(239,71,111,0.3)" strokeWidth={1} strokeDasharray="4 4" opacity={rightP} />
          {/* Arrow pointing right to solution */}
          <line x1={230} y1={127} x2={310} y2={127} stroke={CYAN} strokeWidth={2} opacity={rightP} />
          <polygon points="310,121 322,127 310,133" fill={CYAN} opacity={rightP} />
          {/* Solution box */}
          <rect x={330} y={72} width={180} height={110} rx={4}
            fill="rgba(6,214,160,0.07)" stroke="rgba(6,214,160,0.45)" strokeWidth={1.5}
            opacity={rightP}
          />
          <text x={420} y={134} fontFamily={MONO} fontSize={24} fill={GREEN_OK} textAnchor="middle" fontWeight="700" opacity={rightP}>✓</text>
          {/* After label */}
          <text x={330} y={48} fontFamily={MONO} fontSize={13} fill={GREEN_OK} letterSpacing="3" opacity={rightP}>AFTER</text>

          {/* Dimension lines */}
          <line x1={30} y1={220} x2={510} y2={220} stroke={CYAN_DIM} strokeWidth={1} strokeDasharray="3 6" opacity={rightP * 0.5} />
          <text x={270} y={242} fontFamily={MONO} fontSize={11} fill={TEXT_DIM} textAnchor="middle" letterSpacing="2" opacity={rightP}>TRANSFORMATION PATHWAY</text>

          {/* Steps below */}
          {['Identify the gap', 'Apply the method', 'See the result'].map((s, i) => (
            <g key={i} opacity={clamp((rightP * 3) - i, 0, 1)}>
              <circle cx={42} cy={290 + i * 38} r={9} fill="none" stroke={CYAN} strokeWidth={1.5} />
              <text x={42} y={295 + i * 38} fontFamily={MONO} fontSize={11} fill={CYAN} textAnchor="middle">{i + 1}</text>
              <text x={62} y={295 + i * 38} fontFamily={MONO} fontSize={14} fill={TEXT_DIM} letterSpacing="1">{s}</text>
            </g>
          ))}
        </svg>
      </div>
    </AbsoluteFill>
  );
}

// ── Content Slide — technical specifications panel ────────────────────────

function ContentSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const bullets = slide.bullets ?? [];
  const headerP  = clamp((frame - 0) / 28, 0, 1);
  const panelP   = clamp((frame - 14) / 32, 0, 1);

  return (
    <AbsoluteFill style={{ padding: '72px 80px', display: 'flex', gap: 64, alignItems: 'flex-start' }}>

      {/* Left — spec list */}
      <div style={{ flex: '0 0 52%', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Header */}
        <div style={{ marginBottom: 36, opacity: easeOut(headerP), transform: `translateY(${interpolate(headerP, [0,1],[20,0])}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: CYAN_DIM, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 14 }}>
            TECHNICAL SPECIFICATIONS
          </div>
          <h2 style={{ fontFamily: MONO, fontSize: 52, fontWeight: 700, color: TEXT, margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {slide.heading}
          </h2>
          <div style={{ height: 2, width: 120, background: `linear-gradient(90deg, ${CYAN}, transparent)`, marginTop: 20 }} />
        </div>

        {/* Spec items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {bullets.map((bullet, i) => {
            const itemP = clamp((frame - (28 + i * 16)) / 20, 0, 1);
            return (
              <div key={i} style={{ opacity: easeOut(itemP), transform: `translateY(${interpolate(itemP, [0,1],[14,0])}px)` }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 20,
                  padding: '18px 20px',
                  borderBottom: `1px solid rgba(0,180,216,0.1)`,
                  background: i % 2 === 0 ? 'rgba(0,180,216,0.025)' : 'transparent',
                }}>
                  {/* Index */}
                  <span style={{ fontFamily: MONO, fontSize: 13, color: CYAN_DIM, flexShrink: 0, marginTop: 3, letterSpacing: '0.1em' }}>
                    {String(i + 1).padStart(2, '0')}.
                  </span>
                  {/* Bullet text */}
                  <span style={{ fontFamily: SANS, fontSize: 24, color: TEXT, lineHeight: 1.45, fontWeight: 400 }}>
                    {bullet}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right — technical diagram */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: easeOut(panelP) }}>
        <svg width={520} height={520} style={{ overflow: 'visible' }}>
          <DrawRect x={10} y={10} w={500} h={500} progress={easeOut(panelP)} color={CYAN_DIM} strokeWidth={1} />
          {/* Grid inside */}
          {[1,2,3,4].map(i => (
            <line key={`h${i}`} x1={10} y1={10 + i * 100} x2={510} y2={10 + i * 100}
              stroke="rgba(0,180,216,0.06)" strokeWidth={1} />
          ))}
          {[1,2,3,4].map(i => (
            <line key={`v${i}`} x1={10 + i * 100} y1={10} x2={10 + i * 100} y2={510}
              stroke="rgba(0,180,216,0.06)" strokeWidth={1} />
          ))}

          {/* Central node */}
          <circle cx={260} cy={260} r={52} fill="rgba(0,180,216,0.07)" stroke={CYAN} strokeWidth={1.5} opacity={panelP} />
          <circle cx={260} cy={260} r={30} fill="rgba(0,180,216,0.12)" stroke={CYAN_DIM} strokeWidth={1} opacity={panelP} />

          {/* Satellite nodes for each bullet */}
          {bullets.map((bullet, i) => {
            const angle = (i / Math.max(bullets.length, 1)) * Math.PI * 2 - Math.PI / 2;
            const nx = 260 + Math.cos(angle) * 148;
            const ny = 260 + Math.sin(angle) * 148;
            const delay = (frame - 40 - i * 12) / 20;
            const nodeP = clamp(delay, 0, 1);
            return (
              <g key={i} opacity={easeOut(nodeP)}>
                <line x1={260 + Math.cos(angle) * 52} y1={260 + Math.sin(angle) * 52} x2={nx - Math.cos(angle) * 22} y2={ny - Math.sin(angle) * 22}
                  stroke={CYAN_DIM} strokeWidth={1} strokeDasharray="4 6" />
                <circle cx={nx} cy={ny} r={22} fill="rgba(0,180,216,0.09)" stroke={CYAN} strokeWidth={1.5} />
                <text x={nx} y={ny + 5} fontFamily={MONO} fontSize={13} fill={CYAN} textAnchor="middle" fontWeight="700">{i + 1}</text>
              </g>
            );
          })}

          <text x={260} y={265} fontFamily={MONO} fontSize={14} fill={CYAN_LT} textAnchor="middle" letterSpacing="2" opacity={panelP}>CORE</text>

          {/* Corner labels */}
          <text x={22} y={26} fontFamily={MONO} fontSize={10} fill={TEXT_DIM} letterSpacing="1" opacity={panelP}>0,0</text>
          <text x={490} y={26} fontFamily={MONO} fontSize={10} fill={TEXT_DIM} textAnchor="end" letterSpacing="1" opacity={panelP}>1,0</text>
        </svg>
      </div>
    </AbsoluteFill>
  );
}

// ── Walkthrough Slide — assembly sequence ─────────────────────────────────

function WalkthroughSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const steps = slide.steps ?? slide.bullets ?? [];
  const HEADING_FRAMES = 22;
  const usable = Math.max(1, slide.duration_frames - HEADING_FRAMES);
  const framesPerStep = Math.max(1, usable / Math.max(steps.length, 1));
  const activeStep = Math.min(steps.length - 1, Math.floor(Math.max(0, frame - HEADING_FRAMES) / framesPerStep));

  const headerP = clamp((frame - 0) / 22, 0, 1);
  const glowP   = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.4, 1]);

  const showPrompt   = activeStep >= Math.floor(steps.length * 0.6) && !!slide.example_prompt;
  const showResponse = activeStep >= Math.floor(steps.length * 0.8) && !!slide.ai_response;
  const promptText   = slide.example_prompt ?? '';
  const responseText = slide.ai_response ?? '';
  const promptChars  = showPrompt ? Math.min(promptText.length, Math.floor(interpolate(frame, [activeStep * framesPerStep, (activeStep + 1) * framesPerStep * 0.85], [0, promptText.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))) : 0;
  const responseChars = showResponse ? Math.min(responseText.length, Math.floor(interpolate(frame, [activeStep * framesPerStep + 8, (activeStep + 1.4) * framesPerStep], [0, responseText.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))) : 0;

  return (
    <AbsoluteFill style={{ padding: '60px 72px 60px', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, opacity: easeOut(headerP) }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: CYAN_DIM, letterSpacing: '0.3em', marginBottom: 10, textTransform: 'uppercase' }}>
            ASSEMBLY SEQUENCE
          </div>
          <h2 style={{ fontFamily: MONO, fontSize: 44, fontWeight: 700, color: TEXT, margin: 0, letterSpacing: '-0.01em' }}>
            {slide.heading}
          </h2>
        </div>
        <StepCounter current={activeStep} total={steps.length} />
      </div>

      {/* Progress track */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 32, opacity: easeOut(headerP) }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < activeStep ? GREEN_OK : i === activeStep ? CYAN : 'rgba(0,180,216,0.12)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {/* Main content — steps left, terminal right */}
      <div style={{ display: 'flex', gap: 48, flex: 1 }}>

        {/* Steps list */}
        <div style={{ flex: '0 0 44%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {steps.map((step, i) => {
            const isDone   = i < activeStep;
            const isActive = i === activeStep;
            const entryP   = clamp((frame - (HEADING_FRAMES + i * framesPerStep * 0.15)) / 16, 0, 1);
            const cardOp   = i > activeStep + 1 ? 0.18 : easeOut(entryP);
            const glowStyle = isActive ? `0 0 28px rgba(0,180,216,${glowP * 0.5})` : 'none';

            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 16,
                padding: isActive ? '16px 18px' : '10px 18px',
                border: `1px solid ${isDone ? 'rgba(6,214,160,0.35)' : isActive ? CYAN : 'rgba(0,180,216,0.1)'}`,
                borderRadius: 6,
                background: isActive ? 'rgba(0,180,216,0.09)' : isDone ? 'rgba(6,214,160,0.04)' : 'transparent',
                boxShadow: glowStyle,
                opacity: cardOp,
              }}>
                <div style={{
                  width: isActive ? 36 : 28, height: isActive ? 36 : 28,
                  borderRadius: '50%', flexShrink: 0,
                  background: isDone ? GREEN_OK : isActive ? CYAN : 'transparent',
                  border: `1.5px solid ${isDone ? GREEN_OK : isActive ? CYAN : CYAN_DIM}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: MONO, fontSize: isActive ? 16 : 13, fontWeight: 700, color: isDone || isActive ? BG : CYAN_DIM }}>
                    {isDone ? '✓' : i + 1}
                  </span>
                </div>
                <p style={{
                  fontFamily: isActive ? SANS : MONO,
                  fontSize: isActive ? 22 : 15,
                  fontWeight: isActive ? 700 : 400,
                  color: isDone ? GREEN_OK : isActive ? TEXT : TEXT_DIM,
                  margin: 0, lineHeight: 1.4, letterSpacing: isActive ? '-0.01em' : '0',
                }}>
                  {step}
                </p>
              </div>
            );
          })}
        </div>

        {/* Terminal panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            flex: 1, background: 'rgba(0,8,18,0.85)', border: `1px solid ${CYAN_DIM}`,
            borderRadius: 6, padding: '18px 22px', fontFamily: MONO, fontSize: 15, color: TEXT,
            display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden',
          }}>
            {/* Terminal header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: `1px solid rgba(0,180,216,0.12)`, marginBottom: 6 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: RED_WARN }} />
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: ORANGE }} />
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: GREEN_OK }} />
              <span style={{ marginLeft: 12, fontSize: 12, color: TEXT_DIM, letterSpacing: '0.15em' }}>NEST TERMINAL</span>
            </div>

            {/* Current step instruction */}
            <div style={{ color: CYAN, fontSize: 13, letterSpacing: '0.1em' }}>
              {'> '}<span style={{ color: TEXT_DIM }}>EXECUTING STEP {activeStep + 1}:</span>
            </div>
            <div style={{ color: TEXT, fontSize: 17, lineHeight: 1.5, paddingLeft: 14 }}>
              {steps[activeStep]}
            </div>

            {showPrompt && (
              <>
                <div style={{ color: CYAN_DIM, fontSize: 13, marginTop: 8 }}>{'> INPUT:'}</div>
                <div style={{
                  background: 'rgba(0,180,216,0.06)', border: `1px solid ${CYAN_DIM}`,
                  borderRadius: 4, padding: '10px 14px', fontSize: 15, color: CYAN_LT, lineHeight: 1.5,
                }}>
                  {promptText.slice(0, promptChars)}
                  <span style={{ opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0, color: CYAN }}>▌</span>
                </div>
              </>
            )}
            {showResponse && responseChars > 0 && (
              <>
                <div style={{ color: GREEN_OK, fontSize: 13, marginTop: 4 }}>{'> OUTPUT:'}</div>
                <div style={{
                  background: 'rgba(6,214,160,0.05)', border: `1px solid rgba(6,214,160,0.25)`,
                  borderRadius: 4, padding: '10px 14px', fontSize: 14, color: 'rgba(202,240,248,0.85)', lineHeight: 1.55,
                }}>
                  {responseText.slice(0, responseChars)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Example Slide — result analysis panel ─────────────────────────────────

function ExampleSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const bullets = slide.bullets ?? [];
  const headerP = clamp((frame - 0) / 24, 0, 1);

  return (
    <AbsoluteFill style={{ padding: '72px 80px', display: 'flex', flexDirection: 'column', gap: 40 }}>
      <div style={{ opacity: easeOut(headerP), transform: `translateY(${interpolate(headerP,[0,1],[18,0])}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: GREEN_OK, letterSpacing: '0.3em', marginBottom: 14, textTransform: 'uppercase' }}>
          RESULT ANALYSIS // STATUS: VERIFIED
        </div>
        <h2 style={{ fontFamily: MONO, fontSize: 52, fontWeight: 700, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>
          {slide.heading}
        </h2>
        <div style={{ height: 2, width: 100, background: `linear-gradient(90deg, ${GREEN_OK}, transparent)`, marginTop: 18 }} />
      </div>

      {/* Before/After comparison grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, flex: 1 }}>
        {bullets.map((bullet, i) => {
          const itemP = clamp((frame - (24 + i * 14)) / 22, 0, 1);
          const isBefore = i < 2;
          const color    = isBefore ? RED_WARN : GREEN_OK;
          const label    = isBefore ? `BEFORE ${i + 1}` : `AFTER ${i - 1}`;
          return (
            <div key={i} style={{
              border: `1px solid ${isBefore ? 'rgba(239,71,111,0.35)' : 'rgba(6,214,160,0.4)'}`,
              borderRadius: 8, padding: '24px 26px',
              background: isBefore ? 'rgba(239,71,111,0.04)' : 'rgba(6,214,160,0.05)',
              opacity: easeOut(itemP), transform: `translateY(${interpolate(itemP,[0,1],[16,0])}px)`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color, letterSpacing: '0.25em', marginBottom: 14, textTransform: 'uppercase' }}>
                {isBefore ? '✗' : '✓'} {label}
              </div>
              <p style={{ fontFamily: SANS, fontSize: 22, color: TEXT, margin: 0, lineHeight: 1.5 }}>{bullet}</p>
              {/* Corner accent */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40,
                borderLeft: `1px solid ${color}33`, borderBottom: `1px solid ${color}33` }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ── Practice Slide — mission briefing ─────────────────────────────────────

function PracticeSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timer   = slide.timer_seconds ?? 120;
  const elapsed = Math.min(timer, Math.floor(frame / fps));
  const remaining = timer - elapsed;
  const timerP  = remaining / timer;
  const headerP = clamp((frame - 0) / 24, 0, 1);
  const bodyP   = clamp((frame - 20) / 22, 0, 1);

  const CIRCUM  = 2 * Math.PI * 52;

  return (
    <AbsoluteFill style={{ padding: '72px 80px', display: 'flex', gap: 64, alignItems: 'flex-start' }}>

      {/* Left — mission brief */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ opacity: easeOut(headerP) }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: ORANGE, letterSpacing: '0.3em', marginBottom: 14, textTransform: 'uppercase' }}>
            MISSION BRIEFING // YOUR TURN
          </div>
          <h2 style={{ fontFamily: MONO, fontSize: 52, fontWeight: 700, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>
            {slide.heading}
          </h2>
          <div style={{ height: 2, width: 100, background: `linear-gradient(90deg, ${ORANGE}, transparent)`, marginTop: 18 }} />
        </div>

        <div style={{ opacity: easeOut(bodyP), transform: `translateY(${interpolate(bodyP,[0,1],[14,0])}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 12, color: CYAN_DIM, letterSpacing: '0.2em', marginBottom: 14 }}>
            OBJECTIVE:
          </div>
          <p style={{ fontFamily: SANS, fontSize: 26, color: TEXT, lineHeight: 1.6, margin: 0 }}>
            {slide.task}
          </p>
        </div>

        {slide.example_prompt && (
          <div style={{ opacity: easeOut(clamp((frame - 36) / 20, 0, 1)) }}>
            <div style={{ fontFamily: MONO, fontSize: 12, color: CYAN_DIM, letterSpacing: '0.2em', marginBottom: 10 }}>
              SUGGESTED INPUT:
            </div>
            <div style={{
              background: 'rgba(0,8,18,0.85)', border: `1px solid ${CYAN_DIM}`,
              borderRadius: 6, padding: '16px 20px',
              fontFamily: MONO, fontSize: 15, color: CYAN_LT, lineHeight: 1.6,
            }}>
              {slide.example_prompt}
            </div>
          </div>
        )}
      </div>

      {/* Right — countdown timer */}
      <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <svg width={140} height={140}>
          {/* Track */}
          <circle cx={70} cy={70} r={52} fill="none" stroke="rgba(0,180,216,0.1)" strokeWidth={6} />
          {/* Progress arc */}
          <circle cx={70} cy={70} r={52}
            fill="none" stroke={timerP > 0.3 ? CYAN : ORANGE} strokeWidth={6}
            strokeDasharray={CIRCUM} strokeDashoffset={CIRCUM * (1 - timerP)}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
          />
          {/* Timer text */}
          <text x={70} y={67} fontFamily={MONO} fontSize={26} fill={TEXT} textAnchor="middle" fontWeight="700">
            {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
          </text>
          <text x={70} y={86} fontFamily={MONO} fontSize={11} fill={TEXT_DIM} textAnchor="middle" letterSpacing="2">
            REMAINING
          </text>
        </svg>
        <TechBadge label="MISSION ACTIVE" color={ORANGE} />
        <div style={{ fontFamily: MONO, fontSize: 12, color: TEXT_DIM, textAlign: 'center', lineHeight: 1.6, letterSpacing: '0.1em' }}>
          PAUSE VIDEO<br />COMPLETE TASK<br />RETURN TO CONTINUE
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Summary Slide — debrief readout ───────────────────────────────────────

function SummarySlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const bullets = slide.bullets ?? [];
  const headerP = clamp((frame - 0) / 24, 0, 1);

  return (
    <AbsoluteFill style={{ padding: '72px 80px', display: 'flex', flexDirection: 'column', gap: 36 }}>
      <div style={{ opacity: easeOut(headerP) }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: GREEN_OK, letterSpacing: '0.3em', marginBottom: 14, textTransform: 'uppercase' }}>
          DEBRIEF // MISSION COMPLETE
        </div>
        <h2 style={{ fontFamily: MONO, fontSize: 52, fontWeight: 700, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>
          {slide.heading}
        </h2>
      </div>

      <div style={{ height: 1, background: `linear-gradient(90deg, ${GREEN_OK}66, transparent)`, opacity: easeOut(headerP) }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        {bullets.map((bullet, i) => {
          const itemP = clamp((frame - (24 + i * 16)) / 22, 0, 1);
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 20,
              padding: '16px 20px',
              border: `1px solid rgba(6,214,160,0.2)`,
              borderRadius: 6,
              background: 'rgba(6,214,160,0.03)',
              opacity: easeOut(itemP), transform: `translateY(${interpolate(itemP,[0,1],[12,0])}px)`,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: GREEN_OK, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: MONO, fontSize: 14, color: BG, fontWeight: 700 }}>✓</span>
              </div>
              <p style={{ fontFamily: SANS, fontSize: 24, color: TEXT, margin: 0, lineHeight: 1.5 }}>{bullet}</p>
            </div>
          );
        })}
      </div>

      {/* Footer stamp */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: easeOut(clamp((frame - 48) / 18, 0, 1)) }}>
        <div style={{ flex: 1, height: 1, background: `rgba(0,180,216,0.15)` }} />
        <span style={{ fontFamily: MONO, fontSize: 12, color: TEXT_DIM, letterSpacing: '0.25em' }}>
          LESSON ARCHIVED // PROCEED TO NEXT MODULE
        </span>
        <div style={{ flex: 1, height: 1, background: `rgba(0,180,216,0.15)` }} />
      </div>
    </AbsoluteFill>
  );
}

// ── Worked Example Slide — calculation worksheet ──────────────────────────

function WorkedExampleSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const steps = slide.math_steps ?? [];
  const framesPerStep = Math.max(1, slide.duration_frames / Math.max(steps.length, 1));
  const activeStep    = Math.min(steps.length - 1, Math.floor(frame / framesPerStep));
  const headerP       = clamp((frame - 0) / 20, 0, 1);

  return (
    <AbsoluteFill style={{ padding: '60px 80px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ opacity: easeOut(headerP) }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: CYAN_DIM, letterSpacing: '0.3em', marginBottom: 10, textTransform: 'uppercase' }}>
          CALCULATION WORKSHEET
        </div>
        <h2 style={{ fontFamily: MONO, fontSize: 44, fontWeight: 700, color: TEXT, margin: 0, letterSpacing: '-0.01em' }}>
          {slide.heading}
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {steps.map((step, i) => {
          const isDone   = i < activeStep;
          const isActive = i === activeStep;
          const stepP    = clamp((frame - i * framesPerStep) / 18, 0, 1);
          const shown    = stepP > 0;

          if (!shown) return null;
          return (
            <div key={i} style={{
              display: 'flex', gap: 24, alignItems: 'center',
              padding: '18px 24px',
              border: `1px solid ${isDone ? 'rgba(6,214,160,0.25)' : isActive ? CYAN : 'transparent'}`,
              borderRadius: 6,
              background: isActive ? 'rgba(0,180,216,0.08)' : isDone ? 'rgba(6,214,160,0.04)' : 'transparent',
              opacity: easeOut(stepP),
              boxShadow: step.highlight && isActive ? `0 0 32px rgba(0,180,216,0.35)` : 'none',
            }}>
              <span style={{ fontFamily: MONO, fontSize: 12, color: isDone ? GREEN_OK : isActive ? CYAN : TEXT_DIM, flexShrink: 0, letterSpacing: '0.1em' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{
                fontFamily: MONO,
                fontSize: isActive ? 36 : 28,
                color: isDone ? GREEN_OK : isActive ? CYAN_LT : TEXT_DIM,
                fontWeight: isActive ? 700 : 400,
                flex: 1,
              }}>
                {step.expression}
              </span>
              {step.annotation && (
                <span style={{ fontFamily: MONO, fontSize: 13, color: TEXT_DIM, letterSpacing: '0.1em', opacity: 0.7 }}>
                  // {step.annotation}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ── Export theme ───────────────────────────────────────────────────────────

export const BlueprintTheme: ThemeComponents = {
  SlideBackground:    BlueprintBackground,
  TitleSlide,
  HookSlide,
  ContentSlide,
  WalkthroughSlide,
  ExampleSlide,
  PracticeSlide,
  SummarySlide,
  WorkedExampleSlide,
  CaptionBar,
  LessonIntro,
};
