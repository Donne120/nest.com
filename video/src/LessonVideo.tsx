import React from 'react';
import {
  AbsoluteFill, Audio, Sequence,
  spring, useCurrentFrame, useVideoConfig,
  interpolate, staticFile,
} from 'remotion';

// ── Types ──────────────────────────────────────────────────────────────────

export interface SlideData {
  type: 'title' | 'content' | 'example' | 'code' | 'summary';
  heading: string;
  subheading?: string;
  bullets?: string[];
  code?: string;
  audio_key: string;       // path relative to public/, e.g. "temp/lesson_01/slide_00.mp3"
  start_frame: number;
  duration_frames: number;
}

export interface LessonVideoProps {
  course_title: string;
  module_title: string;
  lesson_title: string;
  lesson_number: number;
  total_frames: number;
  slides: SlideData[];
}

// ── Design tokens ──────────────────────────────────────────────────────────

const BG    = '#0b0c0f';
const GOLD  = '#e8c97e';
const WHITE = '#e8e4dc';
const GRAY  = '#9ca3af';
const DARK  = '#1c1e27';
const TERRA = '#c45c3c';

// ── Animation helpers (each used as a sub-component, not in loops) ─────────

function useSpringEnter(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 120, mass: 0.8 } });
  return {
    opacity: interpolate(frame - delay, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    y: interpolate(progress, [0, 1], [36, 0]),
    scale: interpolate(progress, [0, 1], [0.95, 1]),
  };
}

// Separate component per bullet so hooks aren't called in a loop
function Bullet({ text, delay, color = WHITE, prefix }: {
  text: string; delay: number; color?: string; prefix?: React.ReactNode;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 100 } });
  const opacity = interpolate(frame - delay, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const y = interpolate(progress, [0, 1], [28, 0]);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, opacity, transform: `translateY(${y}px)` }}>
      {prefix ?? <div style={{ width: 10, height: 10, borderRadius: '50%', background: GOLD, flexShrink: 0, marginTop: 20 }} />}
      <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 42, color, lineHeight: 1.45, letterSpacing: '-0.005em' }}>
        {text}
      </span>
    </div>
  );
}

function NumberedItem({ text, num, delay }: { text: string; num: number; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 100 } });
  const opacity = interpolate(frame - delay, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const y = interpolate(progress, [0, 1], [28, 0]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, opacity, transform: `translateY(${y}px)` }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        border: `1.5px solid ${GOLD}`, background: 'rgba(232,201,126,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: GOLD }}>{num}</span>
      </div>
      <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 40, color: WHITE, lineHeight: 1.4, fontWeight: 600 }}>
        {text}
      </span>
    </div>
  );
}

// ── Title Slide ────────────────────────────────────────────────────────────

function TitleSlide({ slide }: { slide: SlideData }) {
  const logo    = useSpringEnter(3);
  const heading = useSpringEnter(12);
  const sub     = useSpringEnter(24);

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 140px' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 55% at 50% 50%, rgba(232,201,126,0.07) 0%, transparent 70%)` }} />

      {/* N logo box */}
      <div style={{
        width: 88, height: 88, border: `2px solid rgba(232,201,126,0.4)`,
        borderRadius: 18, background: 'rgba(232,201,126,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 44, boxShadow: '0 0 50px rgba(232,201,126,0.1)',
        opacity: logo.opacity, transform: `scale(${logo.scale})`,
      }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 50, fontWeight: 700, color: GOLD }}>N</span>
      </div>

      <h1 style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 84, fontWeight: 700, lineHeight: 1.1,
        letterSpacing: '-0.025em', color: WHITE,
        textAlign: 'center', margin: 0, maxWidth: 1300,
        opacity: heading.opacity, transform: `translateY(${heading.y}px)`,
      }}>
        {slide.heading}
      </h1>

      <div style={{ width: 80, height: 3, background: GOLD, borderRadius: 2, margin: '32px 0', opacity: sub.opacity }} />

      {slide.subheading && (
        <p style={{
          fontFamily: 'system-ui, sans-serif', fontSize: 34,
          color: GRAY, textAlign: 'center', margin: 0, letterSpacing: '0.01em',
          opacity: sub.opacity, transform: `translateY(${sub.y}px)`,
        }}>
          {slide.subheading}
        </p>
      )}
    </AbsoluteFill>
  );
}

