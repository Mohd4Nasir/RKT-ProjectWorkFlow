// import axiosInstance from "./axiosInstance";

// /* =========================
//    TASK LIST DTOs
// ========================= */

// export interface CreateTaskListDto {
//   projectId: number;
//   listTitle: string;
// }

// export interface UpdateTaskListDto {
//   listTitle: string;
// }

// /* =========================
//    TASK DTOs
// ========================= */

// export interface CreateTaskDto {
//   listId: number;
//   taskTitle: string;
//   description?: string;
//   startDate?: string;
//   endDate?: string;
//   priority?: string;
// }

// export interface UpdateTaskDto {
//   taskTitle?: string;
//   description?: string;
//   startDate?: string;
//   endDate?: string;
//   priority?: string;
//   status?: string;
// }

// /* =========================
//    TASK LIST APIs
// ========================= */

// export const taskService = {
 
// createTaskList: async (
//   data: CreateTaskListDto
// ) => {
//   try {
//     const response = await axiosInstance.post(
//       "/task/list/create",
//       {
//         projectId: data.projectId,
//         listTitle: data.listTitle,
//       }
//     );

//     return response.data;
//   } catch (error) {
//     console.error("Create task list error:", error);
//     throw error;
//   }
// },

//   // Update List
//   updateTaskList: async (
//     listId: number,
//     listtitle : string
//   ) => {
//     const response = await axiosInstance.put(
//       `/task/list/update/${listId}`,
//       listtitle
//     );

//     return response.data;
//   },

//   // Delete List
//   deleteTaskList: async (listId: number) => {
//     const response = await axiosInstance.delete(
//       `/task/list/delete/${listId}`
//     );

//     return response.data;
//   },

//   /* =========================
//      TASK APIs
//   ========================= */

//   // Create Task
//   createTask: async (data: CreateTaskDto) => {
//     console.log("Creating task with data:", data);
//     const response = await axiosInstance.post(
//       "/task/create",
//       data
//     );

//     return response.data;
//   },

//   // Update Task
//   updateTask: async (
//     taskId: number,
//     data: UpdateTaskDto
//   ) => {
//     const response = await axiosInstance.put(
//       `/task/update/${taskId}`,
//       data
//     );

//     return response.data;
//   },

//   // Delete Task
//   deleteTask: async (taskId: number) => {
//     const response = await axiosInstance.delete(
//       `/task/delete/${taskId}`
//     );

//     return response.data;
//   },

//   // Get Task By Id
//   getTaskById: async (taskId: number) => {
//     const response = await axiosInstance.get(
//       `/task/${taskId}`
//     );

//     return response.data;
//   },

//   // Get Tasks By List
//   getTasksByListId: async (listId: number) => {
//     const response = await axiosInstance.get(
//       `/task/list/${listId}`
//     );

//     return response.data;
//   },

//  // In your taskService file, add:

// createTaskAtPosition: async (payload: {
//   taskTitle: string;
//   taskDescription?: string;
//   taskStartDate?: string;
//   taskEndDate?: string;
//   refTaskId: number | string;
//   isAbove: boolean;
// }) => {
//   const response = await axiosInstance.post('/task/create-at-position', payload);
//   return response.data;
// }, 
// };


import axiosInstance from "./axiosInstance";

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
}

export interface CreateTaskListAtPositionDto {
  projectId?: string | number;
  listTitle: string;
  refListId: number | string;
  isAbove: boolean;
}

/* =========================
   TASK LIST APIs
========================= */

export const taskService = {
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

  // Update List — accepts a partial DTO object, not a bare string
  updateTaskList: async (listId: string | number, data: UpdateTaskListDto) => {
    try {
      const response = await axiosInstance.put(`/task/list/update/${listId}`, data);
      return response.data;
    } catch (error) {
      console.error("Update task list error:", error);
      throw error;
    }
  },

  // Delete List
  deleteTaskList: async (listId: string | number) => {
    try {
      const response = await axiosInstance.delete(`/task/list/delete/${listId}`);
      return response.data;
    } catch (error) {
      console.error("Delete task list error:", error);
      throw error;
    }
  },

  // Create List Above / Below a reference list
  createTaskListAtPosition: async (payload: CreateTaskListAtPositionDto) => {
    console.log("Task List",payload)
    try {
      const response = await axiosInstance.post("/task/list/create-at-position", payload);
      return response.data;
    } catch (error) {
      console.error("Create task list at position error:", error);
      throw error;
    }
  },

  /* =========================
     TASK APIs
  ========================= */

  // Create Task
  createTask: async (data: CreateTaskDto) => {
    console.log("Add task ya sub task ",data)
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

  // Update Task
  updateTask: async (taskId: string | number, data: UpdateTaskDto) => {
    try {
      const response = await axiosInstance.put(`/task/update/${taskId}`, {
        taskTitle: data.taskTitle,
        description: data.taskDescription,
        startDate: data.taskStartDate,
        endDate: data.taskEndDate,
        priority: data.priority,
        status: data.taskStatus,
        assigneeId: data.assigneeId,
        sequence: data.sequence,
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

  // Create Task Above / Below a reference task
  createTaskAtPosition: async (payload: CreateTaskAtPositionDto) => {
    console.log(" ther is add task ",payload)
    try {
      const response = await axiosInstance.post("/task/create-at-position", payload);
      return response.data;
    } catch (error) {
      console.error("Create task at position error:", error);
      throw error;
    }
  },
};