import clsx from 'clsx';

interface Props { className?: string; }

export function Skeleton({ className }: Props) {
  return <div className={clsx('animate-pulse bg-gray-200 rounded', className)} />;
}

export function QuestionCardSkeleton() {
  return (
    <div className="p-4 border border-gray-100 rounded-lg space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="w-12 h-5" />
        <Skeleton className="w-16 h-5 ml-auto" />
      </div>
      <Skeleton className="w-full h-4" />
      <Skeleton className="w-3/4 h-4" />
      <div className="flex items-center gap-2">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="w-24 h-3" />
      </div>
    </div>
  );
}
