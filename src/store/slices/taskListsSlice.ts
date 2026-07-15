// import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { TaskList } from '@/types/ProejctAndTask';

// interface TaskListsState {
//   items: TaskList[];
// }

// const initialState: TaskListsState = { items: [] };

// const taskListsSlice = createSlice({
//   name: 'taskLists',
//   initialState,
//   reducers: {
//     addTaskList(state, action: PayloadAction<TaskList>) {
//       // Assign order = last + 1
//       const maxOrder = state.items.length
//         ? Math.max(...state.items.map(tl => tl.order ?? 0))
//         : -1;
//       state.items.push({ ...action.payload, order: maxOrder + 1 });
//     },

//     updateTaskList(state, action: PayloadAction<TaskList>) {
//       const idx = state.items.findIndex(tl => tl.id === action.payload.id);
//       if (idx >= 0) state.items[idx] = action.payload;
//     },

//     deleteTaskList(state, action: PayloadAction<string>) {
//       state.items = state.items.filter(tl => tl.id !== action.payload);
//     },

//     // Drag-drop reorder for task lists
//     reorderTaskLists(
//       state,
//       action: PayloadAction<{ projectId: string; orderedIds: string[] }>
//     ) {
//       const { projectId, orderedIds } = action.payload;
//       orderedIds.forEach((id, idx) => {
//         const tl = state.items.find(x => x.id === id && String(x.projectId) === String(projectId));
//         if (tl) tl.order = idx * 10;
//       });
//     },

//     setTaskLists(state, action: PayloadAction<TaskList[]>) {
//       state.items = action.payload;
//     },

//     clearTaskLists(state) {
//       state.items = [];
//     },
//   },
// });

// export const {
//   addTaskList, updateTaskList, deleteTaskList,
//   reorderTaskLists, setTaskLists, clearTaskLists,
// } = taskListsSlice.actions;

// export default taskListsSlice.reducer;



// store/slices/taskListsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── Normalized shape stored in Redux ─────────────────────────────────────────
// NOTE: DO NOT import TaskList from ProejctAndTask.ts here.
// That type is the API response shape. Redux uses this flat shape.
export interface ReduxTaskList {
  id: string;
  name: string;
  projectId: string;
  order: number;
  createdAt?: string;
}

interface TaskListsState {
  items: ReduxTaskList[];
}

const initialState: TaskListsState = { items: [] };

const taskListsSlice = createSlice({
  name: 'taskLists',
  initialState,
  reducers: {
    addTaskList(state, action: PayloadAction<ReduxTaskList>) {
      const maxOrder = state.items.length
        ? Math.max(...state.items.map(tl => tl.order ?? 0))
        : -1;
      state.items.push({ ...action.payload, order: maxOrder + 1 });
    },

    updateTaskList(state, action: PayloadAction<ReduxTaskList>) {
      const idx = state.items.findIndex(tl => tl.id === action.payload.id);
      if (idx >= 0) state.items[idx] = action.payload;
    },

    deleteTaskList(state, action: PayloadAction<string>) {
      state.items = state.items.filter(tl => tl.id !== action.payload);
    },

    reorderTaskLists(
      state,
      action: PayloadAction<{ projectId: string; orderedIds: string[] }>
    ) {
      const { projectId, orderedIds } = action.payload;
      orderedIds.forEach((id, idx) => {
        const tl = state.items.find(
          x => x.id === id && String(x.projectId) === String(projectId)
        );
        if (tl) tl.order = idx * 10;
      });
    },

    // Called after API fetch — replaces all lists for a project
    setTaskLists(state, action: PayloadAction<ReduxTaskList[]>) {
      // Keep lists from OTHER projects, replace lists from this project
      if (action.payload.length > 0) {
        const projectId = action.payload[0].projectId;
        state.items = [
          ...state.items.filter(tl => tl.projectId !== projectId),
          ...action.payload,
        ];
      } else {
        state.items = action.payload;
      }
    },

    clearTaskLists(state) {
      state.items = [];
    },
  },
});

export const {
  addTaskList,
  updateTaskList,
  deleteTaskList,
  reorderTaskLists,
  setTaskLists,
  clearTaskLists,
} = taskListsSlice.actions;

export default taskListsSlice.reducer;