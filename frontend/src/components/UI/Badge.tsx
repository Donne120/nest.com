import clsx from 'clsx';

type Variant = 'pending' | 'answered' | 'archived' | 'not_started' | 'in_progress' | 'completed' | 'educator' | 'owner' | 'learner';

const variants: Record<Variant, string> = {
  pending:     'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50',
  answered:    'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50',
  archived:    'bg-gray-50 text-gray-500 border-gray-200/80 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  not_started: 'bg-gray-50 text-gray-500 border-gray-200/80 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  in_progress: 'bg-brand-50 text-brand-700 border-brand-200/80 dark:bg-brand-900/25 dark:text-brand-300 dark:border-brand-800/50',
  completed:   'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50',
  educator:    'bg-brand-50 text-brand-700 border-brand-200/80 dark:bg-brand-900/25 dark:text-brand-300 dark:border-brand-800/50',
  owner:       'bg-brand-100 text-brand-800 border-brand-300/80 dark:bg-brand-800/40 dark:text-brand-200 dark:border-brand-700/60',
  learner:     'bg-gray-50 text-gray-600 border-gray-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

const dots: Record<Variant, string> = {
  pending:     'bg-amber-400',
  answered:    'bg-emerald-400',
  archived:    'bg-gray-300',
  not_started: 'bg-gray-300',
  in_progress: 'bg-brand-500 animate-pulse',
  completed:   'bg-emerald-400',
  educator:    'bg-brand-400',
  owner:       'bg-brand-600',
  learner:     'bg-gray-400',
};

const labels: Record<Variant, string> = {
  pending:     'Pending',
  answered:    'Answered',
  archived:    'Archived',
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed:   'Completed',
  educator:    'Educator',
  owner:       'Owner',
  learner:     'Learner',
};

interface Props {
  variant: Variant;
  className?: string;
  label?: string;
}

export default function Badge({ variant, className, label }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', dots[variant])} />
      {label ?? labels[variant]}
    </span>
  );
}
