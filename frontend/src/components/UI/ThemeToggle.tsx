import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
        borderRadius: 100, padding: '7px 14px',
        cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 13, fontWeight: 500,
        color: isDark ? '#e8e4dc' : '#1a1714',
        transition: 'all 0.2s',
      }}
    >
      {isDark ? <Moon size={14} /> : <Sun size={14} />}
      {isDark ? 'Dark' : 'Light'}
    </button>
  );
}
