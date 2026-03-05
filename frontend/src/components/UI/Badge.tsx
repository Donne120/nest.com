import clsx from 'clsx';

type Variant = 'pending' | 'answered' | 'archived' | 'not_started' | 'in_progress' | 'completed' | 'manager' | 'admin' | 'employee';

const variants: Record<Variant, string> = {
  pending:     'bg-amber-100 text-amber-800 border-amber-200',
  answered:    'bg-emerald-100 text-emerald-800 border-emerald-200',
  archived:    'bg-gray-100 text-gray-600 border-gray-200',
  not_started: 'bg-gray-100 text-gray-600 border-gray-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  completed:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  manager:     'bg-purple-100 text-purple-700 border-purple-200',
  admin:       'bg-red-100 text-red-700 border-red-200',
  employee:    'bg-gray-100 text-gray-700 border-gray-200',
};

const labels: Record<Variant, string> = {
  pending:     'Pending',
  answered:    'Answered',
  archived:    'Archived',
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed:   'Completed',
  manager:     'Manager',
  admin:       'Admin',
  employee:    'Employee',
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
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {label ?? labels[variant]}
    </span>
  );
}
