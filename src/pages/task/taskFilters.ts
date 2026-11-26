import { SubTaskNode, TaskListNode } from '@/types/taskTypes';
import type { FilterField, FilterValues } from '@/pages/projects/ProjectsFilterDrawer';
import { matchPredicates } from '@/pages/projects/hooks/useProjectsFilter';
import { isTaskDone, normStatus, priorityOf } from './taskUi';

/** Client-side filtering of the project's task tree. Works only on what redux already holds — no API calls. */

const day = (d?: string) => (d ? d.slice(0, 10) : '');
const today = () => new Date().toISOString().slice(0, 10);

export function buildTaskFilterFields(opts: {
  statuses: { key: string; label: string }[];
  priorities: { key: string; label: string }[];
  users: { id: string | number; name: string }[];
  lists: { listId: number | string; listTitle: string }[];
}): FilterField[] {
  return [
    { id: 'status', label: 'Status', type: 'select', options: opts.statuses.map((s) => ({ label: s.label, value: s.key })) },
    {
      id: 'priority', label: 'Priority', type: 'select',
      options: opts.priorities.map((p) => ({ label: p.label, value: p.key })),
    },
    { id: 'assignee', label: 'Assignee', type: 'select', options: opts.users.map((u) => ({ label: u.name, value: String(u.id) })) },
    { id: 'list', label: 'Task List', type: 'select', options: opts.lists.map((l) => ({ label: l.listTitle, value: String(l.listId) })) },
    {
      id: 'level', label: 'Type', type: 'select',
      options: [{ label: 'Tasks only', value: 'task' }, { label: 'Subtasks only', value: 'subtask' }],
    },
    { id: 'startDate', label: 'Start Date', type: 'daterange' },
    { id: 'endDate', label: 'Due Date', type: 'daterange' },
    {
      id: 'overdue', label: 'Overdue', type: 'select',
      options: [{ label: 'Overdue only', value: 'yes' }, { label: 'Not overdue', value: 'no' }],
    },
    {
      id: 'hasSubtasks', label: 'Subtasks', type: 'select',
      options: [{ label: 'Has subtasks', value: 'yes' }, { label: 'No subtasks', value: 'no' }],
    },
  ];
}

/** how many filter fields the user filled in (a range counts once) */
export function countActiveFilters(fields: FilterField[], values: Record<string, string>): number {
  return fields.filter((f) =>
    Object.keys(values).some(
      (k) => values[k] && (k === f.id || (k.startsWith(f.id) && /^(From|To|Min|Max)$/.test(k.slice(f.id.length)))),
    ),
  ).length;
}

type Task = SubTaskNode & { listId?: number };

export function matchesTask(t: Task, listId: number, search: string, filters: FilterValues): boolean {
  const q = search.trim().toLowerCase();
  if (q) {
    const hay = `${t.taskTitle ?? ''} ${t.taskDescription ?? ''} tsk-${t.taskId}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }

  const f = filters.values;
  const preds: boolean[] = [];
  const inRange = (v: string, from?: string, to?: string) => !!v && (!from || v >= from) && (!to || v <= to);

  if (f.status) preds.push(normStatus(t.taskStatus) === f.status);
  if (f.priority) preds.push(priorityOf(t).toLowerCase() === f.priority);
  if (f.assignee) preds.push(String(t.assigneeId ?? '') === f.assignee);
  if (f.list) preds.push(String(listId) === f.list);
  if (f.level) preds.push(f.level === 'subtask' ? !!t.parentTaskId : !t.parentTaskId);
  if (f.startDateFrom || f.startDateTo) preds.push(inRange(day(t.startDate), f.startDateFrom, f.startDateTo));
  if (f.endDateFrom || f.endDateTo) preds.push(inRange(day(t.endDate), f.endDateFrom, f.endDateTo));
  if (f.overdue) {
    const late = !!t.endDate && day(t.endDate) < today() && !isTaskDone(t.taskStatus);
    preds.push(f.overdue === 'yes' ? late : !late);
  }
  if (f.hasSubtasks) {
    const has = (t.subTask?.length ?? 0) > 0;
    preds.push(f.hasSubtasks === 'yes' ? has : !has);
  }
  return matchPredicates(preds, filters.match);
}

/**
 * Prune the tree to what matches. A task stays if it matches itself OR something below it does
 * (so the path to a match is never cut), and every kept task only lists its kept children.
 */
export function filterLists(lists: TaskListNode[], search: string, filters: FilterValues): TaskListNode[] {
  const active = !!search.trim() || Object.values(filters.values).some(Boolean);
  if (!active) return lists;

  const prune = (nodes: SubTaskNode[], listId: number): SubTaskNode[] =>
    nodes.flatMap((n) => {
      const kids = prune(n.subTask ?? [], listId);
      return kids.length || matchesTask(n, listId, search, filters) ? [{ ...n, subTask: kids }] : [];
    });

  return lists
    .map((l) => {
      const tasks = prune(l.tasks ?? [], l.listId) as TaskListNode['tasks'];
      return { ...l, tasks, taskCount: tasks.length };
    })
    .filter((l) => l.tasks.length > 0);
}

/** flat list of tasks that match on their own — for the board and card views */
export function filterFlat<T extends Task & { listId: number }>(tasks: T[], search: string, filters: FilterValues): T[] {
  return tasks.filter((t) => matchesTask(t, t.listId, search, filters));
}
