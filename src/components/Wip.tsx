import { cn } from '@/lib/utils';

/** Small tag for parts that are dummy / not connected to the backend yet. */
export function Wip({ hint, className }: { hint?: string; className?: string }) {
  return (
    <span
      title={hint ?? 'Work in progress'}
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border border-amber-400/50 bg-amber-100 px-1.5 py-px align-middle',
        'text-[9px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
        className,
      )}
    >
      WIP
    </span>
  );
}
