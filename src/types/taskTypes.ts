// types/taskTypes.ts

export interface SubTaskNode {
  taskId: number;
  taskTitle: string;
  taskDescription?: string;
  taskStatus: string;
  taskSequence: number;
  startDate?: string;
  endDate?: string;
  assigneeId?: string;
  createdBy?:string
  
  priority?: string;
  parentTaskId?: number | null;
  subTask?: SubTaskNode[]; 
}

export interface TaskNode extends SubTaskNode {
  listId: number;
  parentTaskId: number | null;
}

export interface TaskListNode {
  titleStatus: string;
  listId: number;
  listTitle: string;
  sequence: number;
  taskCount: number;
  tasks: TaskNode[];
}

export interface TaskState {
  projectId: string | null;
  lists: TaskListNode[];
  loading: boolean;
}
export interface CreateTaskListRequest {
  projectId: string | number;
  name: string;
}

export interface CreateTaskRequest {
  projectId: string | number;
  taskListId: string | number;
  parentTaskId?: string | number | null;
  taskName: string;
  taskDescription?: string;
  taskStartDate?: string;
  taskEndDate?: string;
  insertAfterId?: string | null;  // NEW — for position-based insert
}