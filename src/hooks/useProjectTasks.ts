import { useCallback, useEffect, useMemo, useState } from 'react';
import { projectApiService } from '@/services/projectsApiService';
import { SubTaskNode, TaskListNode } from '@/types/taskTypes';

export interface FlatTask extends SubTaskNode {
  listId: number;
  listTitle: string;
}

export type StatusGroup = 'todo' | 'in-progress' | 'blocked' | 'done';

export function statusGroup(status?: string): StatusGroup {
  switch ((status || '').toUpperCase()) {
    case 'COMPLETED':
    case 'CLOSED':
    case 'DONE':
      return 'done';
    case 'IN_PROGRESS':
    case 'IN_REVIEW':
    case 'TO_BE_TESTED':
      return 'in-progress';
    case 'ON_HOLD':
    case 'DELAYED':
      return 'blocked';
    default:
      return 'todo';
  }
}

export function isOverdue(t: SubTaskNode): boolean {
  if (!t.endDate || statusGroup(t.taskStatus) === 'done') return false;
  const end = new Date(t.endDate);
  end.setHours(23, 59, 59, 999);
  return end.getTime() < Date.now();
}

function flatten(nodes: SubTaskNode[] = [], listId: number, listTitle: string, out: FlatTask[]) {
  for (const n of nodes) {
    out.push({ ...n, listId, listTitle });
    if (n.subTask?.length) flatten(n.subTask, listId, listTitle, out);
  }
}

/** Loads a project's task tree from the API and flattens it for stats. */
export function useProjectTasks(projectId: string | number) {
  const [lists, setLists] = useState<TaskListNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await projectApiService.getProjectById(String(projectId));
      setLists(res?.data?.lists ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const tasks = useMemo(() => {
    const out: FlatTask[] = [];
    for (const l of lists) flatten(l.tasks, l.listId, l.listTitle, out);
    return out;
  }, [lists]);

  return { lists, tasks, loading, error, reload: load };
}
