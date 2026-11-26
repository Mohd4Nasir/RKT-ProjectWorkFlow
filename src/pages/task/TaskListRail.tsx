import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Circle, ListTodo, PanelLeftClose, Search } from 'lucide-react';
import { useAppSelector } from '@/store';
import { SubTaskNode } from '@/types/taskTypes';
import { cn } from '@/lib/utils';
import { isTaskDone } from './taskUi';

interface Props {
  taskId: number;
  listId?: number;
  onSelect: (taskId: number) => void;
  onCollapse: () => void;
}

/** ids of every ancestor of `target`, so its branch opens automatically */
function pathTo(nodes: SubTaskNode[], target: number, trail: number[] = []): number[] | null {
  for (const n of nodes) {
    if (Number(n.taskId) === Number(target)) return trail;
    const hit = n.subTask?.length ? pathTo(n.subTask, target, [...trail, n.taskId]) : null;
    if (hit) return hit;
  }
  return null;
}

/** keep a node if it, or anything below it, matches the query */
function filterTree(nodes: SubTaskNode[], q: string): SubTaskNode[] {
  return nodes.flatMap((n) => {
    const kids = filterTree(n.subTask ?? [], q);
    return n.taskTitle.toLowerCase().includes(q) || kids.length ? [{ ...n, subTask: kids }] : [];
  });
}

/** true when `target` is somewhere below `node` */
const holds = (node: SubTaskNode, target: number): boolean =>
  !!node.subTask?.some((k) => Number(k.taskId) === Number(target) || holds(k, target));

function Row({
  node, depth, selectedId, open, toggle, onSelect, forceOpen,
}: {
  node: SubTaskNode; depth: number; selectedId: number; open: Set<number>; forceOpen: boolean;
  toggle: (id: number) => void; onSelect: (id: number) => void;
}) {
  const kids = node.subTask ?? [];
  const isOpen = forceOpen || open.has(node.taskId);
  const active = Number(node.taskId) === Number(selectedId);
  const done = isTaskDone(node.taskStatus);
  // a parent of the open task gets a lighter marker so the whole path is visible
  const parentOfActive = !active && holds(node, selectedId);
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'nearest' });
  }, [active]);
  return (
    <>
      <li
        ref={ref}
        aria-current={active ? 'true' : undefined}
        className={cn(
          'group flex items-center gap-1 pr-2 border-l-[3px] transition-colors',
          active
            ? 'border-primary bg-primary/15 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.3)]'
            : parentOfActive
              ? 'border-primary/40 bg-primary/[0.05] hover:bg-primary/[0.09]'
              : 'border-transparent hover:bg-primary/[0.06]',
        )}
        style={{ paddingLeft: 6 + depth * 14 }}
      >
        {kids.length ? (
          <button
            onClick={() => toggle(node.taskId)}
            className="h-5 w-5 grid place-items-center shrink-0 rounded text-muted-foreground hover:bg-muted"
            aria-label={isOpen ? 'Collapse' : 'Expand'}
          >
            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <button
          onClick={() => onSelect(node.taskId)}
          title={node.taskTitle}
          className="flex-1 min-w-0 flex items-center gap-2 py-1.5 text-left"
        >
          {done
            ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
            : <Circle className={cn("h-3.5 w-3.5 shrink-0", active ? "text-primary fill-primary/30" : "text-info/60")} />}
          <span className={cn(
            'truncate text-[13px]',
            active ? 'font-bold text-primary' : parentOfActive ? 'font-semibold text-foreground' : 'text-foreground',
            done && (active ? 'line-through' : 'line-through text-muted-foreground'),
          )}>
            {node.taskTitle}
          </span>
        </button>
        {(node.openIssueCount ?? 0) > 0 && (
          <span title={`${node.openIssueCount} open issue(s)`}
            className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/15 px-1.5 text-[10px] font-semibold tabular-nums text-rose-600">
            <AlertCircle className="h-2.5 w-2.5" />{node.openIssueCount}
          </span>
        )}
        {kids.length > 0 && (
          <span className="rounded-full bg-info/15 px-1.5 text-[10px] font-semibold tabular-nums text-info">{kids.length}</span>
        )}
      </li>
      {isOpen && kids.map((k) => (
        <Row key={k.taskId} node={k} depth={depth + 1} selectedId={selectedId} open={open}
          forceOpen={forceOpen} toggle={toggle} onSelect={onSelect} />
      ))}
    </>
  );
}

/** Zoho-style left rail: every task of the current list, nested, with the open one highlighted. Reads from redux — no extra API calls. */
export function TaskListRail({ taskId, listId, onSelect, onCollapse }: Props) {
  const lists = useAppSelector((s) => s.tasks.lists || []);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Set<number>>(new Set());

  // list the open task lives in, unless the user browses another one from the dropdown
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => setPicked(null), [taskId]);

  const list = useMemo(
    () =>
      lists.find((l) => Number(l.listId) === picked) ??
      lists.find((l) => Number(l.listId) === Number(listId)) ??
      lists.find((l) => pathTo(l.tasks, taskId)),
    [lists, listId, taskId, picked],
  );
  const tasks = (list?.tasks ?? []) as SubTaskNode[];

  // open the branch holding the current task whenever it changes
  useEffect(() => {
    const trail = pathTo(tasks, taskId);
    if (trail?.length) setOpen((o) => new Set([...o, ...trail]));
  }, [taskId, tasks]);

  const query = q.trim().toLowerCase();
  const shown = useMemo(() => (query ? filterTree(tasks, query) : tasks), [tasks, query]);
  const toggle = (id: number) =>
    setOpen((o) => { const n = new Set(o); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <nav aria-label="Tasks in this list" className="hidden lg:flex w-[260px] shrink-0 flex-col border-r border-border bg-muted/40">
      <div className="flex items-center gap-2 px-3 h-11 shrink-0 text-heading bg-card border-b border-border border-t-2 border-t-primary">
        <ListTodo className="h-4 w-4 shrink-0 text-primary" />
        <span className="flex-1 truncate text-xs font-bold uppercase tracking-wider">Task lists</span>
        <button onClick={onCollapse} title="Hide list" aria-label="Hide list"
          className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>
      <div className="p-2 space-y-2 border-b border-border/70 shrink-0">
        <select
          value={list?.listId ?? ''}
          onChange={(e) => { setPicked(Number(e.target.value)); setQ(''); }}
          aria-label="Choose task list"
          title={list?.listTitle}
          className="w-full rounded-md border border-primary/30 bg-card px-2 py-1.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
        >
          {lists.map((l) => (
            <option key={l.listId} value={l.listId}>
              {l.listTitle} ({l.tasks?.length ?? 0})
            </option>
          ))}
        </select>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tasks"
            className="w-full rounded-md border border-input bg-background pl-7 pr-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      <ul className="flex-1 overflow-y-auto scrollbar-thin py-1">
        {shown.length === 0 ? (
          <li className="px-4 py-6 text-center text-xs text-muted-foreground">No tasks found</li>
        ) : (
          shown.map((n) => (
            <Row key={n.taskId} node={n} depth={0} selectedId={taskId} open={open}
              forceOpen={!!query} toggle={toggle} onSelect={onSelect} />
          ))
        )}
      </ul>
    </nav>
  );
}
