import { useEffect } from 'react';

// ─── Single light identity ("Calm Purple") ────────────────────────────────────
// The dark/black theme has been retired — the whole platform now uses one pure,
// calming light palette. This hook keeps its old shape so existing consumers
// (Navbar, ThemeToggle, RichText…) don't break, but it is permanently light:
// it never adds the `.dark` class, so every `dark:` Tailwind variant and every
// `.dark …` CSS rule stays dormant and the `:root` light tokens always win.
export type Theme = 'light';

function forceLight() {
  document.documentElement.classList.remove('dark');
  // Clean up any previously-persisted preference so nothing re-applies dark.
  try { localStorage.removeItem('nest_theme'); } catch { /* ignore */ }
}

export function useTheme() {
  useEffect(() => { forceLight(); }, []);
  // setTheme is a no-op now; kept so callers compile unchanged.
  return { theme: 'light' as Theme, setTheme: (_t?: Theme) => {}, resolvedTheme: 'light' as const };
}

// Initialise before React mounts (prevents any flash of a stale dark class).
export function initTheme() {
  forceLight();
}
