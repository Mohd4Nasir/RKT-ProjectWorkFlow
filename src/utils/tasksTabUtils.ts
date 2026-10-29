// src/utils/tasksTabUtils.ts
export const mapStatusToApi = (status: string): string => {
  switch (status) {
    case 'in-progress': return 'IN_PROGRESS';
    case 'done': return 'DONE';
    default: return 'TODO';
  }
};

export const mapStatusFromApi = (status: string): string => {
  switch (status) {
    case 'IN_PROGRESS': return 'in-progress';
    case 'DONE': return 'done';
    default: return 'todo';
  }
};

export type ViewMode = 'table' | 'cards';

/* =========================
   TASK STATUS OPTIONS (GET /task/statuses)
========================= */

export interface TaskStatusOption {
  /** Value the API expects (sent back on update). */
  value: string;
  label: string;
  dot: string;
  badge: string;
}

export const normalizeTaskStatus = (status?: string): string =>
  (status || '').trim().toUpperCase().replace(/[\s-]+/g, '_');

export const prettyTaskStatusLabel = (status?: string): string =>
  normalizeTaskStatus(status)
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');

type StatusStyle = { dot: string; badge: string };

const STATUS_STYLES: StatusStyle[] = [
  { dot: 'bg-muted-foreground', badge: 'bg-muted text-paragraph border-border' },
  { dot: 'bg-warning', badge: 'bg-warning/15 text-warning border-warning/40' },
  { dot: 'bg-info', badge: 'bg-info/15 text-info border-info/40' },
  { dot: 'bg-danger', badge: 'bg-danger/15 text-danger border-danger/40' },
  { dot: 'bg-success', badge: 'bg-success/15 text-success border-success/40' },
  { dot: 'bg-primary', badge: 'bg-primary/15 text-primary border-primary/40' },
];

const STATUS_STYLE_KEYS: Record<string, number> = {
  TODO: 0, BACKLOG: 0, OPEN: 0, PENDING: 0, NEW: 0,
  IN_PROGRESS: 1, INPROGRESS: 1, PROGRESS: 1, ACTIVE: 1, STARTED: 1, DOING: 1,
  ON_HOLD: 2, HOLD: 2, PAUSED: 2, BLOCKED: 2, REVIEW: 2,
  DELAYED: 3, OVERDUE: 3, FAILED: 3, CANCELLED: 3,
  DONE: 4, COMPLETED: 4, COMPLETE: 4, CLOSED: 4, RESOLVED: 4,
};

const styleForStatus = (value: string, index: number): StatusStyle => {
  const styleIndex = STATUS_STYLE_KEYS[normalizeTaskStatus(value)];
  return STATUS_STYLES[styleIndex ?? index % STATUS_STYLES.length];
};

/** Fallback list, used while the endpoint is loading or when it fails. */
export const DEFAULT_TASK_STATUS_OPTIONS: TaskStatusOption[] = [
  { value: 'TODO', label: 'To Do', ...styleForStatus('TODO', 0) },
  { value: 'IN_PROGRESS', label: 'In Progress', ...styleForStatus('IN_PROGRESS', 1) },
  { value: 'DONE', label: 'Done', ...styleForStatus('DONE', 2) },
];

/** Turns the GET /task/statuses response into dropdown options. Accepts string[] or object[]. */
export const mapTaskStatusOptions = (data: unknown): TaskStatusOption[] => {
  const asRecord = (input: unknown): Record<string, unknown> =>
    typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};

  const body = asRecord(data);
  const list: unknown[] = Array.isArray(data)
    ? data
    : (body.data ?? body.taskStatuses ?? body.statuses ?? body.content) as unknown[];

  const seen = new Set<string>();
  const options: TaskStatusOption[] = [];

  (Array.isArray(list) ? list : []).forEach((item) => {
    const record = asRecord(item);
    const rawValue =
      typeof item === 'string' || typeof item === 'number'
        ? item
        : record.taskStatus ?? record.status ?? record.value ?? record.statusName ?? record.name;
    if (rawValue === undefined || rawValue === null) return;

    const value = String(rawValue).trim();
    if (!value || seen.has(value)) return;
    seen.add(value);

    const rawLabel =
      typeof item === 'object' && item !== null
        ? record.displayName ?? record.label ?? record.statusName ?? record.name
        : undefined;

    options.push({
      value,
      label: String(rawLabel || prettyTaskStatusLabel(value)),
      ...styleForStatus(value, options.length),
    });
  });

  return options.length ? options : DEFAULT_TASK_STATUS_OPTIONS;
};

/** Matches a task's current taskStatus against the fetched options. */
export const findTaskStatusOption = (
  status: string | undefined,
  options: TaskStatusOption[],
): TaskStatusOption | undefined => {
  const target = normalizeTaskStatus(status);
  if (!target) return undefined;
  return (
    options.find((o) => normalizeTaskStatus(o.value) === target) ??
    options.find((o) => normalizeTaskStatus(o.label) === target)
  );
};
