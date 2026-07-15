import { ReactNode } from "react";
import { ApiResponse } from "./api";

export type UserRole = 'admin' | 'user';

export interface Users {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  status: 'active' | 'inactive';
  joinedAt: string;
}

export type ProjectStatus = 'active' | 'on-hold' | 'in-progress' | 'delayed' | 'completed';
export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type SLAStatus = 'on-track' | 'at-risk' | 'breached';

export interface Project {
  data: any;
  id: string | number;
  projectId: string | number;
  projectTitle: string;
  ownerId: string | number;
  ownerName: string;
  projectStatus: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'| 'ON_HOLD' | 'DELAYED';
  description?: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  totalTask?: number;
  completedTask?: number;
  members?: string[];
  tag?: string;
  color?: string;
}
//======================================
export interface TaskList {
  listId: number;

  listTitle: string;

  sequence: number;

  tasks: Task[];
}

export interface Task {
  projectId?: string | number;
  id: string | number;
  priority: string;
  taskDescription: string;
  status: "in-progress" | "done" | "todo";
  assigneeId: string;
  taskId: number;
  listId: number;
  parentTaskId: number | string ;
  taskTitle: string;
  taskStatus: 'TODO' | 'IN_PROGRESS' | 'DONE';
  taskSequence: number;
  startDate?: string;
  endDate?: string;
  subTask: SubTask[];
}

export interface SubTask {
  priority: string;
  assigneeId: string;
  taskDescription: string;
  taskId: number;
  parentTaskId: number;

  taskTitle: string;
  taskStatus: 'TODO' | 'IN_PROGRESS' | 'DONE';

  taskSequence: number;

  startDate?: string;
  endDate?: string;
}
export type ProjectsResponse = ApiResponse<{
  projects: Project[];
}>;
// Add this type definition after your imports
 export interface PublicProject {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'in-progress' | 'on-hold' | 'delayed' | 'completed';
  ownerId: string;
  access: 'public' | 'restricted' | 'private';
  createdAt: string;
  joined?: boolean;
  members?: string[];
  tags?: string[];
  stars?: number;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}





export interface Notification {
  id: string;
  type: 'assigned' | 'deadline' | 'status' | 'mention';
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  link?: string;
}

export interface ActivityItem {
  id: string;
  userId: string;
  action: string;
  target: string;
  createdAt: string;
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