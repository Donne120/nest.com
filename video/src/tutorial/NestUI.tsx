/**
 * Shared Nest UI atoms used across all tutorial screen mockups.
 * Matches the real Nest dark/gold design system.
 */
import React from 'react';

export const GOLD   = '#c8a96e';
export const GOLD2  = '#e8d4a0';
export const INK    = '#f0ebe2';
export const INK2   = '#8a8070';
export const INK3   = '#2e2a24';
export const CARD   = '#161410';
export const BG     = '#0a0907';
export const GO     = '#4a9a6a';
export const RULE   = 'rgba(255,255,255,0.07)';

// ── Browser chrome wrapper ──────────────────────────────────────────────────
export const Browser: React.FC<{ url?: string; children: React.ReactNode; scale?: number }> = ({
  url = 'nest-com.vercel.app', children, scale = 1,
}) => (
  <div style={{
    width: 960 * scale, background: '#1a1814',
    borderRadius: 12, overflow: 'hidden',
    boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
    border: '1px solid rgba(255,255,255,0.06)',
  }}>
    {/* Title bar */}
    <div style={{ height: 40, background: '#111008', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
      <div style={{
        flex: 1, marginLeft: 8, height: 22,
        background: '#0d0b08', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: INK2, letterSpacing: '0.04em' }}>
          🔒 {url}
        </span>
      </div>
    </div>
    {/* Content */}
    <div style={{ background: BG }}>{children}</div>
  </div>
);

// ── Sidebar navigation ──────────────────────────────────────────────────────
export interface NavItem { label: string; icon: string; active?: boolean; badge?: number; }
export const Sidebar: React.FC<{ items: NavItem[]; orgName?: string }> = ({ items, orgName = 'Nest Academy' }) => (
  <div style={{
    width: 220, background: CARD, borderRight: `1px solid ${RULE}`,
    display: 'flex', flexDirection: 'column', height: '100%', minHeight: 500,
  }}>
    {/* Logo */}
    <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${RULE}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          border: `1.5px solid rgba(200,169,110,0.45)`,
          background: 'rgba(200,169,110,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'Georgia', fontSize: 15, fontWeight: 700, color: GOLD }}>N</span>
        </div>
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontStyle: 'italic', color: INK }}>Nest</div>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: INK2, letterSpacing: '0.1em', marginTop: 1 }}>{orgName}</div>
        </div>
      </div>
    </div>
    {/* Nav items */}
    <div style={{ flex: 1, padding: '12px 10px' }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 8, marginBottom: 2,
          background: item.active ? 'rgba(200,169,110,0.1)' : 'transparent',
          border: item.active ? `1px solid rgba(200,169,110,0.2)` : '1px solid transparent',
          cursor: 'pointer',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke={item.active ? GOLD : INK2} strokeWidth="1.8" strokeLinecap="round">
            <path d={item.icon} />
          </svg>
          <span style={{
            fontFamily: 'sans-serif', fontSize: 12,
            color: item.active ? INK : INK2, fontWeight: item.active ? 500 : 400,
          }}>{item.label}</span>
          {item.badge ? (
            <div style={{
              marginLeft: 'auto', minWidth: 18, height: 18,
              borderRadius: 9, background: GOLD,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'monospace', fontSize: 9, color: BG, fontWeight: 700,
            }}>{item.badge}</div>
          ) : null}
        </div>
      ))}
    </div>
  </div>
);

