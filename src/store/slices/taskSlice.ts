// // store/slices/projectSlice.ts
// import { SubTaskNode, TaskListNode,  TaskNode, TaskState } from '@/types/taskTypes';
// import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// const initialState: TaskState = {
//   projectId: null,
//   lists: [],
//   loading: false,
// };

// // ── Recursive helpers — tree ke andar kisi bhi depth pe kaam karte hain ──
// function findTaskInTree(nodes: SubTaskNode[], taskId: number): SubTaskNode | null {
//   for (const n of nodes) {
//     if (n.taskId === taskId) return n;
//     if (n.subTask?.length) {
//       const found = findTaskInTree(n.subTask, taskId);
//       if (found) return found;
//     }
//   }
//   return null;
// }

// function deleteTaskFromTree(nodes: SubTaskNode[], taskId: number): boolean {
//   const idx = nodes.findIndex(n => n.taskId === taskId);
//   if (idx !== -1) {
//     nodes.splice(idx, 1);
//     return true;
//   }
//   for (const n of nodes) {
//     if (n.subTask?.length && deleteTaskFromTree(n.subTask, taskId)) return true;
//   }
//   return false;
// }

// function reorderInTree(nodes: SubTaskNode[], parentTaskId: number, orderedIds: number[]): boolean {
//   for (const n of nodes) {
//     if (n.taskId === parentTaskId && n.subTask) {
//       n.subTask.sort((a, b) => orderedIds.indexOf(a.taskId) - orderedIds.indexOf(b.taskId));
//       n.subTask.forEach((t, i) => (t.taskSequence = (i + 1) * 1000));
//       return true;
//     }
//     if (n.subTask?.length && reorderInTree(n.subTask, parentTaskId, orderedIds)) return true;
//   }
//   return false;
// }

// const taskSlice = createSlice({
//   name: 'tasks',
//   initialState,
//   reducers: {
//     setLoading(state, action: PayloadAction<boolean>) {
//       state.loading = action.payload;
//     },

//     // 🔥 MAIN ACTION — API response seedha as-is set ho jaata hai, koi flatten nahi
//     setProjectData(
//       state,
//       action: PayloadAction<{ projectId: string; lists: TaskListNode[] }>
//     ) {
//       state.projectId = action.payload.projectId;
//       state.lists = action.payload.lists;
//     },

//     // ── Lists ──
//     addTaskList(state, action: PayloadAction<TaskListNode>) {
//       state.lists.push(action.payload);
//     },

//     updateTaskListInfo(
//       state,
//       action: PayloadAction<{ listId: number; listTitle?: string; sequence?: number }>
//     ) {
//       const list = state.lists.find(l => l.listId === action.payload.listId);
//       if (list) {
//         if (action.payload.listTitle !== undefined) list.listTitle = action.payload.listTitle;
//         if (action.payload.sequence !== undefined) list.sequence = action.payload.sequence;
//       }
//     },

//     deleteTaskListById(state, action: PayloadAction<number>) {
//       state.lists = state.lists.filter(l => l.listId !== action.payload);
//     },

//     reorderTaskListsInTree(state, action: PayloadAction<number[]>) {
//       const orderedIds = action.payload;
//       state.lists.sort((a, b) => orderedIds.indexOf(a.listId) - orderedIds.indexOf(b.listId));
//       state.lists.forEach((l, i) => (l.sequence = (i + 1) * 1000));
//     },

//     // ── Tasks (root ya nested — kahin bhi ho, tree mein hi update hota hai) ──
//     addTaskToTree(
//       state,
//       action: PayloadAction<{ listId: number; parentTaskId: number | null; task: TaskNode }>
//     ) {
//       const { listId, parentTaskId, task } = action.payload;
//       const list = state.lists.find(l => l.listId === listId);
//       if (!list) return;

