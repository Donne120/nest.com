/**
 * Nest "Calm Purple" palette — CSS variable references.
 * The single light identity's values live in index.css under :root. The dark
 * theme has been retired, so these constants always resolve to the light
 * palette. Every page that uses them re-skins automatically — no component
 * logic needed.
 */

export const BG   = 'var(--c-bg)';
export const BG2  = 'var(--c-bg2)';
export const SURF = 'var(--c-surf)';
export const RULE = 'var(--c-rule)';
export const INK  = 'var(--c-ink)';
export const INK2 = 'var(--c-ink2)';
export const INK3 = 'var(--c-ink3)';
export const ACC  = 'var(--c-acc)';
export const ACC2 = 'var(--c-acc2)';
export const GO   = 'var(--c-go)';
export const BLUE = 'var(--c-acc2)';
// Semantic + signature tokens — use these instead of hardcoding hex
export const GOLD   = 'var(--c-gold)';   // brand signature accent
export const WARN   = 'var(--c-warn)';   // pending / attention (amber)
export const DANGER = 'var(--c-danger)'; // destructive / error (red)
export const OK     = 'var(--c-ok)';     // success (green)
export const INFO   = 'var(--c-info)';   // cool teal — neutral/informational chips only

// Video player cinema palette — fixed dark theme, not org-branded
export const C = {
  bg:       '#0b0c0f',
  surface:  '#13141a',
  elevated: '#1c1e27',
  ink:      '#e8e4dc',
  muted:    '#9ca3af',
  ghost:    '#6b6b78',
  gold:     '#e8c97e',
  goldDim:  '#c8a96e',
  rule:     'rgba(255,255,255,0.07)',
} as const;
