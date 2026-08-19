import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '@/types/ProejctsType';
import { mockProjects } from '@/services/mockData';

interface ProjectsState { items: Project[]; }
const initialState: ProjectsState = { items:mockProjects }; // Initialize with mock data for testing

const slice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
     setProjects(state, a: PayloadAction<Project[]>) {
      state.items = a.payload;
    },
    addProject(state, a: PayloadAction<Project>) { 
      state.items.unshift(a.payload); 
    },
    
    updateProject(state, a: PayloadAction<Project>) {
      const i = state.items.findIndex((p) => p.id === a.payload.id);
      if (i >= 0) state.items[i] = a.payload;
    },
    
    deleteProject(state, a: PayloadAction<string>) {
      state.items = state.items.filter((p) => p.id !== a.payload);
    },

    // Add a member to the project
    addProjectMember(state, a: PayloadAction<{ projectId: string; userId: string; role?: string }>) {
      const project = state.items.find((p) => p.id === a.payload.projectId);
      if (project && !project.members.includes(a.payload.userId)) {
        project.members.push(a.payload.userId);
      }
    },

    // Remove a member from the project
    removeProjectMember(state, a: PayloadAction<{ projectId: string; userId: string }>) {
      const project = state.items.find((p) => p.id === a.payload.projectId);
      if (project) {
        project.members = project.members.filter((id) => id !== a.payload.userId);
      }
    },

    // Update member role
    updateProjectMemberRole(state, a: PayloadAction<{ projectId: string; userId: string; role: string }>) {
      const project = state.items.find((p) => p.id === a.payload.projectId);
      if (project) {
        // Role update handled at application level if needed
      }
    },

    // Bulk add members
    addMultipleProjectMembers(state, a: PayloadAction<{ projectId: string; userIds: string[]; role?: string }>) {
      const project = state.items.find((p) => p.id === a.payload.projectId);
      if (project) {
        const newMembers = a.payload.userIds.filter((id) => !project.members.includes(id));
        project.members.push(...newMembers);
      }
    },

    // Transfer ownership to another member
    transferProjectOwnership(state, a: PayloadAction<{ projectId: string; newOwnerId: string }>) {
      const project = state.items.find((p) => p.id === a.payload.projectId);
      if (project && project.members.includes(a.payload.newOwnerId)) {
        // Add current owner to members if not already there
        if (!project.members.includes(project.ownerId)) {
          project.members.push(project.ownerId);
        }
        
        // Update ownership
        project.ownerId = a.payload.newOwnerId;
        
        // Remove new owner from members list (since they're now owner)
        project.members = project.members.filter((id) => id !== a.payload.newOwnerId);
      }
    },
  },
});

export const { 
  setProjects,
  addProject, 
  updateProject, 
  deleteProject,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
  addMultipleProjectMembers,
  transferProjectOwnership,
} = slice.actions;

export default slice.reducer;