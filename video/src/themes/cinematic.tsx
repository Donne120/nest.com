import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile } from 'remotion';
import type { ThemeComponents, SlideData, Caption } from './types';

// ── CINEMATIC — documentary film aesthetic ─────────────────────────────────
// Letterboxed. Grain. Warm desaturated palette. Lower-third captions.
// Ken Burns slow zoom on every background. Typewriter reveals.
// Think BBC / National Geographic / award-winning documentary.

const FILM_BG   = '#0d0b09';
const SEPIA_LT  = '#c8b89a';
const SEPIA_MD  = '#9a8068';
const SEPIA_DK  = '#5c4a36';
const CREAM     = '#ede0cc';
const RED_TITLE = '#c8452a';
const WHITE     = '#f4f0ea';
const DIM       = 'rgba(244,240,234,0.55)';
const FAINT     = 'rgba(244,240,234,0.18)';
const SANS      = '"Helvetica Neue", Arial, sans-serif';
const SERIF     = '"Georgia", "Palatino Linotype", serif';

const BAR_H = 88; // letterbox bar height px

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function ease(t: number) { return 1 - Math.pow(1 - clamp(t, 0, 1), 3); }
function easeIn(t: number) { return clamp(t, 0, 1) * clamp(t, 0, 1); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * clamp(t, 0, 1); }

// ── Film grain via SVG turbulence ──────────────────────────────────────────

function FilmGrain() {
  const frame = useCurrentFrame();
  // Shift seed every 3 frames — real film grain is per-frame noise
  const seed = Math.floor(frame / 3);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 900 }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <filter id="cgrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" seed={seed} />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="overlay" />
        </filter>
        <rect width="100%" height="100%" filter="url(#cgrain)" opacity="0.09" />
      </svg>
    </AbsoluteFill>
  );
}

// ── Vignette ───────────────────────────────────────────────────────────────

function Vignette() {
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 800, background:
      'radial-gradient(ellipse 85% 80% at 50% 50%, transparent 42%, rgba(0,0,0,0.72) 100%)' }} />
  );
}

// ── Letterbox bars ─────────────────────────────────────────────────────────

function Letterbox({ frame }: { frame: number }) {
  const p = ease(clamp(frame / 20, 0, 1));
  const h = BAR_H * p;
  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: h,
        background: '#000', zIndex: 950 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: h,
        background: '#000', zIndex: 950 }} />
    </>
  );
}

// ── Ken Burns slow zoom ────────────────────────────────────────────────────

function KenBurns({ children, duration }: { children: React.ReactNode; duration: number }) {
  const frame = useCurrentFrame();
  const scale = lerp(1.0, 1.06, frame / duration);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${scale})`,
        transformOrigin: '52% 50%', transition: 'none' }}>
        {children}
      </div>
    </div>
  );
}

// ── Typewriter text ────────────────────────────────────────────────────────

function Typewriter({ text, startFrame, fps, style }: {
  text: string; startFrame: number; fps: number; style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const charsPerSec = 28;
  const chars = Math.floor(elapsed / fps * charsPerSec);
  const visible = text.slice(0, chars);
  const showCursor = Math.floor(frame / 18) % 2 === 0;
  return (
    <span style={style}>{visible}<span style={{ opacity: showCursor ? 1 : 0 }}>|</span></span>
  );
}

// ── Cinematic background — textured dark gradient ─────────────────────────

function CinematicBackground() {
  const frame = useCurrentFrame();
  // Very slow warm hue shift
  const hue = 28 + Math.sin(frame * 0.004) * 4;
  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse 110% 90% at 48% 52%,
        hsl(${hue},18%,14%) 0%,
        hsl(${hue - 4},12%,8%) 60%,
        #050403 100%)`,
    }} />
  );
}

// ── Lower-third label ──────────────────────────────────────────────────────

function LowerThird({ label, sub, startFrame }: { label: string; sub?: string; startFrame: number }) {
  const frame = useCurrentFrame();
  const p = ease(clamp((frame - startFrame) / 18, 0, 1));
  return (
    <div style={{
      position: 'absolute', left: 0, bottom: BAR_H + 60, right: 0,
      opacity: p, transform: `translateY(${(1 - p) * 18}px)`,
    }}>
      <div style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 72 }}>
        <div style={{
          width: 4, height: 52, background: RED_TITLE, position: 'absolute',
          left: -16, top: 0,
        }} />
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 22,
          letterSpacing: '0.18em', textTransform: 'uppercase', color: WHITE }}>{label}</span>
        {sub && <span style={{ fontFamily: SERIF, fontSize: 15, color: SEPIA_LT,
          letterSpacing: '0.06em', marginTop: 4, fontStyle: 'italic' }}>{sub}</span>}
      </div>
    </div>
  );
}

// ── Slide separator line (horizontal scan reveal) ──────────────────────────

