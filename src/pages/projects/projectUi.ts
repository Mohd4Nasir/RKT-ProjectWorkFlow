import { Project } from '@/types/ProejctsType';

export const PROJECT_STATUS_UI: Record<string, { label: string; dot: string; badge: string }> = {
  OPEN: { label: 'Open', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-800 border-blue-300' },
  ON_HOLD: { label: 'On Hold', dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-800 border-orange-300' },
  DELAYED: { label: 'Delayed', dot: 'bg-red-500', badge: 'bg-red-50 text-red-800 border-red-300' },
  COMPLETED: { label: 'Completed', dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-800 border-violet-300' },
  CLOSED: { label: 'Closed', dot: 'bg-zinc-500', badge: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
};

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
  if (!p.endDate || p.projectStatus === 'COMPLETED' || p.projectStatus === 'CLOSED') return false;
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
