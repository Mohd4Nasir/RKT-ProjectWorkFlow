// src/utils/tasksTabUtils.ts
export const mapStatusToApi = (status: string): string => {
  switch (status) {
    case 'in-progress': return 'IN_PROGRESS';
    case 'done': return 'COMPLETED';
    default: return 'TODO';
  }
};

export const mapStatusFromApi = (status: string): string => {
  switch (status) {
    case 'IN_PROGRESS':
    case 'IN_REVIEW':
    case 'TO_BE_TESTED': return 'in-progress';
    case 'DONE':
    case 'COMPLETED':
    case 'CLOSED': return 'done';
    default: return 'todo';
  }
};

export type ViewMode = 'table' | 'board' | 'cards';