// ── Content Slide ──────────────────────────────────────────────────────────

function ContentSlide({ slide }: { slide: SlideData }) {
  const eyebrow = useSpringEnter(0);
  const heading = useSpringEnter(6);
  const rule    = useSpringEnter(16);
  const bullets = slide.bullets ?? [];

  return (
    <AbsoluteFill style={{ padding: '90px 110px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontFamily: 'monospace', fontSize: 15, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(232,201,126,0.45)', marginBottom: 18, opacity: eyebrow.opacity }}>
        Nest · Lesson
      </div>

      <h2 style={{
        fontFamily: 'Georgia, serif', fontSize: 72, fontWeight: 700,
        lineHeight: 1.15, letterSpacing: '-0.02em', color: WHITE,
        margin: '0 0 16px', maxWidth: '86%',
        opacity: heading.opacity, transform: `translateY(${heading.y}px)`,
      }}>
        {slide.heading}
      </h2>

      <div style={{ width: 110, height: 3, background: GOLD, borderRadius: 2, marginBottom: 44, opacity: rule.opacity }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
        {bullets[0] && <Bullet text={bullets[0]} delay={24} />}
        {bullets[1] && <Bullet text={bullets[1]} delay={36} />}
        {bullets[2] && <Bullet text={bullets[2]} delay={48} />}
        {bullets[3] && <Bullet text={bullets[3]} delay={60} />}
      </div>
    </AbsoluteFill>
  );
}

// ── Example Slide ──────────────────────────────────────────────────────────

function ExampleSlide({ slide }: { slide: SlideData }) {
  const badge   = useSpringEnter(0);
  const heading = useSpringEnter(10);
  const bullets = slide.bullets ?? [];

  return (
    <AbsoluteFill style={{ padding: '90px 110px', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        border: `1px solid ${TERRA}`, borderRadius: 7, padding: '6px 18px',
        background: 'rgba(196,92,60,0.09)', marginBottom: 30, alignSelf: 'flex-start',
        opacity: badge.opacity, transform: `translateY(${badge.y}px)`,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: TERRA }} />
        <span style={{ fontFamily: 'monospace', fontSize: 15, letterSpacing: '0.16em', textTransform: 'uppercase', color: TERRA, fontWeight: 700 }}>Real World Example</span>
      </div>

      <h2 style={{
        fontFamily: 'Georgia, serif', fontSize: 66, fontWeight: 700,
        lineHeight: 1.2, color: WHITE, margin: '0 0 38px', maxWidth: '88%',
        opacity: heading.opacity, transform: `translateY(${heading.y}px)`,
      }}>
        {slide.heading}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {bullets[0] && <Bullet text={bullets[0]} delay={22} color="rgba(232,228,220,0.85)" prefix={<span style={{ fontFamily: 'monospace', fontSize: 26, color: TERRA, fontWeight: 700, flexShrink: 0, marginTop: 8 }}>→</span>} />}
        {bullets[1] && <Bullet text={bullets[1]} delay={34} color="rgba(232,228,220,0.85)" prefix={<span style={{ fontFamily: 'monospace', fontSize: 26, color: TERRA, fontWeight: 700, flexShrink: 0, marginTop: 8 }}>→</span>} />}
        {bullets[2] && <Bullet text={bullets[2]} delay={46} color="rgba(232,228,220,0.85)" prefix={<span style={{ fontFamily: 'monospace', fontSize: 26, color: TERRA, fontWeight: 700, flexShrink: 0, marginTop: 8 }}>→</span>} />}
        {bullets[3] && <Bullet text={bullets[3]} delay={58} color="rgba(232,228,220,0.85)" prefix={<span style={{ fontFamily: 'monospace', fontSize: 26, color: TERRA, fontWeight: 700, flexShrink: 0, marginTop: 8 }}>→</span>} />}
      </div>
    </AbsoluteFill>
  );
}

// ── Code Slide ─────────────────────────────────────────────────────────────

function CodeSlide({ slide }: { slide: SlideData }) {
  const heading = useSpringEnter(5);
  const box     = useSpringEnter(18);

  return (
    <AbsoluteFill style={{ padding: '90px 110px', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{
        fontFamily: 'Georgia, serif', fontSize: 66, fontWeight: 700,
        color: WHITE, margin: '0 0 34px',
        opacity: heading.opacity, transform: `translateY(${heading.y}px)`,
      }}>
        {slide.heading}
      </h2>

      <div style={{
        background: DARK, borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.07)', padding: '22px 36px 32px',
        flex: 1, opacity: box.opacity, transform: `translateY(${box.y}px)`,
      }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          {['#c94f2c', '#e8c97e', '#34d399'].map((c, i) => (
            <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: c, opacity: 0.8 }} />
          ))}
        </div>
        <pre style={{
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: 34, lineHeight: 1.7, color: '#b8ffb8',
          margin: 0, whiteSpace: 'pre-wrap', overflow: 'hidden',
        }}>
          {slide.code ?? ''}
        </pre>
      </div>
    </AbsoluteFill>
  );
}