//       if (parentTaskId === null) {
//         list.tasks.push(task);
//       } else {
//         const parent = findTaskInTree(list.tasks, parentTaskId);
//         if (parent) {
//           if (!parent.subTask) parent.subTask = [];
//           parent.subTask.push(task);
//         }
//       }
//     },

//     updateTaskInTree(
//       state,
//       action: PayloadAction<{ listId: number; taskId: number; changes: Partial<SubTaskNode> }>
//     ) {
//       const { listId, taskId, changes } = action.payload;
//       const list = state.lists.find(l => l.listId === listId);
//       if (!list) return;
//       const node = findTaskInTree(list.tasks, taskId);
//       if (node) Object.assign(node, changes);
//     },

//     deleteTaskFromTreeById(state, action: PayloadAction<{ listId: number; taskId: number }>) {
//       const { listId, taskId } = action.payload;
//       const list = state.lists.find(l => l.listId === listId);
//       if (!list) return;
//       deleteTaskFromTree(list.tasks, taskId);
//     },

//     reorderTasksInTree(
//       state,
//       action: PayloadAction<{ listId: number; parentTaskId: number | null; orderedIds: number[] }>
//     ) {
//       const { listId, parentTaskId, orderedIds } = action.payload;
//       const list = state.lists.find(l => l.listId === listId);
//       if (!list) return;

//       if (parentTaskId === null) {
//         list.tasks.sort((a, b) => orderedIds.indexOf(a.taskId) - orderedIds.indexOf(b.taskId));
//         list.tasks.forEach((t, i) => (t.taskSequence = (i + 1) * 1000));
//       } else {
//         reorderInTree(list.tasks, parentTaskId, orderedIds);
//       }
//     },

//     clearProjectData(state) {
//       state.projectId = null;
//       state.lists = [];
//     },
//   },
// });

// export const {
//   setLoading,
//   setProjectData,
//   addTaskList,
//   updateTaskListInfo,
//   deleteTaskListById,
//   reorderTaskListsInTree,
//   addTaskToTree,
//   updateTaskInTree,
//   deleteTaskFromTreeById,
//   reorderTasksInTree,
//   clearProjectData,
// } = taskSlice.actions;

// export default taskSlice.reducer;









// ===================================================================================================================================================================



// store/slices/taskSlice.ts
import { SubTaskNode, TaskListNode, TaskNode, TaskState } from '@/types/taskTypes';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState: TaskState = {
  projectId: null,
  lists: [],
  loading: false,
};

// ── Recursive tree helpers ──────────────────────────────────────────────
function findInNodes(nodes: SubTaskNode[], taskId: number): SubTaskNode | null {
  for (const n of nodes) {
    if (n.taskId === taskId) return n;
    if (n.subTask?.length) {
      const found = findInNodes(n.subTask, taskId);
      if (found) return found;
    }
  }
  return null;
}

function findTaskAcrossLists(lists: TaskListNode[], taskId: number): SubTaskNode | null {
  for (const list of lists) {
    const found = findInNodes(list.tasks, taskId);
    if (found) return found;
  }
  return null;
}

function deleteFromNodes(nodes: SubTaskNode[], taskId: number): boolean {
  const idx = nodes.findIndex(n => n.taskId === taskId);
  if (idx !== -1) {
    nodes.splice(idx, 1);
    return true;
  }
  for (const n of nodes) {
    if (n.subTask?.length && deleteFromNodes(n.subTask, taskId)) return true;
  }
  return false;
}

