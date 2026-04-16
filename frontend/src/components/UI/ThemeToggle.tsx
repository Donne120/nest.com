import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme, type Theme } from '../../hooks/useTheme';

const OPTIONS: { value: Theme; icon: typeof Sun; label: string; description: string }[] = [
  { value: 'light',  icon: Sun,     label: 'Light',  description: 'Always light'         },
  { value: 'system', icon: Monitor, label: 'System', description: 'Follows your device'  },
  { value: 'dark',   icon: Moon,    label: 'Dark',   description: 'Always dark'           },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map(({ value, icon: Icon, label, description }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className="relative flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all duration-150 cursor-pointer"
            style={{
              background:   active ? 'rgba(var(--brand-600)/0.08)' : 'transparent',
              borderColor:  active ? 'rgba(var(--brand-600)/0.35)' : undefined,
              fontFamily:   'inherit',
            }}
          >
            {/* icon circle */}
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{
                background: active
                  ? 'rgba(var(--brand-600)/0.15)'
                  : undefined,
              }}
            >
              <Icon
                size={16}
                className={active ? 'text-brand-600' : 'text-gray-400 dark:text-slate-500'}
              />
            </span>

            <span className="text-center">
              <span className={`block text-xs font-semibold ${active ? 'text-brand-600' : 'text-gray-700 dark:text-slate-300'}`}>
                {label}
              </span>
              <span className="block text-[10.5px] text-gray-400 dark:text-slate-500 mt-0.5 leading-tight">
                {description}
              </span>
            </span>

            {active && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand-600 flex items-center justify-center">
                <Check size={9} className="text-white" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