// ── Top page header ─────────────────────────────────────────────────────────
export const PageHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div style={{ padding: '24px 32px 20px', borderBottom: `1px solid ${RULE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: INK, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK2, margin: '4px 0 0' }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ── Gold button ─────────────────────────────────────────────────────────────
export const GoldButton: React.FC<{ label: string; glow?: boolean; small?: boolean }> = ({ label, glow, small }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: glow ? GOLD : 'rgba(200,169,110,0.12)',
    border: `1px solid ${glow ? GOLD : 'rgba(200,169,110,0.35)'}`,
    borderRadius: 6, padding: small ? '6px 14px' : '9px 20px',
    fontFamily: 'sans-serif', fontSize: small ? 11 : 12, fontWeight: 600,
    color: glow ? BG : GOLD,
    boxShadow: glow ? `0 0 20px rgba(200,169,110,0.4)` : 'none',
    cursor: 'pointer',
  }}>{label}</div>
);

// ── Input field ─────────────────────────────────────────────────────────────
export const Input: React.FC<{ label?: string; value?: string; placeholder?: string; focused?: boolean; password?: boolean }> = ({
  label, value = '', placeholder = '', focused, password,
}) => (
  <div style={{ marginBottom: 16 }}>
    {label && <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK2, marginBottom: 6 }}>{label}</div>}
    <div style={{
      background: INK3, border: `1px solid ${focused ? GOLD : 'rgba(200,169,110,0.15)'}`,
      borderRadius: 6, padding: '9px 14px',
      fontFamily: 'sans-serif', fontSize: 13,
      color: value ? INK : INK2,
      boxShadow: focused ? `0 0 0 2px rgba(200,169,110,0.15)` : 'none',
      display: 'flex', alignItems: 'center',
    }}>
      {password && value ? '••••••••' : (value || placeholder)}
      {focused && <span style={{ width: 1.5, height: 14, background: GOLD, marginLeft: 1, animation: 'none' }} />}
    </div>
  </div>
);

// ── Animated cursor ─────────────────────────────────────────────────────────
export const Cursor: React.FC<{ x: number; y: number; clicking?: boolean }> = ({ x, y, clicking }) => (
  <div style={{
    position: 'absolute', left: x, top: y,
    transform: `scale(${clicking ? 0.85 : 1})`,
    transition: 'transform 0.1s',
    zIndex: 999, pointerEvents: 'none',
  }}>
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
      <path d="M0 0L0 18L5 13L8 20L10.5 19L7.5 12L13 12L0 0Z" fill="white" />
      <path d="M0 0L0 18L5 13L8 20L10.5 19L7.5 12L13 12L0 0Z" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
    </svg>
    {clicking && (
      <div style={{
        position: 'absolute', top: -4, left: -4,
        width: 28, height: 28, borderRadius: '50%',
        border: `2px solid ${GOLD}`,
        opacity: 0.6,
      }} />
    )}
  </div>
);

// ── Highlight box ───────────────────────────────────────────────────────────
export const Highlight: React.FC<{ x: number; y: number; w: number; h: number; pulse?: boolean }> = ({ x, y, w, h, pulse }) => (
  <div style={{
    position: 'absolute', left: x, top: y, width: w, height: h,
    border: `2px solid ${GOLD}`,
    borderRadius: 8,
    boxShadow: pulse ? `0 0 20px rgba(200,169,110,0.5), inset 0 0 20px rgba(200,169,110,0.1)` : `0 0 10px rgba(200,169,110,0.3)`,
    pointerEvents: 'none', zIndex: 100,
    background: pulse ? 'rgba(200,169,110,0.06)' : 'transparent',
  }} />
);

// ── Step annotation ─────────────────────────────────────────────────────────
export const StepAnnotation: React.FC<{ step: number; text: string; x: number; y: number; align?: 'left' | 'right' }> = ({
  step, text, x, y, align = 'left',
}) => (
  <div style={{
    position: 'absolute', left: align === 'left' ? x : undefined, right: align === 'right' ? x : undefined,
    top: y, display: 'flex', alignItems: 'center', gap: 8, zIndex: 200,
  }}>
    {align === 'right' && <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: INK, background: 'rgba(10,9,7,0.9)', borderRadius: 6, padding: '5px 10px', maxWidth: 180, lineHeight: 1.4, border: `1px solid rgba(200,169,110,0.2)` }}>{text}</div>}
    <div style={{
      width: 24, height: 24, borderRadius: '50%',
      background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: BG, flexShrink: 0,
    }}>{step}</div>
    {align === 'left' && <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: INK, background: 'rgba(10,9,7,0.9)', borderRadius: 6, padding: '5px 10px', maxWidth: 200, lineHeight: 1.4, border: `1px solid rgba(200,169,110,0.2)` }}>{text}</div>}
  </div>
);

// ── Status badge ────────────────────────────────────────────────────────────
export const Badge: React.FC<{ label: string; color?: 'gold' | 'green' | 'red' | 'gray' }> = ({ label, color = 'gold' }) => {
  const colors = {
    gold:  { bg: 'rgba(200,169,110,0.12)', border: 'rgba(200,169,110,0.3)', text: GOLD },
    green: { bg: 'rgba(74,154,106,0.12)',  border: 'rgba(74,154,106,0.3)',  text: GO },
    red:   { bg: 'rgba(196,92,44,0.12)',   border: 'rgba(196,92,44,0.3)',   text: '#c45c2c' },
    gray:  { bg: 'rgba(138,128,112,0.12)', border: 'rgba(138,128,112,0.3)', text: INK2 },
  }[color];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: colors.bg, border: `1px solid ${colors.border}`,
      borderRadius: 100, padding: '3px 10px',
      fontFamily: 'sans-serif', fontSize: 10, fontWeight: 600, color: colors.text,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.text }} />
      {label}
    </span>
  );
};

// ── Data row ────────────────────────────────────────────────────────────────
export const DataRow: React.FC<{ cols: React.ReactNode[]; header?: boolean; highlight?: boolean }> = ({ cols, header, highlight }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: `repeat(${cols.length}, 1fr)`,
    padding: '10px 20px', borderBottom: `1px solid ${RULE}`,
    background: highlight ? 'rgba(200,169,110,0.05)' : 'transparent',
    alignItems: 'center',
  }}>
    {cols.map((col, i) => (
      <div key={i} style={{
        fontFamily: header ? 'monospace' : 'sans-serif',
        fontSize: header ? 9 : 12,
        color: header ? INK2 : INK,
        letterSpacing: header ? '0.14em' : 0,
        textTransform: header ? 'uppercase' : 'none',
      }}>{col}</div>
    ))}
  </div>
);

// ── Video thumbnail card ─────────────────────────────────────────────────────
export const VideoCard: React.FC<{ title: string; duration?: string; progress?: number; index?: number }> = ({
  title, duration = '12:34', progress = 0, index = 0,
}) => (
  <div style={{
    background: CARD, border: `1px solid ${RULE}`, borderRadius: 10,
    overflow: 'hidden', cursor: 'pointer',
  }}>
    <div style={{
      height: 80, background: `linear-gradient(135deg, #1a1710 0%, #0f0d09 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid rgba(200,169,110,0.45)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="10" height="10" viewBox="0 0 20 20" fill={GOLD}><path d="M5 4l12 6-12 6V4z"/></svg>
      </div>
      <div style={{ position: 'absolute', bottom: 6, right: 8, fontFamily: 'monospace', fontSize: 9, color: INK2 }}>{duration}</div>
      {progress > 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, height: 2, width: `${progress}%`, background: GOLD }} />}
    </div>
    <div style={{ padding: '8px 12px' }}>
      <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: INK, fontWeight: 500 }}>{title}</div>
    </div>
  </div>
);
