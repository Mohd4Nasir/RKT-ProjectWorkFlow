import axiosInstance from "./axiosInstance";
import type { TaskCommentAttachment } from "./fileApiService";

/**
 * task-issue-controller + task-issue-comment-controller.
 * An issue always belongs to a task; a subtask is just a task with its own taskId, so the very same calls
 * work for tasks and subtasks alike.
 */

export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REOPENED";
export type IssueType = "BUG" | "BLOCKER" | "IMPROVEMENT" | "QUERY";
export type IssueSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface IssueUser {
  userId: number;
  name: string;
  email?: string;
}

export interface Issue {
  id: number;
  taskId: number;
  taskTitle?: string;
  projectId?: number;
  title: string;
  description?: string;
  type: IssueType;
  severity: IssueSeverity;
  status: IssueStatus;
  reportedBy?: IssueUser | null;
  assignee?: IssueUser | null;
  resolvedBy?: IssueUser | null;
  resolvedAt?: string | null;
  closedBy?: IssueUser | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface IssueComment {
  id: number;
  issueId: number;
  author?: IssueUser | null;
  content: string;
  createdAt: string;
  commentUpdatedOn?: string;
  attachments?: TaskCommentAttachment[];
}

export interface IssueOption {
  value: string;
  displayName: string;
}

export interface CreateIssueDto {
  taskId: number | string;
  title: string;
  description?: string;
  type?: IssueType;
  severity?: IssueSeverity;
  assigneeId?: number | string | null;
}

export interface UpdateIssueDto {
  title: string;
  description?: string;
  type: IssueType;
  severity: IssueSeverity;
}

export interface IssueFilters {
  status?: IssueStatus[];
  severity?: IssueSeverity[];
  type?: IssueType[];
  assigneeId?: number | string;
}

export const issueService = {
  // GET /task/issue/task/{taskId}
  getByTask: async (taskId: number | string, status?: IssueStatus): Promise<Issue[]> => {
    const res = await axiosInstance.get(`/task/issue/task/${taskId}`, { params: status ? { status } : undefined });
    return res.data?.data ?? [];
  },

  // GET /task/issue/project/{projectId}  (array filters are sent as repeated params: status=A&status=B)
  getByProject: async (projectId: number | string, filters: IssueFilters = {}): Promise<Issue[]> => {
    const res = await axiosInstance.get(`/task/issue/project/${projectId}`, {
      params: filters,
      paramsSerializer: { indexes: null },
    });
    return res.data?.data ?? [];
  },

  // GET /task/issue/{issueId}
  get: async (issueId: number | string): Promise<Issue> => {
    const res = await axiosInstance.get(`/task/issue/${issueId}`);
    return res.data?.data;
  },

  // POST /task/issue
  create: async (dto: CreateIssueDto): Promise<Issue> => {
    const res = await axiosInstance.post("/task/issue", {
      taskId: Number(dto.taskId),
      title: dto.title,
      description: dto.description ?? "",
      type: dto.type,
      severity: dto.severity,
      ...(dto.assigneeId ? { assigneeId: Number(dto.assigneeId) } : {}),
    });
    return res.data?.data;
  },

  // PUT /task/issue/{issueId}
  update: async (issueId: number | string, dto: UpdateIssueDto): Promise<Issue> => {
    const res = await axiosInstance.put(`/task/issue/${issueId}`, dto);
    return res.data?.data;
  },

  // PUT /task/issue/{issueId}/status
  updateStatus: async (issueId: number | string, status: IssueStatus): Promise<Issue> => {
    const res = await axiosInstance.put(`/task/issue/${issueId}/status`, { status });
    return res.data?.data;
  },

  // PUT /task/issue/{issueId}/assignee   (no assigneeId = unassign)
  assign: async (issueId: number | string, assigneeId: number | string | null): Promise<Issue> => {
    const res = await axiosInstance.put(`/task/issue/${issueId}/assignee`, { assigneeId: assigneeId ? Number(assigneeId) : null });
    return res.data?.data;
  },

  // DELETE /task/issue/{issueId}
  remove: async (issueId: number | string): Promise<void> => {
    await axiosInstance.delete(`/task/issue/${issueId}`);
  },

  // GET /task/issue/types | /severities | /statuses
  types: async (): Promise<IssueOption[]> => (await axiosInstance.get("/task/issue/types")).data?.data ?? [],
  severities: async (): Promise<IssueOption[]> => (await axiosInstance.get("/task/issue/severities")).data?.data ?? [],
  statuses: async (): Promise<IssueOption[]> => (await axiosInstance.get("/task/issue/statuses")).data?.data ?? [],

  /* ───────── comments (task-issue-comment-controller) ───────── */

  // GET /task/issue/{issueId}/comment
  getComments: async (issueId: number | string): Promise<IssueComment[]> => {
    const res = await axiosInstance.get(`/task/issue/${issueId}/comment`);
    return res.data?.data ?? [];
  },

  // POST /task/issue/{issueId}/comment
  addComment: async (issueId: number | string, content: string): Promise<IssueComment> => {
    const res = await axiosInstance.post(`/task/issue/${issueId}/comment`, { content });
    return res.data?.data;
  },

  // PUT /task/issue/comment/{commentId}
  editComment: async (commentId: number | string, content: string): Promise<IssueComment> => {
    const res = await axiosInstance.put(`/task/issue/comment/${commentId}`, { content });
    return res.data?.data;
  },

  // DELETE /task/issue/comment/{commentId}
  deleteComment: async (commentId: number | string): Promise<void> => {
    await axiosInstance.delete(`/task/issue/comment/${commentId}`);
  },
};
