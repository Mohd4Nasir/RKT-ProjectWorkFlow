import { useMemo } from 'react';
import { useAppSelector } from '@/store';
import { UserAvatar } from '@/components/UserAvatar';
import { StatusBadge as SLABadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500', 'in-progress': 'bg-blue-500',
  'on-hold': 'bg-amber-500', delayed: 'bg-red-500', completed: 'bg-violet-500',
};
const STATUS_LABELS: Record<string, string> = {
  active: 'Active', 'in-progress': 'In Progress',
  'on-hold': 'On Hold', delayed: 'Delayed', completed: 'Completed',
};

interface Props { project: any; }

export function DashboardTab({ project }: Props) {
  const users = useAppSelector(s => s.users.items);
  const tasks = useAppSelector(s => s.tasks.items.filter(t => t.projectId === project.id));

  const owner       = users.find(u => u.id === project.ownerId);
  const memberUsers = users.filter(u => project.members?.includes(u.id));

  const done       = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const todo       = tasks.filter(t => t.status === 'todo').length;
  const pct        = tasks.length ? Math.round((done / tasks.length) * 100) : project.progress ?? 0;

  return (
    <div className="space-y-6 p-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks',  val: tasks.length, color: 'text-foreground',   bg: 'bg-muted' },
          { label: 'To Do',        val: todo,         color: 'text-slate-600',    bg: 'bg-slate-50' },
          { label: 'In Progress',  val: inProgress,   color: 'text-blue-600',     bg: 'bg-blue-50' },
          { label: 'Completed',    val: done,         color: 'text-emerald-600',  bg: 'bg-emerald-50' },
        ].map(s => (
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
          <span className="text-sm font-bold text-primary">{pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Start: {project.startDate ? format(new Date(project.startDate), 'dd MMM yyyy') : '—'}</span>
          <span>End:   {project.endDate   ? format(new Date(project.endDate),   'dd MMM yyyy') : '—'}</span>
        </div>
      </div>

      {/* Project Info */}
      <div className="rounded-xl border border-border p-4 bg-card space-y-3">
        <h3 className="font-semibold text-sm">Project Info</h3>
        <div className="grid grid-cols-2 gap-y-4 text-xs">
          <div>
            <span className="text-muted-foreground">Status</span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', STATUS_COLORS[project.status] || 'bg-muted')} />
              <span className="font-medium">{STATUS_LABELS[project.status] || project.status}</span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">SLA</span>
            <div className="mt-1"><SLABadge value={project.sla} /></div>
          </div>
          <div>
            <span className="text-muted-foreground">Owner</span>
            <div className="mt-1 flex items-center gap-1.5">
              {owner && <UserAvatar name={owner.name} size="sm" />}
              <span className="font-medium">{owner?.name || '—'}</span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Tag</span>
            <div className="mt-1">
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md font-medium">
                {project.tag || '—'}
              </span>
            </div>
          </div>
        </div>
        {project.description && (
          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            {project.description}
          </p>
        )}
      </div>

      {/* Team */}
      <div className="rounded-xl border border-border p-4 bg-card">
        <h3 className="font-semibold text-sm mb-3">Team ({memberUsers.length})</h3>
        {memberUsers.length === 0 ? (
          <p className="text-xs text-muted-foreground">No members added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {memberUsers.map(u => (
              <div key={u.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs font-medium">
                <UserAvatar name={u.name} size="sm" />
                {u.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}