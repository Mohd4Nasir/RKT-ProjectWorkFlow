import { useCallback, useEffect, useMemo, useState } from 'react';
import { projectApiService } from '@/services/projectsApiService';
import { Project } from '@/types/ProejctsType';
import { SubTaskNode, TaskListNode } from '@/types/taskTypes';

export interface GlobalTask extends SubTaskNode {
  projectId: number;
  projectTitle: string;
  listId: number;
  listTitle: string;
  subtaskTotal: number;
  subtaskDone: number;
}

const DONE = ['COMPLETED', 'CLOSED', 'DONE'];

function countDesc(nodes: SubTaskNode[] = []): { total: number; done: number } {
  let total = 0;
  let done = 0;
  for (const n of nodes) {
    total += 1;
    if (DONE.includes((n.taskStatus || '').toUpperCase())) done += 1;
    const c = countDesc(n.subTask);
    total += c.total;
    done += c.done;
  }
  return { total, done };
}

function flatten(
  nodes: SubTaskNode[] = [], p: Project, list: TaskListNode, out: GlobalTask[],
) {
  for (const n of nodes) {
    const c = countDesc(n.subTask);
    out.push({
      ...n,
      projectId: Number(p.projectId),
      projectTitle: p.projectTitle,
      listId: list.listId,
      listTitle: list.listTitle,
      subtaskTotal: c.total,
      subtaskDone: c.done,
    });
    if (n.subTask?.length) flatten(n.subTask, p, list, out);
  }
}

/**
 * Loads every project the user can see + each project's task tree
 * (GET /project/get-all, then GET /project/{id}/task in parallel).
 */
export function useAllTasks() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<GlobalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [failedProjects, setFailedProjects] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const list = await projectApiService.getProjects();
      setProjects(list);
      const results = await Promise.allSettled(
        list.map((p) => projectApiService.getProjectById(String(p.projectId))),
      );
      const out: GlobalTask[] = [];
      let failed = 0;
      results.forEach((r, i) => {
        if (r.status !== 'fulfilled') {
          failed += 1;
          return;
        }
        const lists: TaskListNode[] = r.value?.data?.lists ?? [];
        lists.forEach((l) => flatten(l.tasks, list[i], l, out));
      });
      setFailedProjects(failed);
      setTasks(out);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** optimistic local status change */
  const setStatusLocal = useCallback((projectId: number, taskId: number, status: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.projectId === projectId && t.taskId === taskId ? { ...t, taskStatus: status } : t)),
    );
  }, []);

  const projectOptions = useMemo(
    () => projects.map((p) => ({ id: Number(p.projectId), title: p.projectTitle })),
    [projects],
  );

  return { projects, projectOptions, tasks, loading, error, failedProjects, reload: load, setStatusLocal };
}
