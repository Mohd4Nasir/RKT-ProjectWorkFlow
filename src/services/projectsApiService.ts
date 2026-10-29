import { Project, ProjectsResponse } from "@/types/ProejctsType";
import axiosInstance from "./axiosInstance";
import { apiService } from "./apiService";

export interface CreateProjectDto {
  projectTitle: string;
  projectDescription?: string;
  status?: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  ownerId?: string;
  members?: string[];
  tag?: string;
}
  // Fixed version with proper error handling and types
interface AddProjectMemberParams {
  projectId: number;
  userId: number;
  projectRole: string;
}

interface AddProjectMemberResponse {
  success: boolean;
  data?: {
    memberId: number;
    projectId: number;
    userId: number;
    role: string;
    joinedAt: string;
  };
  message?: string;
}
export interface UpdateProjectDto {
  projectTitle?: string;
  projectDescription?: string;
  status?: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  members?: string[];
  tag?: string;
}

export interface ExcelImportReport {
  totalProjects: number;
  projectsCreated: number;
  projectsSkipped: number;
  totalTasks: number;
  tasksCreated: number;
  tasksSkipped: number;
  totalComments: number;
  commentsCreated: number;
  totalAttachments: number;
  attachmentsCreated: number;
  errors?: string[];
  warnings?: string[];
}

export interface ExcelImportResponse {
  success: boolean;
  message?: string;
  data?: ExcelImportReport;
}