function ScanReveal({ y, startFrame, color = SEPIA_MD }: { y: number; startFrame: number; color?: string }) {
  const frame = useCurrentFrame();
  const p = ease(clamp((frame - startFrame) / 22, 0, 1));
  return (
    <div style={{
      position: 'absolute', top: y, left: 72, height: 1,
      width: `calc(${p * 100}% - 144px)`, background: color,
    }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTARY VISUAL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// ── DocuFrame — aged photo in a documentary frame ─────────────────────────
// Shows image_key with sepia treatment, slow horizontal Ken Burns pan,
// film scratches, and a caption name-plate at the bottom.

function DocuFrame({ imageKey, caption, era, location, dur }: {
  imageKey: string; caption?: string; era?: string; location?: string; dur: number;
}) {
  const frame = useCurrentFrame();

  // Slow horizontal pan across the image (documentary pan effect)
  const panPct = interpolate(frame, [0, dur], [52, 47], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Caption plate slides up from bottom
  const plateP = ease(clamp((frame - 20) / 22, 0, 1));

  // Film scratches — 4 thin vertical lines that flash in/out
  const scratchDefs = [
    { x: '18%',  base: 0.04, phase: 0.0,  freq: 0.13 },
    { x: '43%',  base: 0.06, phase: 1.1,  freq: 0.09 },
    { x: '67%',  base: 0.03, phase: 2.3,  freq: 0.17 },
    { x: '84%',  base: 0.05, phase: 3.7,  freq: 0.11 },
  ];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: 4 }}>
      {/* ── Image with sepia + horizontal pan ── */}
      <img
        src={staticFile(imageKey)}
        alt={caption ?? ''}
        style={{
          position: 'absolute', inset: 0, width: '110%', height: '110%',
          objectFit: 'cover',
          objectPosition: `${panPct}% 50%`,
          filter: 'sepia(0.55) contrast(1.12) brightness(0.82) saturate(0.75)',
        }}
      />

      {/* ── Aged overlay — double-exposure warmth ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 90% 80% at 50% 50%, rgba(120,80,30,0.18) 0%, rgba(0,0,0,0.55) 100%)',
      }} />

      {/* ── Film scratches ── */}
      {scratchDefs.map((s, i) => {
        const op = s.base * (0.5 + 0.5 * Math.sin(frame * s.freq + s.phase));
        return (
          <div key={i} style={{
            position: 'absolute', top: 0, bottom: 0,
            left: s.x, width: 1,
            background: 'rgba(255,255,255,0.9)',
            opacity: op,
          }} />
        );
      })}

      {/* ── Aged border ── */}
      <div style={{
        position: 'absolute', inset: 4,
        border: '1px solid rgba(200,184,154,0.25)',
        borderRadius: 2,
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 8,
        border: '1px solid rgba(200,184,154,0.12)',
        borderRadius: 1,
        pointerEvents: 'none',
      }} />

      {/* ── Caption plate ── */}
      {caption && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 55%, transparent 100%)',
          padding: '32px 22px 18px',
          opacity: plateP,
          transform: `translateY(${(1 - plateP) * 14}px)`,
        }}>
          {/* Red accent line */}
          <div style={{ width: 30, height: 2, background: RED_TITLE, marginBottom: 10 }} />
          <div style={{ fontFamily: SERIF, fontSize: 17, color: CREAM, letterSpacing: '0.04em', lineHeight: 1.4 }}>
            {caption}
          </div>
          {(era || location) && (
            <div style={{ fontFamily: SANS, fontSize: 12, color: SEPIA_LT, letterSpacing: '0.14em',
              marginTop: 5, textTransform: 'uppercase' }}>
              {[location, era].filter(Boolean).join('  ·  ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── CinematicPortrait — SVG copper-plate engraving style ─────────────────
// Progressive cross-hatching reveal + period figure silhouette.
// Used when scene_type === "portrait" and no image_key.

function CinematicPortrait({ caption, era }: { caption?: string; era?: string }) {
  const frame = useCurrentFrame();

  // Frame draws in
  const frameP  = ease(clamp(frame / 20, 0, 1));
  // Hatch reveals top→bottom over 55 frames
  const hatchP  = ease(clamp((frame - 12) / 55, 0, 1));
  // Silhouette fades in after hatching starts
  const figureP = ease(clamp((frame - 20) / 35, 0, 1));
  // Name plate slides up
  const nameP   = ease(clamp((frame - 55) / 20, 0, 1));
  // Ornament corners
  const ornP    = ease(clamp((frame - 5) / 18, 0, 1));

  // Glow pulse on portrait
  const glowPulse = interpolate(Math.sin(frame * 0.07), [-1, 1], [0.06, 0.18]);

  const CX = 200; const CY = 190;
  const RX = 115; const RY = 145;
  const HATCH_CLIP_H = (CY + RY - (CY - RY)) * hatchP; // reveals oval top→bottom
  const ovalTop = CY - RY;
  const ovalH   = 2 * RY;

  // Generate hatching lines (3 layers: horizontal, diagonal, counter-diagonal)
  const hLines: JSX.Element[] = [];
  for (let i = 0; i < 38; i++) {
    const y = ovalTop + i * 8;
    hLines.push(
      <line key={`h${i}`} x1={CX - RX - 10} y1={y} x2={CX + RX + 10} y2={y}
        stroke={`rgba(92,74,54,${0.22 + (i % 3) * 0.06})`} strokeWidth={0.7} />
    );
  }
  const dLines: JSX.Element[] = [];
  for (let i = 0; i < 30; i++) {
    const y0 = ovalTop - 20 + i * 12;
    dLines.push(
      <line key={`d${i}`} x1={CX - RX - 20} y1={y0} x2={CX + RX + 20} y2={y0 + ovalH * 0.6}
        stroke={`rgba(92,74,54,${0.12 + (i % 2) * 0.06})`} strokeWidth={0.5} />
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={400} height={520} viewBox="0 0 400 520" style={{ overflow: 'visible' }}>
        <defs>
          {/* Hatch reveal clip — grows top→bottom */}
          <clipPath id="hatch-reveal">
            <rect x={0} y={0} width={400} height={ovalTop + HATCH_CLIP_H} />
          </clipPath>
          {/* Oval clip for hatching */}
          <clipPath id="oval-clip">
            <ellipse cx={CX} cy={CY} rx={RX} ry={RY} />
          </clipPath>
        </defs>

        {/* Ornamental corner brackets */}
        {[
          { tx: 18, ty: 16, r: 0 },
          { tx: 382, ty: 16, r: 90 },
          { tx: 382, ty: 440, r: 180 },
          { tx: 18, ty: 440, r: 270 },
        ].map((c, i) => (
          <g key={i} transform={`translate(${c.tx},${c.ty}) rotate(${c.r})`} opacity={ornP}>
            <line x1={0} y1={0} x2={28} y2={0} stroke={SEPIA_MD} strokeWidth={1.5} />
            <line x1={0} y1={0} x2={0} y2={28} stroke={SEPIA_MD} strokeWidth={1.5} />
            <circle cx={0} cy={0} r={3} fill={SEPIA_MD} />
          </g>
        ))}

        {/* Outer frame */}
        <rect x={18} y={16} width={364} height={424}
          fill="none" stroke={SEPIA_DK} strokeWidth={1.2} opacity={frameP} />
        <rect x={26} y={24} width={348} height={408}
          fill="none" stroke={`rgba(92,74,54,0.3)`} strokeWidth={0.6} opacity={frameP} />

        {/* Oval background */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY}
          fill={`rgba(52,38,24,${0.5 * figureP})`}
          stroke={SEPIA_MD} strokeWidth={1.8} opacity={frameP} />

        {/* Glow behind portrait */}
        <ellipse cx={CX} cy={CY} rx={RX - 5} ry={RY - 5}
          fill="none"
          stroke={SEPIA_LT} strokeWidth={6}
          opacity={glowPulse * figureP}
          style={{ filter: 'blur(8px)' }}
        />

        {/* Hatching — revealed progressively */}
        <g clipPath="url(#oval-clip)">
          <g clipPath="url(#hatch-reveal)">
            {hLines}
            {dLines}
          </g>
        </g>

        {/* Figure silhouette — head + period coat */}
        <g opacity={figureP}>
          {/* Head */}
          <ellipse cx={CX} cy={CY - 72} rx={38} ry={46}
            fill={`rgba(78,58,38,0.85)`}
          />
          {/* Hair (top) */}
          <path d={`M ${CX - 36},${CY - 96} C ${CX - 30},${CY - 120} ${CX + 30},${CY - 120} ${CX + 36},${CY - 96}`}
            fill={`rgba(52,38,24,0.9)`}
          />
          {/* Neck */}
          <rect x={CX - 12} y={CY - 28} width={24} height={22}
            fill={`rgba(78,58,38,0.85)`}
          />
          {/* Period collar/cravat */}
          <path d={`M ${CX - 18},${CY - 8} C ${CX - 14},${CY - 4} ${CX},${CY} ${CX + 14},${CY - 4} L ${CX + 18},${CY - 8} L ${CX + 10},${CY + 8} C ${CX + 6},${CY + 14} ${CX - 6},${CY + 14} ${CX - 10},${CY + 8} Z`}
            fill={`rgba(200,184,154,0.6)`}
          />
          {/* Coat/jacket — wide period silhouette */}
          <path d={`
            M ${CX - 48},${CY + 10}
            C ${CX - 44},${CY + 2} ${CX - 26},${CY - 2} ${CX - 18},${CY - 6}
            L ${CX - 10},${CY + 10}
            L ${CX},${CY + 6}
            L ${CX + 10},${CY + 10}
            L ${CX + 18},${CY - 6}
            C ${CX + 26},${CY - 2} ${CX + 44},${CY + 2} ${CX + 48},${CY + 10}
            C ${CX + 55},${CY + 55} ${CX + 52},${CY + 115} ${CX + 48},${CY + 145}
            L ${CX - 48},${CY + 145}
            C ${CX - 52},${CY + 115} ${CX - 55},${CY + 55} ${CX - 48},${CY + 10}
            Z`}
            fill={`rgba(42,30,18,0.9)`}
          />
          {/* Coat lapels */}
          <path d={`M ${CX - 18},${CY - 6} L ${CX - 30},${CY + 30} L ${CX},${CY + 6} Z`}
            fill={`rgba(62,46,30,0.85)`} />
          <path d={`M ${CX + 18},${CY - 6} L ${CX + 30},${CY + 30} L ${CX},${CY + 6} Z`}
            fill={`rgba(62,46,30,0.85)`} />
        </g>

        {/* Oval border on top of everything */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY}
          fill="none" stroke={SEPIA_MD} strokeWidth={2} opacity={frameP} />

        {/* Name plate */}
        <g opacity={nameP} transform={`translateY(${(1 - nameP) * 12})`}>
          {/* Horizontal rules */}
          <line x1={36} y1={388} x2={364} y2={388} stroke={SEPIA_DK} strokeWidth={0.8} />
          <line x1={36} y1={392} x2={364} y2={392} stroke={SEPIA_DK} strokeWidth={0.4} />
          {/* Red accent */}
          <rect x={36} y={400} width={22} height={2} fill={RED_TITLE} />

          {caption && (
            <text x={72} y={413} fontFamily={SERIF} fontSize={18} fill={CREAM}
              letterSpacing="0.04em">
              {caption.slice(0, 38)}
            </text>
          )}
          {era && (
            <text x={72} y={434} fontFamily={SANS} fontSize={12} fill={SEPIA_LT}
              letterSpacing="0.16em" textAnchor="start">
              {era.toUpperCase()}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}

// ── CinematicMap — animated parchment navigation chart ───────────────────
// Compass rose, location markers, animated route line, grid.
// Used when scene_type === "map".

function CinematicMap({ caption, location, era }: {
  caption?: string; location?: string; era?: string;
}) {
  const frame = useCurrentFrame();

  const gridP    = ease(clamp(frame / 18, 0, 1));
  const compassP = ease(clamp((frame - 10) / 24, 0, 1));
  const routeP   = ease(clamp((frame - 28) / 50, 0, 1));
  const markerP  = ease(clamp((frame - 40) / 20, 0, 1));
  const labelP   = ease(clamp((frame - 52) / 18, 0, 1));

  const glowPulse = interpolate(Math.sin(frame * 0.09), [-1, 1], [0.15, 0.45]);

  // Fixed "locations" on the map (abstract — not real coordinates)
  const locs = [
    { x: 140, y: 200, name: location?.split(',')[0] ?? 'Origin' },
    { x: 310, y: 140, name: 'Destination' },
    { x: 260, y: 280, name: 'Via' },
  ];

  // Route path: animated reveal
  const fullRoute = `M 140,200 C 175,155 250,130 310,140`;
  const routeLen = 220; // approximate path length for dasharray

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={460} height={420} viewBox="0 0 460 420" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="parchment-shadow">
            <feDropShadow dx={0} dy={2} stdDeviation={4} floodColor={SEPIA_DK} floodOpacity={0.4} />
          </filter>
        </defs>

        {/* Parchment background */}
        <rect x={16} y={12} width={428} height={396}
          fill="rgba(200,175,130,0.08)"
          stroke={SEPIA_DK} strokeWidth={1.5}
          rx={3} opacity={gridP}
        />
        <rect x={22} y={18} width={416} height={384}
          fill="none" stroke={`rgba(200,175,130,0.2)`} strokeWidth={0.6}
          rx={2} opacity={gridP}
        />

        {/* Grid lines (lat/long) */}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`gx${i}`} x1={16 + i * 60} y1={12} x2={16 + i * 60} y2={408}
            stroke={`rgba(200,175,130,${0.12 * gridP})`} strokeWidth={0.6} />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <line key={`gy${i}`} x1={16} y1={12 + i * 60} x2={444} y2={12 + i * 60}
            stroke={`rgba(200,175,130,${0.12 * gridP})`} strokeWidth={0.6} />
        ))}

        {/* Coastline / territory outline (abstract) */}
        <path d="M 80,380 C 100,360 90,320 110,290 C 130,260 160,255 180,240 C 200,225 195,200 190,180 C 185,160 170,145 165,125 C 160,105 175,85 200,75"
          stroke={`rgba(92,74,54,${0.22 * gridP})`} strokeWidth={1.2}
          fill="none" strokeDasharray="4 3"
        />
        <path d="M 260,380 C 280,355 300,340 320,310 C 340,280 350,260 355,230 C 360,200 345,175 340,150 C 335,125 350,100 370,85"
          stroke={`rgba(92,74,54,${0.18 * gridP})`} strokeWidth={1}
          fill="none" strokeDasharray="4 3"
        />

        {/* Route line — animated draw */}
        <path d={fullRoute}
          stroke={RED_TITLE} strokeWidth={2} fill="none"
          strokeDasharray={routeLen} strokeDashoffset={routeLen * (1 - routeP)}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px rgba(200,69,42,${routeP * 0.5}))` }}
        />
        {/* Direction arrowhead at route end */}
        {routeP > 0.85 && (
          <path d="M 303,137 L 310,140 L 306,148"
            stroke={RED_TITLE} strokeWidth={2} fill="none"
            strokeLinecap="round" strokeLinejoin="round"
            opacity={interpolate(routeP, [0.85, 1], [0, 1])}
          />
        )}

        {/* Location markers */}
        {locs.map((loc, i) => {
          const delay = i * 14;
          const mP = ease(clamp((frame - 40 - delay) / 18, 0, 1));
          if (mP <= 0) return null;
          const glow = interpolate(Math.sin(frame * 0.09 + i * 1.2), [-1, 1], [0.2, 0.55]);
          return (
            <g key={i}>
              {/* Glow ring */}
              <circle cx={loc.x} cy={loc.y} r={18}
                fill="none" stroke={i === 0 ? SEPIA_LT : RED_TITLE} strokeWidth={1.2}
                opacity={mP * glow} style={{ filter: 'blur(3px)' }} />
              {/* Outer circle */}
              <circle cx={loc.x} cy={loc.y} r={9}
                fill="rgba(200,175,130,0.1)" stroke={i === 0 ? SEPIA_MD : RED_TITLE}
                strokeWidth={1.8} opacity={mP} />
              {/* Inner dot */}
              <circle cx={loc.x} cy={loc.y} r={3.5}
                fill={i === 0 ? SEPIA_LT : RED_TITLE} opacity={mP} />
              {/* Location label */}
              <text x={loc.x + 16} y={loc.y + 5}
                fontFamily={SERIF} fontSize={13} fill={CREAM}
                letterSpacing="0.04em" opacity={labelP * mP}
                style={{ filter: `drop-shadow(0 1px 3px rgba(0,0,0,0.8))` }}>
                {i === 0 ? loc.name : i === 1 ? 'Destination' : ''}
              </text>
            </g>
          );
        })}

        {/* Compass rose (top-right) */}
        <g transform="translate(405, 55)" opacity={compassP}>
          {/* N / S arms */}
          <line x1={0} y1={-32} x2={0} y2={32} stroke={SEPIA_MD} strokeWidth={1.2} />
          {/* E / W arms */}
          <line x1={-24} y1={0} x2={24} y2={0} stroke={SEPIA_MD} strokeWidth={1.2} />
          {/* Diagonal arms */}
          <line x1={-17} y1={-17} x2={17} y2={17} stroke={SEPIA_DK} strokeWidth={0.6} />
          <line x1={17} y1={-17} x2={-17} y2={17} stroke={SEPIA_DK} strokeWidth={0.6} />
          {/* N diamond */}
          <path d="M 0,-32 L -5,-16 L 0,-8 L 5,-16 Z" fill={CREAM} />
          {/* S diamond */}
          <path d="M 0,32 L -5,16 L 0,8 L 5,16 Z" fill={SEPIA_DK} />
          {/* Centre */}
          <circle cx={0} cy={0} r={4} fill={CREAM} stroke={SEPIA_DK} strokeWidth={1} />
          {/* N label */}
          <text x={0} y={-36} textAnchor="middle" fontFamily={SANS} fontSize={11}
            fontWeight="700" fill={CREAM} letterSpacing="0.1em">N</text>
        </g>

        {/* Scale bar */}
        <g opacity={labelP}>
          <line x1={30} y1={392} x2={110} y2={392} stroke={SEPIA_MD} strokeWidth={1.5} />
          <line x1={30} y1={387} x2={30} y2={397} stroke={SEPIA_MD} strokeWidth={1.5} />
          <line x1={110} y1={387} x2={110} y2={397} stroke={SEPIA_MD} strokeWidth={1.5} />
          <text x={70} y={405} textAnchor="middle" fontFamily={SANS} fontSize={10}
            fill={SEPIA_LT} letterSpacing="0.08em">SCALE</text>
        </g>

        {/* Caption / legend */}
        {caption && (
          <g opacity={labelP}>
            <rect x={16} y={344} width={240} height={44}
              fill="rgba(0,0,0,0.55)" rx={2} />
            <line x1={26} y1={355} x2={44} y2={355} stroke={RED_TITLE} strokeWidth={1.5} />
            <text x={44} y={357} fontFamily={SERIF} fontSize={13} fill={CREAM}
              letterSpacing="0.03em">{caption.slice(0, 32)}</text>
            {(era || location) && (
              <text x={44} y={376} fontFamily={SANS} fontSize={10} fill={SEPIA_LT}
                letterSpacing="0.14em">
                {[location, era].filter(Boolean).join(' · ').slice(0, 35).toUpperCase()}
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}

// ── CinematicScene — SVG illustration for events / buildings / crowds ──────
// Abstract but evocative — silhouettes, geometric shapes, period detail.

function CinematicScene({ sceneType, caption, era }: {
  sceneType: 'building' | 'event' | 'crowd'; caption?: string; era?: string;
}) {
  const frame = useCurrentFrame();
  const drawP  = ease(clamp(frame / 60, 0, 1));
  const labelP = ease(clamp((frame - 50) / 18, 0, 1));
  const glowPulse = interpolate(Math.sin(frame * 0.07), [-1, 1], [0.06, 0.2]);

  if (sceneType === 'building') {
    // Classical column + arch — Roman/Greek/Renaissance building outline
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={420} height={420} viewBox="0 0 420 420" style={{ overflow: 'visible' }}>
          {/* Sky glow */}
          <ellipse cx={210} cy={160} rx={160} ry={120}
            fill={`rgba(200,100,42,${glowPulse})`}
            style={{ filter: 'blur(40px)' }} />

          {/* Steps / podium */}
          {[0, 1, 2].map(i => {
            const w = 300 - i * 20; const h = 14; const y = 340 - i * h;
            const p = ease(clamp((frame - i * 8) / 18, 0, 1));
            return (
              <rect key={i} x={(420 - w) / 2} y={y} width={w * p} height={h}
                fill="rgba(92,74,54,0.7)" stroke={SEPIA_MD} strokeWidth={0.8} />
            );
          })}

          {/* Columns */}
          {[0, 1, 2, 3, 4].map(i => {
            const x = 75 + i * 68;
            const colP = ease(clamp((frame - 20 - i * 4) / 30, 0, 1));
            return (
              <g key={i}>
                {/* Column shaft — grows upward */}
                <rect x={x - 14} y={200 + (1 - colP) * 120} width={28} height={120 * colP}
                  fill="rgba(62,48,32,0.8)" stroke={SEPIA_DK} strokeWidth={0.6} />
                {/* Capital */}
                {colP > 0.9 && (
                  <>
                    <rect x={x - 18} y={196} width={36} height={8}
                      fill="rgba(92,74,54,0.85)" stroke={SEPIA_MD} strokeWidth={0.8} />
                    <rect x={x - 22} y={190} width={44} height={8}
                      fill="rgba(72,56,36,0.85)" stroke={SEPIA_DK} strokeWidth={0.6} />
                  </>
                )}
              </g>
            );
          })}

          {/* Entablature (horizontal beam at top) */}
          {drawP > 0.5 && (
            <rect x={60} y={182} width={300 * Math.min(1, (drawP - 0.5) / 0.5)} height={10}
              fill="rgba(80,62,42,0.9)" stroke={SEPIA_MD} strokeWidth={1} />
          )}

          {/* Pediment (triangular top) */}
          {drawP > 0.7 && (
            <path d={`M 60,182 L 210,${182 - 70 * ((drawP - 0.7) / 0.3)} L 360,182`}
              stroke={SEPIA_MD} strokeWidth={2} fill="none" />
          )}

          {/* Label */}
          {caption && (
            <text x={210} y={410} textAnchor="middle" fontFamily={SERIF} fontSize={18}
              fill={CREAM} letterSpacing="0.04em" opacity={labelP}>
              {caption.slice(0, 36)}
            </text>
          )}
          {era && (
            <text x={210} y={428} textAnchor="middle" fontFamily={SANS} fontSize={11}
              fill={SEPIA_LT} letterSpacing="0.18em" opacity={labelP}>
              {era.toUpperCase()}
            </text>
          )}
        </svg>
      </div>
    );
  }

  if (sceneType === 'crowd') {
    // Crowd of silhouette dots filling in progressively
    const DOT_COUNT = 80;
    const dots = Array.from({ length: DOT_COUNT }, (_, i) => ({
      x: 50 + (i % 14) * 26 + (Math.floor(i / 14) % 2) * 13,
      y: 160 + Math.floor(i / 14) * 36,
      delay: i * 2.5,
      size: 5 + (i % 3) * 2,
    }));

    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={420} height={420} viewBox="0 0 420 420" style={{ overflow: 'visible' }}>
          {/* Ground line */}
          <line x1={30} y1={352} x2={390} y2={352}
            stroke={SEPIA_DK} strokeWidth={1.5} opacity={drawP} />

          {/* Crowd dots */}
          {dots.map((d, i) => {
            const dp = ease(clamp((frame - d.delay) / 14, 0, 1));
            if (dp <= 0) return null;
            return (
              <g key={i}>
                {/* Body */}
                <ellipse cx={d.x} cy={d.y + 12} rx={d.size * 0.6} ry={d.size * 0.9}
                  fill={`rgba(52,38,24,${0.7 * dp})`} />
                {/* Head */}
                <circle cx={d.x} cy={d.y - 2} r={d.size * 0.5}
                  fill={`rgba(78,58,38,${0.8 * dp})`} />
              </g>
            );
          })}

          {/* Banners / flags */}
          {[110, 210, 310].map((x, i) => {
            const flagP = ease(clamp((frame - 40 - i * 10) / 20, 0, 1));
            return (
              <g key={i} opacity={flagP}>
                <line x1={x} y1={240} x2={x} y2={140} stroke={SEPIA_MD} strokeWidth={1.5} />
                <path d={`M ${x},140 L ${x + 28},150 L ${x},162 Z`} fill={RED_TITLE} opacity={0.7} />
              </g>
            );
          })}

          {caption && (
            <text x={210} y={402} textAnchor="middle" fontFamily={SERIF} fontSize={18}
              fill={CREAM} letterSpacing="0.04em" opacity={labelP}>
              {caption.slice(0, 36)}
            </text>
          )}
          {era && (
            <text x={210} y={418} textAnchor="middle" fontFamily={SANS} fontSize={11}
              fill={SEPIA_LT} letterSpacing="0.18em" opacity={labelP}>
              {era.toUpperCase()}
            </text>
          )}
        </svg>
      </div>
    );
  }

  // Default: "event" — abstract dramatic moment with light rays
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={420} height={420} viewBox="0 0 420 420" style={{ overflow: 'visible' }}>
        {/* Radial light rays from centre */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const rP = ease(clamp((frame - i * 3) / 30, 0, 1));
          const len = 160 * rP;
          return (
            <line key={i}
              x1={210} y1={200}
              x2={210 + Math.cos(angle) * len}
              y2={200 + Math.sin(angle) * len}
              stroke={SEPIA_LT} strokeWidth={0.8}
              opacity={0.1 + 0.08 * rP}
            />
          );
        })}

        {/* Central moment — two silhouetted figures */}
        {drawP > 0.3 && (
          <g opacity={Math.min(1, (drawP - 0.3) / 0.4)}>
            {/* Figure 1 */}
            <ellipse cx={175} cy={260} rx={18} ry={32} fill="rgba(42,30,18,0.85)" />
            <circle cx={175} cy={222} r={16} fill="rgba(62,46,28,0.85)" />
            {/* Figure 2 */}
            <ellipse cx={245} cy={265} rx={18} ry={30} fill="rgba(42,30,18,0.85)" />
            <circle cx={245} cy={230} r={15} fill="rgba(62,46,28,0.85)" />
          </g>
        )}

        {/* Dramatic circle outline */}
        <circle cx={210} cy={240} r={120 * drawP}
          fill="none" stroke={SEPIA_DK} strokeWidth={1.2} opacity={0.4} />

        {caption && (
          <text x={210} y={402} textAnchor="middle" fontFamily={SERIF} fontSize={18}
            fill={CREAM} letterSpacing="0.04em" opacity={labelP}>
            {caption.slice(0, 36)}
          </text>
        )}
      </svg>
    </div>
  );
}

// ── HistoricalVisual — routes to the right visual component ───────────────

function HistoricalVisual({ slide, dur }: { slide: SlideData; dur: number }) {
  if (slide.image_key) {
    return (
      <DocuFrame
        imageKey={slide.image_key}
        caption={slide.scene_caption}
        era={slide.scene_era}
        location={slide.scene_location}
        dur={dur}
      />
    );
  }
  if (slide.scene_type === 'portrait') {
    return <CinematicPortrait caption={slide.scene_caption} era={slide.scene_era} />;
  }
  if (slide.scene_type === 'map') {
    return <CinematicMap caption={slide.scene_caption} location={slide.scene_location} era={slide.scene_era} />;
  }
  if (slide.scene_type === 'building' || slide.scene_type === 'event' || slide.scene_type === 'crowd') {
    return <CinematicScene sceneType={slide.scene_type} caption={slide.scene_caption} era={slide.scene_era} />;
  }
  // No visual data — return empty (text-only layout)
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function TitleSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const { durationInFrames: dur, fps } = useVideoConfig();

  const headP = ease(clamp((frame - 22) / 28, 0, 1));
  const subP  = ease(clamp((frame - 40) / 22, 0, 1));
  const tagP  = ease(clamp((frame - 55) / 18, 0, 1));

  // Fade out at end
  const fadeOut = ease(clamp((dur - frame - 20) / 20, 0, 1));

  return (
    <AbsoluteFill style={{ color: WHITE, opacity: fadeOut }}>
      <KenBurns duration={dur}>
        <CinematicBackground />
      </KenBurns>
      <Vignette />
      <FilmGrain />
      <Letterbox frame={frame} />

      {/* Horizontal rule top */}
      <ScanReveal y={BAR_H + 40} startFrame={12} color={SEPIA_DK} />

      {/* Lesson label */}
      <div style={{
        position: 'absolute', top: BAR_H + 60, left: 72,
        opacity: tagP, transform: `translateY(${(1 - tagP) * 10}px)`,
        fontFamily: SANS, fontSize: 13, letterSpacing: '0.28em',
        textTransform: 'uppercase', color: RED_TITLE, fontWeight: 700,
      }}>
        Documentary · {slide.subheading ?? 'Module 1'}
      </div>

      {/* Main heading — typewriter */}
      <div style={{
        position: 'absolute', top: '35%', left: 72, right: 120,
        opacity: headP,
      }}>
        <Typewriter
          text={slide.heading}
          startFrame={22}
          fps={fps}
          style={{
            fontFamily: SERIF, fontSize: 64, fontWeight: 400, lineHeight: 1.18,
            color: CREAM, letterSpacing: '0.01em',
            display: 'block',
          }}
        />
      </div>

      {/* Divider after heading */}
      <ScanReveal y={'52%' as any} startFrame={52} />

      {/* Subheading */}
      {slide.subheading && (
        <div style={{
          position: 'absolute', top: '56%', left: 72,
          opacity: subP, transform: `translateY(${(1 - subP) * 8}px)`,
          fontFamily: SANS, fontSize: 21, color: SEPIA_LT, letterSpacing: '0.04em',
          fontStyle: 'italic',
        }}>
          {slide.subheading}
        </div>
      )}

      {/* Bottom rule */}
      <ScanReveal y={`calc(100% - ${BAR_H + 40}px)` as any} startFrame={65} color={SEPIA_DK} />
    </AbsoluteFill>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function HookSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const { durationInFrames: dur } = useVideoConfig();
  const p = ease(clamp(frame / 20, 0, 1));
  const fadeOut = ease(clamp((dur - frame - 20) / 20, 0, 1));
  const hasVis = !!(slide.image_key || slide.scene_type);

  return (
    <AbsoluteFill style={{ color: WHITE, opacity: fadeOut }}>
      <KenBurns duration={dur}>
        <CinematicBackground />
      </KenBurns>
      <Vignette />
      <FilmGrain />
      <Letterbox frame={frame} />
      <ScanReveal y={BAR_H + 40} startFrame={8} color={SEPIA_DK} />

      <div style={{
        position: 'absolute',
        top: BAR_H + 50, bottom: BAR_H + 50,
        left: 0, right: 0,
        display: 'flex', alignItems: 'center',
      }}>
        {/* Quote block — left panel */}
        <div style={{
          flex: hasVis ? '0 0 52%' : '1',
          paddingLeft: 80,
          paddingRight: hasVis ? 32 : 80,
          opacity: p,
          transform: `translateY(${(1 - p) * 20}px)`,
        }}>
          <div style={{ fontFamily: SERIF, fontSize: hasVis ? 90 : 120, color: RED_TITLE,
            lineHeight: 0.7, marginBottom: 16, opacity: 0.7 }}>"</div>
          <p style={{ fontFamily: SERIF, fontSize: hasVis ? 26 : 34, lineHeight: 1.55,
            color: CREAM, fontStyle: 'italic', margin: 0 }}>
            {slide.story ?? slide.heading}
          </p>
        </div>

        {/* Visual panel — right */}
        {hasVis && (
          <>
            {/* Separator */}
            <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(92,74,54,0.3)',
              margin: '12px 0' }} />
            <div style={{ flex: '0 0 48%', paddingLeft: 32, paddingRight: 44,
              alignSelf: 'stretch' }}>
              <HistoricalVisual slide={slide} dur={dur} />
            </div>
          </>
        )}
      </div>

      <LowerThird label={slide.heading} sub="The Question" startFrame={30} />
    </AbsoluteFill>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function ContentSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const { durationInFrames: dur } = useVideoConfig();
  const bullets = slide.bullets ?? [];
  const fadeOut = ease(clamp((dur - frame - 20) / 20, 0, 1));
  const hasVis = !!(slide.image_key || slide.scene_type);

  const headP = ease(clamp(frame / 18, 0, 1));
  const divP  = ease(clamp((frame - 20) / 22, 0, 1));

  return (
    <AbsoluteFill style={{ color: WHITE, opacity: fadeOut }}>
      <KenBurns duration={dur}>
        <CinematicBackground />
      </KenBurns>
      <Vignette />
      <FilmGrain />
      <Letterbox frame={frame} />
      <ScanReveal y={BAR_H + 40} startFrame={6} color={SEPIA_DK} />

      <div style={{
        position: 'absolute',
        top: BAR_H + 50, bottom: BAR_H + 20,
        left: 0, right: 0,
        display: 'flex', alignItems: 'stretch',
      }}>
        {/* Left: text panel */}
        <div style={{
          flex: hasVis ? '0 0 54%' : '1',
          paddingLeft: 72,
          paddingRight: hasVis ? 28 : 72,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          {/* Heading */}
          <div style={{ opacity: headP, transform: `translateY(${(1 - headP) * 12}px)`, marginBottom: 20 }}>
            <div style={{ fontFamily: SANS, fontSize: 12, letterSpacing: '0.3em',
              textTransform: 'uppercase', color: RED_TITLE, marginBottom: 10 }}>Chapter</div>
            <div style={{ fontFamily: SERIF, fontSize: hasVis ? 36 : 44, fontWeight: 400,
              color: CREAM, lineHeight: 1.2 }}>{slide.heading}</div>
          </div>

          {/* Animated divider */}
          <div style={{ height: 1, background: SEPIA_MD, marginBottom: 22,
            width: `${divP * 100}%` }} />

          {/* Bullets */}
          {bullets.map((b, i) => {
            const bp = ease(clamp((frame - 28 - i * 14) / 20, 0, 1));
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 20,
                opacity: bp, transform: `translateX(${(1 - bp) * 22}px)`,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%',
                  background: RED_TITLE, marginTop: 12, flexShrink: 0 }} />
                <p style={{ fontFamily: SERIF, fontSize: hasVis ? 19 : 22, color: SEPIA_LT,
                  lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>{b}</p>
              </div>
            );
          })}
        </div>

        {/* Right: documentary visual panel */}
        {hasVis && (
          <>
            <div style={{ width: 1, background: 'rgba(92,74,54,0.28)', margin: '16px 0' }} />
            <div style={{ flex: '0 0 46%', paddingLeft: 28, paddingRight: 40,
              paddingTop: 12, paddingBottom: 12 }}>
              <HistoricalVisual slide={slide} dur={dur} />
            </div>
          </>
        )}
      </div>
    </AbsoluteFill>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function WalkthroughSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: dur } = useVideoConfig();
  const steps = slide.steps ?? [];
  const framesPerStep = steps.length > 0 ? Math.floor(dur / steps.length) : dur;
  const activeStep = Math.min(Math.floor(frame / framesPerStep), steps.length - 1);
  const fadeOut = ease(clamp((dur - frame - 20) / 20, 0, 1));

  return (
    <AbsoluteFill style={{ color: WHITE, opacity: fadeOut }}>
      <KenBurns duration={dur}>
        <CinematicBackground />
      </KenBurns>
      <Vignette />
      <FilmGrain />
      <Letterbox frame={frame} />
      <ScanReveal y={BAR_H + 40} startFrame={4} color={SEPIA_DK} />

      {/* Scene label */}
      <div style={{ position: 'absolute', top: BAR_H + 60, left: 72,
        fontFamily: SANS, fontSize: 11, letterSpacing: '0.32em',
        textTransform: 'uppercase', color: RED_TITLE }}>
        {slide.heading}
      </div>

      {/* Active step — documentary caption style */}
      {steps.map((step, i) => {
        if (i !== activeStep) return null;
        const stepFrame = frame - i * framesPerStep;
        const p = ease(clamp(stepFrame / 20, 0, 1));
        return (
          <div key={i} style={{
            position: 'absolute', top: '32%', left: 72, right: 72,
            opacity: p, transform: `translateY(${(1 - p) * 16}px)`,
          }}>
            {/* Step number in corner like a film reel counter */}
            <div style={{ fontFamily: SANS, fontSize: 100, fontWeight: 900, lineHeight: 1,
              color: 'rgba(200,69,42,0.12)', position: 'absolute',
              top: -20, right: 0, letterSpacing: '-0.04em' }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 13, letterSpacing: '0.24em',
              textTransform: 'uppercase', color: SEPIA_MD, marginBottom: 14 }}>
              Step {i + 1} of {steps.length}
            </div>
            <div style={{ width: 48, height: 2, background: RED_TITLE, marginBottom: 22 }} />
            <p style={{ fontFamily: SERIF, fontSize: 32, lineHeight: 1.6,
              color: CREAM, margin: 0, maxWidth: '75%' }}>{step}</p>
          </div>
        );
      })}

      {/* Progress dots */}
      <div style={{ position: 'absolute', bottom: BAR_H + 36, left: 72,
        display: 'flex', gap: 10 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i === activeStep ? 28 : 8, height: 8, borderRadius: 4,
            background: i === activeStep ? RED_TITLE : SEPIA_DK,
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>
    </AbsoluteFill>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function ExampleSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const { durationInFrames: dur } = useVideoConfig();
  const p = ease(clamp(frame / 24, 0, 1));
  const fadeOut = ease(clamp((dur - frame - 20) / 20, 0, 1));
  const hasVis = !!(slide.image_key || slide.scene_type);

  return (
    <AbsoluteFill style={{ color: WHITE, opacity: fadeOut }}>
      <KenBurns duration={dur}>
        <CinematicBackground />
      </KenBurns>
      <Vignette />
      <FilmGrain />
      <Letterbox frame={frame} />
      <ScanReveal y={BAR_H + 40} startFrame={8} color={SEPIA_DK} />

      <div style={{
        position: 'absolute',
        top: BAR_H + 50, bottom: BAR_H + 20,
        left: 0, right: 0,
        display: 'flex', alignItems: 'center',
      }}>
        {/* Exhibit text — left panel */}
        <div style={{
          flex: hasVis ? '0 0 54%' : '1',
          paddingLeft: 72,
          paddingRight: hasVis ? 28 : 72,
          opacity: p,
          transform: `translateY(${(1 - p) * 14}px)`,
        }}>
          <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.32em',
            textTransform: 'uppercase', color: RED_TITLE, marginBottom: 14 }}>Exhibit</div>
          <p style={{ fontFamily: SERIF, fontSize: hasVis ? 28 : 36, lineHeight: 1.55,
            color: CREAM, margin: 0, fontStyle: 'italic' }}>
            {slide.example_prompt ?? slide.heading}
          </p>
          {slide.ai_response && (
            <div style={{
              marginTop: 28, padding: '16px 20px',
              borderLeft: `4px solid ${SEPIA_DK}`,
              background: 'rgba(255,255,255,0.04)',
            }}>
              <p style={{ fontFamily: SERIF, fontSize: hasVis ? 17 : 20, color: SEPIA_LT,
                lineHeight: 1.65, margin: 0 }}>{slide.ai_response}</p>
            </div>
          )}
        </div>

        {/* Visual panel — right */}
        {hasVis && (
          <>
            <div style={{ width: 1, background: 'rgba(92,74,54,0.28)', alignSelf: 'stretch', margin: '16px 0' }} />
            <div style={{ flex: '0 0 46%', paddingLeft: 28, paddingRight: 40,
              alignSelf: 'stretch', paddingTop: 12, paddingBottom: 12 }}>
              <HistoricalVisual slide={slide} dur={dur} />
            </div>
          </>
        )}
      </div>

      <LowerThird label={slide.heading} startFrame={32} />
    </AbsoluteFill>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function PracticeSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: dur } = useVideoConfig();
  const timerSec = slide.timer_seconds ?? 30;
  const elapsed = frame / fps;
  const remaining = Math.max(0, timerSec - elapsed);
  const progress = 1 - remaining / timerSec;
  const p = ease(clamp(frame / 20, 0, 1));
  const fadeOut = ease(clamp((dur - frame - 20) / 20, 0, 1));

  return (
    <AbsoluteFill style={{ color: WHITE, opacity: fadeOut }}>
      <KenBurns duration={dur}>
        <CinematicBackground />
      </KenBurns>
      <Vignette />
      <FilmGrain />
      <Letterbox frame={frame} />
      <ScanReveal y={BAR_H + 40} startFrame={6} color={SEPIA_DK} />

      <div style={{ position: 'absolute', top: '28%', left: 72, right: 72,
        opacity: p }}>
        <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.32em',
          textTransform: 'uppercase', color: RED_TITLE, marginBottom: 14 }}>Field Exercise</div>
        <p style={{ fontFamily: SERIF, fontSize: 34, lineHeight: 1.55,
          color: CREAM, margin: '0 0 40px', maxWidth: '80%' }}>
          {slide.task ?? slide.heading}
        </p>
        {/* Timer bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontFamily: SANS, fontSize: 48, fontWeight: 200,
            color: RED_TITLE, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {String(Math.floor(remaining / 60)).padStart(2, '0')}:
            {String(Math.floor(remaining % 60)).padStart(2, '0')}
          </div>
          <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.1)',
            borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress * 100}%`,
              background: RED_TITLE, borderRadius: 2 }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function SummarySlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const { durationInFrames: dur } = useVideoConfig();
  const bullets = slide.bullets ?? [];
  const fadeOut = ease(clamp((dur - frame - 20) / 20, 0, 1));

  return (
    <AbsoluteFill style={{ color: WHITE, opacity: fadeOut }}>
      <KenBurns duration={dur}>
        <CinematicBackground />
      </KenBurns>
      <Vignette />
      <FilmGrain />
      <Letterbox frame={frame} />
      <ScanReveal y={BAR_H + 40} startFrame={6} color={SEPIA_DK} />

      <div style={{ position: 'absolute', top: BAR_H + 70, left: 72 }}>
        {(() => {
          const p = ease(clamp(frame / 18, 0, 1));
          return (
            <div style={{ opacity: p }}>
              <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.32em',
                textTransform: 'uppercase', color: RED_TITLE, marginBottom: 10 }}>Credits</div>
              <div style={{ fontFamily: SERIF, fontSize: 46, color: CREAM }}>{slide.heading}</div>
            </div>
          );
        })()}
      </div>

      <ScanReveal y={BAR_H + 150} startFrame={22} />

      <div style={{ position: 'absolute', top: BAR_H + 180, left: 72, right: 72 }}>
        {bullets.map((b, i) => {
          const bp = ease(clamp((frame - 28 - i * 12) / 18, 0, 1));
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
              opacity: bp, transform: `translateX(${(1 - bp) * 18}px)`,
            }}>
              <span style={{ fontFamily: SANS, fontSize: 11, color: RED_TITLE,
                letterSpacing: '0.2em' }}>—</span>
              <p style={{ fontFamily: SERIF, fontSize: 22, color: SEPIA_LT,
                fontStyle: 'italic', margin: 0 }}>{b}</p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function WorkedExampleSlide({ slide }: { slide: SlideData }) {
  const frame = useCurrentFrame();
  const { durationInFrames: dur } = useVideoConfig();
  const steps = slide.math_steps ?? [];
  const framesPerStep = steps.length > 0 ? Math.floor(dur / steps.length) : dur;
  const activeIdx = Math.min(Math.floor(frame / framesPerStep), steps.length - 1);
  const fadeOut = ease(clamp((dur - frame - 20) / 20, 0, 1));

  return (
    <AbsoluteFill style={{ color: WHITE, opacity: fadeOut }}>
      <KenBurns duration={dur}>
        <CinematicBackground />
      </KenBurns>
      <Vignette />
      <FilmGrain />
      <Letterbox frame={frame} />
      <ScanReveal y={BAR_H + 40} startFrame={6} color={SEPIA_DK} />

      <div style={{ position: 'absolute', top: BAR_H + 68, left: 72 }}>
        <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.3em',
          textTransform: 'uppercase', color: RED_TITLE, marginBottom: 8 }}>Proof</div>
        <div style={{ fontFamily: SERIF, fontSize: 38, color: CREAM }}>{slide.heading}</div>
      </div>

      <div style={{ position: 'absolute', top: '40%', left: 72, right: 72 }}>
        {steps.map((s, i) => {
          const sp = ease(clamp((frame - i * framesPerStep) / 18, 0, 1));
          const isActive = i === activeIdx;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 18,
              opacity: sp,
            }}>
              <div style={{
                fontFamily: SANS, fontSize: 24, color: isActive ? RED_TITLE : SEPIA_DK,
                fontWeight: 700, minWidth: 32, lineHeight: 1.4,
              }}>{i + 1}.</div>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: isActive ? 28 : 22,
                  color: isActive ? CREAM : SEPIA_LT,
                  letterSpacing: '0.04em' }}>{s.expression}</div>
                {s.annotation && isActive && (
                  <div style={{ fontFamily: SERIF, fontSize: 16, color: SEPIA_LT,
                    fontStyle: 'italic', marginTop: 4 }}>{s.annotation}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function LessonIntro({ moduleTitle, lessonTitle, lessonNumber }: {
  moduleTitle: string; lessonTitle: string; lessonNumber: number;
}) {
  const frame = useCurrentFrame();
  const { durationInFrames: dur, fps } = useVideoConfig();

  // Black → open letterbox → typewriter title
  const blackFade = ease(clamp(frame / 25, 0, 1));
  const fadeOut   = ease(clamp((dur - frame - 20) / 20, 0, 1));

  return (
    <AbsoluteFill style={{ background: '#000', opacity: Math.min(blackFade, fadeOut) }}>
      <CinematicBackground />
      <Vignette />
      <FilmGrain />
      <Letterbox frame={frame} />

      {/* Production title card */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 0,
      }}>
        <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.45em',
          textTransform: 'uppercase', color: RED_TITLE, marginBottom: 24 }}>
          Lesson {String(lessonNumber).padStart(2, '0')}
        </div>

        <div style={{ width: 60, height: 1, background: SEPIA_DK, marginBottom: 28 }} />

        <Typewriter
          text={lessonTitle}
          startFrame={28}
          fps={fps}
          style={{
            fontFamily: SERIF, fontSize: 52, color: CREAM, textAlign: 'center',
            display: 'block', maxWidth: '75%', lineHeight: 1.3,
          }}
        />

        <div style={{ width: 60, height: 1, background: SEPIA_DK, marginTop: 28, marginBottom: 20 }} />

        {(() => {
          const p = ease(clamp((frame - 55) / 18, 0, 1));
          return (
            <div style={{ fontFamily: SANS, fontSize: 15, letterSpacing: '0.18em',
              color: SEPIA_LT, opacity: p, fontStyle: 'italic' }}>
              {moduleTitle}
            </div>
          );
        })()}
      </div>
    </AbsoluteFill>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CAPTION BAR — documentary lower-third style
// ─────────────────────────────────────────────────────────────────────────────

function CaptionBar({ captions, frame, fps }: { captions: Caption[]; frame: number; fps: number }) {
  const currentMs = (frame / fps) * 1000;
  const active = captions.find(c => currentMs >= c.start_ms && currentMs < c.start_ms + c.duration_ms);

  // Find current sentence context (±2 words around active)
  const activeIdx = captions.findIndex(c => currentMs >= c.start_ms && currentMs < c.start_ms + c.duration_ms);
  const windowStart = Math.max(0, activeIdx - 3);
  const windowEnd   = Math.min(captions.length - 1, activeIdx + 4);
  const window = activeIdx >= 0 ? captions.slice(windowStart, windowEnd + 1) : [];

  if (!active && window.length === 0) return null;

  // Slide up from bottom
  const slideP = ease(clamp(frame / 8, 0, 1));

  return (
    <div style={{
      position: 'absolute', bottom: BAR_H + 12, left: 0, right: 0,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      transform: `translateY(${(1 - slideP) * 20}px)`,
      opacity: slideP,
      zIndex: 960,
      pointerEvents: 'none',
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(4px)',
        borderLeft: `3px solid ${RED_TITLE}`,
        padding: '10px 22px',
        maxWidth: '72%',
        display: 'flex', flexWrap: 'wrap', gap: '5px 8px',
      }}>
        {window.map((c, i) => {
          const isActive = c === active;
          return (
            <span key={windowStart + i} style={{
              fontFamily: SANS,
              fontSize: isActive ? 20 : 17,
              fontWeight: isActive ? 700 : 400,
              color: isActive ? WHITE : DIM,
              letterSpacing: '0.02em',
              transition: 'all 0.1s',
              textTransform: 'uppercase',
            }}>{c.text}</span>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const CinematicTheme: ThemeComponents = {
  SlideBackground: CinematicBackground,
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
