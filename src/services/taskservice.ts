import axiosInstance from "./axiosInstance";
import type { TaskCommentAttachment } from "./fileApiService";

/* =========================
   TASK LIST DTOs
========================= */

export interface CreateTaskListDto {
  projectId: string | number;
  listTitle: string;
}

export interface UpdateTaskListDto {
  listTitle?: string;
  sequence?: number;
}

export type CommentLikeType = "LIKE" | "DISLIKE";

export interface TaskComment {
  id: number;
  taskId: number;
  authorId: number;
  authorName: string;
  content: string;
  commentUpdatedOn: string;
  commentType?: string;
  parentCommentId?: number | null;
  replyCount?: number;
  likeCount?: number;
  dislikeCount?: number;
  userLikeType?: CommentLikeType | null;
  likedByCurrentUser?: boolean;
  attachments?: TaskCommentAttachment[];
}

/* =========================
   TASK DTOs
========================= */

export interface CreateTaskDto {
  projectId: string | number;
  taskListId: string | number;
  parentTaskId?: string | number | null;
  taskTitle: string;
  taskDescription?: string;
  taskStartDate?: string;
  taskEndDate?: string;
  taskStatus?: string;
  /** NONE | LOW | MEDIUM | HIGH — the server uses NONE when omitted */
  taskPriority?: string;
  priority?: string;
  insertAfterId?: string | null;
}

export interface UpdateTaskDto {
  taskTitle?: string;
  taskDescription?: string;
  taskStartDate?: string;
  taskEndDate?: string;
  priority?: string;
  taskStatus?: string;
  assigneeId?: string;
  sequence?: number;
}

export interface CreateTaskAtPositionDto {
  taskTitle: string;
  taskDescription?: string;
  taskStartDate?: string;
  taskEndDate?: string;
  refTaskId: number | string;
  isAbove: boolean;
  taskPriority?: string;
}

export interface CreateTaskListAtPositionDto {
  projectId?: string | number;
  listTitle: string;
  refListId: number | string;
  isAbove: boolean;
}

/* =========================
   TASK MEMBER / CONTRIBUTOR DTOs
========================= */

export interface AssignTaskMemberDto {
  userId: string | number;
  taskId: string | number;
  taskMemberRole: string; // e.g. "PRIMARY_ASSIGNEE"
}

/* =========================
   TASK LIST APIs
========================= */

