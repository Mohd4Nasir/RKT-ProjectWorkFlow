import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task, TaskStatus } from '@/types';
import { mockTasks } from '@/services/mockData';

interface TasksState { items: Task[]; }
const initialState: TasksState = { items: mockTasks };

const slice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask(state, a: PayloadAction<Task>) { state.items.unshift(a.payload); },
    updateTask(state, a: PayloadAction<Task>) {
      const i = state.items.findIndex((t) => t.id === a.payload.id);
      if (i >= 0) state.items[i] = a.payload;
    },
    deleteTask(state, a: PayloadAction<string>) {
      state.items = state.items.filter((t) => t.id !== a.payload);
    },
    moveTask(state, a: PayloadAction<{ id: string; status: TaskStatus }>) {
      const t = state.items.find((x) => x.id === a.payload.id);
      if (t) t.status = a.payload.status;
    },
  },
});

export const { addTask, updateTask, deleteTask, moveTask } = slice.actions;
export default slice.reducer;
