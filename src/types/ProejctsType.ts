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

/** Singular alias — older modules (OwnerPicker, format, Team pages) import `User`. */
export type User = Users;

export type ProjectStatus = 'active' | 'on-hold' | 'in-progress' | 'delayed' | 'completed';
export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type SLAStatus = 'on-track' | 'at-risk' | 'breached';

/** A single owner assigned to a project. API returns an array of these under `owners`. */
export interface ProjectOwner {
  ownerId: string | number;
  ownerName: string;
}

export interface Project {
  data: any;
  id: string | number;
  projectId: string | number;
  projectTitle: string;

  /**
   * Multiple owners, as returned by the API, e.g.:
   * [{ ownerId: 3, ownerName: 'Nasir Rajput' }, { ownerId: 1, ownerName: 'piyush koley' }]
   */
  owners: ProjectOwner[];

  /**
   * @deprecated Back-compat single-owner fields, kept because some
   * older components (OwnerPicker, filters) still read a single owner.
   * These are derived from `owners[0]` at map-time — prefer `owners` for anything new.
   */
  ownerId?: string | number;
  ownerName?: string;

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