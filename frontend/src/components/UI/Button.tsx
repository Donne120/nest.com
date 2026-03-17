import clsx from 'clsx';
import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: [
    'bg-brand-gradient text-white shadow-brand',
    'hover:brightness-110 hover:-translate-y-px hover:shadow-[0_6px_20px_rgb(var(--brand-600)/0.4)]',
    'active:translate-y-0 active:brightness-95',
    'focus:ring-brand-500',
  ].join(' '),
  secondary: [
    'bg-white text-gray-700 border border-gray-200 shadow-card',
    'hover:border-gray-300 hover:bg-gray-50 hover:-translate-y-px hover:shadow-card-md',
    'active:translate-y-0 active:shadow-card',
    'dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700',
    'focus:ring-brand-500',
  ].join(' '),
  ghost: [
    'text-gray-600 dark:text-slate-400',
    'hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-200',
    'active:bg-gray-200',
    'focus:ring-gray-300',
  ].join(' '),
  danger: [
    'bg-red-500 text-white shadow-sm',
    'hover:bg-red-600 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(239,68,68,0.35)]',
    'active:translate-y-0',
    'focus:ring-red-500',
  ].join(' '),
};

const sizes: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 font-medium',
  md: 'text-sm px-4 py-2 rounded-xl gap-2 font-medium',
  lg: 'text-sm px-5 py-2.5 rounded-xl gap-2 font-semibold',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
        'select-none',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
