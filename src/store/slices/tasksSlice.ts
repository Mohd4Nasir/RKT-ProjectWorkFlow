// import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { Task } from '@/types/ProejctAndTask';
// import { mockTasks } from '@/services/mockData';

// interface TasksState { items: Task[]; }
// const initialState: TasksState = { items: mockTasks };

// // Helper: insert a task at a specific position within a taskList
// function insertAtPosition(
//   items: Task[],
//   newTask: Task,
//   insertAfterId: string | null | undefined
// ): Task[] {
//   // Get siblings (same taskListId + same parentTaskId)
//   const siblings = items
//     .filter(t =>
//       String(t.taskListId) === String(newTask.taskListId) &&
//       String(t.parentTaskId ?? '') === String(newTask.parentTaskId ?? '')
//     )
//     .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

//   const rest = items.filter(t =>
//     !(String(t.taskListId) === String(newTask.taskListId) &&
//       String(t.parentTaskId ?? '') === String(newTask.parentTaskId ?? ''))
//   );

//   if (!insertAfterId || insertAfterId === 'end') {
//     const maxOrder = siblings.length
//       ? Math.max(...siblings.map(t => t.order ?? 0))
//       : -1;
//     newTask = { ...newTask, order: maxOrder + 10 };
//     return [...rest, ...siblings, newTask];
//   }

//   if (insertAfterId === '') {
//     // Insert at beginning
//     const updated = siblings.map((t, i) => ({ ...t, order: (i + 1) * 10 }));
//     newTask = { ...newTask, order: 0 };
//     return [...rest, newTask, ...updated];
//   }

//   const afterIdx = siblings.findIndex(t => t.id === insertAfterId);
//   if (afterIdx < 0) {
//     const maxOrder = siblings.length ? Math.max(...siblings.map(t => t.order ?? 0)) : -1;
//     newTask = { ...newTask, order: maxOrder + 10 };
//     return [...rest, ...siblings, newTask];
//   }

//   const before = siblings[afterIdx];
//   const after = siblings[afterIdx + 1];
//   const newOrder = after
//     ? Math.floor(((before.order ?? 0) + (after.order ?? 0)) / 2)
//     : (before.order ?? 0) + 10;

//   newTask = { ...newTask, order: newOrder };
//   const newSiblings = [...siblings.slice(0, afterIdx + 1), newTask, ...siblings.slice(afterIdx + 1)];
//   // Re-normalize orders to avoid collisions
//   const normalized = newSiblings.map((t, i) => ({ ...t, order: i * 10 }));
//   return [...rest, ...normalized];
// }

// const slice = createSlice({
//   name: 'tasks',
//   initialState,
//   reducers: {
//  setTasks(state, action: PayloadAction<Task[]>) {
//       state.items = action.payload;
//     },



//     addTask(state, action: PayloadAction<Task & { insertAfterId?: string | null }>) {
//       const { insertAfterId, ...task } = action.payload;
//       state.items = insertAtPosition(state.items, task, insertAfterId);
//     },

//     updateTask(state, action: PayloadAction<Task>) {
//       const i = state.items.findIndex(t => t.id === action.payload.id);
//       if (i >= 0) state.items[i] = action.payload;
//     },

//     deleteTask(state, action: PayloadAction<string>) {
//       // Also delete all subtasks (recursive)
//       const toDelete = new Set<string>();
//       const collect = (id: string) => {
//         toDelete.add(id);
//         state.items.filter(t => String(t.parentTaskId) === id).forEach(t => collect(t.id));
//       };
//       collect(action.payload);
//       state.items = state.items.filter(t => !toDelete.has(t.id));
//     },

//     deleteTasksByTaskList(state, action: PayloadAction<string>) {
//       state.items = state.items.filter(
//         t => String(t.taskListId) !== String(action.payload)
//       );
//     },

//     // Drag-drop reorder
//     reorderTasks(
//       state,
//       action: PayloadAction<{ taskListId: string; parentTaskId: string | null; orderedIds: string[] }>
//     ) {
//       const { taskListId, parentTaskId, orderedIds } = action.payload;
//       orderedIds.forEach((id, idx) => {
//         const task = state.items.find(t => t.id === id);
//         if (task) task.order = idx * 10;
//       });
//     },

//     moveTask(state, action: PayloadAction<{ id: string; status: string }>) {
//       const t = state.items.find(x => x.id === action.payload.id);
//       if (t) t.status = action.payload.status as Task['status'];
//     },
//   },
// });

