import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, Columns3, Info, List as ListIcon, ListChecks, RefreshCw, Search, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { TaskBoard, BoardTask } from '@/components/board/TaskBoard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store';
import { GlobalTask, useAllTasks } from '@/hooks/useAllTasks';
import { taskService } from '@/services/taskservice';
import { IssueCountBadge } from '@/pages/task/IssueCountBadge';
import { fmtDate } from '@/pages/projects/projectUi';
import {
  isOverdueDate, isTaskDone, priorityOf, priorityUi, taskStatusUi,
} from '@/pages/task/taskUi';
import { useTaskStatuses } from '@/pages/task/useTaskStatuses';
import { showError } from '@/lib/errorAlert';

interface Props { mine?: boolean; }

export default function Tasks({ mine }: Props) {
  const statusOptions = useTaskStatuses();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const base = user?.role === 'admin' ? '/projects' : '/my-projects';

  const { tasks, projectOptions, loading, error, failedProjects, reload, setStatusLocal } = useAllTasks();

  const [view, setView] = useState<'board' | 'list'>('board');
  const [q, setQ] = useState('');
  const [project, setProject] = useState('all');
  const [priority, setPriority] = useState('all');
  const [status, setStatus] = useState('all');
  const [hideDone, setHideDone] = useState(false);

  // "My tasks": match on assignee id when the API gives one, otherwise show everything
  const mineMatches = useMemo(
    () => (mine && user ? tasks.filter((t) => String(t.assigneeId ?? '') === String(user.id)) : tasks),
    [tasks, mine, user],
  );
  const assigneeDataMissing = !!mine && tasks.length > 0 && mineMatches.length === 0;
  const scoped = assigneeDataMissing ? tasks : mineMatches;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return scoped.filter((t) => {
      if (project !== 'all' && String(t.projectId) !== project) return false;
      if (priority !== 'all' && priorityOf(t).toLowerCase() !== priority) return false;
      if (status !== 'all' && (statusOptions.find((o) => o.key === (t.taskStatus || '').toUpperCase()) ?? taskStatusUi(t.taskStatus)).key !== status) return false;
      if (hideDone && isTaskDone(t.taskStatus)) return false;
      if (s && !(t.taskTitle || '').toLowerCase().includes(s) && !t.projectTitle.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [scoped, q, project, priority, status, hideDone]);

  const kpi = useMemo(() => ({
    total: scoped.length,
    open: scoped.filter((t) => !isTaskDone(t.taskStatus)).length,
    done: scoped.filter((t) => isTaskDone(t.taskStatus)).length,
    overdue: scoped.filter((t) => isOverdueDate(t.endDate, t.taskStatus)).length,
  }), [scoped]);

  const boardTasks: BoardTask[] = useMemo(() => filtered.map((t) => ({
    key: `${t.projectId}-${t.taskId}`,
    taskId: t.taskId,
    projectId: t.projectId,
    title: t.taskTitle,
    status: t.taskStatus,
    priority: priorityOf(t),
    endDate: t.endDate,
    listTitle: t.listTitle,
    projectTitle: t.projectTitle,
    openIssueCount: t.openIssueCount,
    subtaskTotal: t.subtaskTotal,
    subtaskDone: t.subtaskDone,
    isSubtask: !!t.parentTaskId,
  })), [filtered]);

  const changeStatus = async (projectId: number, taskId: number, next: string, prev: string) => {
    setStatusLocal(projectId, taskId, next); // optimistic
    try {
      await taskService.updateTaskStatus(projectId, taskId, next);
      toast.success(`Moved to ${taskStatusUi(next).label}`);
    } catch (err) {
      setStatusLocal(projectId, taskId, prev); // roll back
      showError(err, 'Failed to update status'); // 409 = open issues block completion
    }
  };

  const openProject = (t: { projectId?: number | string }) =>
    navigate(`${base}/${t.projectId}?tab=tasks`);

  const clearFilters = () => { setQ(''); setProject('all'); setPriority('all'); setStatus('all'); setHideDone(false); };
  const hasFilters = q || project !== 'all' || priority !== 'all' || status !== 'all' || hideDone;

  return (
    <div className="page-fill !gap-4">
      <PageHeader
        title={mine ? 'Tasks' : 'Tasks'}
        subtitle={mine ? 'Everything on your plate, across projects.' : 'All tasks across all projects.'}
        actions={
          <Button variant="outline" onClick={reload} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 -mt-3 shrink-0">
        <StatCard title="Total" value={loading ? '—' : kpi.total} icon={ListChecks} variant="primary" />
        <StatCard title="In flight" value={loading ? '—' : kpi.open} icon={Columns3} variant="info" />
        <StatCard title="Completed" value={loading ? '—' : kpi.done} icon={CheckCircle2} variant="success" />
        <StatCard title="Overdue" value={loading ? '—' : kpi.overdue} icon={AlertTriangle} variant="warning" />
      </div>

      {assigneeDataMissing && (
        <div className="shrink-0 flex items-center gap-2 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-xs text-info">
          <Info className="h-4 w-4 shrink-0" />
          The API doesn't return task assignees yet, so all tasks from your projects are shown here.
        </div>
      )}
      {(error || failedProjects > 0) && (
        <div className="shrink-0 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <span>
            {error ? "Couldn't load tasks." : `${failedProjects} project${failedProjects > 1 ? 's' : ''} couldn't be loaded.`}
          </span>
          <button className="underline font-medium" onClick={reload}>Retry</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="shrink-0 card-elevated p-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks or projects…" className="pl-8 h-9" />
        </div>

        <Select value={project} onValueChange={setProject}>
          <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Project" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projectOptions.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}
          </SelectContent>
        </Select>

        {view === 'list' && (
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none px-1">
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} className="accent-primary" />
          Hide completed
        </label>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs">
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}

        <div className="ml-auto inline-flex rounded-md border border-border bg-card">
          {([['board', 'Board', Columns3], ['list', 'List', ListIcon]] as const).map(([k, label, Icon], i) => (
            <button
              key={k}
              onClick={() => setView(k)}
              className={cn(
                'h-9 px-3 text-xs font-medium inline-flex items-center gap-1.5',
                i === 0 ? 'rounded-l-md' : 'rounded-r-md border-l border-border',
                view === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="fill-area">
        {loading ? (
          <div className="h-full grid place-items-center text-sm text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mb-2 mx-auto" /> Loading tasks…
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-elevated py-16 text-center">
            <ListChecks className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-semibold">No tasks found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {hasFilters ? 'Try clearing the filters.' : 'Create tasks inside a project to see them here.'}
            </p>
          </div>
        ) : view === 'board' ? (
          <TaskBoard
            tasks={boardTasks}
            showProject
            onOpen={openProject}
            onStatusChange={(t, next) =>
              changeStatus(Number(t.projectId), Number(t.taskId), next, t.status)}
          />
        ) : (
          <ListView tasks={filtered} onOpen={openProject} onStatus={changeStatus} />
        )}
      </div>
    </div>
  );
}

function ListView({
  tasks, onOpen, onStatus,
}: {
  tasks: GlobalTask[];
  onOpen: (t: GlobalTask) => void;
  onStatus: (projectId: number, taskId: number, next: string, prev: string) => void;
}) {
  const statusOptions = useTaskStatuses();
  return (
    <div className="h-full border border-border bg-card shadow-card overflow-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-sidebar">
          <tr>
            {['Task', 'Project', 'List', 'Status', 'Priority', 'Due'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/75 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const st = statusOptions.find((o) => o.key === (t.taskStatus || '').toUpperCase()) ?? taskStatusUi(t.taskStatus);
            const pr = priorityUi(t.priority);
            const od = isOverdueDate(t.endDate, t.taskStatus);
            return (
              <tr
                key={`${t.projectId}-${t.taskId}`}
                onClick={() => onOpen(t)}
                className="border-b border-border/70 hover:bg-primary/[0.04] cursor-pointer transition-colors"
              >
                <td className="px-4 py-2.5 font-semibold max-w-[320px] truncate">
                  {t.parentTaskId ? <span className="text-muted-foreground mr-1">↳</span> : null}
                  <span className={cn(isTaskDone(t.taskStatus) && 'line-through text-muted-foreground')}>{t.taskTitle}</span>
                  <IssueCountBadge count={t.openIssueCount} className="ml-2 align-middle" />
                </td>
                <td className="px-4 py-2.5 text-muted-foreground max-w-[200px] truncate">{t.projectTitle}</td>
                <td className="px-4 py-2.5 text-muted-foreground max-w-[160px] truncate">{t.listTitle}</td>
                <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <Select value={st.key} onValueChange={(v) => onStatus(t.projectId, t.taskId, v, t.taskStatus)}>
                    <SelectTrigger className={cn('h-7 w-[140px] rounded-full border text-[11px] font-semibold', st.badge)}>
                      <span className="flex items-center gap-1.5">
                        <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                        <SelectValue />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-2.5">
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium', pr.chip)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', pr.dot)} /> {pr.label}
                  </span>
                </td>
                <td className={cn('px-4 py-2.5 text-xs whitespace-nowrap', od ? 'text-destructive font-semibold' : 'text-muted-foreground')}>
                  {fmtDate(t.endDate)}{od && ' · overdue'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
