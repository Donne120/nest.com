/**
 * Nest warm palette — CSS variable references.
 * Light/dark values live in index.css under :root and html.dark.
 * Adding the `dark` class to <html> (done by useTheme) switches every
 * page that uses these constants automatically — no component logic needed.
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