// API Service
export const projectApiService = {
  // Import projects/tasks/comments from an Excel file
  importFromExcel: async (
    file: File,
    options: { skipExisting: boolean; mapUsersByName: boolean },
  ): Promise<ExcelImportResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosInstance.post<ExcelImportResponse>(
      "/project/import-excel",
      formData,
      {
        params: options,
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
      },
    );
    return response.data;
  },

  // Get all projects
  getProjects: async (): Promise<Project[]> => {
    try {
      const response =
        await axiosInstance.get<ProjectsResponse>("/project/get-all");

      // ✅ response.data.data.projects
      const projects = response.data.data.projects;
      console.log("Projects:", projects);

      return projects;
    } catch (error) {
      console.error("Get projects error:", error);
      throw error;
    }
  },
   getMembersForProject: async (projectId: string) => {
    try {
      const response = await axiosInstance.get(`/team/${projectId}/get-not-assigned-users`);
      return response.data;
    } catch (error) {
      console.error(`Get members for project ${projectId} error:`, error);
      throw error;
    }
  },

 getExistingMembersInProject: async (projectId: string) => {
 console.log(`Fetching existing members for project ${projectId}`);
    try {
      const response = await axiosInstance.get(`/team/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`Get existing members for project ${projectId} error:`, error);
      throw error;
    }
  },
  // Get single project by ID
  getProjectById: async (id: string): Promise<Project> => {
    try {
      const response = await axiosInstance.get(`/project/${id}/task`);
      return response.data;
    } catch (error) {
      console.error(`Get project ${id} error:`, error);
      throw error;
    }
  },

  // Get my projects (where user is member)
  getMyProjects: async (): Promise<Project[]> => {
    try {
      const response = await axiosInstance.get("/projects/my");
      return response.data;
    } catch (error) {
      console.error("Get my projects error:", error);
      throw error;
    }
  },



addProjectMember: async ({ projectId, userId, projectRole }: AddProjectMemberParams): Promise<AddProjectMemberResponse> => {
  try {
    // Validate inputs
    if (!projectId || !userId || !projectRole) {
      throw new Error('Missing required fields: projectId, userId, or projectRole');
    }

    console.log(`Adding member ${userId} to project ${projectId} with role ${projectRole}`);

    const response = await axiosInstance.post<AddProjectMemberResponse>(
      "/team/add-member",
      { 
        projectId, 
        userId, 
        projectRole 
      }
    );

    // Check if response is successful
    if (response.data?.success === false) {
      throw new Error(response.data?.message || 'Failed to add member');
    }

    return response.data;
  } catch (error) {
    // Enhanced error logging
    console.error(`Error adding member ${userId} to project ${projectId}:`, {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      params: { projectId, userId, projectRole }
    });

    // Rethrow with user-friendly message
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.response?.status === 404) {
      throw new Error('Project or user not found');
    } else if (error.response?.status === 403) {
      throw new Error('You do not have permission to add members to this project');
    } else if (error.response?.status === 409) {
      throw new Error('User is already a member of this project');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    } else {
      throw new Error(error.message || 'Failed to add member to project');
    }
  }
},

  // Create new project
  createProjectTask: async (data: CreateProjectDto): Promise<Project> => {
    console.log("Creating project with data:", data);
    try {
      const response = await axiosInstance.post("/project/create", {
        projectTitle: data.projectTitle,
        projectDescription: data.projectDescription || "",
        startDate: data.startDate,
        endDate: data.endDate,
      });
      return response.data;
    } catch (error) {
      console.error("Create project error:", error);
      throw error;
    }
  },

  // Update project  (PUT /project)
  // The API requires title, description, start AND end date every time, so any
  // field that is not supplied is filled from the project's current details.
  updateProject: async (
    id: string | number,
    data: {
      projectTitle?: string;
      projectDescription?: string;
      startDate?: string;
      endDate?: string;
    },
  ) => {
    try {
      const need =
        !data.projectTitle || !data.projectDescription || !data.startDate || !data.endDate;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: any = {};
      if (need) {
        const res = await axiosInstance.get(`/project/${id}`);
        current = res.data?.data ?? res.data ?? {};
      }
      const day = (d?: string) => (d ? String(d).slice(0, 10) : undefined);
      const payload = {
        projectId: Number(id),
        projectTitle: data.projectTitle || current.projectTitle,
        projectDescription:
          data.projectDescription || current.projectDescription || current.description || "-",
        startDate: day(data.startDate || current.startDate),
        endDate: day(data.endDate || current.endDate),
      };
      const response = await axiosInstance.put("/project", payload);
      return response.data;
    } catch (error) {
      console.error(`Update project ${id} error:`, error);
      throw error;
    }
  },

  // Delete project
  deleteProject: async (id: string): Promise<void> => {
    try {
      await axiosInstance.delete(`/projects/${id}`);
    } catch (error) {
      console.error(`Delete project ${id} error:`, error);
      throw error;
    }
  },

  
  // Add member to project
  addMember: async (projectId: string, userId: string): Promise<Project> => {
    try {
      const response = await axiosInstance.post(
        `/projects/${projectId}/members`,
        { userId },
      );
      return response.data;
    } catch (error) {
      console.error(`Add member to project ${projectId} error:`, error);
      throw error;
    }
  },

  // Remove member from project  (DELETE /team/remove-member)
  removeMember: async (projectId: number | string, userId: number | string) => {
    try {
      const response = await axiosInstance.delete("/team/remove-member", {
        data: { projectId: Number(projectId), userId: Number(userId) },
      });
      return response.data;
    } catch (error) {
      console.error(`Remove member from project ${projectId} error:`, error);
      throw error;
    }
  },

  // Change a member's role  (PUT /team/update-member-role)
  updateMemberRole: async (
    projectId: number | string,
    userId: number | string,
    projectRole: string,
  ) => {
    const response = await axiosInstance.put("/team/update-member-role", {
      projectId: Number(projectId),
      userId: Number(userId),
      projectRole,
    });
    return response.data;
  },

  // Change project status  (PUT /project/status)
  updateProjectStatus: async (projectId: number | string, projectStatus: string) => {
    const response = await axiosInstance.put("/project/status", {
      projectId: Number(projectId),
      projectStatus,
    });
    return response.data;
  },

  // All allowed project statuses  (GET /project/statuses)
  getProjectStatuses: async () => {
    const response = await axiosInstance.get("/project/statuses");
    return response.data;
  },

  getRoles : async () => {
    const roleResponse = await axiosInstance.get("/team/project/roles");
    return roleResponse.data;
  },
   activtiyTracker: async (projectId:number) => {
    try {
      const response = await axiosInstance.get(`/activities/project/${projectId}`);
      console.log(`Activity tracker for project ${projectId}:`, response.data.data);
      return response.data;
    } catch (error) {
      console.error(`Get activity tracker for project ${projectId} error:`, error);
      throw error;
    }
  }
};
