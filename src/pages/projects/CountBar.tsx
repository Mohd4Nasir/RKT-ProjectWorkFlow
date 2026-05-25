import { cn } from '@/lib/utils';

export function CountBar({
  done, total, colorClass = 'bg-success',
}: { done: number; total: number; colorClass?: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs tabular-nums text-muted-foreground w-6 text-right">{done}</span>
      <div className="relative flex-1 h-4 bg-muted rounded overflow-hidden min-w-[60px]">
        <div className={cn('h-full', colorClass)} style={{ width: `${pct}%` }} />
        <span className="absolute inset-0 grid place-items-center text-[10px] font-semibold text-foreground/80">
          {pct}%
        </span>
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-6">{total}</span>
    </div>
  );
}

export function PillEmpty({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
      {label}
    </span>
  );
}
