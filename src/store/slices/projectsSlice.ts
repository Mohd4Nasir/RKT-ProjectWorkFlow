import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '@/types/ProejctsType';
import { mockProjects } from '@/services/mockData';

interface ProjectsState { items: Project[]; }
const initialState: ProjectsState = { items:[] }; // Initialize with mock data for testing

// Ids arrive as either strings or numbers depending on the endpoint, so
// strict `===` silently misses. Compare on a normalised string instead.
const sameId = (a?: string | number | null, b?: string | number | null) =>
  a != null && b != null && String(a) === String(b);

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
      const i = state.items.findIndex((p) => sameId(p.id, a.payload.id));
      if (i >= 0) state.items[i] = a.payload;
    },
    
    deleteProject(state, a: PayloadAction<string | number>) {
      state.items = state.items.filter((p) => !sameId(p.id, a.payload));
    },
    patchProject(state, a: PayloadAction<Partial<Project> & { projectId: string | number }>) {
  const i = state.items.findIndex((p) => String(p.projectId) === String(a.payload.projectId));
  if (i >= 0) state.items[i] = { ...state.items[i], ...a.payload };
},

    // Add a member to the project
    addProjectMember(state, a: PayloadAction<{ projectId: string | number; userId: string | number; role?: string }>) {
      const project = state.items.find((p) => sameId(p.id, a.payload.projectId));
      if (project && !project.members.some((m) => sameId(m, a.payload.userId))) {
        project.members.push(String(a.payload.userId));
      }
    },

    // Remove a member from the project
    removeProjectMember(state, a: PayloadAction<{ projectId: string | number; userId: string | number }>) {
      const project = state.items.find((p) => sameId(p.id, a.payload.projectId));
      if (project) {
        project.members = project.members.filter((id) => !sameId(id, a.payload.userId));
      }
    },

    // Update member role
    updateProjectMemberRole(state, a: PayloadAction<{ projectId: string | number; userId: string | number; role: string }>) {
      const project = state.items.find((p) => sameId(p.id, a.payload.projectId));
      if (project) {
        // Role update handled at application level if needed
      }
    },

    // Bulk add members
    addMultipleProjectMembers(state, a: PayloadAction<{ projectId: string | number; userIds: (string | number)[]; role?: string }>) {
      const project = state.items.find((p) => sameId(p.id, a.payload.projectId));
      if (project) {
        const newMembers = a.payload.userIds
          .filter((id) => !project.members.some((m) => sameId(m, id)))
          .map(String);
        project.members.push(...newMembers);
      }
    },

    // Transfer ownership to another member
    transferProjectOwnership(state, a: PayloadAction<{ projectId: string | number; newOwnerId: string | number }>) {
      const project = state.items.find((p) => sameId(p.id, a.payload.projectId));
      if (project && project.members.some((m) => sameId(m, a.payload.newOwnerId))) {
        // Add current owner to members if not already there
        if (project.ownerId != null && !project.members.some((m) => sameId(m, project.ownerId!))) {
          project.members.push(String(project.ownerId));
        }
        
        // Update ownership
        project.ownerId = a.payload.newOwnerId;
        
        // Remove new owner from members list (since they're now owner)
        project.members = project.members.filter((id) => !sameId(id, a.payload.newOwnerId));
      }
    },
  },
});

export const { 
  setProjects,
  addProject, 
  updateProject, 
  patchProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
  addMultipleProjectMembers,
  transferProjectOwnership,
} = slice.actions;

export default slice.reducer;