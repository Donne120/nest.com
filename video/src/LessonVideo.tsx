import React from 'react';
import {
  AbsoluteFill, Audio, Sequence,
  spring, useCurrentFrame, useVideoConfig,
  interpolate, staticFile,
} from 'remotion';
import { BlueprintTheme }   from './themes/blueprint';
import { KineticTheme }     from './themes/kinetic';
import { ChalkboardTheme }  from './themes/chalkboard';
import { OrganicTheme }     from './themes/organic';
import { CinematicTheme }   from './themes/cinematic';
import type { ThemeComponents, GraphData, GraphPoint, KeyPoint, QuizOption } from './themes/types';
export type { GraphData, GraphPoint, KeyPoint, QuizOption };

// ── Types ──────────────────────────────────────────────────────────────────

export interface MathStep {
  expression: string;
  annotation?: string;
  highlight?: boolean;
}

export interface Caption {
  text: string;
  start_ms: number;
  duration_ms: number;
}

export interface SlideData {
  type: 'title' | 'hook' | 'content' | 'walkthrough' | 'example' | 'practice' | 'summary' | 'worked_example' | 'quiz';
  heading: string;
  subheading?: string;
  bullets?: string[];
  steps?: string[];
  math_steps?: MathStep[];
  captions?: Caption[];
  story?: string;
  task?: string;
  example_prompt?: string;
  ai_response?: string;
  nest_question?: string;
  timer_seconds?: number;
  code?: string;
  visual_hint?: 'timeline' | 'cycle' | 'stats' | 'graph' | 'default';
  graph_data?: GraphData;
  quiz_options?: QuizOption[];
  scene_type?:     'portrait' | 'map' | 'building' | 'event' | 'crowd';
  scene_caption?:  string;
  scene_era?:      string;
  scene_location?: string;
  audio_key: string;
  image_key?: string;
  start_frame: number;
  duration_frames: number;
}

export interface LessonVideoProps {
  course_title: string;
  module_title: string;
  lesson_title: string;
  lesson_number: number;
  total_frames: number;
  theme?: string;
  slides: SlideData[];
}

// ── Design tokens ──────────────────────────────────────────────────────────

const BG    = '#080a0e';
const GOLD  = '#e8c97e';
const GOLD2 = '#f5e0a0';
const WHITE = '#f0ece4';
const GRAY  = '#9ca3af';
const DARK  = '#1c1e27';
const GREEN = '#34d399';
const TERRA = '#c45c3c';
const BLUE  = '#60a5fa';

// ── Animation helpers ──────────────────────────────────────────────────────

function useSpringEnter(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 70, mass: 1.0 } });
  return {
    opacity: interpolate(frame - delay, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    y: interpolate(progress, [0, 1], [72, 0]),
    scale: interpolate(progress, [0, 1], [0.88, 1]),
  };
}

// ── Vignette — cinematic edge darkening on every slide ────────────────────

function Vignette() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50,
      background: 'radial-gradient(ellipse 110% 110% at 50% 50%, transparent 42%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.82) 100%)',
    }} />
  );
}

// ── Grain — subtle film noise for cinematic depth ─────────────────────────

function Grain() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.055, pointerEvents: 'none', zIndex: 49 }}>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}

// ── Animated bullet icons — 4 variants, one per bullet position ───────────
// Each icon draws stroke-by-stroke in sync with the bullet's entrance delay.

function BulletIcon({ index, delay }: { index: number; delay: number }) {
  const defs = [
    // 0 — Lightbulb (idea / insight)
    { paths: ["M12 3a6 6 0 00-2.4 11.6V16h4.8v-1.4A6 6 0 0012 3z", "M10 18h4M10.5 21h3"], sw: 2 },
    // 1 — Clock (time / efficiency)
    { paths: ["M12 2a10 10 0 100 20A10 10 0 0012 2z", "M12 7v5l3.5 2"], sw: 2 },
    // 2 — Trending up (growth / improvement)
    { paths: ["M3 17l5-5 4 4 5-6.5 5 5", "M16 7.5h5v5"], sw: 2.2 },
    // 3 — Checkmark circle (achievement / result)
    { paths: ["M22 11.1V12a10 10 0 11-5.9-9.1", "M22 4L12 14.01l-3-3"], sw: 2 },
  ];
  const icon = defs[index % defs.length];
  return (
    <div style={{ width: 34, height: 34, flexShrink: 0, marginTop: 6 }}>
      <svg width={34} height={34} viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible' }}>
        {icon.paths.map((d, i) => (
          <DrawPath key={i} d={d} stroke={GOLD} strokeWidth={icon.sw}
            delay={delay + i * 5} duration={22} />
        ))}
      </svg>
    </div>
  );
}

function Bullet({ text, delay, color = WHITE, prefix, iconIndex }: {
  text: string; delay: number; color?: string; prefix?: React.ReactNode; iconIndex?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 100 } });
  const opacity = interpolate(frame - delay, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const y = interpolate(progress, [0, 1], [28, 0]);
  const dot = <div style={{ width: 10, height: 10, borderRadius: '50%', background: GOLD, flexShrink: 0, marginTop: 20 }} />;
  const bulletPrefix = prefix ?? (iconIndex !== undefined ? <BulletIcon index={iconIndex} delay={delay} /> : dot);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, opacity, transform: `translateY(${y}px)` }}>
      {bulletPrefix}
      <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 40, color, lineHeight: 1.45 }}>
        {text}
      </span>
    </div>
  );
}

// ── SVG Drawing Primitives ─────────────────────────────────────────────────
// pathLength={1} normalises any path to length 1. With strokeDasharray={1}
// we animate strokeDashoffset 1→0 to progressively reveal the stroke.

function DrawPath({
  d, stroke = GOLD, strokeWidth = 2.5,
  delay = 0, duration = 20, fill = 'none',
}: {
  d: string; stroke?: string; strokeWidth?: number;
  delay?: number; duration?: number; fill?: string;
}) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, Math.max(duration, 1)], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return (
    <path
      d={d}
      pathLength={1}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={1}
      strokeDashoffset={1 - progress}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={fill}
    />
  );
}

function DrawCircle({
  cx, cy, r, stroke = GOLD, strokeWidth = 2.5,
  delay = 0, duration = 20, fill = 'none',
}: {
  cx: number; cy: number; r: number; stroke?: string; strokeWidth?: number;
  delay?: number; duration?: number; fill?: string;
}) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, Math.max(duration, 1)], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const circumference = 2 * Math.PI * r;
  return (
    <circle
      cx={cx} cy={cy} r={r}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={circumference}
      strokeDashoffset={circumference * (1 - progress)}
      strokeLinecap="round"
      fill={fill}
      style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
    />
  );
}

// ── Smart visual types ────────────────────────────────────────────────────
// Selected by visual_hint on each slide. Each type teaches visually rather
// than decorating — the shape of the visual matches the shape of the idea.

// ·· Timeline — for sequential steps, ordered events, historical progression

