import { useEffect, useState } from 'react';
import { taskService } from '@/services/taskservice';
import { PRIORITY_UI } from './taskUi';

export interface TaskPriorityUi {
  /** lower-case key, matches PRIORITY_UI */
  key: string;
  label: string;
  chip: string;
  dot: string;
}

// GET /task/priorities is fetched once per page load and shared by every priority dropdown.
const FALLBACK = ['high', 'medium', 'low', 'none'].map((key) => ({ key }));
let cache: TaskPriorityUi[] | null = null;
let inflight: Promise<TaskPriorityUi[]> | null = null;

const titleCase = (k: string) => k.charAt(0).toUpperCase() + k.slice(1).toLowerCase();

function build(keys: { key: string; label?: string }[]): TaskPriorityUi[] {
  return keys.map(({ key, label }) => {
    const ui = PRIORITY_UI[key] ?? PRIORITY_UI.none;
    return { key, label: label ?? PRIORITY_UI[key]?.label ?? titleCase(key), chip: ui.chip, dot: ui.dot };
  });
}

/** API may return ["HIGH", ...] or [{ value|key|name, label }, ...] */
function toUi(raw: unknown): TaskPriorityUi[] {
  const list = (raw as { data?: unknown })?.data ?? raw;
  if (!Array.isArray(list)) return [];
  const keys: { key: string; label?: string }[] = [];
  list.forEach((item) => {
    const o = item as Record<string, unknown>;
    const key = String(typeof item === 'string' ? item : o?.value ?? o?.key ?? o?.name ?? '').toLowerCase();
    if (!key || keys.some((k) => k.key === key)) return;
    const label = typeof o?.label === 'string' ? o.label : typeof o?.displayName === 'string' ? o.displayName : undefined;
    keys.push({ key, label });
  });
  return build(keys);
}

function load(): Promise<TaskPriorityUi[]> {
  if (cache) return Promise.resolve(cache);
  inflight ??= taskService.getTaskPriorities()
    .then((res) => {
      const ui = toUi(res);
      if (ui.length) cache = ui;
      return ui;
    })
    .catch(() => [] as TaskPriorityUi[])
    .finally(() => { inflight = null; });
  return inflight;
}

/** Priority options from the API; a static list is used until it loads or if the call fails. */
export function useTaskPriorities(): TaskPriorityUi[] {
  const [items, setItems] = useState<TaskPriorityUi[]>(cache ?? build(FALLBACK));
  useEffect(() => {
    let live = true;
    load().then((ui) => { if (live && ui.length) setItems(ui); });
    return () => { live = false; };
  }, []);
  return items;
}
