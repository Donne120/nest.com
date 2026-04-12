import React from 'react';
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { GOLD, GOLD2, INK, INK2, INK3, BG, CARD, RULE } from './NestUI';

export interface TutorialStep {
  title: string;        // e.g. "Step 1 — Click New Module"
  instruction: string;  // shown bottom-left as annotation
  durationInFrames: number;
  render: (stepFrame: number, stepTotal: number) => React.ReactNode;
}

interface Props {
  moduleNumber: number;   // 1-12
  moduleTitle: string;
  lessonTag: string;      // "Lesson 02 · Organisation Setup"
  nextLesson?: string;
  steps: TutorialStep[];
  /** Path relative to /public, e.g. "audio/T01_Welcome.mp3" */
  audioSrc?: string;
}

export const TutorialTemplate: React.FC<Props> = ({
  moduleNumber, moduleTitle, lessonTag, nextLesson, steps, audioSrc,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Calculate total duration from steps ──────────────────────────────────
  const TITLE_DURATION = 75;
  const OUTRO_DURATION = 80;
  const STEP_GAP       = 20; // transition frames between steps

  // Figure out which step we're in
  const stepsWithOffsets = steps.reduce<{ start: number; end: number; step: TutorialStep }[]>(
    (acc, step, i) => {
      const prev = acc[i - 1];
      const start = (prev?.end ?? TITLE_DURATION) + (i > 0 ? STEP_GAP : 0);
      acc.push({ start, end: start + step.durationInFrames, step });
      return acc;
    }, []
  );
  const totalDuration = (stepsWithOffsets[stepsWithOffsets.length - 1]?.end ?? TITLE_DURATION) + OUTRO_DURATION;

  // Active step
  const activeIdx = stepsWithOffsets.findIndex(s => frame >= s.start && frame < s.end);
  const active = activeIdx >= 0 ? stepsWithOffsets[activeIdx] : null;
  const stepFrame = active ? frame - active.start : 0;

  // ── Global fade ───────────────────────────────────────────────────────────
  const sceneOp = interpolate(
    frame, [0, 18, totalDuration - 20, totalDuration],
    [0, 1, 1, 0], { extrapolateRight: 'clamp' }
  );

  // ── Title card ────────────────────────────────────────────────────────────
  const titleOp = interpolate(frame, [0, 20, 60, 75], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  const tagY    = interpolate(frame, [10, 35], [16, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headY   = interpolate(frame, [22, 48], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subOp   = interpolate(frame, [38, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // ── Step content ─────────────────────────────────────────────────────────
  const contentOp = interpolate(frame, [TITLE_DURATION, TITLE_DURATION + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Step transition
  const stepIn = active
    ? interpolate(stepFrame, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;

  // ── Outro ─────────────────────────────────────────────────────────────────
  const outroStart = stepsWithOffsets[stepsWithOffsets.length - 1]?.end ?? TITLE_DURATION;
  const outroOp = interpolate(frame, [outroStart, outroStart + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outroScale = spring({ frame: frame - outroStart, fps, config: { damping: 12, stiffness: 160 }, from: 0.88, to: 1 });

  // Glow pulse
  const glow = 0.04 + 0.02 * Math.sin(frame * 0.05);

  const isTitleCard = frame < TITLE_DURATION;
  const isOutro     = frame >= outroStart;

  return (
    <AbsoluteFill style={{ background: BG, opacity: sceneOp }}>
      {/* Voiceover audio — plays from the start of the composition */}
      {audioSrc && (
        <Audio
          src={staticFile(audioSrc)}
          startFrom={0}
          volume={(f) =>
            interpolate(f, [0, 8, totalDuration - 15, totalDuration], [0, 1, 1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      )}

      {/* Ambient */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse 900px 500px at 50% 30%, rgba(200,169,110,${glow}) 0%, transparent 65%)`,
        pointerEvents: 'none',
      }} />

      {/* ── TITLE CARD ────────────────────────────────────────────────────── */}
      {isTitleCard && (
        <AbsoluteFill style={{ opacity: titleOp, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid rgba(200,169,110,0.45)`, background: 'rgba(200,169,110,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Georgia', fontSize: 22, fontWeight: 700, color: GOLD }}>N</span>
            </div>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontStyle: 'italic', fontWeight: 300, color: INK2 }}>Nest</span>
          </div>

          {/* Tag */}
          <div style={{ transform: `translateY(${tagY}px)`, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.26em', textTransform: 'uppercase', color: GOLD, marginBottom: 18 }}>
            {lessonTag}
          </div>

          {/* Title */}
          <div style={{ transform: `translateY(${headY}px)`, fontFamily: 'Georgia, serif', fontSize: 52, fontWeight: 300, fontStyle: 'italic', color: INK, letterSpacing: '-0.02em', textAlign: 'center', lineHeight: 1.05, marginBottom: 20 }}>
            {moduleTitle}
          </div>

          {/* Steps list */}
          <div style={{ opacity: subOp, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(200,169,110,0.12)', border: `1px solid rgba(200,169,110,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 9, color: GOLD }}>{i + 1}</div>
                <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK2 }}>{s.title}</span>
              </div>
            ))}
          </div>
        </AbsoluteFill>
      )}

      {/* ── STEP CONTENT ─────────────────────────────────────────────────── */}
      {!isTitleCard && !isOutro && active && (
        <AbsoluteFill style={{ opacity: contentOp * stepIn }}>
          {/* Step counter bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: INK3 }}>
            <div style={{
              width: `${((activeIdx + (stepFrame / active.step.durationInFrames)) / steps.length) * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`,
            }} />
          </div>

          {/* Step label — top left */}
          <div style={{
            position: 'absolute', top: 18, left: 32,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, boxShadow: `0 0 6px ${GOLD}` }} />
            <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD }}>
              Step {activeIdx + 1} of {steps.length}
            </span>
          </div>

          {/* Nest logo — top right */}
          <div style={{ position: 'absolute', top: 14, right: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontStyle: 'italic', color: INK2 }}>Nest</span>
            <div style={{ width: 26, height: 26, borderRadius: 6, border: `1.5px solid rgba(200,169,110,0.4)`, background: 'rgba(200,169,110,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Georgia', fontSize: 13, fontWeight: 700, color: GOLD }}>N</span>
            </div>
          </div>

          {/* Main screen area */}
          <AbsoluteFill style={{ top: 46, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {active.step.render(stepFrame, active.step.durationInFrames)}
          </AbsoluteFill>

          {/* Instruction bar — bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px 40px',
            background: 'linear-gradient(to top, rgba(10,9,7,0.95) 0%, transparent 100%)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: BG }}>{activeIdx + 1}</div>
            <span style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK, lineHeight: 1.4 }}>{active.step.instruction}</span>
          </div>
        </AbsoluteFill>
      )}

      {/* ── OUTRO ────────────────────────────────────────────────────────── */}
      {isOutro && (
        <AbsoluteFill style={{ opacity: outroOp, transform: `scale(${outroScale})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, border: `2px solid ${GOLD}`, background: 'rgba(200,169,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 300, fontStyle: 'italic', color: INK }}>
            You've got it.
          </div>
          <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK2, letterSpacing: '0.06em' }}>
            {moduleTitle} — complete
          </div>
          {nextLesson && (
            <div style={{
              marginTop: 16, display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(200,169,110,0.06)', border: '1px solid rgba(200,169,110,0.2)',
              borderRadius: 100, padding: '10px 24px',
            }}>
              <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK2 }}>Up next:</span>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontStyle: 'italic', color: GOLD2 }}>{nextLesson}</span>
            </div>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