function TimelineViz({ bullets }: { bullets: string[] }) {
  const frame = useCurrentFrame();
  const items = bullets.slice(0, 4);
  const n     = Math.max(items.length, 1);
  const W = 380; const H = 420;
  const lx1 = 38; const lx2 = 342; const ly = 210;
  const xs = items.map((_, i) => lx1 + i * ((lx2 - lx1) / Math.max(n - 1, 1)));

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {/* Main axis */}
        <DrawPath d={`M ${lx1},${ly} L ${lx2},${ly}`}
          stroke="rgba(232,201,126,0.35)" strokeWidth={2.5} delay={0} duration={22} />
        {/* Arrowhead */}
        <DrawPath d={`M ${lx2 - 10},${ly - 7} L ${lx2},${ly} L ${lx2 - 10},${ly + 7}`}
          stroke="rgba(232,201,126,0.35)" strokeWidth={2} delay={20} duration={8} />

        {items.map((text, i) => {
          const x = xs[i];
          const above = i % 2 === 0;
          const nd = 16 + i * 18;
          const np = interpolate(frame - nd, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const tp = interpolate(frame - nd - 10, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const stemY2 = above ? ly - 38 : ly + 38;
          const label1Y = above ? ly - 56 : ly + 62;
          const label2Y = above ? ly - 38 : ly + 80;
          const words = text.replace(/^(Before|After|Improvement|Next step):\s*/i, '').split(' ');
          const line1 = words.slice(0, 4).join(' ');
          const line2 = words.slice(4, 8).join(' ');

          return (
            <g key={i}>
              <DrawPath d={`M ${x},${ly} L ${x},${stemY2}`}
                stroke="rgba(232,201,126,0.4)" strokeWidth={1.5}
                delay={nd - 3} duration={9} />
              {/* Node */}
              <circle cx={x} cy={ly} r={15}
                fill={`rgba(232,201,126,${0.12 * np})`}
                stroke={GOLD} strokeWidth={2.2}
                strokeDasharray={2 * Math.PI * 15}
                strokeDashoffset={2 * Math.PI * 15 * (1 - np)}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: `${x}px ${ly}px` }}
              />
              <text x={x} y={ly + 6} textAnchor="middle"
                fontFamily="monospace" fontSize={13} fontWeight="700"
                fill={GOLD} fillOpacity={tp}
              >{i + 1}</text>
              {/* Labels */}
              <text x={x} y={label1Y} textAnchor="middle"
                fontFamily="system-ui" fontSize={13} fill={WHITE} fillOpacity={tp}
              >{line1}</text>
              {line2 && (
                <text x={x} y={label2Y} textAnchor="middle"
                  fontFamily="system-ui" fontSize={13} fill={GRAY} fillOpacity={tp}
                >{line2}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ·· Cycle — for repeating processes, feedback loops, circular systems

function CycleViz({ bullets }: { bullets: string[] }) {
  const frame = useCurrentFrame();
  const items = bullets.slice(0, 4);
  const CX = 190; const CY = 210; const R = 130;
  // Nodes at 12, 3, 6, 9 o'clock
  const angles = [-90, 0, 90, 180].map(a => a * (Math.PI / 180));
  const nodes  = angles.map(a => ({ x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) }));
  // Curved arc paths between adjacent nodes
  const arcs = nodes.map((n, i) => {
    const m = nodes[(i + 1) % nodes.length];
    const mx = (n.x + m.x) / 2 + (CY - (n.y + m.y) / 2) * 0.25;
    const my = (n.y + m.y) / 2 - (CX - (n.x + m.x) / 2) * 0.25;
    return `M ${n.x},${n.y} Q ${mx},${my} ${m.x},${m.y}`;
  });
  const glowPulse = interpolate(Math.sin(frame * 0.06), [-1, 1], [0.08, 0.2]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={380} height={420} viewBox="0 0 380 420" style={{ overflow: 'visible' }}>
        {/* Centre pulse */}
        <circle cx={CX} cy={CY} r={28} fill={`rgba(232,201,126,${glowPulse})`} />
        <DrawCircle cx={CX} cy={CY} r={28} stroke={GOLD} strokeWidth={2} delay={0} duration={16} />
        <text x={CX} y={CY + 6} textAnchor="middle" fontFamily="monospace" fontSize={13}
          fill={GOLD} fillOpacity={interpolate(frame, [14, 24], [0, 0.8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
        >CYCLE</text>

        {/* Arcs between nodes */}
        {arcs.map((d, i) => (
          <DrawPath key={i} d={d} stroke="rgba(232,201,126,0.35)" strokeWidth={1.8}
            delay={14 + i * 14} duration={18} />
        ))}

        {/* Arrowheads on arcs */}
        {nodes.map((n, i) => {
          const prev = nodes[(i + nodes.length - 1) % nodes.length];
          const ax = n.x + (n.x - CX) * 0.12;
          const ay = n.y + (n.y - CY) * 0.12;
          const np = interpolate(frame - 18 - i * 14, [0, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const tp = interpolate(frame - 26 - i * 14, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const labelX = CX + (R + 38) * Math.cos(angles[i]);
          const labelY = CY + (R + 38) * Math.sin(angles[i]);
          const text = (items[i] ?? '').replace(/^(Before|After):\s*/i, '');
          const words = text.split(' ');
          const l1 = words.slice(0, 4).join(' ');
          const l2 = words.slice(4, 8).join(' ');
          return (
            <g key={i}>
              <DrawCircle cx={n.x} cy={n.y} r={18} stroke={GOLD} strokeWidth={2.2}
                fill="rgba(232,201,126,0.1)" delay={18 + i * 14} duration={14} />
              <text x={n.x} y={n.y + 5} textAnchor="middle"
                fontFamily="monospace" fontSize={13} fontWeight="700"
                fill={GOLD} fillOpacity={np}>{i + 1}</text>
              <text x={labelX} y={labelY - 7} textAnchor="middle"
                fontFamily="system-ui" fontSize={13} fill={WHITE} fillOpacity={tp}>{l1}</text>
              {l2 && <text x={labelX} y={labelY + 11} textAnchor="middle"
                fontFamily="system-ui" fontSize={12} fill={GRAY} fillOpacity={tp}>{l2}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ·· Stats — for key metrics, percentages, measurable results
// Extracts leading numbers from bullet text and counts them up.

function extractNum(text: string): { pre: string; num: number; suf: string } | null {
  const m = text.match(/^(.*?)(\d[\d,.]*)([%×x+]?)\s*(.*)$/i);
  if (!m || !m[2]) return null;
  return { pre: m[1], num: parseFloat(m[2].replace(/,/g, '')), suf: (m[3] + ' ' + m[4]).trim() };
}

function StatBox({ text, delay }: { text: string; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress  = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 70 } });
  const opacity   = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scale     = interpolate(progress, [0, 1], [0.82, 1]);
  const parsed    = extractNum(text);
  const countUp   = parsed ? Math.round(interpolate(progress, [0, 1], [0, parsed.num])) : null;

  return (
    <div style={{
      flex: 1, borderRadius: 16, padding: '22px 18px',
      background: 'rgba(232,201,126,0.06)', border: `1px solid rgba(232,201,126,0.22)`,
      opacity, transform: `scale(${scale})`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
      boxShadow: `0 0 30px rgba(232,201,126,${opacity * 0.08})`,
    }}>
      {countUp !== null ? (
        <>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 64, fontWeight: 700, color: GOLD, lineHeight: 1 }}>
            {parsed!.pre}{countUp}{parsed!.suf.slice(0, 5)}
          </div>
          <div style={{ fontFamily: 'system-ui', fontSize: 18, color: GRAY, textAlign: 'center', lineHeight: 1.4 }}>
            {text.replace(/\d[\d,.]*[%×x+]?/, '').trim().slice(0, 42)}
          </div>
        </>
      ) : (
        <div style={{ fontFamily: 'system-ui', fontSize: 22, color: WHITE, textAlign: 'center', lineHeight: 1.5 }}>
          {text.slice(0, 60)}
        </div>
      )}
    </div>
  );
}

function StatsViz({ bullets }: { bullets: string[] }) {
  const items = bullets.slice(0, 4);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ flex: 1, display: 'flex', gap: 16 }}>
        {items[0] && <StatBox text={items[0]} delay={10} />}
        {items[1] && <StatBox text={items[1]} delay={22} />}
      </div>
      {(items[2] || items[3]) && (
        <div style={{ flex: 1, display: 'flex', gap: 16 }}>
          {items[2] && <StatBox text={items[2]} delay={34} />}
          {items[3] && <StatBox text={items[3]} delay={46} />}
        </div>
      )}
    </div>
  );
}

// ── Math Graph Viz — animated coordinate plane + function curve ───────────
// LLM provides sampled points; the curve traces itself left→right in sync
// with narration. Key points pulse in with labels. Axes draw first.

function buildCurveD(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 2)];
    const p1 = pts[i - 1];
    const p2 = pts[i];
    const p3 = pts[Math.min(pts.length - 1, i + 1)];
    // Catmull-Rom → cubic bezier
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

function MathGraphViz({ data }: { data: GraphData }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const VW = 500; const VH = 420;
  const PL = 68; const PR = 22; const PT = 26; const PB = 56;
  const GW = VW - PL - PR;
  const GH = VH - PT - PB;

  const [x0, x1] = data.x_range;
  const [y0, y1] = data.y_range;

  const toSX = (x: number) => PL + ((x - x0) / (x1 - x0)) * GW;
  const toSY = (y: number) => PT + GH - ((y - y0) / (y1 - y0)) * GH;

  const originX = toSX(Math.max(x0, Math.min(x1, 0)));
  const originY = toSY(Math.max(y0, Math.min(y1, 0)));

  // ── Animation timing ───────────────────────────────────────────────
  const AXES_DUR    = 24;
  const CURVE_START = AXES_DUR;
  const CURVE_DUR   = 52;
  const PTS_START   = CURVE_START + CURVE_DUR * 0.45;
  const LBL_START   = CURVE_START + CURVE_DUR + 4;

  const axisXP = interpolate(frame, [0, AXES_DUR], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const axisYP = interpolate(frame, [4, AXES_DUR + 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const gridOp = interpolate(frame, [8, 22], [0, 0.16], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lblOp  = interpolate(frame - LBL_START, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // ── Curve: grow by adding visible points progressively ──────────────
  const rawProgress = interpolate(frame - CURVE_START, [0, CURVE_DUR],
    [0, data.points.length - 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lastFull = Math.floor(rawProgress);
  const frac     = rawProgress - lastFull;

  const visPts = data.points.slice(0, lastFull + 2).map(p => ({ x: toSX(p.x), y: toSY(p.y) }));
  if (lastFull < data.points.length - 1 && frac > 0 && visPts.length >= 2) {
    const prev  = visPts[visPts.length - 2];
    const nextD = data.points[lastFull + 1];
    visPts[visPts.length - 1] = {
      x: prev.x + frac * (toSX(nextD.x) - prev.x),
      y: prev.y + frac * (toSY(nextD.y) - prev.y),
    };
  }
  const curveD  = buildCurveD(visPts);
  const leadPt  = visPts[visPts.length - 1];
  const showLead = rawProgress > 0.05 && rawProgress < data.points.length - 1.1;

  // ── Ticks ─────────────────────────────────────────────────────────
  const xSpan  = x1 - x0;
  const xStep  = xSpan <= 6 ? 1 : xSpan <= 12 ? 2 : 5;
  const xTicks: number[] = [];
  for (let v = Math.ceil(x0 / xStep) * xStep; v <= x1 + 0.001; v += xStep)
    if (Math.abs(v) > 0.001) xTicks.push(v);

  const ySpan = y1 - y0;
  const yStep = ySpan <= 8 ? 1 : ySpan <= 20 ? 2 : ySpan <= 50 ? 5 : 10;
  const yTicks: number[] = [];
  for (let v = Math.ceil(y0 / yStep) * yStep; v <= y1 + 0.001; v += yStep)
    if (Math.abs(v) > 0.001) yTicks.push(v);

  // ── Shade under curve (integrals) ─────────────────────────────────
  const shadeOp = data.shade_under
    ? interpolate(frame - LBL_START, [0, 20], [0, 0.14], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;
  const allPts = data.points.map(p => ({ x: toSX(p.x), y: toSY(p.y) }));
  const shadePath = data.shade_under && allPts.length > 1
    ? `${buildCurveD(allPts)} L ${allPts[allPts.length - 1].x},${originY} L ${allPts[0].x},${originY} Z`
    : '';

  const keyPoints = data.key_points ?? [];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={VW} height={VH} viewBox={`0 0 ${VW} ${VH}`} style={{ overflow: 'visible' }}>

        {/* Subtle grid */}
        {xTicks.map((v, i) => (
          <line key={`gx${i}`} x1={toSX(v)} y1={PT} x2={toSX(v)} y2={PT + GH}
            stroke={WHITE} strokeWidth={0.7} opacity={gridOp} />
        ))}
        {yTicks.map((v, i) => (
          <line key={`gy${i}`} x1={PL} y1={toSY(v)} x2={PL + GW} y2={toSY(v)}
            stroke={WHITE} strokeWidth={0.7} opacity={gridOp} />
        ))}

        {/* X axis — draws left → right */}
        <line x1={PL} y1={originY} x2={PL + GW * axisXP} y2={originY}
          stroke="rgba(232,228,220,0.55)" strokeWidth={2} strokeLinecap="round" />
        {axisXP > 0.94 && (
          <DrawPath d={`M ${PL + GW - 10},${originY - 6} L ${PL + GW},${originY} L ${PL + GW - 10},${originY + 6}`}
            stroke="rgba(232,228,220,0.55)" strokeWidth={1.8} delay={AXES_DUR - 3} duration={6} />
        )}

        {/* Y axis — draws bottom → top */}
        <line x1={originX} y1={PT + GH} x2={originX} y2={PT + GH - GH * axisYP}
          stroke="rgba(232,228,220,0.55)" strokeWidth={2} strokeLinecap="round" />
        {axisYP > 0.94 && (
          <DrawPath d={`M ${originX - 6},${PT + 10} L ${originX},${PT} L ${originX + 6},${PT + 10}`}
            stroke="rgba(232,228,220,0.55)" strokeWidth={1.8} delay={AXES_DUR - 1} duration={6} />
        )}

        {/* Tick marks + numbers */}
        {xTicks.map((v, i) => {
          const sx  = toSX(v);
          const op  = interpolate(frame - 14 - i * 2, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <g key={`xt${i}`}>
              <line x1={sx} y1={originY - 5} x2={sx} y2={originY + 5} stroke={GRAY} strokeWidth={1.5} opacity={op} />
              <text x={sx} y={originY + 19} textAnchor="middle" fontFamily="monospace" fontSize={14} fill={GRAY} opacity={op}>{v}</text>
            </g>
          );
        })}
        {yTicks.map((v, i) => {
          const sy  = toSY(v);
          const op  = interpolate(frame - 14 - i * 2, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <g key={`yt${i}`}>
              <line x1={originX - 5} y1={sy} x2={originX + 5} y2={sy} stroke={GRAY} strokeWidth={1.5} opacity={op} />
              <text x={originX - 12} y={sy + 5} textAnchor="end" fontFamily="monospace" fontSize={14} fill={GRAY} opacity={op}>{v}</text>
            </g>
          );
        })}

        {/* Axis variable labels */}
        <text x={PL + GW + 16} y={originY + 5} fontFamily="Georgia,serif" fontSize={18} fill={GRAY} fillOpacity={axisXP}>
          {data.x_label ?? 'x'}
        </text>
        <text x={originX - 16} y={PT - 6} fontFamily="Georgia,serif" fontSize={18} fill={GRAY} fillOpacity={axisYP}>
          {data.y_label ?? 'y'}
        </text>

        {/* Shaded area under curve */}
        {shadeOp > 0 && shadePath && (
          <path d={shadePath} fill={GOLD} fillOpacity={shadeOp} stroke="none" />
        )}

        {/* Function curve — grows from left to right */}
        {curveD && (
          <path d={curveD} stroke={GOLD} strokeWidth={3.2} fill="none"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 5px rgba(232,201,126,0.55))' }}
          />
        )}

        {/* Gold leading dot — rides the frontier of the curve */}
        {showLead && leadPt && (
          <>
            <circle cx={leadPt.x} cy={leadPt.y} r={11}
              fill={GOLD} opacity={0.22}
              style={{ filter: 'blur(5px)' }}
            />
            <circle cx={leadPt.x} cy={leadPt.y} r={5}
              fill={GOLD} stroke={WHITE} strokeWidth={1.8}
            />
          </>
        )}

        {/* Key points — pulse in with dashed crosshairs + label */}
        {keyPoints.map((kp, i) => {
          const kx    = toSX(kp.x);
          const ky    = toSY(kp.y);
          const kDel  = PTS_START + i * 18;
          const kOp   = interpolate(frame - kDel, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const kSc   = interpolate(
            spring({ frame: frame - kDel, fps, config: { damping: 12, stiffness: 130 } }),
            [0, 1], [0.2, 1]
          );
          const glow  = kOp > 0.1 ? interpolate(Math.sin(frame * 0.1 + i * 1.4), [-1, 1], [0.2, 0.55]) : 0;
          const labelRight = kx < VW * 0.55;
          if (kOp <= 0.01) return null;
          return (
            <g key={i}>
              <line x1={kx} y1={ky} x2={kx} y2={originY}
                stroke={GOLD} strokeWidth={1} strokeDasharray="5 4" opacity={kOp * 0.4} />
              <line x1={kx} y1={ky} x2={originX} y2={ky}
                stroke={GOLD} strokeWidth={1} strokeDasharray="5 4" opacity={kOp * 0.4} />
              <circle cx={kx} cy={ky} r={16}
                fill="none" stroke={GOLD} strokeWidth={1.5}
                opacity={kOp * glow} style={{ filter: 'blur(3px)' }} />
              <circle cx={kx} cy={ky} r={7}
                fill={GOLD} stroke={BG} strokeWidth={2}
                opacity={kOp}
                style={{ transform: `scale(${kSc})`, transformOrigin: `${kx}px ${ky}px` }} />
              <text
                x={kx + (labelRight ? 14 : -14)} y={ky - 14}
                textAnchor={labelRight ? 'start' : 'end'}
                fontFamily="Georgia,'Times New Roman',serif" fontSize={16}
                fill={GOLD} opacity={kOp}
                style={{ filter: `drop-shadow(0 0 7px rgba(232,201,126,${kOp * 0.6}))` }}
              >{kp.label}</text>
            </g>
          );
        })}

        {/* Function label — top right */}
        {data.function_label && (
          <text x={PL + GW - 4} y={PT + 20} textAnchor="end"
            fontFamily="Georgia,'Times New Roman',serif" fontSize={22}
            fill={WHITE} opacity={lblOp}
            style={{ filter: `drop-shadow(0 0 10px rgba(232,201,126,${lblOp * 0.5}))` }}
          >{data.function_label}</text>
        )}
      </svg>
    </div>
  );
}

// ── Hook Sketch — "stuck clock" drawn live on screen ──────────────────────
// Clock face → hour marks → hands → confusion spiral → X reveal

function HookSketch() {
  const frame = useCurrentFrame();
  const xOpacity = interpolate(frame, [82, 100], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const glowPulse = frame > 100 ? interpolate(Math.sin(frame * 0.09), [-1, 1], [0.15, 0.45]) : 0;

  // 12 hour-mark lines, staggered
  const hourMarks = Array.from({ length: 12 }, (_, h) => {
    const angle = (h * 30 - 90) * (Math.PI / 180);
    const x1 = 160 + Math.cos(angle) * 110;
    const y1 = 185 + Math.sin(angle) * 110;
    const x2 = 160 + Math.cos(angle) * (h % 3 === 0 ? 92 : 97);
    const y2 = 185 + Math.sin(angle) * (h % 3 === 0 ? 92 : 97);
    return { x1, y1, x2, y2, delay: 22 + h * 1.5 };
  });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 80% 60% at 50% 55%, rgba(196,92,60,0.07) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <svg width={320} height={360} viewBox="0 0 320 360" style={{ overflow: 'visible' }}>
        {/* Outer glow ring */}
        {glowPulse > 0 && (
          <circle cx={160} cy={185} r={124}
            fill="none" stroke={TERRA} strokeWidth={8}
            style={{ filter: 'blur(10px)', opacity: glowPulse }}
          />
        )}

        {/* Clock face */}
        <DrawCircle cx={160} cy={185} r={120} stroke={`rgba(232,201,126,0.55)`} strokeWidth={3} delay={0} duration={22} />

        {/* Hour marks */}
        {hourMarks.map((m, h) => (
          <DrawPath key={h}
            d={`M ${m.x1},${m.y1} L ${m.x2},${m.y2}`}
            stroke={`rgba(232,201,126,${h % 3 === 0 ? 0.5 : 0.28})`}
            strokeWidth={h % 3 === 0 ? 2.5 : 1.5}
            delay={m.delay} duration={5}
          />
        ))}

        {/* Minute hand (pointing to 12) */}
        <DrawPath d="M 160,185 L 160,82" stroke={GOLD} strokeWidth={3.5} delay={40} duration={10} />

        {/* Hour hand (pointing to ~2 o'clock) */}
        <DrawPath d="M 160,185 L 223,148" stroke={GOLD} strokeWidth={4.5} delay={46} duration={10} />

        {/* Centre pivot */}
        <DrawCircle cx={160} cy={185} r={7} stroke={GOLD} strokeWidth={2} fill={`rgba(232,201,126,0.4)`} delay={48} duration={6} />

        {/* Confusion spiral — bezier that loops ~1.5 times */}
        <DrawPath
          d="M 195,158 C 228,145 240,190 222,218 C 204,246 162,244 142,218 C 122,192 132,155 158,145 C 184,135 212,152 214,178"
          stroke={`rgba(196,92,60,0.65)`} strokeWidth={2.2}
          delay={56} duration={26}
        />

        {/* Question mark 1 — top-left */}
        <DrawPath
          d="M 44,48 C 44,32 62,26 66,37 C 70,48 54,55 54,66 L 54,75 M 54,82 L 54,85"
          stroke={`rgba(232,201,126,0.75)`} strokeWidth={2.5}
          delay={30} duration={14}
        />
        {/* Question mark 2 — top-right, smaller */}
        <DrawPath
          d="M 262,32 C 262,20 276,15 279,24 C 282,33 270,38 270,46 L 270,53 M 270,59 L 270,61"
          stroke={`rgba(232,201,126,0.55)`} strokeWidth={2}
          delay={37} duration={12}
        />
        {/* Question mark 3 — right, tiny */}
        <DrawPath
          d="M 300,132 C 300,124 308,121 310,126 C 312,131 304,134 304,140 L 304,145 M 304,149 L 304,150"
          stroke={`rgba(232,201,126,0.38)`} strokeWidth={1.5}
          delay={43} duration={9}
        />

        {/* Big X — the problem reveal */}
        <DrawPath d="M 52,68 L 268,302" stroke={TERRA} strokeWidth={6} delay={82} duration={14} />
        <DrawPath d="M 268,68 L 52,302" stroke={TERRA} strokeWidth={6} delay={90} duration={14} />

        {/* X glow (after draw) */}
        {xOpacity > 0 && (
          <>
            <line x1={52} y1={68} x2={268} y2={302}
              stroke={TERRA} strokeWidth={12}
              style={{ filter: 'blur(8px)', opacity: xOpacity * 0.35 }}
            />
            <line x1={268} y1={68} x2={52} y2={302}
              stroke={TERRA} strokeWidth={12}
              style={{ filter: 'blur(8px)', opacity: xOpacity * 0.35 }}
            />
          </>
        )}
      </svg>
    </div>
  );
}

// ── Concept Map — mind map draws in sync with content bullets ─────────────

function ConceptMap({ bullets }: { bullets: string[] }) {
  const frame = useCurrentFrame();
  const centerGlow = interpolate(Math.sin(frame * 0.06), [-1, 1], [0.07, 0.17]);

  // Outer node positions in a 380×440 viewBox (center = 190, 220)
  const nodes = [
    { cx: 190, cy: 72,  lineD: 'M 190,178 L 190,94',  delay: 20 },
    { cx: 338, cy: 178, lineD: 'M 222,207 L 316,184',  delay: 34 },
    { cx: 292, cy: 358, lineD: 'M 216,248 L 270,340',  delay: 48 },
    { cx: 88,  cy: 358, lineD: 'M 164,248 L 110,340',  delay: 62 },
  ];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={380} height={440} viewBox="0 0 380 440" style={{ overflow: 'visible' }}>
        {/* Centre glow */}
        <circle cx={190} cy={220} r={44} fill={`rgba(232,201,126,${centerGlow})`} stroke="none" />

        {/* Centre ring */}
        <DrawCircle cx={190} cy={220} r={44} stroke={GOLD} strokeWidth={2.5} delay={0} duration={16} />
        <DrawCircle cx={190} cy={220} r={34} stroke={`rgba(232,201,126,0.22)`} strokeWidth={1} delay={5} duration={16} />

        {/* Centre dot */}
        <DrawCircle cx={190} cy={220} r={8} stroke={GOLD} strokeWidth={2} fill={`rgba(232,201,126,0.7)`} delay={14} duration={8} />

        {/* Cardinal sparkle lines from centre */}
        <DrawPath d="M 190,176 L 190,164" stroke={`rgba(232,201,126,0.45)`} strokeWidth={1.5} delay={18} duration={6} />
        <DrawPath d="M 234,220 L 246,220" stroke={`rgba(232,201,126,0.45)`} strokeWidth={1.5} delay={20} duration={6} />
        <DrawPath d="M 190,264 L 190,276" stroke={`rgba(232,201,126,0.45)`} strokeWidth={1.5} delay={22} duration={6} />
        <DrawPath d="M 146,220 L 134,220" stroke={`rgba(232,201,126,0.45)`} strokeWidth={1.5} delay={24} duration={6} />

        {/* Lines + outer nodes (one per bullet, staggered) */}
        {nodes.map((n, i) => {
          if (!bullets[i]) return null;
          const np = interpolate(frame - n.delay, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <g key={i}>
              <DrawPath d={n.lineD} stroke={`rgba(232,201,126,0.38)`} strokeWidth={1.5} delay={n.delay - 4} duration={12} />
              <circle cx={n.cx} cy={n.cy} r={22} fill={`rgba(232,201,126,${0.07 * np})`} />
              <DrawCircle cx={n.cx} cy={n.cy} r={22} stroke={`rgba(232,201,126,0.6)`} strokeWidth={1.8} delay={n.delay} duration={14} />
              <DrawCircle cx={n.cx} cy={n.cy} r={9}  stroke={`rgba(232,201,126,0.3)`} strokeWidth={1.2} delay={n.delay + 8} duration={10} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Transform Curve — before/after growth chart for example slides ─────────

function TransformCurve() {
  const frame = useCurrentFrame();
  const afterGlow = frame > 95 ? interpolate(Math.sin(frame * 0.08), [-1, 1], [0.1, 0.3]) : 0;
  const fillOpacity = interpolate(frame, [95, 130], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={380} height={360} viewBox="0 0 380 360" style={{ overflow: 'visible' }}>
        {/* Axes */}
        <DrawPath d="M 40,310 L 358,310" stroke={`rgba(232,228,220,0.28)`} strokeWidth={2} delay={0} duration={10} />
        <DrawPath d="M 40,22 L 40,310"  stroke={`rgba(232,228,220,0.28)`} strokeWidth={2} delay={0} duration={10} />
        <DrawPath d="M 348,303 L 358,310 L 348,317" stroke={`rgba(232,228,220,0.28)`} strokeWidth={1.5} delay={9}  duration={5} />
        <DrawPath d="M 33,32 L 40,22 L 47,32"       stroke={`rgba(232,228,220,0.28)`} strokeWidth={1.5} delay={9}  duration={5} />

        {/* Subtle grid */}
        <DrawPath d="M 40,250 L 358,250" stroke={`rgba(255,255,255,0.05)`} strokeWidth={1} delay={5} duration={8} />
        <DrawPath d="M 40,190 L 358,190" stroke={`rgba(255,255,255,0.05)`} strokeWidth={1} delay={6} duration={8} />
        <DrawPath d="M 40,130 L 358,130" stroke={`rgba(255,255,255,0.05)`} strokeWidth={1} delay={7} duration={8} />

        {/* Before dot */}
        <DrawCircle cx={68} cy={285} r={9} stroke={TERRA} strokeWidth={2.5} delay={13} duration={8} />

        {/* Flat "before" segment */}
        <DrawPath d="M 68,285 C 88,285 100,287 122,283" stroke={TERRA} strokeWidth={2.5} delay={14} duration={14} />

        {/* Rising curve — the cinematic draw */}
        <DrawPath
          d="M 122,283 C 148,275 162,252 178,220 C 194,188 210,154 230,118 C 248,88 262,62 288,52"
          stroke={GOLD} strokeWidth={3.2}
          delay={28} duration={52}
        />

        {/* After plateau */}
        <DrawPath d="M 288,52 L 356,50" stroke={GOLD} strokeWidth={3.2} delay={78} duration={12} />

        {/* After dot (success) */}
        <DrawCircle cx={356} cy={50} r={9} stroke={GREEN} strokeWidth={2.5} fill={`rgba(52,211,153,0.18)`} delay={82} duration={10} />

        {/* After glow */}
        {afterGlow > 0 && (
          <circle cx={356} cy={50} r={22} fill="none"
            stroke={GREEN} strokeWidth={2}
            style={{ filter: 'blur(6px)', opacity: afterGlow }}
          />
        )}

        {/* Checkmark at end */}
        <DrawPath d="M 340,40 L 350,52 L 370,28" stroke={GREEN} strokeWidth={3} delay={92} duration={14} />

        {/* Vertical drop line from peak */}
        <DrawPath d="M 356,50 L 356,310" stroke={`rgba(52,211,153,0.14)`} strokeWidth={1.5} delay={94} duration={14} />

        {/* Area fill under curve */}
        {fillOpacity > 0 && (
          <path
            d="M 122,283 C 148,275 162,252 178,220 C 194,188 210,154 230,118 C 248,88 262,62 288,52 L 356,50 L 356,310 L 122,310 Z"
            fill="rgba(232,201,126,0.045)"
            fillOpacity={fillOpacity}
          />
        )}

        {/* BEFORE label */}
        <text x={68} y={330}
          fontFamily="monospace" fontSize={13} letterSpacing="0.12em" textAnchor="middle"
          fill={`rgba(196,92,60,${interpolate(frame, [16, 26], [0, 0.65], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })})`}
        >BEFORE</text>

        {/* AFTER label */}
        <text x={320} y={40}
          fontFamily="monospace" fontSize={13} letterSpacing="0.12em" textAnchor="middle"
          fill={`rgba(52,211,153,${interpolate(frame, [82, 96], [0, 0.75], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })})`}
        >AFTER</text>
      </svg>
    </div>
  );
}

// ── Animated NumberedItem — border draws in, turns to checkmark at slide end

function AnimatedNumberedItem({ text, num, delay, slideEnd }: {
  text: string; num: number; delay: number; slideEnd: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 100 } });
  const opacity  = interpolate(frame - delay, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const y        = interpolate(progress, [0, 1], [28, 0]);

  // Circle border draws in over 20 frames on entry
  const ringProgress = interpolate(frame - delay, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const circumference = 2 * Math.PI * 25;

  // Checkmark draws in during last 44 frames of the slide
  const checkStart = Math.max(delay + 30, slideEnd - 44);
  const checkProgress = interpolate(frame - checkStart, [0, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const isChecking = frame > checkStart;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, opacity, transform: `translateY(${y}px)` }}>
      <div style={{ width: 54, height: 54, flexShrink: 0, position: 'relative' }}>
        <svg width={54} height={54} style={{ position: 'absolute', top: 0, left: 0 }}>
          {/* Static background fill */}
          <circle cx={27} cy={27} r={23}
            fill={isChecking ? `rgba(52,211,153,0.08)` : `rgba(232,201,126,0.07)`}
          />
          {/* Animated ring */}
          <circle cx={27} cy={27} r={23}
            fill="none"
            stroke={isChecking ? GREEN : GOLD}
            strokeWidth={2}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - ringProgress)}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '27px 27px' }}
          />
          {/* Number fades out as check fades in */}
          <text x={27} y={33}
            fontFamily="monospace" fontSize={20} fontWeight="700"
            fill={GOLD} textAnchor="middle"
            fillOpacity={1 - checkProgress}
          >{num}</text>
          {/* Checkmark draws in */}
          {isChecking && (
            <path
              d="M 14,27 L 23,36 L 40,17"
              pathLength={1}
              stroke={GREEN} strokeWidth={2.8}
              strokeDasharray={1}
              strokeDashoffset={1 - checkProgress}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </svg>
      </div>
      <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 38, color: WHITE, lineHeight: 1.4, fontWeight: 600 }}>
        {text}
      </span>
    </div>
  );
}

// ── Shared layout chrome ───────────────────────────────────────────────────

function Chrome({ label }: { label?: string }) {
  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: GOLD }} />
      {label && (
        <div style={{
          position: 'absolute', top: 22, left: 56,
          fontFamily: 'monospace', fontSize: 14, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: 'rgba(232,201,126,0.4)',
        }}>
          {label}
        </div>
      )}
      <div style={{
        position: 'absolute', bottom: 28, right: 52,
        fontFamily: 'Georgia, serif', fontSize: 18,
        color: 'rgba(232,201,126,0.15)', fontWeight: 700, letterSpacing: '0.1em',
      }}>
        N  NEST
      </div>
    </>
  );
}

// ── Lesson progress dots ───────────────────────────────────────────────────

function LessonProgress({ current, total }: { current: number; total: number }) {
  return (
    <div style={{
      position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: 8, zIndex: 10, alignItems: 'center',
    }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          width: i === current ? 28 : 8, height: 8, borderRadius: 4,
          background: i <= current ? GOLD : 'rgba(255,255,255,0.14)',
          opacity: i === current ? 1 : i < current ? 0.55 : 0.28,
        }} />
      ))}
    </div>
  );
}

// ── Per-slide contextual image panel ──────────────────────────────────────

function ImagePanel({ imageKey, alt }: { imageKey: string; alt: string }) {
  const anim = useSpringEnter(20);
  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden',
      border: '1px solid rgba(232,201,126,0.18)',
      boxShadow: '0 8px 60px rgba(0,0,0,0.5)',
      opacity: anim.opacity,
      transform: `translateY(${anim.y}px) scale(${anim.scale})`,
    }}>
      <img src={staticFile(imageKey)} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

// ── Background grid ────────────────────────────────────────────────────────

function Grid() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `
        repeating-linear-gradient(90deg, rgba(255,255,255,0.010) 0 1px, transparent 1px 80px),
        repeating-linear-gradient(0deg,  rgba(255,255,255,0.010) 0 1px, transparent 1px 80px)
      `,
    }} />
  );
}

// ── Title Slide ────────────────────────────────────────────────────────────

function TitleSlide({ slide }: { slide: SlideData }) {
  const frame   = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo    = useSpringEnter(3);
  const heading = useSpringEnter(14);
  const sub     = useSpringEnter(28);

  const floatY    = Math.sin(frame * 0.038) * 10;
  const glowPulse = interpolate(Math.sin(frame * 0.055), [-1, 1], [0.06, 0.22]);
  const shimmerX  = interpolate(frame % 100, [0, 100], [-120, 220], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const orbitAngle = (frame * 1.1) % 360;
  const orbitRad   = (orbitAngle * Math.PI) / 180;
  const RING_R     = 74;
  const dotX       = 96 + Math.cos(orbitRad) * RING_R;
  const dotY       = 96 + Math.sin(orbitRad) * RING_R;
  const trailAngle = (frame * 1.1 - 30) % 360;
  const trailRad   = (trailAngle * Math.PI) / 180;
  const trailX     = 96 + Math.cos(trailRad) * RING_R;
  const trailY     = 96 + Math.sin(trailRad) * RING_R;

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 140px' }}>
      {/* Deep radial glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 65% 50% at 50% 42%, rgba(232,201,126,${glowPulse}) 0%, transparent 70%)` }} />
      {/* Horizontal light beam */}
      <div style={{ position: 'absolute', top: '44%', left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent 0%, rgba(232,201,126,0.12) 20%, rgba(232,201,126,0.28) 50%, rgba(232,201,126,0.12) 80%, transparent 100%)`, pointerEvents: 'none' }} />

      {/* Logo + orbital ring */}
      <div style={{ position: 'relative', width: 192, height: 192, marginBottom: 48, opacity: logo.opacity, transform: `scale(${logo.scale}) translateY(${floatY}px)` }}>
        <svg width={192} height={192} style={{ position: 'absolute', inset: 0 }}>
          {/* Static ring */}
          <circle cx={96} cy={96} r={RING_R} fill="none" stroke={`rgba(232,201,126,0.15)`} strokeWidth={1.5} />
          {/* Trail dot */}
          <circle cx={trailX} cy={trailY} r={3} fill={GOLD} opacity={0.3} />
          {/* Orbiting dot */}
          <circle cx={dotX} cy={dotY} r={5} fill={GOLD} opacity={0.9}>
            <animate attributeName="opacity" values="0.9;1;0.9" dur="1.2s" repeatCount="indefinite" />
          </circle>
          {/* Glow on orbiting dot */}
          <circle cx={dotX} cy={dotY} r={10} fill={`rgba(232,201,126,0.2)`} />
        </svg>
        {/* N box */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 96, height: 96, border: `1.5px solid rgba(232,201,126,0.5)`,
          borderRadius: 22, background: 'rgba(232,201,126,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 40px rgba(232,201,126,${glowPulse}), inset 0 0 20px rgba(232,201,126,0.04)`,
        }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 54, fontWeight: 700, color: GOLD, lineHeight: 1 }}>N</span>
        </div>
      </div>

      {/* Gradient heading */}
      <h1 style={{
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        fontSize: 88, fontWeight: 800, lineHeight: 1.05,
        letterSpacing: '-0.035em',
        background: `linear-gradient(135deg, ${GOLD2} 0%, ${WHITE} 45%, ${GOLD} 100%)`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        textAlign: 'center', margin: 0, maxWidth: 1280,
        opacity: heading.opacity, transform: `translateY(${heading.y}px)`,
      }}>
        {slide.heading}
      </h1>

      {/* Shimmer divider */}
      <div style={{ width: 96, height: 2, borderRadius: 2, margin: '36px 0', opacity: sub.opacity, overflow: 'hidden', position: 'relative', background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)`, transform: `translateX(${shimmerX}%)` }} />
      </div>

      {slide.subheading && (
        <p style={{
          fontFamily: '"Helvetica Neue", Arial, sans-serif', fontSize: 28,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'rgba(232,201,126,0.6)', textAlign: 'center', margin: 0,
          opacity: sub.opacity, transform: `translateY(${sub.y}px)`,
        }}>
          {slide.subheading}
        </p>
      )}
    </AbsoluteFill>
  );
}

// ── Hook Slide — text left, live sketch right ──────────────────────────────

function HookSlide({ slide }: { slide: SlideData }) {
  const badge   = useSpringEnter(0);
  const problem = useSpringEnter(12);
  const cta     = useSpringEnter(28);
  const sketch  = useSpringEnter(6);

  const storyText = slide.story ?? slide.subheading ?? '';

  return (
    <AbsoluteFill style={{ padding: '80px 100px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 56 }}>
      <div style={{
        position: 'absolute', top: '30%', left: '30%', transform: 'translate(-50%,-50%)',
        width: 600, height: 450,
        background: `radial-gradient(ellipse, rgba(232,201,126,0.06) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Left: text block */}
      <div style={{ flex: '0 0 58%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          border: `1px solid ${GOLD}`, borderRadius: 8, padding: '8px 20px',
          background: 'rgba(232,201,126,0.06)', alignSelf: 'flex-start', marginBottom: 36,
          opacity: badge.opacity, transform: `translateY(${badge.y}px)`,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD }} />
          <span style={{ fontFamily: 'monospace', fontSize: 14, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, fontWeight: 700 }}>
            The Problem
          </span>
        </div>

        <h2 style={{
          fontFamily: 'Georgia, serif', fontSize: 60, fontWeight: 700,
          color: WHITE, lineHeight: 1.35, margin: '0 0 44px', maxWidth: 860,
          opacity: problem.opacity, transform: `translateY(${problem.y}px)`,
        }}>
          {storyText}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, opacity: cta.opacity, transform: `translateY(${cta.y}px)` }}>
          <div style={{ width: 60, height: 3, background: GOLD, borderRadius: 2 }} />
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 30, color: GRAY, margin: 0, fontStyle: 'italic' }}>
            {slide.heading}
          </p>
        </div>
      </div>

      {/* Right: live drawing */}
      <div style={{
        flex: 1, height: '80%', minHeight: 340,
        opacity: sketch.opacity,
        transform: `translateY(${sketch.y}px) scale(${sketch.scale})`,
      }}>
        <HookSketch />
      </div>
    </AbsoluteFill>
  );
}

// ── Content Slide ──────────────────────────────────────────────────────────

function ContentSlide({ slide }: { slide: SlideData }) {
  const eyebrow = useSpringEnter(0);
  const heading = useSpringEnter(6);
  const rule    = useSpringEnter(16);
  const bullets = slide.bullets ?? [];
  const hasImage = !!slide.image_key;

  const textBlock = (
    <div style={{ display: 'flex', flexDirection: 'column', width: '54%' }}>
      <div style={{ fontFamily: 'monospace', fontSize: 15, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(232,201,126,0.45)', marginBottom: 18, opacity: eyebrow.opacity }}>
        Nest · Lesson
      </div>
      <h2 style={{
        fontFamily: 'Georgia, serif', fontSize: 60, fontWeight: 700,
        lineHeight: 1.15, letterSpacing: '-0.02em', color: WHITE,
        margin: '0 0 16px',
        opacity: heading.opacity, transform: `translateY(${heading.y}px)`,
      }}>
        {slide.heading}
      </h2>
      <div style={{ width: 110, height: 3, background: GOLD, borderRadius: 2, marginBottom: 32, opacity: rule.opacity }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {bullets[0] && <Bullet text={bullets[0]} delay={24} iconIndex={0} />}
        {bullets[1] && <Bullet text={bullets[1]} delay={38} iconIndex={1} />}
        {bullets[2] && <Bullet text={bullets[2]} delay={52} iconIndex={2} />}
        {bullets[3] && <Bullet text={bullets[3]} delay={66} iconIndex={3} />}
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ padding: '90px 110px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 56, flex: 1, alignItems: 'center' }}>
        {textBlock}
        <div style={{ flex: 1, height: '82%' }}>
          {hasImage ? (
            <ImagePanel imageKey={slide.image_key!} alt={slide.heading} />
          ) : slide.visual_hint === 'graph' && slide.graph_data ? (
            <MathGraphViz data={slide.graph_data} />
          ) : slide.visual_hint === 'timeline' ? (
            <TimelineViz bullets={bullets} />
          ) : slide.visual_hint === 'cycle' ? (
            <CycleViz bullets={bullets} />
          ) : slide.visual_hint === 'stats' ? (
            <StatsViz bullets={bullets} />
          ) : (
            <ConceptMap bullets={bullets} />
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Generic Step Visual ────────────────────────────────────────────────────

function StepVisual({ slide, activeStep, totalSteps, frame, framesPerStep }: {
  slide: SlideData; activeStep: number; totalSteps: number; frame: number; framesPerStep: number;
}) {
  const cursorBlink = Math.sin(frame * 0.25) > 0;
  const promptStep   = Math.max(2, Math.floor(totalSteps * 0.5));
  const responseStep = Math.max(3, Math.floor(totalSteps * 0.72));
  const showPrompt   = activeStep >= promptStep && !!slide.example_prompt;
  const showResponse = activeStep >= responseStep && !!slide.ai_response;
  const promptText   = slide.example_prompt ?? '';
  const responseText = slide.ai_response ?? '';

  const promptChars = showPrompt
    ? Math.min(promptText.length, Math.floor(
        interpolate(frame, [promptStep * framesPerStep, (promptStep + 1) * framesPerStep * 0.9],
          [0, promptText.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })))
    : 0;
  const responseChars = showResponse
    ? Math.min(responseText.length, Math.floor(
        interpolate(frame, [responseStep * framesPerStep, (responseStep + 1.5) * framesPerStep],
          [0, responseText.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })))
    : 0;

  const progressPct = Math.min(1, frame / Math.max(1, totalSteps * framesPerStep));
  const stepEnter   = interpolate(frame, [activeStep * framesPerStep, activeStep * framesPerStep + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        background: 'rgba(232,201,126,0.06)', border: `2px solid ${GOLD}`, borderRadius: 20,
        padding: '32px 36px', boxShadow: `0 0 50px rgba(232,201,126,0.10)`,
        opacity: stepEnter, transform: `translateY(${interpolate(stepEnter, [0, 1], [16, 0])}px)`,
        flex: showPrompt ? '0 0 auto' : 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: GOLD, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: DARK }}>{activeStep + 1}</span>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,201,126,0.55)' }}>
            Doing now
          </span>
        </div>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 32, fontWeight: 700, color: WHITE, margin: 0, lineHeight: 1.45 }}>
          {slide.steps?.[activeStep] ?? ''}
        </p>
      </div>

      {showPrompt && (
        <div style={{
          background: DARK, border: `1.5px solid rgba(232,201,126,0.4)`, borderRadius: 16,
          padding: '22px 28px', flex: showResponse ? '0 0 auto' : 1,
          opacity: interpolate(frame, [promptStep * framesPerStep, promptStep * framesPerStep + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(232,201,126,0.5)', marginBottom: 10 }}>
            USE THIS  ↓
          </div>
          <p style={{ fontFamily: 'system-ui', fontSize: 22, color: GOLD, margin: 0, lineHeight: 1.55 }}>
            {promptText.slice(0, promptChars)}
            {promptChars < promptText.length && cursorBlink && (
              <span style={{ borderRight: `2px solid ${GOLD}`, marginLeft: 2 }}>&nbsp;</span>
            )}
          </p>
        </div>
      )}

      {showResponse && (
        <div style={{
          background: 'rgba(52,211,153,0.06)', border: `1.5px solid ${GREEN}`, borderRadius: 16,
          padding: '22px 28px', flex: 1,
          opacity: interpolate(frame, [responseStep * framesPerStep, responseStep * framesPerStep + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: `rgba(52,211,153,0.6)`, marginBottom: 10 }}>
            RESULT  ✓
          </div>
          <p style={{ fontFamily: 'system-ui', fontSize: 21, color: 'rgba(232,228,220,0.9)', margin: 0, lineHeight: 1.6 }}>
            {responseText.slice(0, responseChars)}
            {responseChars < responseText.length && cursorBlink && (
              <span style={{ borderRight: `2px solid ${GREEN}`, marginLeft: 2 }}>&nbsp;</span>
            )}
          </p>
        </div>
      )}

      <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progressPct * 100}%`, background: `linear-gradient(90deg, ${GOLD}, ${GREEN})`, borderRadius: 2 }} />
      </div>
    </div>
  );
}

// ── Step Flowchart — card-based step list with animated connectors ─────────
// Replaces the dot+text list in WalkthroughSlide. Each step is a rounded card
// that draws in as its turn arrives. Connector lines animate between cards.

function StepFlowchart({ steps, activeStep, frame, framesPerStep }: {
  steps: string[]; activeStep: number; frame: number; framesPerStep: number;
}) {
  const glowPulse = interpolate(Math.sin(frame * 0.12), [-1, 1], [0.3, 1]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: 0 }}>
      {steps.map((step, i) => {
        const isDone   = i < activeStep;
        const isActive = i === activeStep;

        // Card entry: each card animates in at its step start
        const entryF = frame - i * Math.floor(framesPerStep);
        const entryP = interpolate(entryF, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const cardOpacity = i > activeStep + 2 ? 0.14 : interpolate(entryF, [0, 14], [0.14, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const cardY = isDone || isActive ? interpolate(entryP, [0, 1], [12, 0]) : 0;

        // Connector line fills in as next step becomes active
        const lineP = i < steps.length - 1
          ? interpolate(frame - (i + 1) * Math.floor(framesPerStep), [0, Math.floor(framesPerStep * 0.28)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          : 0;

        return (
          <div key={i}>
            {/* Step card */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 18,
              borderRadius: 14, padding: isActive ? '16px 20px' : '9px 14px',
              background: isDone ? 'rgba(52,211,153,0.07)' : isActive ? 'rgba(232,201,126,0.11)' : 'rgba(255,255,255,0.02)',
              border: `${isActive ? 2 : 1.5}px solid ${isDone ? 'rgba(52,211,153,0.35)' : isActive ? `rgba(232,201,126,0.7)` : 'rgba(255,255,255,0.06)'}`,
              boxShadow: isActive ? `0 0 40px rgba(232,201,126,${glowPulse * 0.5}), inset 0 0 24px rgba(232,201,126,0.05)` : 'none',
              opacity: cardOpacity,
              transform: `translateY(${cardY}px)`,
              transition: 'padding 0.3s',
            }}>
              {/* Node */}
              <div style={{
                width: isActive ? 48 : 38, height: isActive ? 48 : 38,
                borderRadius: '50%', flexShrink: 0,
                background: isDone ? GREEN : isActive ? GOLD : 'rgba(255,255,255,0.06)',
                border: `2px solid ${isDone ? GREEN : isActive ? GOLD : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isActive ? `0 0 24px rgba(232,201,126,${glowPulse * 0.8})` : 'none',
              }}>
                {isDone
                  ? <span style={{ fontSize: 18, color: DARK, fontWeight: 700 }}>✓</span>
                  : <span style={{ fontFamily: 'monospace', fontSize: isActive ? 20 : 15, fontWeight: 700, color: isActive ? DARK : 'rgba(255,255,255,0.3)' }}>{i + 1}</span>
                }
              </div>
              {/* Text */}
              <p style={{
                fontFamily: '"Helvetica Neue", Arial, sans-serif', margin: 0, lineHeight: 1.4,
                fontSize: isActive ? 24 : 16,
                fontWeight: isActive ? 700 : 400,
                color: isDone ? GREEN : isActive ? WHITE : GRAY,
                letterSpacing: isActive ? '-0.01em' : '0',
              }}>
                {step}
              </p>
            </div>

            {/* Animated connector line */}
            {i < steps.length - 1 && (
              <div style={{ paddingLeft: 28, height: 20, display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 2, height: `${lineP * 100}%`, maxHeight: 20,
                  background: isDone ? GREEN : 'rgba(232,201,126,0.35)',
                  borderRadius: 1,
                }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Walkthrough Slide ──────────────────────────────────────────────────────

function WalkthroughSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const steps = slide.steps ?? slide.bullets ?? [];
  // Reserve 20 frames for heading entrance, then divide remaining frames evenly
  const HEADING_FRAMES = 20;
  const usableFrames  = Math.max(1, slide.duration_frames - HEADING_FRAMES);
  const framesPerStep = Math.max(1, usableFrames / Math.max(steps.length, 1));
  const rawStep       = Math.floor(Math.max(0, frame - HEADING_FRAMES) / framesPerStep);
  const activeStep    = Math.min(steps.length - 1, rawStep);

  const headingAnim = useSpringEnter(0);
  const screenAnim  = useSpringEnter(10);

  return (
    <AbsoluteFill style={{ padding: '60px 72px 56px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
        <h2 style={{
          fontFamily: 'Georgia, serif', fontSize: 54, fontWeight: 700,
          color: WHITE, margin: 0, lineHeight: 1.2, maxWidth: 900,
          opacity: headingAnim.opacity, transform: `translateY(${headingAnim.y}px)`,
        }}>
          {slide.heading}
        </h2>
        <div style={{
          fontFamily: 'monospace', fontSize: 18, color: GRAY,
          border: `1px solid ${GOLD}`, borderRadius: 8, padding: '8px 22px', flexShrink: 0,
          background: 'rgba(232,201,126,0.08)',
        }}>
          Step {activeStep + 1} / {steps.length}
        </div>
      </div>

      {/* Steps list + visual */}
      <div style={{ flex: 1, display: 'flex', gap: 48, minHeight: 0 }}>
        {/* Left: flowchart step cards */}
        <div style={{ width: '36%' }}>
          <StepFlowchart
            steps={steps}
            activeStep={activeStep}
            frame={frame}
            framesPerStep={framesPerStep}
          />
        </div>

        {/* Right: step visual */}
        <div style={{ flex: 1, opacity: screenAnim.opacity, transform: `translateY(${screenAnim.y}px)` }}>
          <StepVisual
            slide={slide} activeStep={activeStep}
            totalSteps={steps.length} frame={frame} framesPerStep={framesPerStep}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Before / After infographic panel ─────────────────────────────────────
// Replaces TransformCurve when no image. Split-panel: BEFORE (TERRA) | AFTER (GREEN)
// with animated X / checkmark icons + two stat chips at the bottom.

function BeforeAfterPanel({ bullets }: { bullets: string[] }) {
  const frame = useCurrentFrame();
  const beforeIn  = interpolate(frame, [0,  20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const afterIn   = interpolate(frame, [26, 46], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const stat1In   = interpolate(frame, [52, 64], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const stat2In   = interpolate(frame, [62, 74], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Main split */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', gap: 14 }}>

        {/* BEFORE panel */}
        <div style={{
          flex: 1, borderRadius: 20,
          background: 'rgba(196,92,60,0.08)',
          border: `1.5px solid rgba(196,92,60,${0.4 * beforeIn})`,
          padding: '28px 22px', display: 'flex', flexDirection: 'column',
          opacity: beforeIn,
          transform: `translateX(${interpolate(beforeIn, [0, 1], [-18, 0])}px)`,
          boxShadow: `inset 0 0 40px rgba(196,92,60,${0.04 * beforeIn})`,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.22em', color: TERRA, marginBottom: 20 }}>BEFORE</span>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
            {/* X icon draws in */}
            <svg width={52} height={52} style={{ marginBottom: 4 }}>
              <DrawPath d="M10 10 L42 42" stroke={TERRA} strokeWidth={4} delay={4}  duration={14} />
              <DrawPath d="M42 10 L10 42" stroke={TERRA} strokeWidth={4} delay={10} duration={14} />
            </svg>
            <p style={{ fontFamily: 'system-ui', fontSize: 24, color: 'rgba(232,228,220,0.72)', lineHeight: 1.5, margin: 0 }}>
              {bullets[0] ?? ''}
            </p>
          </div>
        </div>

        {/* Arrow */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <svg width={54} height={54} viewBox="0 0 54 54" fill="none">
            <DrawPath d="M4 27 L42 27"   stroke={GOLD} strokeWidth={2.5} delay={22} duration={12} />
            <DrawPath d="M34 17 L46 27 L34 37" stroke={GOLD} strokeWidth={2.5} delay={30} duration={11} />
          </svg>
        </div>

        {/* AFTER panel */}
        <div style={{
          flex: 1, borderRadius: 20,
          background: 'rgba(52,211,153,0.07)',
          border: `1.5px solid rgba(52,211,153,${0.4 * afterIn})`,
          padding: '28px 22px', display: 'flex', flexDirection: 'column',
          opacity: afterIn,
          transform: `translateX(${interpolate(afterIn, [0, 1], [18, 0])}px)`,
          boxShadow: `inset 0 0 40px rgba(52,211,153,${0.04 * afterIn})`,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.22em', color: GREEN, marginBottom: 20 }}>AFTER</span>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
            {/* Checkmark circle draws in */}
            <svg width={52} height={52} style={{ marginBottom: 4 }}>
              <DrawCircle cx={26} cy={26} r={20} stroke={GREEN} strokeWidth={2.5} delay={28} duration={18} />
              <DrawPath d="M14 26 L22 34 L38 16" stroke={GREEN} strokeWidth={3} delay={38} duration={14} />
            </svg>
            <p style={{ fontFamily: 'system-ui', fontSize: 24, color: 'rgba(232,228,220,0.92)', lineHeight: 1.5, margin: 0 }}>
              {bullets[1] ?? ''}
            </p>
          </div>
        </div>
      </div>

      {/* Stat chips — bullets[2] and bullets[3] */}
      <div style={{ display: 'flex', gap: 14 }}>
        {bullets[2] && (
          <div style={{
            flex: 1, borderRadius: 12, padding: '13px 18px',
            background: 'rgba(232,201,126,0.07)', border: `1px solid rgba(232,201,126,0.25)`,
            opacity: stat1In, transform: `translateY(${interpolate(stat1In, [0, 1], [10, 0])}px)`,
          }}>
            <span style={{ fontFamily: 'system-ui', fontSize: 21, color: GOLD, lineHeight: 1.4 }}>{bullets[2]}</span>
          </div>
        )}
        {bullets[3] && (
          <div style={{
            flex: 1, borderRadius: 12, padding: '13px 18px',
            background: 'rgba(52,211,153,0.06)', border: `1px solid rgba(52,211,153,0.2)`,
            opacity: stat2In, transform: `translateY(${interpolate(stat2In, [0, 1], [10, 0])}px)`,
          }}>
            <span style={{ fontFamily: 'system-ui', fontSize: 21, color: GREEN, lineHeight: 1.4 }}>{bullets[3]}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Example Slide ──────────────────────────────────────────────────────────

function ExampleSlide({ slide }: { slide: SlideData }) {
  const badge   = useSpringEnter(0);
  const heading = useSpringEnter(10);
  const bullets = slide.bullets ?? [];
  const hasImage = !!slide.image_key;
  const arrowPrefix = <span style={{ fontFamily: 'monospace', fontSize: 26, color: TERRA, fontWeight: 700, flexShrink: 0, marginTop: 8 }}>→</span>;

  const textBlock = (
    <div style={{ display: 'flex', flexDirection: 'column', width: '54%' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        border: `1px solid ${TERRA}`, borderRadius: 7, padding: '6px 18px',
        background: 'rgba(196,92,60,0.09)', marginBottom: 28, alignSelf: 'flex-start',
        opacity: badge.opacity, transform: `translateY(${badge.y}px)`,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: TERRA }} />
        <span style={{ fontFamily: 'monospace', fontSize: 15, letterSpacing: '0.16em', textTransform: 'uppercase', color: TERRA, fontWeight: 700 }}>Real World Example</span>
      </div>
      <h2 style={{
        fontFamily: 'Georgia, serif', fontSize: 56, fontWeight: 700,
        lineHeight: 1.2, color: WHITE, margin: '0 0 28px',
        opacity: heading.opacity, transform: `translateY(${heading.y}px)`,
      }}>
        {slide.heading}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {bullets[0] && <Bullet text={bullets[0]} delay={22} color="rgba(232,228,220,0.85)" prefix={arrowPrefix} />}
        {bullets[1] && <Bullet text={bullets[1]} delay={34} color="rgba(232,228,220,0.85)" prefix={arrowPrefix} />}
        {bullets[2] && <Bullet text={bullets[2]} delay={46} color="rgba(232,228,220,0.85)" prefix={arrowPrefix} />}
        {bullets[3] && <Bullet text={bullets[3]} delay={58} color="rgba(232,228,220,0.85)" prefix={arrowPrefix} />}
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ padding: '90px 110px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 56, flex: 1, alignItems: 'center' }}>
        {textBlock}
        <div style={{ flex: 1, height: '82%' }}>
          {hasImage
            ? <ImagePanel imageKey={slide.image_key!} alt={slide.heading} />
            : <BeforeAfterPanel bullets={bullets} />
          }
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Practice Slide ─────────────────────────────────────────────────────────

function PracticeSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badge  = useSpringEnter(0);
  const task   = useSpringEnter(14);
  const box    = useSpringEnter(26);
  const steps  = useSpringEnter(48);

  const promptText = slide.example_prompt ?? '';
  const typedChars = Math.min(
    promptText.length,
    Math.floor(interpolate(frame, [fps * 1.2, fps * 4.5], [0, promptText.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  );
  const cursorBlink = Math.sin(frame * 0.22) > 0;

  const timerTotal = slide.timer_seconds ?? 120;
  const timerLeft  = Math.max(0, timerTotal - Math.floor(frame / fps));
  const timerPct   = timerLeft / timerTotal;

  const R = 54; const CX = 66; const CY = 66;
  const circumference = 2 * Math.PI * R;

  return (
    <AbsoluteFill style={{ padding: '72px 100px', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 14,
        background: 'linear-gradient(135deg, rgba(232,201,126,0.18), rgba(232,201,126,0.04))',
        border: `1.5px solid ${GOLD}`, borderRadius: 12, padding: '10px 26px',
        alignSelf: 'flex-start', marginBottom: 36,
        opacity: badge.opacity, transform: `translateY(${badge.y}px)`,
        boxShadow: `0 0 32px rgba(232,201,126,0.12)`,
      }}>
        <span style={{ fontSize: 28 }}>🎯</span>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: GOLD, letterSpacing: '0.04em' }}>
          YOUR TURN — DO IT RIGHT NOW
        </span>
      </div>

      <h2 style={{
        fontFamily: 'Georgia, serif', fontSize: 54, fontWeight: 700, color: WHITE,
        margin: '0 0 36px', lineHeight: 1.25, maxWidth: 1200,
        opacity: task.opacity, transform: `translateY(${task.y}px)`,
      }}>
        {slide.task ?? slide.heading}
      </h2>

      {promptText && (
        <div style={{
          background: '#1e2030', border: `2px solid ${GOLD}`, borderRadius: 20,
          padding: '28px 40px', marginBottom: 40,
          boxShadow: `0 0 50px rgba(232,201,126,0.12)`,
          opacity: box.opacity, transform: `translateY(${box.y}px)`,
          position: 'relative',
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(232,201,126,0.5)', marginBottom: 14 }}>
            COPY THIS  ↓
          </div>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 30, color: WHITE, margin: 0, lineHeight: 1.55 }}>
            {promptText.slice(0, typedChars)}
            {typedChars < promptText.length && cursorBlink && (
              <span style={{ borderRight: `3px solid ${GOLD}`, marginLeft: 2, opacity: 0.9 }}>&nbsp;</span>
            )}
          </p>
          {typedChars >= promptText.length && (
            <div style={{
              position: 'absolute', top: 20, right: 28,
              fontFamily: 'monospace', fontSize: 12, letterSpacing: '0.12em',
              color: GREEN, border: `1px solid ${GREEN}`, borderRadius: 6, padding: '4px 12px',
            }}>
              READY
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 48, opacity: steps.opacity, transform: `translateY(${steps.y}px)` }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {['Pause this video right now', 'Use the prompt above — adapt it to your own situation', 'Come back and share what you got'].map((line, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: DARK }}>{i + 1}</span>
              </div>
              <p style={{ fontFamily: 'system-ui', fontSize: 26, color: GRAY, margin: 0, lineHeight: 1.45 }}>{line}</p>
            </div>
          ))}
        </div>
        <div style={{ flexShrink: 0, position: 'relative', width: 132, height: 132 }}>
          <svg width={132} height={132} style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
            <circle cx={CX} cy={CY} r={R} fill="none"
              stroke={timerPct > 0.3 ? GOLD : TERRA} strokeWidth={8}
              strokeDasharray={`${timerPct * circumference} ${circumference}`}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 34, fontWeight: 700, color: timerPct > 0.3 ? GOLD : TERRA, lineHeight: 1 }}>{timerLeft}</span>
            <span style={{ fontFamily: 'system-ui', fontSize: 14, color: GRAY }}>sec</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Quiz Checkpoint Slide ──────────────────────────────────────────────────
// Shows question + 4 options. Timer counts down, then correct answer reveals
// with green glow + particle burst. Wrong answers shake and dim.

function QuizSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const options     = slide.quiz_options ?? [];
  const REVEAL      = Math.floor(slide.duration_frames * 0.60);
  const isRevealed  = frame >= REVEAL;
  const correctIdx  = options.findIndex(o => o.correct);

  const badgeIn    = useSpringEnter(0);
  const questionIn = useSpringEnter(12);
  const ruleIn     = useSpringEnter(22);

  const timerPct = Math.max(0, 1 - frame / Math.max(1, REVEAL));

  // Damped shake for wrong answers after reveal
  const shakeT = Math.max(0, frame - REVEAL);
  const shakeAmp = shakeT < 22 ? interpolate(shakeT, [0, 22], [7, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
  const shakeX = Math.sin(shakeT * 1.3) * shakeAmp;

  // Particle burst near correct card position
  const col    = correctIdx % 2;
  const row    = Math.floor(correctIdx / 2);
  const burstX = 260 + col * 720;
  const burstY = 420 + row * 200;

  return (
    <AbsoluteFill style={{ padding: '64px 100px', display: 'flex', flexDirection: 'column' }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 65% 50% at 50% 38%, rgba(232,201,126,0.07) 0%, transparent 68%)`,
      }} />

      {/* CHECKPOINT badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 14, alignSelf: 'flex-start',
        border: `1.5px solid ${GOLD}`, borderRadius: 10, padding: '8px 24px',
        background: 'rgba(232,201,126,0.09)', marginBottom: 26,
        boxShadow: `0 0 28px rgba(232,201,126,0.10)`,
        opacity: badgeIn.opacity, transform: `translateY(${badgeIn.y}px)`,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: GOLD,
          boxShadow: `0 0 8px ${GOLD}` }} />
        <span style={{ fontFamily: 'monospace', fontSize: 15, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: GOLD, fontWeight: 700 }}>
          Checkpoint
        </span>
      </div>

      {/* Question */}
      <h2 style={{
        fontFamily: 'Georgia, serif', fontSize: 52, fontWeight: 700,
        color: WHITE, margin: '0 0 10px', lineHeight: 1.25, maxWidth: 1400,
        opacity: questionIn.opacity, transform: `translateY(${questionIn.y}px)`,
      }}>
        {slide.heading}
      </h2>
      <div style={{ width: 100, height: 3, background: GOLD, borderRadius: 2, marginBottom: 32, opacity: ruleIn.opacity }} />

      {/* Options — 2 × 2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, flex: 1 }}>
        {options.slice(0, 4).map((opt, i) => {
          const enterDelay = 30 + i * 14;
          const enterOp    = interpolate(frame - enterDelay, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const enterY     = interpolate(
            spring({ frame: frame - enterDelay, fps, config: { damping: 18, stiffness: 100 } }),
            [0, 1], [28, 0]
          );
          const isCorrect = opt.correct;
          const isWrong   = isRevealed && !isCorrect;
          const isRight   = isRevealed && isCorrect;
          const correctGlow = isRight
            ? interpolate(Math.sin(frame * 0.11), [-1, 1], [0.28, 0.60])
            : 0;
          const revealOp   = interpolate(frame - REVEAL, [0, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

          return (
            <div key={i} style={{
              borderRadius: 20, padding: '26px 30px',
              background: isRight
                ? 'rgba(52,211,153,0.10)'
                : isWrong ? 'rgba(255,255,255,0.02)'
                : 'rgba(232,201,126,0.06)',
              border: `2px solid ${
                isRight ? GREEN
                : isWrong ? 'rgba(255,255,255,0.07)'
                : 'rgba(232,201,126,0.35)'
              }`,
              opacity: isWrong ? enterOp * 0.28 : enterOp,
              transform: `translateY(${enterY}px) translateX(${isWrong ? shakeX : 0}px)`,
              boxShadow: isRight ? `0 0 48px rgba(52,211,153,${correctGlow * 0.35})` : 'none',
              position: 'relative',
              display: 'flex', alignItems: 'center', gap: 20,
            }}>
              {/* Letter badge */}
              <div style={{
                width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                background: isRight ? GREEN : isWrong ? 'rgba(255,255,255,0.04)' : 'rgba(232,201,126,0.12)',
                border: `2px solid ${isRight ? GREEN : isWrong ? 'rgba(255,255,255,0.08)' : GOLD}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isRight ? `0 0 20px rgba(52,211,153,${correctGlow})` : 'none',
              }}>
                <span style={{
                  fontFamily: 'monospace', fontSize: 20, fontWeight: 700,
                  color: isRight ? DARK : isWrong ? GRAY : GOLD,
                }}>
                  {isRight ? '✓' : String.fromCharCode(65 + i)}
                </span>
              </div>
              <p style={{
                fontFamily: 'system-ui, sans-serif', fontSize: 26, fontWeight: 600,
                color: isRight ? GREEN : isWrong ? GRAY : WHITE,
                margin: 0, lineHeight: 1.35,
              }}>{opt.text}</p>
              {isRight && (
                <div style={{
                  position: 'absolute', top: 12, right: 16,
                  fontFamily: 'monospace', fontSize: 12, color: GREEN,
                  border: `1px solid ${GREEN}`, borderRadius: 6, padding: '3px 10px',
                  opacity: revealOp,
                }}>CORRECT</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Timer bar — counts down to reveal */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', marginTop: 22 }}>
        <div style={{
          height: '100%',
          width: `${(isRevealed ? 0 : timerPct) * 100}%`,
          background: `linear-gradient(90deg, ${GOLD}, rgba(232,201,126,0.4))`,
          borderRadius: 2,
        }} />
      </div>

      {/* Aha burst on correct card + centre */}
      <ParticleBurst triggerFrame={REVEAL}     cx={burstX}  cy={burstY}  count={40} />
      <ParticleBurst triggerFrame={REVEAL + 5} cx={960}     cy={540}     count={22} />
    </AbsoluteFill>
  );
}

// ── Summary Slide — animated numbered items with drawing circles ───────────

function SummarySlide({ slide }: { slide: SlideData }) {
  const label   = useSpringEnter(0);
  const heading = useSpringEnter(10);
  const rule    = useSpringEnter(18);
  const bullets = slide.bullets ?? [];
  return (
    <AbsoluteFill style={{ padding: '90px 110px', display: 'flex', flexDirection: 'column' }}>
      <ParticleBurst triggerFrame={22} cx={960} cy={200} count={24} />
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
        {bullets[0] && <Bullet text={bullets[0]} delay={26} iconIndex={0} />}
        {bullets[1] && <Bullet text={bullets[1]} delay={40} iconIndex={1} />}
        {bullets[2] && <Bullet text={bullets[2]} delay={54} iconIndex={2} />}
        {bullets[3] && <Bullet text={bullets[3]} delay={68} iconIndex={3} />}
      </div>
    </AbsoluteFill>
  );
}

// ── Worked Example Slide — math steps write themselves stroke by stroke ───────
//
// Each expression renders in two SVG layers:
//   1. Stroke-only text animates stroke-dashoffset 1→0  (the "pen drawing" phase)
//   2. Fill text fades in once the stroke is done       (solid readable text)
// A gold underline draws left-to-right after each expression.
// The final answer step gets a gold rectangle drawn around it.

function MathStepItem({ step, delay, isActive, isDone, framesPerStep }: {
  step: MathStep; delay: number;
  isActive: boolean; isDone: boolean;
  framesPerStep: number;
}) {
  const frame = useCurrentFrame();

  const STROKE_DUR  = Math.min(28, framesPerStep * 0.45);
  const FILL_START  = STROKE_DUR * 0.7;
  const LINE_START  = STROKE_DUR * 0.85;
  const ANNOT_START = STROKE_DUR + 6;
  const BOX_START   = STROKE_DUR + 10;

  const strokeProgress = interpolate(frame - delay, [0, STROKE_DUR], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fillOpacity    = interpolate(frame - delay - FILL_START,  [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const strokeOpacity  = interpolate(frame - delay - FILL_START,  [0, 14], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lineWidth      = interpolate(frame - delay - LINE_START,  [0, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const annotOpacity   = interpolate(frame - delay - ANNOT_START, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const boxProgress    = step.highlight
    ? interpolate(frame - delay - BOX_START, [0, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;

  const containerOpacity = isDone ? 0.38 : isActive ? 1 : 0;
  const exprColor = step.highlight ? GOLD : WHITE;

  // SVG stroke dasharray — large enough to cover any math expression
  const DASH = 2400;

  return (
    <div style={{ opacity: containerOpacity, position: 'relative', paddingBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>

        {/* Expression + underline + box */}
        <div style={{ position: 'relative', minWidth: 560, flex: '0 0 auto' }}>
          <svg width={700} height={72} viewBox="0 0 700 72" style={{ overflow: 'visible', display: 'block' }}>
            {/* Highlight box draws around final answer */}
            {boxProgress > 0 && (
              <rect x={-10} y={2} width={720} height={68}
                fill={`rgba(232,201,126,0.07)`}
                stroke={GOLD} strokeWidth={2.5}
                rx={10}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - boxProgress}
                style={{ filter: `drop-shadow(0 0 12px rgba(232,201,126,${boxProgress * 0.4}))` }}
              />
            )}

            {/* Fill layer — fades in after stroke */}
            <text x={8} y={54}
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize={50} fontWeight="400"
              fill={exprColor} fillOpacity={fillOpacity}
              stroke="none"
            >{step.expression}</text>

            {/* Stroke layer — draws in */}
            <text x={8} y={54}
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize={50} fontWeight="400"
              fill="none"
              stroke={exprColor} strokeWidth={1.2}
              strokeDasharray={DASH}
              strokeDashoffset={DASH * (1 - strokeProgress)}
              strokeOpacity={strokeOpacity}
              strokeLinecap="round" strokeLinejoin="round"
            >{step.expression}</text>
          </svg>

          {/* Underline draws left → right */}
          <div style={{
            position: 'absolute', bottom: 0, left: 8,
            width: `${lineWidth * 96}%`, height: step.highlight ? 2.5 : 1.5,
            background: step.highlight ? GOLD : `rgba(232,201,126,0.3)`,
            borderRadius: 2,
          }} />
        </div>

        {/* Annotation */}
        {step.annotation && (
          <span style={{
            fontFamily: 'system-ui, sans-serif', fontSize: 22,
            color: step.highlight ? `rgba(232,201,126,0.75)` : GRAY,
            fontStyle: 'italic', opacity: annotOpacity, flexShrink: 0, maxWidth: 380,
          }}>
            ← {step.annotation}
          </span>
        )}
      </div>
    </div>
  );
}

function WorkedExampleSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const label   = useSpringEnter(0);
  const heading = useSpringEnter(8);

  const mathSteps = slide.math_steps ?? [];
  const framesPerStep = Math.max(1, slide.duration_frames / Math.max(mathSteps.length, 1));
  const activeStep    = Math.min(mathSteps.length - 1, Math.floor(frame / framesPerStep));

  // Subtle glow that pulses on the active step
  const glowPulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.06, 0.14]);

  return (
    <AbsoluteFill style={{ padding: '70px 110px', display: 'flex', flexDirection: 'column' }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 60% 40% at 50% 60%, rgba(232,201,126,${glowPulse}) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Label */}
      <div style={{
        fontFamily: 'monospace', fontSize: 14, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: `rgba(232,201,126,0.5)`,
        marginBottom: 14, opacity: label.opacity,
      }}>
        Maths · Worked Example
      </div>

      {/* Heading */}
      <h2 style={{
        fontFamily: 'Georgia, serif', fontSize: 54, fontWeight: 700,
        color: WHITE, margin: '0 0 36px', lineHeight: 1.2,
        opacity: heading.opacity, transform: `translateY(${heading.y}px)`,
      }}>
        {slide.heading}
      </h2>

      {/* Step counter badge */}
      <div style={{
        position: 'absolute', top: 70, right: 110,
        fontFamily: 'monospace', fontSize: 16, color: GRAY,
        border: `1px solid ${GOLD}`, borderRadius: 8, padding: '6px 18px',
        background: 'rgba(232,201,126,0.07)',
      }}>
        Step {activeStep + 1} / {mathSteps.length}
      </div>

      {/* Math steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1, justifyContent: 'center' }}>
        {mathSteps.map((step, i) => (
          <MathStepItem
            key={i}
            step={step}
            delay={i * framesPerStep}
            isActive={i === activeStep}
            isDone={i < activeStep}
            framesPerStep={framesPerStep}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginTop: 24 }}>
        <div style={{
          height: '100%',
          width: `${((activeStep + 1) / Math.max(mathSteps.length, 1)) * 100}%`,
          background: `linear-gradient(90deg, ${GOLD}, ${GREEN})`,
          borderRadius: 2,
        }} />
      </div>

      {/* Aha-moment particle burst on the final highlighted step */}
      {mathSteps.map((step, i) =>
        step.highlight ? (
          <ParticleBurst key={i} triggerFrame={Math.floor(i * framesPerStep + 6)} cx={760} cy={540} count={32} />
        ) : null
      )}
    </AbsoluteFill>
  );
}

// ── Karaoke Caption Bar ────────────────────────────────────────────────────
// Full-width cinematic caption: active word pops with scale + gold glow.
// Context words fade by distance. Gradient panel fades into frame bottom.

function CaptionBar({ captions, frame, fps }: {
  captions: Caption[]; frame: number; fps: number;
}) {
  const currentMs = (frame / fps) * 1000;

  let activeIdx = -1;
  for (let i = 0; i < captions.length; i++) {
    if (currentMs >= captions[i].start_ms) activeIdx = i;
    else break;
  }

  if (activeIdx === -1) return null;

  const BEFORE = 4;
  const AFTER  = 4;
  const winStart    = Math.max(0, activeIdx - BEFORE);
  const winEnd      = Math.min(captions.length, activeIdx + AFTER + 1);
  const win         = captions.slice(winStart, winEnd);
  const activeInWin = activeIdx - winStart;

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: '60px 100px 36px',
      background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 55%, transparent 100%)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
      zIndex: 200, pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', gap: 16, flexWrap: 'nowrap', alignItems: 'flex-end',
        maxWidth: '92%',
      }}>
        {win.map((cap, i) => {
          const isActive   = i === activeInWin;
          const dist       = Math.abs(i - activeInWin);
          const wordAgeMs  = isActive ? Math.max(0, currentMs - cap.start_ms) : 0;
          const popT       = Math.min(1, wordAgeMs / 70);
          const popScale   = isActive ? interpolate(popT, [0, 1], [0.82, 1]) : 1;
          const opacity    = isActive ? 1 : dist === 1 ? 0.5 : dist === 2 ? 0.28 : 0.14;
          const fontSize   = isActive ? 56 : dist === 1 ? 46 : 38;
          const color      = isActive ? '#ffffff' : WHITE;
          const shadow     = isActive
            ? `0 0 32px rgba(232,201,126,0.9), 0 0 64px rgba(232,201,126,0.45), 0 4px 12px rgba(0,0,0,0.95)`
            : '0 2px 6px rgba(0,0,0,0.85)';
          return (
            <span key={winStart + i} style={{
              fontFamily: '"Helvetica Neue", "Arial", sans-serif',
              fontSize, fontWeight: isActive ? 800 : 500,
              color, opacity,
              transform: `scale(${popScale})`,
              transformOrigin: 'bottom center',
              textShadow: shadow,
              letterSpacing: isActive ? '-0.01em' : '0.005em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              display: 'inline-block',
            }}>
              {cap.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Particle burst — aha-moment effect ────────────────────────────────────
// Fires once at `triggerFrame`. Particles radiate outward and fade over 50 frames.

function ParticleBurst({ triggerFrame, cx = 960, cy = 480, count = 28 }: {
  triggerFrame: number; cx?: number; cy?: number; count?: number;
}) {
  const frame = useCurrentFrame();
  const t = frame - triggerFrame;
  if (t < 0 || t > 55) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 300 }}>
      {Array.from({ length: count }, (_, i) => {
        const angle   = (i / count) * Math.PI * 2 + (i % 2) * 0.3;
        const speed   = 5 + (i % 5) * 2.2;
        const px      = cx + Math.cos(angle) * speed * t;
        const py      = cy + Math.sin(angle) * speed * t;
        const opacity = interpolate(t, [0, 55], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const size    = 2.5 + (i % 4) * 1.5;
        const color   = i % 3 === 0 ? GOLD : i % 3 === 1 ? GREEN : WHITE;
        return (
          <div key={i} style={{
            position: 'absolute', left: px, top: py,
            width: size, height: size, borderRadius: '50%',
            background: color, opacity,
            transform: 'translate(-50%,-50%)',
            boxShadow: i % 3 === 0 ? `0 0 6px ${GOLD}` : 'none',
          }} />
        );
      })}
    </div>
  );
}

// ── Neural theme object ────────────────────────────────────────────────────

function NeuralBackground() {
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Grid />
      <Grain />
    </AbsoluteFill>
  );
}

const NeuralTheme: ThemeComponents = {
  SlideBackground:    NeuralBackground,
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

// ── Theme registry ─────────────────────────────────────────────────────────

const THEMES: Record<string, ThemeComponents> = {
  neural:     NeuralTheme,
  blueprint:  BlueprintTheme,
  kinetic:    KineticTheme,
  chalkboard: ChalkboardTheme,
  organic:    OrganicTheme,
  cinematic:  CinematicTheme,
};

// ── Slide wrapper — theme-aware ────────────────────────────────────────────

function SlideWrapper({ slide, slideIndex, totalSlides, isLast, theme }: {
  slide: SlideData; slideIndex: number; totalSlides: number; isLast: boolean;
  theme: ThemeComponents;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Cinematic push transition ──────────────────────────────────────
  const FADE  = 10;
  const PUSH  = 14;  // frames for push movement
  const DIST  = 72;  // pixels of lateral push

  const fadeIn  = interpolate(frame, [0, FADE], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = isLast ? 1 : interpolate(frame, [slide.duration_frames - FADE, slide.duration_frames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Incoming: spring from right
  const enterSpring = spring({ frame, fps, config: { damping: 22, stiffness: 110, mass: 0.9 } });
  const enterX = interpolate(enterSpring, [0, 1], [DIST, 0]);

  // Outgoing: linear slide to left
  const exitX = isLast ? 0 : interpolate(
    frame, [slide.duration_frames - PUSH, slide.duration_frames],
    [0, -DIST * 0.55], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const SLIDE_MAP: Record<string, React.FC<{ slide: SlideData }>> = {
    title:          theme.TitleSlide,
    hook:           theme.HookSlide,
    content:        theme.ContentSlide,
    walkthrough:    theme.WalkthroughSlide,
    example:        theme.ExampleSlide,
    practice:       theme.PracticeSlide,
    summary:        theme.SummarySlide,
    worked_example: theme.WorkedExampleSlide,
    quiz:           QuizSlide,
  };

  const Component = SLIDE_MAP[slide.type] ?? theme.ContentSlide;
  const isNeural  = theme === NeuralTheme;

  return (
    <AbsoluteFill style={{
      opacity: fadeIn * fadeOut,
      transform: `translateX(${enterX + exitX}px)`,
    }}>
      {slide.audio_key && <Audio src={staticFile(slide.audio_key)} />}
      <theme.SlideBackground />
      {/* Neural-specific chrome + progress */}
      {isNeural && <>
        <Chrome label={slide.type === 'title' ? undefined : 'Nest · Lesson'} />
        <LessonProgress current={slideIndex} total={totalSlides} />
      </>}
      <Component slide={slide} />
      <Vignette />
      {slide.captions && slide.captions.length > 0 && (
        <theme.CaptionBar captions={slide.captions} frame={frame} fps={fps} />
      )}
    </AbsoluteFill>
  );
}

// ── Cinematic lesson intro — 90 frames before slide 1 ─────────────────────
// Branded 3-second sequence: sweeping line → module name → big lesson number
// → lesson title → fade out. Gives the video a Netflix-episode feel.

function LessonIntro({ moduleTitle, lessonTitle, lessonNumber }: {
  moduleTitle: string; lessonTitle: string; lessonNumber: number;
}) {
  const frame = useCurrentFrame();

  const lineW    = interpolate(frame, [0, 28],  [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const moduleOp = interpolate(frame, [12, 26], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const numScale = interpolate(
    spring({ frame: frame - 22, fps: 30, config: { damping: 16, stiffness: 90, mass: 0.9 } }),
    [0, 1], [0.6, 1]
  );
  const numOp    = interpolate(frame, [22, 36], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleOp  = interpolate(frame, [34, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exitOp   = interpolate(frame, [72, 88], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      background: BG, opacity: exitOp,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <Grain />
      <Vignette />
      {/* Background radial */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 45% at 50% 50%, rgba(232,201,126,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Sweeping GOLD line */}
      <div style={{
        width: `${lineW * 480}px`, height: 2,
        background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
        marginBottom: 32, borderRadius: 2,
      }} />

      {/* Module label */}
      <div style={{
        fontFamily: 'monospace', fontSize: 16, letterSpacing: '0.28em',
        textTransform: 'uppercase', color: GRAY, marginBottom: 16,
        opacity: moduleOp,
      }}>
        {moduleTitle}
      </div>

      {/* Lesson number — big */}
      <div style={{
        fontFamily: 'Georgia, serif', fontSize: 144, fontWeight: 700,
        color: GOLD, lineHeight: 1,
        opacity: numOp, transform: `scale(${numScale})`,
        textShadow: `0 0 80px rgba(232,201,126,0.3)`,
      }}>
        {String(lessonNumber).padStart(2, '0')}
      </div>

      {/* Divider */}
      <div style={{ width: 64, height: 2, background: GOLD, borderRadius: 1, margin: '20px 0', opacity: titleOp }} />

      {/* Lesson title */}
      <div style={{
        fontFamily: 'Georgia, serif', fontSize: 36, color: WHITE,
        textAlign: 'center', maxWidth: 860, lineHeight: 1.35,
        opacity: titleOp,
      }}>
        {lessonTitle}
      </div>
    </AbsoluteFill>
  );
}

// ── Main composition ───────────────────────────────────────────────────────

export const LessonVideo: React.FC<LessonVideoProps> = ({
  slides, module_title, lesson_title, lesson_number, theme: themeName,
}) => {
  const theme = THEMES[themeName ?? 'neural'] ?? NeuralTheme;

  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* Cinematic intro — frames 0–89 */}
      <Sequence from={0} durationInFrames={90} name="Intro">
        <theme.LessonIntro
          moduleTitle={module_title}
          lessonTitle={lesson_title}
          lessonNumber={lesson_number}
        />
      </Sequence>

      {/* Slides */}
      {slides.map((slide, i) => (
        <Sequence
          key={i}
          from={slide.start_frame}
          durationInFrames={slide.duration_frames}
          name={`${slide.type}: ${slide.heading.slice(0, 40)}`}
        >
          <SlideWrapper
            slide={slide} slideIndex={i}
            totalSlides={slides.length}
            isLast={i === slides.length - 1}
            theme={theme}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
