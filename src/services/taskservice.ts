import axiosInstance from "./axiosInstance";

/* =========================
   TASK LIST DTOs
========================= */

export interface CreateTaskListDto {
  projectId: string | number;
  listTitle: string;
}

export interface UpdateTaskListDto {
  projectId: string | number;
  taskListId: string | number;
  listTitle?: string;
}

export interface UpdateTaskListPositionDto {
  projectId: string | number;
  taskListId: string | number;
  referenceListId: string | number;
  isAbove: boolean;
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
  priority?: string;
  insertAfterId?: string | null;
}

export interface UpdateTaskDto {
  projectId: string | number;
  taskId: string | number;
  taskTitle?: string;
  taskDescription?: string;
  taskStartDate?: string;
  taskEndDate?: string;
  
}

export interface UpdateTaskStatusDto {
  projectId: string | number;
  taskId: string | number;
  taskStatus: string;
}

export interface UpdateTaskPositionDto {
  projectId: string | number;
  taskId: string | number;
  referenceTaskId: string | number;
  isAbove: boolean;
  taskListId?: string | number;
}

export interface CreateTaskAtPositionDto {
  taskTitle: string;
  taskDescription?: string;
  taskStartDate?: string;
  taskEndDate?: string;
  refTaskId: number | string;
  isAbove: boolean;
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

  // Update List — accepts a partial DTO object, not a bare string
  updateTaskList: async ( data: UpdateTaskListDto) => {
    console.log("Update task list data:", data);
    try {
      const response = await axiosInstance.put(
        `/task/list`,      data,

      );
      return response.data;
    } catch (error) {
      console.error("Update task list error:", error);
      throw error;
    }
  },

  // Move List Above / Below a reference list
  updateTaskListPosition: async (payload: UpdateTaskListPositionDto) => {
    try {
      const response = await axiosInstance.put("/task/list/position", {
        projectId: payload.projectId,
        taskListId: payload.taskListId,
        referenceListId: payload.referenceListId,
        isAbove: payload.isAbove,
      });
      return response.data;
    } catch (error) {
      console.error("Update task list position error:", error);
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
  updateTask: async (data: UpdateTaskDto) => {
    try {
      console.log("Update task data:", data);
      const response = await axiosInstance.put(`/task/update`, data);
      return response.data;
    } catch (error) {
      console.error("Update task error:", error);
      throw error;
    }
  },

  // Update Task Status
  updateTaskStatus: async (data: UpdateTaskStatusDto) => {
    try {
      const response = await axiosInstance.put(`/task/status`, data);
      return response.data;
    } catch (error) {
      console.error("Update task status error:", error);
      throw error;
    }
  },

  // Move Task Above / Below a reference task
  updateTaskPosition: async (payload: UpdateTaskPositionDto) => {
    try {
      console.log("Update task position payload:", payload);
      const response = await axiosInstance.put(`/task/move`, {
        projectId: payload.projectId,
        taskId: payload.taskId,
        referenceTaskId: payload.referenceTaskId,
        isAbove: payload.isAbove,
        taskListId: payload.taskListId,
      });
      return response.data;
    } catch (error) {
      console.error("Update task position error:", error);
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

  // Statuses selectable on a task — GET /task/statuses
  getTaskStatuses: async () => {
    try {
      const res = await axiosInstance.get(`/task/statuses`);
      console.log("taskService getTaskStatuses", res.data);
      return res.data;
    } catch (error) {
      console.error("Get task statuses error:", error);
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
  getSubtaskInTaskDeatils: async (taskId: string | number) => {
    try {
      const res = await axiosInstance.get(`/task/${taskId}/full-tree`);
      console.log("taskService sub task", res);
      return res.data.data;
    } catch (error) {
      console.error("Create Task at positons", error);
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
};