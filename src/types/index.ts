export type UserRole = 'admin' | 'user';

export interface Users {
  id: string;
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
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  endDate: string;
  members: string[]; // user ids
  ownerId: string;
  sla: SLAStatus;
  tag: string;
  color: string;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId: string;
  dueDate: string;
  createdAt: string;
  sla: SLAStatus;
  subtasks: Subtask[];
  comments: Comment[];
  attachments: { id: string; name: string; size: string; type: string }[];
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