export const taskService = {
  // PUT /task/status
  updateTaskStatus: async (projectId: number | string, taskId: number | string, taskStatus: string) => {
    const response = await axiosInstance.put("/task/status", {
      projectId: Number(projectId),
      taskId: Number(taskId),
      taskStatus,
    });
    return response.data;
  },

  // PUT /task/priority   (taskPriority: NONE | LOW | MEDIUM | HIGH)
  updateTaskPriority: async (projectId: number | string, taskId: number | string, taskPriority: string) => {
    const response = await axiosInstance.put("/task/priority", {
      projectId: Number(projectId),
      taskId: Number(taskId),
      taskPriority: taskPriority.toUpperCase(),
    });
    return response.data;
  },

  // GET /task/priorities
  getTaskPriorities: async () => {
    const response = await axiosInstance.get("/task/priorities");
    return response.data;
  },

  // GET /task/statuses
  getTaskStatuses: async () => {
    const response = await axiosInstance.get("/task/statuses");
    return response.data;
  },

  // PUT /task/move  (drag a task to another list / parent / position)
  moveTask: async (data: {
    projectId: number | string;
    taskId: number | string;
    targetListId: number | string;
    targetParentTaskId?: number | string | null;
    referenceTaskId?: number | string;
    isAbove?: boolean;
  }) => {
    const response = await axiosInstance.put("/task/move", data);
    return response.data;
  },

  // PUT /task/list/position  (reorder lists)
  updateListPosition: async (data: {
    projectId: number | string;
    taskListId: number | string;
    referenceListId: number | string;
    isAbove: boolean;
  }) => {
    const response = await axiosInstance.put("/task/list/position", data);
    return response.data;
  },

  // GET /task/{taskId}/sub-tree
  getSubTree: async (taskId: number | string) => {
    const response = await axiosInstance.get(`/task/${taskId}/sub-tree`);
    return response.data;
  },

  /* =========================
     TASK  List APIs
  ========================= */
  createTaskList: async (data: CreateTaskListDto) => {
    try {
      const response = await axiosInstance.post("/task/list/create", {
        projectId: data.projectId,
        listTitle: data.listTitle,
      });
      return response.data;
    } catch (error) {
      console.error("Create task list error:", error);
      throw error;
    }
  },
  // Create List Above / Below a reference list
  createTaskListAtPosition: async (payload: CreateTaskListAtPositionDto) => {
    console.log("Task List", payload);
    try {
      const response = await axiosInstance.post(
        "/task/list/create-at-position",
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Create task list at position error:", error);
      throw error;
    }
  },

  // Update List  (PUT /task/list)
  updateTaskList: async (
    projectId: string | number,
    listId: string | number,
    listTitle: string,
  ) => {
    try {
      const response = await axiosInstance.put("/task/list", {
        projectId: Number(projectId),
        taskListId: Number(listId),
        listTitle,
      });
      return response.data;
    } catch (error) {
      console.error("Update task list error:", error);
      throw error;
    }
  },

  // Delete List
  deleteTaskList: async (listId: string | number) => {
    try {
      const response = await axiosInstance.delete(
        `/task/list/delete/${listId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Delete task list error:", error);
      throw error;
    }
  },

  /* =========================
     TASK APIs
  ========================= */

  // Create Task
  createTask: async (data: CreateTaskDto) => {
    console.log("Add task ya sub task ", data);
    try {
      const response = await axiosInstance.post("/task/create", {
        projectId: data.projectId,
        taskListId: data.taskListId,
        parentTaskId: data.parentTaskId ?? null,
        taskTitle: data.taskTitle,
        description: data.taskDescription ?? "",
        startDate: data.taskStartDate ?? "",
        endDate: data.taskEndDate ?? "",
        ...(data.taskPriority ? { taskPriority: data.taskPriority.toUpperCase() } : {}),
      });
      return response.data;
    } catch (error) {
      console.error("Create task error:", error);
      throw error;
    }
  },
  // Create Task Above / Below a reference task
  createTaskAtPosition: async (payload: CreateTaskAtPositionDto) => {
    console.log(" ther is add task ", payload);
    try {
      const response = await axiosInstance.post(
        "/task/create-at-position",
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Create task at position error:", error);
      throw error;
    }
  },
  // Update Task
  // Update task title / description / dates  (PUT /task/update)
  // Status has its own endpoint: updateTaskStatus (PUT /task/status)
  updateTask: async (
    projectId: string | number,
    taskId: string | number,
    data: UpdateTaskDto,
  ) => {
    try {
      const response = await axiosInstance.put("/task/update", {
        projectId: Number(projectId),
        taskId: Number(taskId),
        taskTitle: data.taskTitle,
        taskDescription: data.taskDescription,
        taskStartDate: data.taskStartDate || undefined,
        taskEndDate: data.taskEndDate || undefined,
      });
      return response.data;
    } catch (error) {
      console.error("Update task error:", error);
      throw error;
    }
  },

  // Delete Task
  deleteTask: async (taskId: string | number) => {
    try {
      const response = await axiosInstance.delete(`/task/delete/${taskId}`);
      return response.data;
    } catch (error) {
      console.error("Delete task error:", error);
      throw error;
    }
  },

  // Get Task By Id
  getTaskById: async (taskId: string | number) => {
    const response = await axiosInstance.get(`/task/${taskId}`);
    return response.data;
  },

  // Get Tasks By List
  getTasksByListId: async (listId: string | number) => {
    const response = await axiosInstance.get(`/task/list/${listId}`);
    return response.data;
  },

  // Get Task Board (used to open Task Detail Panel — full details for a single task)
  getTaskBoard: async (taskId: string | number) => {
    try {
      const response = await axiosInstance.get(`/task/${taskId}/board`);
      return response.data; // { data: {...}, success, message, ... }
    } catch (error) {
      console.error("Get task board error:", error);
      throw error;
    }
  },
  /* =========================
     TASK MEMBER / CONTRIBUTOR APIs
  ========================= */

  // Get current contributors on a task
  getTaskMembers: async (taskId: number | string) => {
    const res = await axiosInstance.get(`/task/${taskId}/task-member`);
    return res.data.data;
  },

  // Roles selectable for a task member — GET /task/roles
  getTaskMemberRoles: async () => {
    try {
      const res = await axiosInstance.get(`/task/roles`);
      return res.data.data;
    } catch (error) {
      console.error("Get task member roles error:", error);
      throw error;
    }
  },

  // Users who are NOT yet a contributor on this task, i.e. eligible to be added
  getNotAssignedMembers: async (taskId: number | string) => {
    try {
      const res = await axiosInstance.get(`/task/${taskId}/not-assigned-member`);
      return res.data.data;
    } catch (error) {
      console.error("Get not-assigned members error:", error);
      throw error;
    }
  },

  // Assign (add) a user to a task with a role, or re-assign/change an existing member's role —
  // same endpoint handles both since it's keyed by userId + taskId
  assignTaskMember: async (data: AssignTaskMemberDto) => {
    try {
      const res = await axiosInstance.post(`/task/assign-task`, {
        userId: data.userId,
        taskId: data.taskId,
        taskMemberRole: data.taskMemberRole,
      });
      return res.data.data;
    } catch (error) {
      console.error("Assign task member error:", error);
      throw error;
    }
  },

  /* =========================
     TASK COMMENT APIs  (task-comment-controller)
     Works for tasks and subtasks alike — a subtask is just a task with its own taskId.
  ========================= */

  // GET /task/comment/task/{taskId}
  getTaskComments: async (taskId: number | string): Promise<TaskComment[]> => {
    const res = await axiosInstance.get(`/task/comment/task/${taskId}`);
    return res.data?.data ?? [];
  },

  // POST /task/comment
  addTaskComment: async (taskId: number | string, content: string): Promise<TaskComment> => {
    const res = await axiosInstance.post("/task/comment", { taskId: Number(taskId), content });
    return res.data?.data;
  },

  // PUT /task/comment/{commentId}
  updateTaskComment: async (commentId: number | string, taskId: number | string, content: string): Promise<TaskComment> => {
    const res = await axiosInstance.put(`/task/comment/${commentId}`, { taskId: Number(taskId), content });
    return res.data?.data;
  },

  // POST /task/comment/{commentId}/reply
  replyToTaskComment: async (commentId: number | string, taskId: number | string, content: string): Promise<TaskComment> => {
    const res = await axiosInstance.post(`/task/comment/${commentId}/reply`, { taskId: Number(taskId), content });
    return res.data?.data;
  },

  // GET /task/comment/{commentId}/replies
  getTaskCommentReplies: async (commentId: number | string): Promise<TaskComment[]> => {
    const res = await axiosInstance.get(`/task/comment/${commentId}/replies`);
    return res.data?.data ?? [];
  },

  // POST /task/comment/{commentId}/like
  likeTaskComment: async (commentId: number | string, likeType: CommentLikeType) => {
    const res = await axiosInstance.post(`/task/comment/${commentId}/like`, { taskCommentId: Number(commentId), likeType });
    return res.data;
  },

  // DELETE /task/comment/{commentId}/like
  unlikeTaskComment: async (commentId: number | string) => {
    const res = await axiosInstance.delete(`/task/comment/${commentId}/like`);
    return res.data;
  },

  // DELETE /task/comment/{commentId}
  deleteTaskComment: async (commentId: number | string) => {
    const res = await axiosInstance.delete(`/task/comment/${commentId}`);
    return res.data;
  },
};