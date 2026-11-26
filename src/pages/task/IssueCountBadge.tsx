import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Number of issues of a task that are not CLOSED (`openIssueCount` from the task/board APIs).
 * null / undefined / 0 render nothing, so cached responses without the field are fine.
 */
export function IssueCountBadge({ count, className }: { count?: number | null; className?: string }) {
  const n = Number(count) || 0;
  if (n <= 0) return null;
  return (
    <span
      title={`${n} open issue${n === 1 ? '' : 's'}`}
      className={cn(
        'inline-flex flex-shrink-0 items-center gap-0.5 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-rose-600 dark:text-rose-300',
        className,
      )}
    >
      <AlertCircle className="h-2.5 w-2.5" />{n}
    </span>
  );
}
