import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '../../hooks/useTheme';
import clsx from 'clsx';

const OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light',  icon: Sun,     label: 'Light'  },
  { value: 'system', icon: Monitor, label: 'System' },
  { value: 'dark',   icon: Moon,    label: 'Dark'   },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-700 rounded-xl">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            theme === value
              ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
          )}
        >
          <Icon size={13} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
