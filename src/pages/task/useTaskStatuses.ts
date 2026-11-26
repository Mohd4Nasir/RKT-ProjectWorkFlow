import { useEffect, useState } from 'react';
import { taskService } from '@/services/taskservice';
import { TASK_STATUSES, TaskStatusUi } from './taskUi';

// GET /task/statuses is fetched once per page load and shared by every status dropdown.
let cache: TaskStatusUi[] | null = null;
let inflight: Promise<TaskStatusUi[]> | null = null;

const titleCase = (k: string) =>
  k.toLowerCase().split('_').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

/** API may return ["TODO", ...] or [{ value|key|name, label }, ...] — keep the known look, fall back for new ones */
function toUi(raw: unknown): TaskStatusUi[] {
  const list = (raw as { data?: unknown })?.data ?? raw;
  if (!Array.isArray(list)) return [];
  const out: TaskStatusUi[] = [];
  list.forEach((item) => {
    const o = item as Record<string, unknown>;
    const key = String(typeof item === 'string' ? item : o?.value ?? o?.key ?? o?.name ?? '').toUpperCase();
    if (!key || out.some((s) => s.key === key)) return;
    const known = TASK_STATUSES.find((s) => s.key === key);
    const label = typeof o?.label === 'string' ? o.label : undefined;
    out.push(known ? { ...known, label: label ?? known.label } : { ...TASK_STATUSES[0], key, label: label ?? titleCase(key) });
  });
  return out;
}

function load(): Promise<TaskStatusUi[]> {
  if (cache) return Promise.resolve(cache);
  inflight ??= taskService.getTaskStatuses()
    .then((res) => {
      const ui = toUi(res);
      if (ui.length) cache = ui;
      return ui;
    })
    .catch(() => [] as TaskStatusUi[])
    .finally(() => { inflight = null; });
  return inflight;
}

/** Status options from the API; the static list is used until it loads or if the call fails. */
export function useTaskStatuses(): TaskStatusUi[] {
  const [statuses, setStatuses] = useState<TaskStatusUi[]>(cache ?? TASK_STATUSES);
  useEffect(() => {
    let live = true;
    load().then((ui) => { if (live && ui.length) setStatuses(ui); });
    return () => { live = false; };
  }, []);
  return statuses;
}
