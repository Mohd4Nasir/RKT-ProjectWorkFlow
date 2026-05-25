import { cn } from '@/lib/utils';
import { Priority, ProjectStatus, SLAStatus, TaskStatus } from '@/types';

const styles: Record<string, string> = {
  // status
  active: 'bg-success/10 text-success border-success/20',
  'on-hold': 'bg-warning/10 text-warning border-warning/20',
  delayed: 'bg-danger/10 text-danger border-danger/20',
  completed: 'bg-info/10 text-info border-info/20',
  // task status
  todo: 'bg-muted text-muted-foreground border-border',
  'in-progress': 'bg-primary/10 text-primary border-primary/20',
  done: 'bg-success/10 text-success border-success/20',
  // priority
  high: 'bg-danger/10 text-danger border-danger/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-info/10 text-info border-info/20',
  // sla
  'on-track': 'bg-success/10 text-success border-success/20',
  'at-risk': 'bg-warning/10 text-warning border-warning/20',
  breached: 'bg-danger/10 text-danger border-danger/20',
};

const labels: Record<string, string> = {
  'in-progress': 'In progress',
  'on-hold': 'On hold',
  'on-track': 'On track',
  'at-risk': 'At risk',
};

interface Props { value: ProjectStatus | TaskStatus | Priority | SLAStatus | string; className?: string; }
export function StatusBadge({ value, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize',
        styles[value] || 'bg-muted text-muted-foreground border-border',
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[value] || value}
    </span>
  );
}
