import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import {
  CalendarDays, Check, ChevronDown, ChevronRight, CornerDownRight, FileText, FolderKanban, ListTree,
  ListTodo, Loader2, Maximize2, Minimize2, Pencil, Plus, Tag, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Project, Users } from '@/types/ProejctsType';
import { SubTaskNode, TaskNode } from '@/types/taskTypes';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { taskService } from '@/services/taskservice';
import { isTaskDone, normStatus, priorityOf, priorityUi, taskStatusUi } from './taskUi';
import { useTaskStatuses } from './useTaskStatuses';
import { useTaskPriorities } from './useTaskPriorities';
import { TaskContributors } from './Taskcontributors ';
import { TaskPanelTabs } from './TaskPanelExtras';
import { TaskListRail } from './TaskListRail';
import { showError } from '@/lib/errorAlert';

const FULLSCREEN_KEY = 'rkt.taskPanel.fullscreen';
const RAIL_KEY = 'rkt.taskPanel.rail';

interface TaskDetailPanelProps {
  task: SubTaskNode | TaskNode;
  users: Users[];
  project: Project;
  onClose: () => void;
  onUpdate: (t: SubTaskNode | TaskNode) => void;
  onSelectTask?: (taskId: string) => void;
  /** called after anything changed on the server so the parent can reload its tree */
  onChanged?: () => void | Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface TreeNode {
  taskId: number;
  taskTitle: string;
  taskStatus: string;
  endDate?: string;
  subTask?: TreeNode[];
}

const fmtDay = (d?: string) => {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

function countTree(nodes: TreeNode[] = []): { total: number; done: number } {
  let total = 0;
  let done = 0;
  nodes.forEach((n) => {
    total += 1;
    if (isTaskDone(n.taskStatus)) done += 1;
    const c = countTree(n.subTask);
    total += c.total;
    done += c.done;
  });
  return { total, done };
}

/* ───────────────────────── Status picker ───────────────────────── */

function StatusPicker({
  value, onChange, size = 'md', disabled,
}: { value?: string; onChange: (s: string) => void; size?: 'sm' | 'md'; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const options = useTaskStatuses();
  const upper = (value || '').toUpperCase();
  const curKey = options.some((o) => o.key === upper) ? upper : normStatus(value);
  const cur = options.find((s) => s.key === curKey) ?? taskStatusUi(value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border font-semibold whitespace-nowrap transition-opacity hover:opacity-85 disabled:opacity-60',
            size === 'md' ? 'px-3 py-1.5 text-xs' : 'px-2 py-0.5 text-[11px]',
            cur.badge,
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', cur.dot)} />
          {cur.label}
          <ChevronDown className="h-3 w-3 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="z-[200] w-48 p-1" align="start" onClick={(e) => e.stopPropagation()}>
        {options.map((s) => (
          <button
            key={s.key}
            onClick={() => {
              setOpen(false);
              if (s.key !== curKey) onChange(s.key);
            }}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted text-left',
              s.key === curKey && 'bg-muted font-semibold',
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', s.dot)} />
            <span className="flex-1">{s.label}</span>
            {s.key === curKey && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/* ───────────────────────── Priority picker ───────────────────────── */

function PriorityPicker({ value, onChange }: { value?: string; onChange: (p: string) => void }) {
  const [open, setOpen] = useState(false);
  const options = useTaskPriorities();
  const cur = priorityUi(value);
  const curKey = (value || 'none').toLowerCase();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold hover:opacity-85 transition-opacity', cur.chip)}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', cur.dot)} />
          {cur.label}
          <ChevronDown className="h-3 w-3 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="z-[200] w-40 p-1" align="start">
        {options.map((p) => (
          <button
            key={p.key}
            onClick={() => { setOpen(false); if (p.key !== curKey) onChange(p.key); }}
            className={cn('w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted text-left', p.key === curKey && 'bg-muted font-semibold')}
          >
            <span className={cn('h-2 w-2 rounded-full', p.dot)} />
            <span className="flex-1">{p.label}</span>
            {p.key === curKey && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/** read-only status chip: nested subtasks can only be viewed here, the open task is the one that is editable */
function StatusBadge({ value }: { value?: string }) {
  const options = useTaskStatuses();
  const cur = options.find((s) => s.key === normStatus(value)) ?? taskStatusUi(value);
  return (
    <span
      title="Open this task to change its status"
      className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap cursor-default', cur.badge)}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', cur.dot)} />
      {cur.label}
    </span>
  );
}

/* ───────────────────────── Subtask rows ───────────────────────── */

const DEPTH_BORDER = ["border-l-primary", "border-l-info", "border-l-accent-foreground", "border-l-warning"];

function SubtaskRow({
  node, depth, onOpen,
}: {
  node: TreeNode;
  depth: number;
  onOpen: (id: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const kids = node.subTask ?? [];
  const done = isTaskDone(node.taskStatus);
  return (
    <>
      <li
        className={cn("group flex items-center gap-2 border-b border-border/60 border-l-[3px] px-3 py-2 hover:bg-primary/[0.06] transition-colors", DEPTH_BORDER[depth % DEPTH_BORDER.length])}
        style={{ paddingLeft: 12 + depth * 22 }}
      >
        {kids.length ? (
          <button onClick={() => setOpen(!open)} className="h-5 w-5 grid place-items-center rounded hover:bg-muted text-muted-foreground">
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground/60 mx-[3px]" />
        )}
        <button
          onClick={() => onOpen(node.taskId)}
          className={cn('flex-1 min-w-0 truncate text-left text-sm font-medium hover:text-primary hover:underline', done && 'line-through text-muted-foreground')}
        >
          {node.taskTitle}
        </button>
        {node.endDate && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <CalendarDays className="h-3 w-3" /> {fmtDay(node.endDate)}
          </span>
        )}
        <StatusBadge value={node.taskStatus} />
      </li>
      {open && kids.map((k) => (
        <SubtaskRow key={k.taskId} node={k} depth={depth + 1} onOpen={onOpen} />
      ))}
    </>
  );
}

/* ───────────────────────── Panel ───────────────────────── */

export const TaskDetailPanel = memo(function TaskDetailPanel({
  task, project, onClose, onUpdate, onSelectTask, onChanged,
}: TaskDetailPanelProps) {
  const t = task as Any;
  const projectId = project?.projectId ?? t.projectId;
  const taskId = t.taskId;
  const listId = t.listId ?? t.taskListId;
  const status = taskStatusUi(t.taskStatus);

  // ── editing state ──
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(t.taskTitle ?? '');
  const [editingDesc, setEditingDesc] = useState(false);
  const [desc, setDesc] = useState(t.taskDescription ?? '');
  const [saving, setSaving] = useState(false);
  const [fullscreen, setFullscreen] = useState(() => {
    try { return localStorage.getItem(FULLSCREEN_KEY) === '1'; } catch { return false; }
  });
  const [railOpen, setRailOpen] = useState(() => {
    try { return localStorage.getItem(RAIL_KEY) !== '0'; } catch { return true; }
  });
  const setRail = (on: boolean) => {
    setRailOpen(on);
    try { localStorage.setItem(RAIL_KEY, on ? '1' : '0'); } catch { /* ignore */ }
  };
  const toggleFullscreen = () => {
    setFullscreen((f) => {
      try { localStorage.setItem(FULLSCREEN_KEY, f ? '0' : '1'); } catch { /* ignore */ }
      return !f;
    });
  };

  useEffect(() => {
    setTitle(t.taskTitle ?? '');
    setDesc(t.taskDescription ?? '');
    setEditingTitle(false);
    setEditingDesc(false);
  }, [taskId, t.taskTitle, t.taskDescription]);

  // Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !editingTitle && !editingDesc) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, editingTitle, editingDesc]);

  // ── subtasks (GET /task/{id}/sub-tree) ──
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loadingTree, setLoadingTree] = useState(true);
  const [newSub, setNewSub] = useState('');
  const [creating, setCreating] = useState(false);
  const subInput = useRef<HTMLInputElement>(null);

  const latestTask = useRef(taskId);
  latestTask.current = taskId;

  const loadTree = useCallback(async () => {
    try {
      const res = await taskService.getSubTree(taskId);
      if (latestTask.current !== taskId) return; // user already moved to another task
      const raw = res?.data ?? res;
      setTree(Array.isArray(raw) ? raw[0] ?? null : raw?.taskId ? raw : null);
    } catch (err) {
      setTree(null);
      showError(err, 'Failed to load subtasks');
    } finally {
      setLoadingTree(false);
    }
  }, [taskId]);

  useEffect(() => {
    setLoadingTree(true);
    loadTree();
  }, [loadTree]);

  const subtasks = tree?.subTask ?? [];
  const counts = useMemo(() => countTree(subtasks), [subtasks]);
  const pct = counts.total ? Math.round((counts.done / counts.total) * 100) : isTaskDone(t.taskStatus) ? 100 : 0;

  // ── server writes ──
  const patchTask = async (patch: { taskTitle?: string; taskDescription?: string; startDate?: string; endDate?: string }) => {
    setSaving(true);
    try {
      await taskService.updateTask(projectId, taskId, {
        taskTitle: patch.taskTitle ?? t.taskTitle,
        taskDescription: patch.taskDescription ?? t.taskDescription ?? '',
        taskStartDate: (patch.startDate ?? t.startDate) || undefined,
        taskEndDate: (patch.endDate ?? t.endDate) || undefined,
      });
      onUpdate({
        ...t,
        taskTitle: patch.taskTitle ?? t.taskTitle,
        taskDescription: patch.taskDescription ?? t.taskDescription,
        startDate: patch.startDate ?? t.startDate,
        endDate: patch.endDate ?? t.endDate,
      });
      onChanged?.();
      toast.success('Saved');
      return true;
    } catch (err) {
      showError(err, 'Failed to save changes');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (next: string) => {
    try {
      await taskService.updateTaskStatus(projectId, taskId, next);
      onUpdate({ ...t, taskStatus: next });
      onChanged?.();
      toast.success(`Status: ${taskStatusUi(next).label}`);
    } catch (err) {
      // 409: "Task can't be marked Completed: N open issue(s) must be closed first"
      showError(err, 'Failed to update status');
    }
  };

  const changePriority = async (next: string) => {
    try {
      await taskService.updateTaskPriority(projectId, taskId, next);
      onUpdate({ ...t, taskPriority: next.toUpperCase(), priority: next.toUpperCase() });
      onChanged?.();
      toast.success(`Priority: ${priorityUi(next).label}`);
    } catch (err) {
      showError(err, 'Failed to update priority');
    }
  };

  const createSubtask = async () => {
    const name = newSub.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      await taskService.createTask({
        projectId,
        taskListId: listId,
        parentTaskId: taskId,
        taskTitle: name,
        taskStatus: 'TODO',
      });
      setNewSub('');
      await loadTree();
      onChanged?.();
      toast.success('Subtask created');
      subInput.current?.focus();
    } catch (err) {
      showError(err, 'Failed to create subtask');
    } finally {
      setCreating(false);
    }
  };

  const saveTitle = async () => {
    const v = title.trim();
    if (!v || v === t.taskTitle) {
      setTitle(t.taskTitle ?? '');
      setEditingTitle(false);
      return;
    }
    if (await patchTask({ taskTitle: v })) setEditingTitle(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-[1px] animate-fade-in" onClick={onClose} />

      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-[101] flex flex-col bg-background shadow-2xl border-l border-primary/30 animate-slide-in-right transition-[width] duration-200',
          fullscreen ? 'w-screen' : railOpen ? 'w-[min(1340px,98vw)]' : 'w-[min(1080px,96vw)]',
        )}
        role="dialog"
        aria-label="Task details"
      >
        {/* ── Header: breadcrumb ── */}
        <header className="relative flex items-center gap-2 px-5 h-12 shrink-0 text-white bg-[image:var(--gradient-hero)]">
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-primary via-info to-accent" />
          {!railOpen && (
            <button
              onClick={() => setRail(true)}
              className="hidden lg:grid h-8 w-8 place-items-center rounded-md text-white/70 hover:bg-white/15 hover:text-white"
              aria-label="Show task list" title="Show task list"
            >
              <ListTodo className="h-4 w-4" />
            </button>
          )}
          <nav className="flex items-center gap-1.5 text-xs text-white/70 min-w-0">
            <FolderKanban className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[160px]">{project?.projectTitle ?? t.projectTitle}</span>
            {t.listTitle && (<><ChevronRight className="h-3 w-3 shrink-0" /><span className="truncate max-w-[140px]">{t.listTitle}</span></>)}
            {t.parentTaskId && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <button
                  onClick={() => onSelectTask?.(String(t.parentTaskId))}
                  className="truncate max-w-[160px] hover:text-white hover:underline"
                  title="Open parent task"
                >
                  {t.parentTaskTitle || `Task ${t.parentTaskId}`}
                </button>
              </>
            )}
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="font-mono font-semibold text-white bg-white/15 rounded px-1.5 py-0.5">TSK-{taskId}</span>
          </nav>
          <button
            onClick={toggleFullscreen}
            className="ml-auto hidden sm:grid h-8 w-8 place-items-center rounded-md text-white/70 hover:bg-white/15 hover:text-white"
            aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
            title={fullscreen ? 'Exit full screen' : 'Full screen'}
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-md text-white/70 hover:bg-white/15 hover:text-white"
            aria-label="Close"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
          {railOpen && (
            <TaskListRail
              taskId={taskId}
              listId={listId}
              onSelect={(id) => id !== taskId && onSelectTask?.(String(id))}
              onCollapse={() => setRail(false)}
            />
          )}

          {/* ═════════ MAIN ═════════ */}
          <main className="flex-1 min-w-0 lg:overflow-y-auto px-6 py-5 space-y-6 scrollbar-thin bg-background">
            {/* Title */}
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-foreground bg-[image:var(--gradient-primary)] rounded-full px-2.5 py-0.5 mb-2 shadow-sm">
                <Tag className="h-3 w-3" /> {t.parentTaskId ? 'Subtask' : 'Task'}
              </span>
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveTitle();
                      if (e.key === 'Escape') { setTitle(t.taskTitle ?? ''); setEditingTitle(false); }
                    }}
                    className="flex-1 text-2xl font-display font-bold bg-card border border-primary/50 rounded-md px-2 py-1 outline-none ring-2 ring-primary/20"
                  />
                  <Button size="sm" onClick={saveTitle} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setTitle(t.taskTitle ?? ''); setEditingTitle(false); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <h1
                  onClick={() => setEditingTitle(true)}
                  title="Click to edit"
                  className="group text-2xl font-display font-bold leading-tight cursor-text rounded-md px-1 -mx-1 hover:bg-muted/70 transition-colors"
                >
                  {t.taskTitle}
                  <Pencil className="inline h-4 w-4 ml-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </h1>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap items-center gap-2">
              <StatusPicker value={t.taskStatus} onChange={changeStatus} />
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => subInput.current?.focus()}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add subtask
              </Button>
            </div>

            {/* Description */}
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold mb-2">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-info/15 text-info"><FileText className="h-3.5 w-3.5" /></span> Description
                {!editingDesc && (
                  <button onClick={() => setEditingDesc(true)} className="ml-1 text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                )}
              </h3>
              {editingDesc ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={6}
                    placeholder="Add a description…"
                    className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-y"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={saving}
                      onClick={async () => { if (await patchTask({ taskDescription: desc })) setEditingDesc(false); }}
                    >
                      {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />} Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setDesc(t.taskDescription ?? ''); setEditingDesc(false); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingDesc(true)}
                  className={cn(
                    'rounded-lg border border-dashed border-info/40 bg-info/[0.04] px-3 py-3 text-sm whitespace-pre-wrap cursor-text hover:bg-info/10 transition-colors min-h-[56px]',
                    !t.taskDescription && 'text-muted-foreground italic',
                  )}
                >
                  {t.taskDescription || 'Click to add a description…'}
                </div>
              )}
            </section>

            {/* Subtasks */}
            <section>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/15 text-primary"><ListTree className="h-3.5 w-3.5" /></span> Subtasks
                  <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                    {counts.done}/{counts.total}
                  </span>
                </h3>
                <div className="flex-1 max-w-[220px] h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-[image:var(--gradient-success)] transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-semibold tabular-nums">{pct}%</span>
              </div>

              <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                {loadingTree ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Loading subtasks…
                  </div>
                ) : subtasks.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">No subtasks yet — add the first one below.</div>
                ) : (
                  <ul>
                    {subtasks.map((s) => (
                      <SubtaskRow
                        key={s.taskId}
                        node={s}
                        depth={0}
                        onOpen={(id) => onSelectTask?.(String(id))}
                      />
                    ))}
                  </ul>
                )}

                {/* inline create */}
                <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-muted/30">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <input
                    ref={subInput}
                    value={newSub}
                    onChange={(e) => setNewSub(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createSubtask()}
                    placeholder="Create a subtask and press Enter…"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    disabled={creating}
                  />
                  {newSub.trim() && (
                    <Button size="sm" className="h-7 text-xs" onClick={createSubtask} disabled={creating}>
                      {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Create'}
                    </Button>
                  )}
                </div>
              </div>
            </section>

            {/* Comments · Log hours · Documents · Issues · Activity */}
            <TaskPanelTabs taskId={taskId} projectId={projectId} onTaskChanged={onChanged} openIssueCount={t.openIssueCount} />
          </main>

          {/* ═════════ DETAILS SIDEBAR ═════════ */}
          <aside className={cn(
            'shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-muted/40 lg:overflow-y-auto px-5 py-5 space-y-5 scrollbar-thin',
            fullscreen ? 'lg:w-[380px]' : 'lg:w-[320px]',
          )}>
            <section className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
              <h3 className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[image:var(--gradient-hero)]">Details</h3>
              <dl className="p-4 space-y-4 text-sm">
                <Field label="Status"><StatusPicker value={t.taskStatus} onChange={changeStatus} size="sm" /></Field>

                <Field label="Priority">
                  <PriorityPicker value={priorityOf(t)} onChange={changePriority} />
                </Field>

                <Field label="Start date">
                  <input
                    type="date"
                    value={(t.startDate || '').slice(0, 10)}
                    onChange={(e) => e.target.value && patchTask({ startDate: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                  />
                </Field>

                <Field label="Due date">
                  <input
                    type="date"
                    value={(t.endDate || '').slice(0, 10)}
                    onChange={(e) => e.target.value && patchTask({ endDate: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                  />
                </Field>

                <Field label="Progress">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-[image:var(--gradient-success)]" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold tabular-nums">{pct}%</span>
                  </div>
                </Field>

                <Field label="Reporter"><span className="text-xs font-medium">{t.createdBy || '—'}</span></Field>
                <Field label="Project"><span className="text-xs font-medium">{project?.projectTitle ?? t.projectTitle ?? '—'}</span></Field>
                {t.listTitle && <Field label="List"><span className="text-xs font-medium">{t.listTitle}</span></Field>}
              </dl>
            </section>

            <section>
              <TaskContributors taskId={taskId} />
            </section>
          </aside>
        </div>
      </aside>
    </>
  );
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_1fr] items-center gap-2">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-primary/80">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
