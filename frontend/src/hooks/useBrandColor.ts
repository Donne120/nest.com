import { useEffect } from 'react';
import { useAuthStore } from '../store';

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function mix(base: RGB, target: RGB, t: number): string {
  return `${clamp(base[0] + (target[0] - base[0]) * t)} ${clamp(base[1] + (target[1] - base[1]) * t)} ${clamp(base[2] + (target[2] - base[2]) * t)}`;
}

/**
 * Generates a 10-shade brand palette from a single hex color
 * treating the input as brand-600 (the primary action color).
 */
function buildPalette(hex: string): Record<string, string> {
  const base = hexToRgb(hex);
  if (!base) return {};
  const white: RGB = [255, 255, 255];
  const black: RGB = [0, 0, 0];
  return {
    '--brand-50':  mix(base, white, 0.95),
    '--brand-100': mix(base, white, 0.87),
    '--brand-200': mix(base, white, 0.72),
    '--brand-300': mix(base, white, 0.54),
    '--brand-400': mix(base, white, 0.28),
    '--brand-500': mix(base, white, 0.10),
    '--brand-600': `${base[0]} ${base[1]} ${base[2]}`,
    '--brand-700': mix(base, black, 0.14),
    '--brand-800': mix(base, black, 0.30),
    '--brand-900': mix(base, black, 0.50),
  };
}

/**
 * Reads the org brand_color from the auth store and injects CSS custom
 * properties onto :root so every Tailwind `brand-*` class follows the org's
 * color in real-time.
 */
export function useBrandColor() {
  const organization = useAuthStore((s) => s.organization);

  useEffect(() => {
    const color = organization?.brand_color;
    if (!color) return;

    const palette = buildPalette(color);
    const root = document.documentElement;
    Object.entries(palette).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [organization?.brand_color]);
}
