import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { isOverdue, statusGroup, useProjectTasks } from '@/hooks/useProjectTasks';

const fmt = (d?: string) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : format(dt, 'dd MMM yyyy');
};

const STATUS_DOT: Record<string, string> = {
  OPEN: 'bg-emerald-500',
  ON_HOLD: 'bg-orange-500',
  COMPLETED: 'bg-violet-500',
  CLOSED: 'bg-zinc-500',
};

interface Props { project: any; }

export function DashboardTab({ project }: Props) {
  const projectId = project.projectId ?? project.id;
  const { tasks, loading, error, reload } = useProjectTasks(projectId);

  const stats = useMemo(() => {
    const g = (k: string) => tasks.filter((t) => statusGroup(t.taskStatus) === k).length;
    const done = g('done');
    return {
      total: tasks.length,
      todo: g('todo'),
      inProgress: g('in-progress'),
      blocked: g('blocked'),
      done,
      overdue: tasks.filter(isOverdue).length,
      pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    };
  }, [tasks]);

  const owners: { ownerId?: string | number; ownerName: string }[] = project.owners ?? [];
  const status: string = project.projectStatus ?? '';

  return (
    <div className="space-y-6 p-4">
      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading task data…
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between">
          Failed to load task data.
          <button className="underline font-medium" onClick={reload}>Retry</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Tasks', val: stats.total, color: 'text-foreground', bg: 'bg-muted' },
          { label: 'To Do', val: stats.todo, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'In Progress', val: stats.inProgress, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed', val: stats.done, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Overdue', val: stats.overdue, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-xl p-4 border border-border', s.bg)}>
            <div className={cn('text-2xl font-bold', s.color)}>{s.val}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-border p-4 bg-card">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">Overall Progress</span>
          <span className="text-sm font-bold text-primary">{stats.pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stats.pct}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Start: {fmt(project.startDate)}</span>
          <span>End: {fmt(project.endDate)}</span>
        </div>
      </div>

      {/* Project Info */}
      <div className="rounded-xl border border-border p-4 bg-card space-y-3">
        <h3 className="font-semibold text-sm">Project Info</h3>
        <div className="grid grid-cols-2 gap-y-4 text-xs">
          <div>
            <span className="text-muted-foreground">Status</span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[status] || 'bg-muted-foreground')} />
              <span className="font-medium">{status || '—'}</span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Blocked (On Hold / Delayed)</span>
            <div className="mt-1 font-medium">{stats.blocked} tasks</div>
          </div>
          <div>
            <span className="text-muted-foreground">Owner{owners.length > 1 ? 's' : ''}</span>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {owners.length === 0 && <span className="font-medium">—</span>}
              {owners.map((o) => (
                <span key={String(o.ownerId ?? o.ownerName)} className="flex items-center gap-1.5">
                  <UserAvatar name={o.ownerName} size="sm" />
                  <span className="font-medium">{o.ownerName}</span>
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Project ID</span>
            <div className="mt-1 font-medium">{projectId}</div>
          </div>
        </div>
        {project.projectDescription && (
          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            {project.projectDescription}
          </p>
        )}
      </div>
    </div>
  );
}
