
// ===================================================================================================================================================
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { ChevronRight, ChevronDown, MoreHorizontal, GripVertical, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubTaskNode, TaskNode } from '@/types/taskTypes';
import { Button } from '../../components/ui/button';
import { useTaskStatuses } from './useTaskStatuses';
import { priorityOf, priorityUi } from './taskUi';

const STATUS_CFG: Record<string, { label: string; badge: string; dot: string }> = {
  TODO: { label: 'To Do', badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/20 dark:text-slate-200 dark:border-slate-500/40', dot: 'bg-slate-500' },
  OPEN: { label: 'Open', badge: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-200 dark:border-cyan-500/40', dot: 'bg-cyan-600' },
  IN_PROGRESS: { label: 'In Progress', badge: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-500/40', dot: 'bg-blue-600' },
  IN_REVIEW: { label: 'In Review', badge: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-500/40', dot: 'bg-indigo-600' },
  TO_BE_TESTED: { label: 'To Be Tested', badge: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/20 dark:text-violet-200 dark:border-violet-500/40', dot: 'bg-violet-600' },
  ON_HOLD: { label: 'On Hold', badge: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-500/40', dot: 'bg-orange-600' },
  DELAYED: { label: 'Delayed', badge: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-200 dark:border-red-500/40', dot: 'bg-red-600' },
  COMPLETED: { label: 'Completed', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40', dot: 'bg-emerald-600' },
  CLOSED: { label: 'Closed', badge: 'bg-zinc-200 text-zinc-800 border-zinc-400 dark:bg-zinc-500/25 dark:text-zinc-200 dark:border-zinc-500/40', dot: 'bg-zinc-600' },
};

export type DropZone = 'above' | 'below' | 'inside';

const LEVELS = [
  { bar: 'border-l-indigo-500', row: 'bg-card', dot: 'bg-indigo-500', icon: 'text-indigo-600', chip: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300' },
  { bar: 'border-l-sky-500', row: 'bg-sky-500/[0.07]', dot: 'bg-sky-500', icon: 'text-sky-600', chip: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  { bar: 'border-l-teal-500', row: 'bg-teal-500/[0.08]', dot: 'bg-teal-500', icon: 'text-teal-600', chip: 'bg-teal-500/15 text-teal-700 dark:text-teal-300' },
  { bar: 'border-l-fuchsia-500', row: 'bg-fuchsia-500/[0.07]', dot: 'bg-fuchsia-500', icon: 'text-fuchsia-600', chip: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300' },
];

const isDone = (s?: string) => ['COMPLETED', 'CLOSED', 'DONE'].includes((s || '').toUpperCase());
const isPast = (d?: string) => {
  if (!d) return false;
  const t = new Date(d);
  if (isNaN(t.getTime())) return false;
  t.setHours(23, 59, 59, 999);
  return t.getTime() < Date.now();
};

function StatusPill({ status, onChange }: { status: string; onChange?: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const options = useTaskStatuses();
  const cfg = options.find((o) => o.key === status) ?? STATUS_CFG[status] ?? STATUS_CFG.TODO;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={e => e.stopPropagation()}
          className={cn('inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border whitespace-nowrap transition-opacity hover:opacity-80', cfg.badge)}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
          {cfg.label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start" onClick={e => e.stopPropagation()}>
        {options.map(({ key, ...c }) => (
          <button
            key={key}
            onClick={() => { setOpen(false); if (key !== status) onChange?.(key); }}
            className={cn('w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted flex items-center gap-2', key === status && 'bg-muted font-semibold')}
          >
            <span className={cn('h-2 w-2 rounded-full', c.dot)} />
            {c.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

interface TaskRowProps {
  task: SubTaskNode;
  taskListId: string;
  depth: number;
  expandedTasks: Set<string>;
  onToggleTask: (id: string) => void;
  onOpenEditTask: (task: SubTaskNode) => void;
  onDeleteTask: (task: SubTaskNode) => void;
onUpdateTask: (task: Partial<TaskNode>) => void;
  onDragStart: (id: string, tlId: string, parentId: string | null) => void;
  onDrop: (e: React.DragEvent, targetId: string, before: boolean, tlId: string, parentId: string | null, zone?: DropZone) => void;
  onContextMenu: (e: React.MouseEvent, task: SubTaskNode) => void;
  onThreeDots: (e: React.MouseEvent, task: SubTaskNode) => void;
  onTaskClick?: (task: SubTaskNode) => void;
  /** quick "+ subtask" button on each row */
  onAddSubtask?: (task: SubTaskNode) => void;
}

export function TaskRow({
  task, taskListId, depth, expandedTasks, onToggleTask,
  onOpenEditTask, onDeleteTask, onUpdateTask, onDragStart, onDrop,
  onContextMenu, onThreeDots, onTaskClick, onAddSubtask,
}: TaskRowProps) {
  // ✅ API se jo subTask array aaya hai, waisa hi — koi sort/filter nahi
  const children = task.subTask || [];
  const taskIdStr = String(task.taskId);
  const isExpanded = expandedTasks.has(taskIdStr);
  const hasChildren = children.length > 0;

  // Per-level look: accent bar, tinted row, dot colour - makes nesting obvious at a glance
  const level = LEVELS[Math.min(depth, LEVELS.length) - 1];
  // drag-over feedback: top/bottom edge = place as sibling, middle = nest as subtask
  const [dropZone, setDropZone] = useState<DropZone | null>(null);
  const zoneOf = (e: React.DragEvent): DropZone => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const f = (e.clientY - r.top) / r.height;
    return f < 0.28 ? 'above' : f > 0.72 ? 'below' : 'inside';
  };
  const doneKids = children.filter((c) => isDone(c.taskStatus)).length;
  const done = isDone(task.taskStatus);
  const overdue = !done && isPast(task.endDate);
  const pr = priorityUi(priorityOf(task));
  
  
  return (
    <>
      <tr
        draggable
        onClick={e => {
          if (!e.currentTarget.contains(e.target as Node)) return; // bubbled up from a portal (status popover etc.)
          if ((e.target as HTMLElement).closest('button,a,input,select,textarea,[role="menuitem"],[role="combobox"]')) return;
          onTaskClick?.(task);
        }}
        onContextMenu={e => onContextMenu(e, task)}
        onDragStart={() => onDragStart(taskIdStr, taskListId, task.parentTaskId ? String(task.parentTaskId) : null)}
        onDragOver={e => {
          e.preventDefault();
          const z = zoneOf(e);
          if (z !== dropZone) setDropZone(z);
        }}
        onDragLeave={e => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropZone(null);
        }}
        onDrop={e => {
          const z = zoneOf(e);
          setDropZone(null);
          onDrop(e, taskIdStr, z === 'above', taskListId, task.parentTaskId ? String(task.parentTaskId) : null, z);
        }}
        onDragEnd={() => setDropZone(null)}
        className={cn(
          'group border-b border-border/60 cursor-grab transition-colors hover:bg-primary/[0.05]',
          level.row,
          dropZone === 'above' && '[&>td]:shadow-[inset_0_3px_0_0_hsl(var(--primary))]',
          dropZone === 'below' && '[&>td]:shadow-[inset_0_-3px_0_0_hsl(var(--primary))]',
          dropZone === 'inside' && '[&>td]:bg-primary/15 [&>td]:shadow-[inset_0_0_0_1.5px_hsl(var(--primary))]',
        )}
      >
        <td className={cn('relative py-2 px-3 border-l-4', level.bar)}>
          {/* tree guide lines for every ancestor level */}
          {Array.from({ length: depth - 1 }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute top-0 bottom-0 w-px bg-border"
              style={{ left: 12 + (i + 1) * 20 + 7 }}
            />
          ))}
          {depth > 1 && (
            <span
              aria-hidden
              className="absolute top-1/2 h-px bg-border"
              style={{ left: 12 + (depth - 1) * 20 + 7, width: 13 }}
            />
          )}

          <div className="relative flex items-center gap-1.5" style={{ paddingLeft: depth * 20 }}>
            {hasChildren ? (
              <button
                onClick={() => onToggleTask(taskIdStr)}
                className={cn('flex-shrink-0 h-5 w-5 grid place-items-center rounded hover:bg-foreground/10 transition-colors', level.icon)}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="flex-shrink-0 h-5 w-5 grid place-items-center">
                <span className={cn('h-1.5 w-1.5 rounded-full', level.dot)} />
              </span>
            )}
            <GripVertical size={13} className="text-muted-foreground/60 flex-shrink-0 group-hover:text-foreground transition-colors" />
            <button
              onClick={e => { e.stopPropagation(); onTaskClick?.(task); }}
              className={cn(
                'text-sm truncate text-left hover:underline',
                depth === 1 ? 'font-semibold text-foreground' : 'font-medium text-foreground/85',
                done && 'line-through text-muted-foreground',
              )}
            >
              {task.taskTitle}
            </button>
            {hasChildren && (
              <span className={cn('flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums', level.chip)}>
                {doneKids}/{children.length}
              </span>
            )}
            {depth > 1 && (
              <span className={cn('flex-shrink-0 rounded px-1 text-[9px] font-bold uppercase tracking-wide', level.chip)}>
                L{depth}
              </span>
            )}
          </div>
        </td>

        <td className="py-1.5 px-3">
          <StatusPill
            status={task.taskStatus}
            onChange={(st) => onUpdateTask({ taskId: task.taskId, taskStatus: st })}
          />
        </td>

        <td className="py-1.5 px-3">
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium', pr.chip)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', pr.dot)} />
            {pr.label}
          </span>
        </td>

        <td className={cn('py-1.5 px-3 text-xs whitespace-nowrap', overdue ? 'text-destructive font-semibold' : 'text-muted-foreground')}>
          {task.endDate || '-'}
          {overdue && <span className="ml-1.5 rounded bg-destructive/10 px-1 text-[9px] font-bold uppercase">Overdue</span>}
        </td>

        <td className="py-1.5 px-3">
          <div className="flex items-center justify-end gap-0.5">
            {onAddSubtask && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10" title="Add subtask" onClick={e => { e.stopPropagation(); onAddSubtask(task); }}>
                <Plus size={13} />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6" title="More options" onClick={e => onThreeDots(e, task)}>
              <MoreHorizontal size={12} />
            </Button>
          </div>
        </td>
      </tr>

      {isExpanded && children.map(child => (
        <TaskRow
          key={child.taskId}
          task={child}
          taskListId={taskListId}
          depth={depth + 1}
          expandedTasks={expandedTasks}
          onToggleTask={onToggleTask}
          onOpenEditTask={onOpenEditTask}
          onDeleteTask={onDeleteTask}
          onUpdateTask={onUpdateTask}
          onDragStart={onDragStart}
          onDrop={onDrop}
          onContextMenu={onContextMenu}
          onThreeDots={onThreeDots}
          onTaskClick={onTaskClick}
          onAddSubtask={onAddSubtask}
        />
      ))}
    </>
  );
}