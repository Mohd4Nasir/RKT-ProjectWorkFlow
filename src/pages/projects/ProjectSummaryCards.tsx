import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, FolderKanban, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project } from '@/types/ProejctsType';
import { isProjectOverdue } from './projectUi';

// only projects with the ACTIVE status, so the card matches the Status filter
const ACTIVE_STATUSES = ['ACTIVE'];
// only projects with the COMPLETED status, so the card matches the Status filter
const COMPLETED_STATUSES = ['COMPLETED'];

export type SummaryCardKey = 'total' | 'active' | 'completed' | 'overdue';

interface Props {
  projects: Project[];
  /** card currently applied as a filter (highlighted) */
  selected?: SummaryCardKey;
  onSelect?: (key: SummaryCardKey) => void;
}

export function ProjectSummaryCards({ projects, selected, onSelect }: Props) {
  const s = useMemo(() => {
    const count = (list: string[]) =>
      projects.filter((p) => list.includes((p.projectStatus || '').toUpperCase())).length;
    return {
      total: projects.length,
      active: count(ACTIVE_STATUSES),
      done: count(COMPLETED_STATUSES),
      overdue: projects.filter(isProjectOverdue).length,
    };
  }, [projects]);

  const cards = [
    { key: 'total' as const, label: 'Total Projects', val: s.total, icon: FolderKanban, tone: 'text-primary bg-primary/10' },
    { key: 'active' as const, label: 'Active', val: s.active, icon: Loader, tone: 'text-blue-600 bg-blue-50' },
    { key: 'completed' as const, label: 'Completed', val: s.done, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
    { key: 'overdue' as const, label: 'Overdue', val: s.overdue, icon: AlertTriangle, tone: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ key, label, val, icon: Icon, tone }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect?.(key)}
          aria-pressed={selected === key}
          className={cn(
            'card-elevated p-4 flex items-center gap-3 text-left cursor-pointer transition',
            'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            selected === key && 'ring-2 ring-primary',
          )}
        >
          <span className={cn('h-10 w-10 rounded-xl grid place-items-center shrink-0', tone)}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-2xl font-bold leading-none tabular-nums">{val}</div>
            <div className="text-xs text-muted-foreground mt-1 truncate">{label}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