// export const {
//   addTask, updateTask, deleteTask,
//   deleteTasksByTaskList, reorderTasks, moveTask,
//   setTasks,
// } = slice.actions;

// export default slice.reducer;



// store/slices/tasksSlice.ts
// import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// export interface ReduxTask {
//   startDate: import("react/jsx-runtime").JSX.Element;
//   id: string;
//   taskListId: string;
//   projectId: string;
//   parentTaskId: string | null;
//   taskName: string;
//   title: string;
//   taskDescription?: string;
//   description?: string;
//   status: 'todo' | 'in-progress' | 'done';
//   priority?: 'low' | 'medium' | 'high' | 'critical';
//   taskStartDate?: string;
//   taskEndDate?: string;
//   dueDate?: string;
//   assigneeId?: string;
//   order: number;
//   createdAt?: string;
// }

// interface TasksState {
//   [x: string]: any[];
//   items: ReduxTask[];
// }

// const initialState: TasksState = { items: [] };

// // Recursively collect a task ID + all its descendants
// function collectDescendantIds(items: ReduxTask[], rootId: string): string[] {
//   const ids: string[] = [rootId];
//   const children = items.filter(t => t.parentTaskId === rootId);
//   children.forEach(child => {
//     ids.push(...collectDescendantIds(items, child.id));
//   });
//   return ids;
// }

// const tasksSlice = createSlice({
//   name: 'taskss',
//   initialState,
//   reducers: {
//     addTask(
//       state,
//       action: PayloadAction<ReduxTask & { insertAfterId?: string | null }>
//     ) {
//       const { insertAfterId, ...task } = action.payload;

//       // Find siblings (same list + same parent)
//       const siblings = state.items.filter(
//         t =>
//           t.taskListId === task.taskListId &&
//           t.parentTaskId === task.parentTaskId
//       );

//       if (!insertAfterId) {
//         // Insert at beginning — order = minOrder - 10
//         const minOrder = siblings.length
//           ? Math.min(...siblings.map(t => t.order))
//           : 0;
//         state.items.push({ ...task, order: minOrder - 10 });
//       } else {
//         // Insert after specific task
//         const afterTask = state.items.find(t => t.id === insertAfterId);
//         const afterOrder = afterTask?.order ?? 0;

//         // Find next sibling's order to interpolate
//         const nextSibling = siblings
//           .filter(t => t.order > afterOrder)
//           .sort((a, b) => a.order - b.order)[0];

//         const newOrder = nextSibling
//           ? (afterOrder + nextSibling.order) / 2
//           : afterOrder + 10;

//         state.items.push({ ...task, order: newOrder });
//       }
//     },

//     updateTask(state, action: PayloadAction<ReduxTask>) {
//       const idx = state.items.findIndex(t => t.id === action.payload.id);
//       if (idx >= 0) state.items[idx] = action.payload;
//     },

//     deleteTask(state, action: PayloadAction<string>) {
//       // Delete the task AND all its descendants (recursive)
//       const idsToDelete = collectDescendantIds(state.items, action.payload);
//       state.items = state.items.filter(t => !idsToDelete.includes(t.id));
//     },

//     deleteTasksByTaskList(state, action: PayloadAction<string>) {
//       state.items = state.items.filter(
//         t => t.taskListId !== action.payload
//       );
//     },

//     reorderTasks(
//       state,
//       action: PayloadAction<{
//         taskListId: string;
//         parentTaskId: string | null;
//         orderedIds: string[];
//       }>
//     ) {
//       const { orderedIds } = action.payload;
//       orderedIds.forEach((id, idx) => {
//         const task = state.items.find(t => t.id === id);
//         if (task) task.order = idx * 10;
//       });
//     },

//     // Replace tasks for a project after API fetch
//     setTasks(state, action: PayloadAction<ReduxTask[]>) {
//       if (action.payload.length > 0) {
//         const projectId = action.payload[0].projectId;
//         state.items = [
//           ...state.items.filter(t => t.projectId !== projectId),
//           ...action.payload,
//         ];
//       } else {
//         state.items = action.payload;
//       }
//     },

//     clearTasks(state) {
//       state.items = [];
//     },
//   },
// });

// export const {
//   addTask,
//   updateTask,
//   deleteTask,
//   deleteTasksByTaskList,
//   reorderTasks,
//   setTasks,
//   clearTasks,
// } = tasksSlice.actions;

// export default tasksSlice.reducer;