// ── Summary Slide ──────────────────────────────────────────────────────────

function SummarySlide({ slide }: { slide: SlideData }) {
  const label   = useSpringEnter(0);
  const heading = useSpringEnter(10);
  const rule    = useSpringEnter(18);
  const bullets = slide.bullets ?? [];

  return (
    <AbsoluteFill style={{ padding: '90px 110px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontFamily: 'monospace', fontSize: 15, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: 18, opacity: label.opacity }}>
        Lesson Recap
      </div>

      <h2 style={{
        fontFamily: 'Georgia, serif', fontSize: 72, fontWeight: 700,
        color: WHITE, margin: '0 0 12px',
        opacity: heading.opacity, transform: `translateY(${heading.y}px)`,
      }}>
        {slide.heading}
      </h2>

      <div style={{ width: 110, height: 3, background: GOLD, borderRadius: 2, marginBottom: 44, opacity: rule.opacity }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
        {bullets[0] && <NumberedItem text={bullets[0]} num={1} delay={26} />}
        {bullets[1] && <NumberedItem text={bullets[1]} num={2} delay={40} />}
        {bullets[2] && <NumberedItem text={bullets[2]} num={3} delay={54} />}
        {bullets[3] && <NumberedItem text={bullets[3]} num={4} delay={68} />}
      </div>
    </AbsoluteFill>
  );
}

// ── Slide wrapper (fade in/out + background + audio) ──────────────────────

const SLIDE_MAP: Record<string, React.FC<{ slide: SlideData }>> = {
  title:   TitleSlide,
  content: ContentSlide,
  example: ExampleSlide,
  code:    CodeSlide,
  summary: SummarySlide,
};

function SlideWrapper({ slide, isLast }: { slide: SlideData; isLast: boolean }) {
  const frame = useCurrentFrame();
  const FADE = 8;

  const fadeIn  = interpolate(frame, [0, FADE], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = isLast ? 1 : interpolate(frame, [slide.duration_frames - FADE, slide.duration_frames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const Component = SLIDE_MAP[slide.type] ?? ContentSlide;

  return (
    <AbsoluteFill style={{ opacity: fadeIn * fadeOut }}>
      {/* Audio */}
      <Audio src={staticFile(slide.audio_key)} />

      {/* Background */}
      <AbsoluteFill style={{ background: BG }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            repeating-linear-gradient(90deg, rgba(255,255,255,0.011) 0 1px, transparent 1px 80px),
            repeating-linear-gradient(0deg,  rgba(255,255,255,0.011) 0 1px, transparent 1px 80px)
          `,
        }} />
        {/* Gold top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: GOLD }} />
      </AbsoluteFill>

      {/* Content */}
      <Component slide={slide} />

      {/* Nest watermark */}
      <div style={{
        position: 'absolute', bottom: 32, right: 54,
        fontFamily: 'Georgia, serif', fontSize: 20,
        color: 'rgba(232,201,126,0.18)', fontWeight: 700, letterSpacing: '0.1em',
      }}>
        N  NEST
      </div>
    </AbsoluteFill>
  );
}

// ── Main composition ───────────────────────────────────────────────────────

export const LessonVideo: React.FC<LessonVideoProps> = ({ slides }) => (
  <AbsoluteFill style={{ background: BG }}>
    {slides.map((slide, i) => (
      <Sequence
        key={i}
        from={slide.start_frame}
        durationInFrames={slide.duration_frames}
        name={`${slide.type}: ${slide.heading.slice(0, 40)}`}
      >
        <SlideWrapper slide={slide} isLast={i === slides.length - 1} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
