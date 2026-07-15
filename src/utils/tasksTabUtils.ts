// src/utils/tasksTabUtils.ts
export const mapStatusToApi = (status: string): string => {
  switch (status) {
    case 'in-progress': return 'IN_PROGRESS';
    case 'done': return 'DONE';
    default: return 'TODO';
  }
};

export const mapStatusFromApi = (status: string): string => {
  switch (status) {
    case 'IN_PROGRESS': return 'in-progress';
    case 'DONE': return 'done';
    default: return 'todo';
  }
};

export type ViewMode = 'table' | 'cards';