import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  hint?: string;
  variant?: 'primary' | 'success' | 'warning' | 'info';
}

const variants = {
  primary: { tile: 'bg-primary/10 text-primary', bar: 'bg-primary' },
  success: { tile: 'bg-success/10 text-success', bar: 'bg-success' },
  warning: { tile: 'bg-warning/15 text-warning', bar: 'bg-warning' },
  info: { tile: 'bg-info/10 text-info', bar: 'bg-info' },
};

export function StatCard({ title, value, icon: Icon, trend, hint, variant = 'primary' }: Props) {
  const positive = (trend || 0) >= 0;
  const v = variants[variant];
  return (
    <div className="card-elevated relative overflow-hidden p-5 transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5">
      <span className={cn('absolute left-0 top-0 h-full w-1', v.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="eyebrow">{title}</div>
          <div className="text-3xl font-bold font-display mt-2 tabular-nums">{value}</div>
        </div>
        <div className={cn('stat-icon shrink-0', v.tile)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {(trend !== undefined || hint) && (
        <div className="flex items-center gap-2 mt-3 text-xs">
          {trend !== undefined && (
            <span className={cn('inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded', positive ? 'text-success bg-success/10' : 'text-danger bg-danger/10')}>
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}%
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </div>
  );
}
