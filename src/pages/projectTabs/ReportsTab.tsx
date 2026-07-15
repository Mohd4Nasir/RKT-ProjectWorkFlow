import { useMemo } from 'react';
import { useAppSelector } from '@/store';
import { cn } from '@/lib/utils';
import { BarChart3, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format, isAfter } from 'date-fns';

interface Props { projectId: string; }

export function ReportsTab({ projectId }: Props) {
  const tasks     = useAppSelector(s => s.tasks.items.filter(t => t.projectId === projectId));
  const taskLists = useAppSelector(s => s.taskLists.items.filter(tl => String(tl.projectId) === String(projectId)));
  const users     = useAppSelector(s => s.users.items);

  const stats = useMemo(() => {
    const total      = tasks.length;
    const done       = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const todo       = tasks.filter(t => t.status === 'todo').length;
    const overdue    = tasks.filter(t => t.dueDate && t.status !== 'done' && isAfter(new Date(), new Date(t.dueDate))).length;
    const pct        = total ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, todo, overdue, pct };
  }, [tasks]);

  const byAssignee = useMemo(() => {
    const map: Record<string, { name: string; total: number; done: number }> = {};
    tasks.forEach(t => {
      const key  = t.assigneeId || 'unassigned';
      const user = users.find(u => u.id === t.assigneeId);
      if (!map[key]) map[key] = { name: user?.name || 'Unassigned', total: 0, done: 0 };
      map[key].total++;
      if (t.status === 'done') map[key].done++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [tasks, users]);

  const byList = useMemo(() =>
    taskLists.map(tl => {
      const listTasks = tasks.filter(t => t.taskListId === tl.id && !t.parentTaskId);
      const done      = listTasks.filter(t => t.status === 'done').length;
      return { name: tl.name, total: listTasks.length, done };
    }), [tasks, taskLists]);

  return (
    <div className="p-6 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total',       val: stats.total,      icon: BarChart3,    color: 'text-slate-600',   bg: 'bg-slate-50' },
          { label: 'Done',        val: stats.done,       icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'In Progress', val: stats.inProgress, icon: Clock,        color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'To Do',       val: stats.todo,       icon: TrendingUp,   color: 'text-violet-600',  bg: 'bg-violet-50' },
          { label: 'Overdue',     val: stats.overdue,    icon: AlertCircle,  color: 'text-red-600',     bg: 'bg-red-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={cn('rounded-xl p-4 border border-border flex items-center gap-3', s.bg)}>
              <Icon className={cn('h-5 w-5', s.color)} />
              <div>
                <div className={cn('text-xl font-bold', s.color)}>{s.val}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion progress */}
      <div className="rounded-xl border border-border p-4 bg-card">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold">Completion Rate</span>
          <span className="text-sm font-bold text-primary">{stats.pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stats.pct}%` }} />
        </div>
      </div>

      {/* By assignee */}
      <div className="rounded-xl border border-border p-4 bg-card">
        <h3 className="font-semibold text-sm mb-4">Tasks by Assignee</h3>
        {byAssignee.length === 0 ? (
          <p className="text-xs text-muted-foreground">No data yet.</p>
        ) : (
          <div className="space-y-3">
            {byAssignee.map(a => (
              <div key={a.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-muted-foreground">{a.done}/{a.total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: a.total ? `${Math.round((a.done / a.total) * 100)}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* By list */}
      <div className="rounded-xl border border-border p-4 bg-card">
        <h3 className="font-semibold text-sm mb-4">Tasks by List</h3>
        {byList.length === 0 ? (
          <p className="text-xs text-muted-foreground">No lists yet.</p>
        ) : (
          <div className="space-y-3">
            {byList.map(l => (
              <div key={l.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{l.name}</span>
                  <span className="text-muted-foreground">{l.done}/{l.total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all"
                    style={{ width: l.total ? `${Math.round((l.done / l.total) * 100)}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}