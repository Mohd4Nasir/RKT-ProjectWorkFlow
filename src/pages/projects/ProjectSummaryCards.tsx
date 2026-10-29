import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, FolderKanban, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project } from '@/types/ProejctsType';
import { isProjectOverdue } from './projectUi';

export function ProjectSummaryCards({ projects }: { projects: Project[] }) {
  const s = useMemo(() => {
    const done = projects.filter((p) => p.projectStatus === 'COMPLETED' || p.projectStatus === 'CLOSED').length;
    return {
      total: projects.length,
      active: projects.filter((p) => p.projectStatus === 'OPEN' || p.projectStatus === 'IN_PROGRESS').length,
      done,
      overdue: projects.filter(isProjectOverdue).length,
    };
  }, [projects]);

  const cards = [
    { label: 'Total Projects', val: s.total, icon: FolderKanban, tone: 'text-primary bg-primary/10' },
    { label: 'Active', val: s.active, icon: Loader, tone: 'text-blue-600 bg-blue-50' },
    { label: 'Completed', val: s.done, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Overdue', val: s.overdue, icon: AlertTriangle, tone: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ label, val, icon: Icon, tone }) => (
        <div key={label} className="card-elevated p-4 flex items-center gap-3">
          <span className={cn('h-10 w-10 rounded-xl grid place-items-center shrink-0', tone)}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-2xl font-bold leading-none tabular-nums">{val}</div>
            <div className="text-xs text-muted-foreground mt-1 truncate">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
