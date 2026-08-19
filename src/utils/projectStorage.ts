// ==========================================
// utils/projectStorage.ts
// ==========================================

import { Project } from "@/types/ProejctsType";

export const saveProjectToStorage = (project: Project) => {
  try {
    sessionStorage.setItem('currentProject', JSON.stringify(project));
    sessionStorage.setItem('currentProjectId', String(project.projectId));
    sessionStorage.setItem('projectExpiry', String(Date.now() + 10 * 60 * 1000)); // 10 min expiry
  } catch (error) {
    console.error('Failed to save project:', error);
  }
};

export const getProjectFromStorage = (projectId?: string) => {
  try {
    const storedProject = sessionStorage.getItem('currentProject');
    const storedId = sessionStorage.getItem('currentProjectId');
    const expiry = sessionStorage.getItem('projectExpiry');
    
    // ✅ Check expiry (10 min)
    if (expiry && Date.now() > parseInt(expiry)) {
      clearProjectStorage();
      return null;
    }
    
    if (storedProject && (!projectId || storedId === projectId)) {
      return JSON.parse(storedProject);
    }
    return null;
  } catch (error) {
    console.error('Failed to get project:', error);
    return null;
  }
};

export const clearProjectStorage = () => {
  sessionStorage.removeItem('currentProject');
  sessionStorage.removeItem('currentProjectId');
  sessionStorage.removeItem('projectExpiry');
};