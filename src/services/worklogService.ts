import axiosInstance from "./axiosInstance";

/**
 * Task work logs (worklogs-api.md): what a task member worked on each day and how long it took.
 * Time is always in MINUTES on the wire (1..1440), dates are plain "yyyy-MM-dd".
 */

export interface WorklogUser {
  userId: number;
  /** null if the user no longer exists */
  name: string | null;
  email: string | null;
}

export interface Worklog {
  worklogId: number;
  taskId: number;
  /** the author */
  user: WorklogUser;
  workDate: string;
  timeSpentMinutes: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskWorklogs {
  /** sum of the RETURNED entries, so the filters apply to it */
  totalMinutes: number;
  /** newest workDate first */
  worklogs: Worklog[];
}

export interface WorklogDto {
  workDate: string;
  timeSpentMinutes: number;
  description: string;
}

export interface WorklogFilters {
  userId?: number | string;
  /** workDate on or after */
  from?: string;
  /** workDate on or before */
  to?: string;
}

export const MAX_WORKLOG_MINUTES = 1440;
export const MAX_WORKLOG_DESCRIPTION = 5000;

/** 150 -> "2h 30m", 120 -> "2h", 30 -> "30m" */
export const fmtMinutes = (m: number): string => {
  const n = Math.max(0, Math.round(Number(m) || 0));
  const h = Math.floor(n / 60);
  const r = n % 60;
  if (!h) return `${r}m`;
  return r ? `${h}h ${r}m` : `${h}h`;
};

export const worklogService = {
  // GET /task/{taskId}/worklogs?userId=&from=&to=
  list: async (taskId: number | string, filters: WorklogFilters = {}): Promise<TaskWorklogs> => {
    const params: Record<string, string | number> = {};
    if (filters.userId) params.userId = filters.userId;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    const res = await axiosInstance.get(`/task/${taskId}/worklogs`, { params });
    const data = res.data?.data;
    return { totalMinutes: data?.totalMinutes ?? 0, worklogs: data?.worklogs ?? [] };
  },

  // POST /task/{taskId}/worklogs  → 201
  add: async (taskId: number | string, dto: WorklogDto): Promise<Worklog> => {
    const res = await axiosInstance.post(`/task/${taskId}/worklogs`, dto);
    return res.data?.data;
  },

  // PUT /task/worklogs/{worklogId}  (full replace: send all three fields)
  update: async (worklogId: number | string, dto: WorklogDto): Promise<Worklog> => {
    const res = await axiosInstance.put(`/task/worklogs/${worklogId}`, dto);
    return res.data?.data;
  },

  // DELETE /task/worklogs/{worklogId}
  remove: async (worklogId: number | string): Promise<void> => {
    await axiosInstance.delete(`/task/worklogs/${worklogId}`);
  },
};
