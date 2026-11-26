import { Project } from '@/types/ProejctsType';

export const PROJECT_STATUS_UI: Record<string, { label: string; dot: string; badge: string }> = {
  OPEN: { label: 'Open', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-800 border-blue-300' },
  ON_HOLD: { label: 'On Hold', dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-800 border-orange-300' },
  DELAYED: { label: 'Delayed', dot: 'bg-red-500', badge: 'bg-red-50 text-red-800 border-red-300' },
  COMPLETED: { label: 'Completed', dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-800 border-violet-300' },
  CLOSED: { label: 'Closed', dot: 'bg-zinc-500', badge: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  ACTIVE: { label: 'Active', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  ON_TRACK: { label: 'On Track', dot: 'bg-teal-500', badge: 'bg-teal-50 text-teal-800 border-teal-300' },
  IN_TESTING: { label: 'In Testing', dot: 'bg-cyan-500', badge: 'bg-cyan-50 text-cyan-800 border-cyan-300' },
  APPROVED: { label: 'Approved', dot: 'bg-lime-500', badge: 'bg-lime-50 text-lime-800 border-lime-300' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-800 border-rose-300' },
  PLANNING: { label: 'Planning', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-800 border-amber-300' },
  INVOICED: { label: 'Invoiced', dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
};

/** Statuses the backend supports — used by the filter and the status dropdown. */
export const PROJECT_STATUS_VALUES = [
  'ACTIVE', 'IN_PROGRESS', 'ON_TRACK', 'DELAYED', 'IN_TESTING', 'ON_HOLD',
  'APPROVED', 'CANCELLED', 'PLANNING', 'COMPLETED', 'INVOICED',
] as const;

export const PROJECT_STATUS_OPTIONS = PROJECT_STATUS_VALUES.map((v) => ({ label: PROJECT_STATUS_UI[v].label, value: v }));

/** Statuses after which a project can no longer be "overdue". */
export const FINISHED_PROJECT_STATUSES = ['COMPLETED', 'CLOSED', 'CANCELLED', 'INVOICED'];

export function statusUi(status?: string) {
  return (
    PROJECT_STATUS_UI[(status || '').toUpperCase()] ?? {
      label: status || 'Unknown',
      dot: 'bg-muted-foreground',
      badge: 'bg-muted text-muted-foreground border-border',
    }
  );
}

export function projectProgress(p: Pick<Project, 'totalTask' | 'completedTask'>): number {
  const total = Number(p.totalTask ?? 0);
  return total ? Math.round((Number(p.completedTask ?? 0) / total) * 100) : 0;
}

export function isProjectOverdue(p: Pick<Project, 'endDate' | 'projectStatus'>): boolean {
  if (!p.endDate || FINISHED_PROJECT_STATUSES.includes(p.projectStatus)) return false;
  const end = new Date(p.endDate);
  end.setHours(23, 59, 59, 999);
  return end.getTime() < Date.now();
}

export function fmtDate(d?: string): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
