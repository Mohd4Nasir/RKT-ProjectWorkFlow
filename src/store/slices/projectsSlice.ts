import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '@/types';
import { mockProjects } from '@/services/mockData';

interface ProjectsState { items: Project[]; }
const initialState: ProjectsState = { items: mockProjects };

const slice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    addProject(state, a: PayloadAction<Project>) { state.items.unshift(a.payload); },
    updateProject(state, a: PayloadAction<Project>) {
      const i = state.items.findIndex((p) => p.id === a.payload.id);
      if (i >= 0) state.items[i] = a.payload;
    },
    deleteProject(state, a: PayloadAction<string>) {
      state.items = state.items.filter((p) => p.id !== a.payload);
    },
  },
});

export const { addProject, updateProject, deleteProject } = slice.actions;
export default slice.reducer;