function reorderChildrenInTree(nodes: SubTaskNode[], parentTaskId: number, orderedIds: number[]): boolean {
  for (const n of nodes) {
    if (n.taskId === parentTaskId && n.subTask) {
      n.subTask.sort((a, b) => orderedIds.indexOf(a.taskId) - orderedIds.indexOf(b.taskId));
      n.subTask.forEach((t, i) => (t.taskSequence = (i + 1) * 1000));
      return true;
    }
    if (n.subTask?.length && reorderChildrenInTree(n.subTask, parentTaskId, orderedIds)) return true;
  }
  return false;
}

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    // 🔥 API response seedha as-is set — koi flatten/transform nahi
    setProjectData(state, action: PayloadAction<{ projectId: string; lists: TaskListNode[] }>) {
      state.projectId = action.payload.projectId;
      state.lists = action.payload.lists;
    },

    // ── Lists ──
    addTaskList(state, action: PayloadAction<TaskListNode>) {
      state.lists.push(action.payload);
    },

    // Poora TaskListNode object leta hai, sirf title+sequence merge karta hai (tasks array untouched)
    updateTaskList(state, action: PayloadAction<TaskListNode>) {
      const list = state.lists.find(l => l.listId === action.payload.listId);
      if (list) {
        list.listTitle = action.payload.listTitle;
        list.sequence = action.payload.sequence;
      }
    },

    deleteTaskList(state, action: PayloadAction<string | number>) {
      const listId = Number(action.payload);
      state.lists = state.lists.filter(l => l.listId !== listId);
    },

    reorderTaskLists(
      state,
      action: PayloadAction<{ projectId: string; orderedIds: string[] }>
    ) {
      const orderedIds = action.payload.orderedIds.map(Number);
      state.lists.sort((a, b) => orderedIds.indexOf(a.listId) - orderedIds.indexOf(b.listId));
      state.lists.forEach((l, i) => (l.sequence = (i + 1) * 1000));
    },

    // ── Tasks (root ya nested — dono handle) ──
    addTask(
      state,
      action: PayloadAction<{ listId: number; parentTaskId: number | null; task: TaskNode }>
    ) {
      const { listId, parentTaskId, task } = action.payload;
      const list = state.lists.find(l => l.listId === listId);
      if (!list) return;

      if (parentTaskId === null) {
        list.tasks.push(task);
      } else {
        const parent = findInNodes(list.tasks, parentTaskId);
        if (parent) {
          if (!parent.subTask) parent.subTask = [];
          parent.subTask.push(task);
        }
      }
    },

    // Poora task object leta hai (taskId zaroori), tree mein dhoond ke merge karta hai
    updateTask(state, action: PayloadAction<Partial<TaskNode> & { taskId: number }>) {
      const node = findTaskAcrossLists(state.lists, action.payload.taskId);
      if (node) {
        const { subTask, ...changes } = action.payload;
        Object.assign(node, changes);
        if (subTask !== undefined) node.subTask = subTask;
      }
    },

    deleteTask(state, action: PayloadAction<string | number>) {
      const taskId = Number(action.payload);
      for (const list of state.lists) {
        if (deleteFromNodes(list.tasks, taskId)) break;
      }
    },

    reorderTasks(
      state,
      action: PayloadAction<{
        taskListId: string | number;
        parentTaskId: string | number | null;
        orderedIds: (string | number)[];
      }>
    ) {
      const listId = Number(action.payload.taskListId);
      const parentTaskId = action.payload.parentTaskId ? Number(action.payload.parentTaskId) : null;
      const orderedIds = action.payload.orderedIds.map(Number);

      const list = state.lists.find(l => l.listId === listId);
      if (!list) return;

      if (parentTaskId === null) {
        list.tasks.sort((a, b) => orderedIds.indexOf(a.taskId) - orderedIds.indexOf(b.taskId));
        list.tasks.forEach((t, i) => (t.taskSequence = (i + 1) * 1000));
      } else {
        reorderChildrenInTree(list.tasks, parentTaskId, orderedIds);
      }
    },

    clearProjectData(state) {
      state.projectId = null;
      state.lists = [];
    },
  },
});

export const {
  setLoading,
  setProjectData,
  addTaskList,
  updateTaskList,
  deleteTaskList,
  reorderTaskLists,
  addTask,
  updateTask,
  deleteTask,
  reorderTasks,
  clearProjectData,
} = taskSlice.actions;

export default taskSlice.reducer;