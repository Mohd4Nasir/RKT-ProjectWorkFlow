/** Shared look & ordering for task statuses / priorities (board, calendar, lists). */

export interface TaskStatusUi {
  key: string;
  label: string;
  /** small round indicator */
  dot: string;
  /** pill (bg + text + border) */
  badge: string;
  /** coloured top bar of a board column */
  bar: string;
}

// NOTE: class names are written out in full so Tailwind can see them.
export const TASK_STATUSES: TaskStatusUi[] = [
  { key: 'TODO', label: 'To Do', dot: 'bg-slate-500', bar: 'border-t-slate-500', badge: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-500/20 dark:text-slate-200 dark:border-slate-500/40' },
  { key: 'OPEN', label: 'Open', dot: 'bg-cyan-600', bar: 'border-t-cyan-600', badge: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-200 dark:border-cyan-500/40' },
  { key: 'IN_PROGRESS', label: 'In Progress', dot: 'bg-blue-600', bar: 'border-t-blue-600', badge: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-500/40' },
  { key: 'IN_REVIEW', label: 'In Review', dot: 'bg-indigo-600', bar: 'border-t-indigo-600', badge: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-500/40' },
  { key: 'TO_BE_TESTED', label: 'To Be Tested', dot: 'bg-violet-600', bar: 'border-t-violet-600', badge: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/20 dark:text-violet-200 dark:border-violet-500/40' },
  { key: 'ON_HOLD', label: 'On Hold', dot: 'bg-orange-600', bar: 'border-t-orange-600', badge: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-500/40' },
  { key: 'DELAYED', label: 'Delayed', dot: 'bg-red-600', bar: 'border-t-red-600', badge: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-200 dark:border-red-500/40' },
  { key: 'COMPLETED', label: 'Completed', dot: 'bg-emerald-600', bar: 'border-t-emerald-600', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40' },
  { key: 'CLOSED', label: 'Closed', dot: 'bg-zinc-600', bar: 'border-t-zinc-600', badge: 'bg-zinc-200 text-zinc-800 border-zinc-400 dark:bg-zinc-500/25 dark:text-zinc-200 dark:border-zinc-500/40' },
];

export const normStatus = (s?: string): string => {
  const k = (s || '').toUpperCase();
  if (k === 'DONE') return 'COMPLETED';
  return TASK_STATUSES.some((x) => x.key === k) ? k : 'TODO';
};

export const taskStatusUi = (s?: string): TaskStatusUi =>
  TASK_STATUSES.find((x) => x.key === normStatus(s)) ?? TASK_STATUSES[0];

export const isTaskDone = (s?: string) => ['COMPLETED', 'CLOSED'].includes(normStatus(s));

export const isOverdueDate = (d?: string, status?: string) => {
  if (!d || isTaskDone(status)) return false;
  const t = new Date(d);
  if (isNaN(t.getTime())) return false;
  t.setHours(23, 59, 59, 999);
  return t.getTime() < Date.now();
};

export const PRIORITY_UI: Record<string, { label: string; chip: string; dot: string }> = {
  critical: { label: 'Critical', chip: 'bg-red-500/15 text-red-700 dark:text-red-300', dot: 'bg-red-600' },
  high: { label: 'High', chip: 'bg-orange-500/15 text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  medium: { label: 'Medium', chip: 'bg-blue-500/15 text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  low: { label: 'Low', chip: 'bg-slate-500/15 text-slate-700 dark:text-slate-300', dot: 'bg-slate-500' },
  none: { label: 'None', chip: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground/50' },
};

export const priorityUi = (p?: string) => PRIORITY_UI[(p || 'none').toLowerCase()] ?? PRIORITY_UI.none;

/** the API sends `taskPriority`; older code paths still carry `priority` */
export const priorityOf = (t?: { taskPriority?: string | null; priority?: string | null } | null): string =>
  (t?.taskPriority ?? t?.priority ?? 'NONE').toString().toUpperCase();
