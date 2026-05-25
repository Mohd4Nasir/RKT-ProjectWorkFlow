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
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
};

export function StatCard({ title, value, icon: Icon, trend, hint, variant = 'primary' }: Props) {
  const positive = (trend || 0) >= 0;
  return (
    <div className="card-elevated p-5 hover:shadow-elevated transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</div>
          <div className="text-3xl font-bold font-display mt-2 text-foreground">{value}</div>
        </div>
        <div className={cn('stat-icon', variants[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 text-xs">
        {trend !== undefined && (
          <span className={cn('inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded', positive ? 'text-success bg-success/10' : 'text-danger bg-danger/10')}>
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
