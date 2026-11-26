import { useMemo, useRef, useState } from 'react';
import { CalendarDays, CornerDownRight, FolderKanban, ListTree } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';
import { IssueCountBadge } from '@/pages/task/IssueCountBadge';
import {
  isOverdueDate, normStatus, priorityUi,
} from '@/pages/task/taskUi';
import { useTaskStatuses } from '@/pages/task/useTaskStatuses';

export interface BoardTask {
  /** unique across the board (e.g. `${projectId}-${taskId}`) */
  key: string;
  taskId: number | string;
  projectId?: number | string;
  title: string;
  status: string;
  priority?: string;
  endDate?: string;
  listTitle?: string;
  projectTitle?: string;
  subtaskTotal?: number;
  subtaskDone?: number;
  /** issues of this task that are not CLOSED */
  openIssueCount?: number | null;
  isSubtask?: boolean;
  assignee?: string;
}

interface Props {
  tasks: BoardTask[];
  onStatusChange: (task: BoardTask, newStatus: string) => void | Promise<void>;
  onOpen?: (task: BoardTask) => void;
  /** show the project name on each card (global board) */
  showProject?: boolean;
}

const fmt = (d?: string) => {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

/** Jira / Zoho style Kanban board. Drag a card to another column to change its status. */
export function TaskBoard({ tasks, onStatusChange, onOpen, showProject }: Props) {
  const statuses = useTaskStatuses();
  const [hideEmpty, setHideEmpty] = useState(false);
  const [overCol, setOverCol] = useState<string | null>(null);
  const dragKey = useRef<string | null>(null);
  const keyOf = (s?: string) => {
    const u = (s || '').toUpperCase();
    return statuses.some((o) => o.key === u) ? u : normStatus(s);
  };

  const grouped = useMemo(() => {
    const map: Record<string, BoardTask[]> = {};
    statuses.forEach((s) => (map[s.key] = []));
    tasks.forEach((t) => (map[keyOf(t.status)] ?? map[statuses[0].key]).push(t));
    return map;
  }, [tasks, statuses]);

  const columns = statuses.filter((s) => !hideEmpty || grouped[s.key].length > 0);

  const drop = (status: string) => {
    const key = dragKey.current;
    dragKey.current = null;
    setOverCol(null);
    const t = tasks.find((x) => x.key === key);
    if (t && keyOf(t.status) !== status) onStatusChange(t, status);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between pb-2 shrink-0">
        <span className="text-xs text-muted-foreground">
          {tasks.length} task{tasks.length === 1 ? '' : 's'} · drag a card to change its status
        </span>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <input type="checkbox" checked={hideEmpty} onChange={(e) => setHideEmpty(e.target.checked)} className="accent-primary" />
          Hide empty columns
        </label>
      </div>

      <div className="flex gap-3 flex-1 min-h-[360px] overflow-x-auto pb-2 scrollbar-thin">
        {columns.map((col) => {
          const items = grouped[col.key];
          return (
            <section
              key={col.key}
              onDragOver={(e) => {
                e.preventDefault();
                if (overCol !== col.key) setOverCol(col.key);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(col.key);
              }}
              className={cn(
                'flex flex-col w-[272px] shrink-0 rounded-lg border border-border border-t-4 bg-muted/60 transition-colors',
                col.bar,
                overCol === col.key && 'bg-primary/10 border-primary/50',
              )}
            >
              <header className="flex items-center justify-between px-3 py-2.5 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('h-2 w-2 rounded-full', col.dot)} />
                  <h4 className="text-xs font-bold uppercase tracking-wide truncate">{col.label}</h4>
                </div>
                <span className="text-[11px] font-semibold rounded-full bg-card border border-border px-2 py-0.5 tabular-nums">
                  {items.length}
                </span>
              </header>

              <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 space-y-2 scrollbar-thin">
                {items.length === 0 && (
                  <div className="text-center text-[11px] text-muted-foreground border border-dashed border-border rounded-md py-6">
                    Drop tasks here
                  </div>
                )}
                {items.map((t) => (
                  <Card
                    key={t.key}
                    task={t}
                    showProject={showProject}
                    onOpen={onOpen}
                    onDragStart={() => (dragKey.current = t.key)}
                    onDragEnd={() => {
                      dragKey.current = null;
                      setOverCol(null);
                    }}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Card({
  task, showProject, onOpen, onDragStart, onDragEnd,
}: {
  task: BoardTask;
  showProject?: boolean;
  onOpen?: (t: BoardTask) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const pr = priorityUi(task.priority);
  const overdue = isOverdueDate(task.endDate, task.status);

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.key);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={() => onOpen?.(task)}
      className="group cursor-grab active:cursor-grabbing rounded-md border border-border bg-card p-3 shadow-soft hover:shadow-card hover:border-primary/40 transition-all"
    >
      {(showProject && task.projectTitle) || task.listTitle ? (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1.5 min-w-0">
          {showProject && task.projectTitle && (
            <span className="inline-flex items-center gap-1 truncate font-medium">
              <FolderKanban className="h-3 w-3 shrink-0" /> <span className="truncate">{task.projectTitle}</span>
            </span>
          )}
          {showProject && task.projectTitle && task.listTitle && <span>›</span>}
          {task.listTitle && <span className="truncate">{task.listTitle}</span>}
        </div>
      ) : null}

      <div className="flex items-start gap-1.5">
        {task.isSubtask && <CornerDownRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />}
        <p className="text-[13px] font-semibold leading-snug line-clamp-2">{task.title}</p>
      </div>

      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', pr.chip)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', pr.dot)} /> {pr.label}
        </span>
        {task.endDate && (
          <span className={cn('inline-flex items-center gap-1 text-[10px]', overdue ? 'text-destructive font-semibold' : 'text-muted-foreground')}>
            <CalendarDays className="h-3 w-3" /> {fmt(task.endDate)}
          </span>
        )}
        {!!task.subtaskTotal && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums">
            <ListTree className="h-3 w-3" /> {task.subtaskDone ?? 0}/{task.subtaskTotal}
          </span>
        )}
        <IssueCountBadge count={task.openIssueCount} />
        {task.assignee && (
          <span className="ml-auto">
            <UserAvatar name={task.assignee} size="sm" />
          </span>
        )}
      </div>
    </article>
  );
}
