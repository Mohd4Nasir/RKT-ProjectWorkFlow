import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateProject } from '@/store/slices/projectsSlice';
import { addTask, deleteTask, updateTask } from '@/store/slices/tasksSlice';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, Plus, MoreHorizontal, MessageSquare, BarChart3, ListChecks,
  Flag, ClipboardList, CalendarDays, Trash2, Edit2, X, ArrowUpRight,
  CheckSquare, FileText, AlertCircle, Users, ChevronRight, Clock, Circle,
  CheckCircle2, AlertTriangle
} from 'lucide-react';
import { InlineEdit } from '@/components/cells/InlineEdit';
import { OwnerPicker } from '@/components/cells/OwnerPicker';
import { DatePickerCell } from '@/components/cells/DatePickerCell';
import { ProjectStatusPill, StatusSelectCell } from '@/components/cells/StatusSelect';
import { UserAvatar } from '@/components/UserAvatar';
import { StatusBadge as SLABadge } from '@/components/StatusBadge';
import { userById } from '@/utils/format';
import { Priority, Task, TaskStatus } from '@/types';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { TaskDetailPanel } from './TaskDetailsPanel';

type GroupBy = 'list' | 'status' | 'owner';
type Tab = 'dashboard' | 'tasks' | 'reports' | 'documents' | 'milestones' | 'issues' | 'users';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: 'tasks',     label: 'Tasks',     icon: <CheckSquare className="h-3.5 w-3.5" /> },
  { id: 'reports',   label: 'Reports',   icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: 'documents', label: 'Documents', icon: <FileText className="h-3.5 w-3.5" /> },
  { id: 'milestones',label: 'Milestones',icon: <Flag className="h-3.5 w-3.5" /> },
  { id: 'issues',    label: 'Issues',    icon: <AlertCircle className="h-3.5 w-3.5" /> },
  { id: 'users',     label: 'Users',     icon: <Users className="h-3.5 w-3.5" /> },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500', 'in-progress': 'bg-blue-500',
  'on-hold': 'bg-amber-500', delayed: 'bg-red-500', completed: 'bg-violet-500',
};
const STATUS_LABELS: Record<string, string> = {
  active: 'Active', 'in-progress': 'In Progress',
  'on-hold': 'On Hold', delayed: 'Delayed', completed: 'Completed',
};

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.projects.items.find((p) => p.id === id));
  const users = useAppSelector((s) => s.users.items);
  const allTasks = useAppSelector((s) => s.tasks.items);
  const me = useAppSelector((s) => s.auth.user!);

  const [tab, setTab] = useState<Tab>('tasks');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('list');
  const [drawerKey, setDrawerKey] = useState<string | null>(null);

  const tasks = useMemo(() => allTasks.filter((t) => t.projectId === id), [allTasks, id]);
  const open = tasks.filter((t) => t.status !== 'done').length;
  const closed = tasks.filter((t) => t.status === 'done').length;
  const pct = tasks.length ? Math.round((closed / tasks.length) * 100) : project?.progress ?? 0;

  if (!project) {
    return (
      <div className="card-elevated p-12 text-center">
        <p className="font-semibold">Project not found</p>
        <Button variant="outline" className="mt-3" onClick={() => navigate('/projects')}>Back to Projects</Button>
      </div>
    );
  }

  const owner = users.find((u) => u.id === project.ownerId);
  const memberUsers = users.filter((u) => project.members.includes(u.id));

  const projectTasks = tasks;
  const done = projectTasks.filter((t) => t.status === 'done').length;
  const inProgress = projectTasks.filter((t) => t.status === 'in-progress').length;
  const todo = projectTasks.filter((t) => t.status === 'todo').length;

  const filteredTasks = taskFilter === 'all'
    ? projectTasks
    : projectTasks.filter((t) => t.status === taskFilter);

  function taskCode(t: Task, i: number) {
    const n = parseInt(t.id.replace(/\D/g, ''), 10) || i + 1;
    return `JD1-T${n}`;
  }

  const onAddTask = (title: string) => {
    if (!title.trim()) return;
    dispatch(addTask({
      id: 't' + Date.now(),
      projectId: project.id,
      title: title.trim(),
      description: '',
      status: 'todo',
      priority: 'medium',
      assigneeId: me.id,
      dueDate: '',
      createdAt: new Date().toISOString(),
      sla: 'on-track',
      subtasks: [], comments: [], attachments: [],
    }));
    toast.success('Task added');
  };

  return (
    <div className="space-y-5">
      {/* Modal-style header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-card rounded-t-2xl">
        <span className="h-7 w-7 rounded-lg grid place-items-center text-white text-xs font-bold flex-shrink-0" style={{ background: project.color }}>
          {project.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
        </span>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-muted-foreground font-semibold">
            {(() => { const n = parseInt(project.id.replace(/\D/g,''),10)||1; return `KI-${100+n*7}`; })()}
          </span>
          <h2 className="font-bold text-base truncate">{project.name}</h2>
        </div>
        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
          <Button variant="ghost" size="sm" className="text-xs font-semibold" onClick={() => navigate('/projects')}>
            Back to Projects <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
          </Button>
          <button className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs - matching modal style */}
      <div className="flex items-center gap-0 px-4 border-b border-border bg-card overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors',
              tab === t.id
                ? 'border-[#E07B39] text-[#E07B39]'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Body - matching modal content structure */}
      <div className="min-h-[calc(100vh-160px)]">
        {tab === 'dashboard' && (
          <div className="space-y-6 p-1">
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Tasks', val: projectTasks.length, color: 'text-foreground', bg: 'bg-muted' },
                { label: 'In Progress', val: inProgress, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Completed', val: done, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Completion', val: `${pct}%`, color: 'text-violet-600', bg: 'bg-violet-50' },
              ].map((s) => (
                <div key={s.label} className={cn('rounded-xl p-4 border border-border', s.bg)}>
                  <div className={cn('text-2xl font-bold', s.color)}>{s.val}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
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
                <span>End: {project.endDate ? format(new Date(project.endDate), 'dd MMM yyyy') : '—'}</span>
              </div>
            </div>

            {/* Project Info */}
            <div className="rounded-xl border border-border p-4 bg-card space-y-3">
              <h3 className="font-semibold text-sm">Project Info</h3>
              <div className="grid grid-cols-2 gap-y-3 text-xs">
                <div><span className="text-muted-foreground">Status</span>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full', STATUS_COLORS[project.status] || 'bg-muted')} />
                    <span className="font-medium">{STATUS_LABELS[project.status]}</span>
                  </div>
                </div>
                <div><span className="text-muted-foreground">SLA</span>
                  <div className="mt-0.5"><SLABadge value={project.sla} /></div>
                </div>
                <div><span className="text-muted-foreground">Owner</span>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {owner && <UserAvatar name={owner.name} size="sm" />}
                    <span className="font-medium">{owner?.name || '—'}</span>
                  </div>
                </div>
                <div><span className="text-muted-foreground">Tag</span>
                  <div className="mt-0.5">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md font-medium">{project.tag}</span>
                  </div>
                </div>
              </div>
              {project.description && (
                <p className="text-xs text-muted-foreground border-t border-border pt-3">{project.description}</p>
              )}
            </div>

            {/* Team */}
            <div className="rounded-xl border border-border p-4 bg-card">
              <h3 className="font-semibold text-sm mb-3">Team ({memberUsers.length})</h3>
              <div className="flex flex-wrap gap-2">
                {memberUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs font-medium">
                    <UserAvatar name={u.name} size="sm" />
                    {u.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'tasks' && (
          <div className="flex flex-col">
            {/* Task toolbar */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/50 flex-shrink-0">
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
                <span>Group By:</span>
                <Select value={groupBy} onValueChange={(v: GroupBy) => setGroupBy(v)}>
                  <SelectTrigger className="h-7 w-[110px] text-xs border-transparent bg-transparent hover:bg-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">Task List</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                {(['all','todo','in-progress','done'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTaskFilter(f)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                      taskFilter === f ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {f === 'all' ? 'All Open' : f === 'todo' ? 'To Do' : f === 'in-progress' ? 'In Progress' : 'Done'}
                  </button>
                ))}
                <button
                  onClick={() => onAddTask('New task')}
                  className="ml-2 flex items-center gap-1 text-xs text-white bg-[#E07B39] px-3 py-1.5 rounded-lg font-semibold hover:opacity-90"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Task
                </button>
              </div>
            </div>

            {/* Tasks table */}
            <div className="overflow-auto">
              <table className="w-full text-xs min-w-max">
                <thead className="sticky top-0 z-10 bg-[#f7f5ff] border-b border-border">
                  <tr>
                    {['', 'ID', 'Task Name', 'Milestone', 'Owner', 'Status', 'Start Date', '% Completion', 'Due Date', 'Duration'].map((h) => (
                      <th key={h} className="h-9 px-3 text-left font-semibold text-[11px] text-muted-foreground whitespace-nowrap border-r border-border last:border-r-0 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Group header */}
                  <tr className="bg-muted/30 border-b border-border">
                    <td colSpan={10} className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground rotate-90" />
                        <span className="font-semibold text-xs">General <span className="text-muted-foreground font-normal">({filteredTasks.length})</span></span>
                        <span className="ml-auto text-xs text-muted-foreground">None</span>
                        <div className="w-20 h-5 rounded-full bg-emerald-100 border border-emerald-300 overflow-hidden relative">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-emerald-800">{pct}%</span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {filteredTasks.map((t, i) => {
                    const u = users.find((x) => x.id === t.assigneeId);
                    const code = taskCode(t, i);
                    const taskPct = t.status === 'done' ? 100 : t.status === 'in-progress' ? 50 : 0;
                    const statusMap: Record<string, string> = {
                      todo: 'bg-muted text-muted-foreground', 'in-progress': 'bg-blue-500 text-white', done: 'bg-emerald-500 text-white',
                    };
                    const statusLabel: Record<string, string> = { todo: 'To Do', 'in-progress': 'Open', done: 'Done' };
                    return (
                      <tr
                        key={t.id}
                        className="border-b border-border hover:bg-primary/5 cursor-pointer transition-colors group"
                        onClick={() => setSelectedTask(t)}
                      >
                        <td className="px-3 py-2.5 border-r border-border w-8">
                          <input type="checkbox" className="rounded" />
                        </td>
                        <td className="px-3 py-2.5 border-r border-border font-mono text-muted-foreground whitespace-nowrap">{code}</td>
                        <td className="px-3 py-2.5 border-r border-border min-w-[200px]">
                          <span className="font-medium group-hover:text-primary transition-colors">{t.title}</span>
                        </td>
                        <td className="px-3 py-2.5 border-r border-border text-muted-foreground">None</td>
                        <td className="px-3 py-2.5 border-r border-border">
                          {u ? (
                            <div className="flex items-center gap-1.5">
                              <UserAvatar name={u.name} size="sm" />
                              <span className="truncate max-w-[80px]">{u.name.split(' ')[0]} {u.name.split(' ')[1]?.[0]}.</span>
                            </div>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-2.5 border-r border-border">
                          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold', statusMap[t.status])}>
                            {statusLabel[t.status]}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 border-r border-border text-muted-foreground whitespace-nowrap">
                          {t.dueDate ? format(new Date(t.dueDate), 'dd MMM yyyy') : '—'}
                        </td>
                        <td className="px-3 py-2.5 border-r border-border w-28">
                          <div className="relative h-5 bg-muted rounded overflow-hidden">
                            <div className="h-full bg-muted-foreground/30" style={{ width: `${taskPct}%` }} />
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{taskPct}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 border-r border-border text-muted-foreground whitespace-nowrap">
                          {t.dueDate ? format(new Date(t.dueDate), 'dd MMM yyyy') : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">—</td>
                      </tr>
                    );
                  })}

                  {/* Add Task row */}
                  <tr className="border-b border-border">
                    <td colSpan={10} className="px-4 py-2">
                      <button
                        onClick={() => onAddTask('New task')}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Task
                        <span className="ml-4 text-border">|</span>
                        <span className="ml-2 hover:text-primary">Add Task List</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              {filteredTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <CheckSquare className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">No tasks found</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-4 py-2 border-t border-border text-xs text-muted-foreground bg-card/50 flex-shrink-0">
              Total Count: <strong className="ml-1 text-foreground">{filteredTasks.length}</strong>
            </div>
          </div>
        )}

        {(tab === 'reports' || tab === 'documents' || tab === 'milestones' || tab === 'issues') && (
          <div className="flex items-center justify-center text-muted-foreground min-h-[400px]">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                {TABS.find(t => t.id === tab)?.icon}
              </div>
              <p className="font-semibold text-sm capitalize">{tab} page</p>
              <p className="text-xs mt-1">Add your {tab} content here</p>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="overflow-auto p-6">
            <div className="space-y-2">
              {memberUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition">
                  <UserAvatar name={u.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{u.department}</span>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold',
                    u.id === project.ownerId ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                    {u.id === project.ownerId ? 'Owner' : 'Member'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          users={users}
          project={project}
          onClose={() => setSelectedTask(null)}
          onUpdate={(t) => { dispatch(updateTask(t)); setSelectedTask(t); }}
        />
      )}

      {/* Right-side drawer for task list view (optional, kept for compatibility) */}
      <Sheet open={!!drawerKey} onOpenChange={(o) => !o && setDrawerKey(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[860px] p-0 bg-background">
          <SheetHeader className="px-5 py-4 border-b border-border bg-card">
            <SheetTitle className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-full grid place-items-center bg-primary/10 text-primary text-xs font-bold">
                {pct}%
              </span>
              <div>
                <div className="text-base font-display">{drawerKey === 'general' ? 'General' : drawerKey}</div>
                <div className="text-[11px] text-muted-foreground font-normal">{project.name} · {project.tag}</div>
              </div>
              <div className="ml-auto text-xs font-normal">
                <span className="text-success font-semibold">{open} Open</span>
                <span className="mx-2 text-muted-foreground">·</span>
                <span className="text-muted-foreground">{closed} Closed</span>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="p-5 overflow-y-auto h-[calc(100vh-80px)]">
            {/* Simplified task list for drawer */}
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">{t.title}</span>
                  <UserAvatar name={userById(users, t.assigneeId)?.name || ''} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}