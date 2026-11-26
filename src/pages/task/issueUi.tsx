import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ban, Bug, CircleHelp, Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { taskService } from '@/services/taskservice';
import {
  IssueOption, IssueSeverity, IssueStatus, IssueType, issueService,
} from '@/services/issueService';

/** Colours, labels and small shared pieces for the issue screens (task panel + project tab). */

export const ISSUE_STATUSES: IssueStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'];
export const ISSUE_TYPES: IssueType[] = ['BUG', 'BLOCKER', 'IMPROVEMENT', 'QUERY'];
export const ISSUE_SEVERITIES: IssueSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const isIssueClosed = (s?: string) => s === 'RESOLVED' || s === 'CLOSED';

const title = (v: string) => v.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

interface Ui { chip: string; dot: string }

export const STATUS_UI: Record<IssueStatus, Ui> = {
  OPEN: { chip: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-400/30', dot: 'bg-blue-500' },
  IN_PROGRESS: { chip: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/30', dot: 'bg-amber-500' },
  RESOLVED: { chip: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/30', dot: 'bg-emerald-500' },
  CLOSED: { chip: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-200 dark:border-slate-400/30', dot: 'bg-slate-500' },
  REOPENED: { chip: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-400/30', dot: 'bg-rose-500' },
};

export const SEVERITY_UI: Record<IssueSeverity, Ui> = {
  LOW: { chip: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-200 dark:border-slate-400/30', dot: 'bg-slate-400' },
  MEDIUM: { chip: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-400/30', dot: 'bg-blue-500' },
  HIGH: { chip: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-400/30', dot: 'bg-orange-500' },
  CRITICAL: { chip: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-200 dark:border-red-400/30', dot: 'bg-red-500' },
};

export const TYPE_UI: Record<IssueType, Ui & { icon: typeof Bug; tile: string }> = {
  BUG: { icon: Bug, tile: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200', chip: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-400/30', dot: 'bg-rose-500' },
  BLOCKER: { icon: Ban, tile: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200', chip: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-200 dark:border-red-400/30', dot: 'bg-red-500' },
  IMPROVEMENT: { icon: Lightbulb, tile: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200', chip: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/30', dot: 'bg-emerald-500' },
  QUERY: { icon: CircleHelp, tile: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200', chip: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-200 dark:border-violet-400/30', dot: 'bg-violet-500' },
};

export const typeUi = (t?: string) => (t && t in TYPE_UI ? TYPE_UI[t as IssueType] : TYPE_UI.BUG);

export const INPUT_CLS =
  'w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20';
export const SELECT_CLS =
  'rounded-md border border-input bg-card px-2 py-1.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20';

/* ───────────────────────── display names from the server ───────────────────────── */

type Kind = 'status' | 'severity' | 'type';
const labelCache: Partial<Record<Kind, Record<string, string>>> = {};
let labelLoad: Promise<void> | null = null;

function loadLabels() {
  if (!labelLoad) {
    const put = (k: Kind) => (rows: IssueOption[]) => {
      labelCache[k] = Object.fromEntries(rows.map((r) => [r.value, r.displayName]));
    };
    labelLoad = Promise.all([
      issueService.statuses().then(put('status')),
      issueService.severities().then(put('severity')),
      issueService.types().then(put('type')),
    ]).then(() => undefined).catch(() => { labelLoad = null; });
  }
  return labelLoad;
}

/** `label('status', 'IN_PROGRESS')` -> the server's display name, or a title-cased fallback until/unless it loads */
export function useIssueLabels() {
  const [, bump] = useState(0);
  useEffect(() => {
    let live = true;
    loadLabels().then(() => live && bump((n) => n + 1));
    return () => { live = false; };
  }, []);
  return (kind: Kind, value?: string) => (value ? labelCache[kind]?.[value] || title(value) : '');
}

/* ───────────────────────── people who can be assigned ───────────────────────── */

export interface Assignable { id: number; name: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toAssignable = (u: any): Assignable | null => {
  const id = Number(u?.userId ?? u?.id);
  const name = u?.name ?? u?.userName ?? u?.fullName ?? u?.email;
  return Number.isFinite(id) && id > 0 && name ? { id, name: String(name) } : null;
};

/** the task's contributors (GET /task/{id}/task-member), de-duplicated. `_projectId` is kept for call-site compatibility. */
export function useAssignable(_projectId?: number | string, taskId?: number | string) {
  const [users, setUsers] = useState<Assignable[]>([]);
  useEffect(() => {
    let live = true;
    const jobs: Promise<unknown[]>[] = [];
    if (taskId) jobs.push(taskService.getTaskMembers(taskId).then((r: unknown) => (Array.isArray(r) ? r : [])).catch(() => []));
    Promise.all(jobs).then((lists) => {
      if (!live) return;
      const seen = new Map<number, Assignable>();
      lists.flat().forEach((u) => { const a = toAssignable(u); if (a && !seen.has(a.id)) seen.set(a.id, a); });
      setUsers([...seen.values()].sort((a, b) => a.name.localeCompare(b.name)));
    });
    return () => { live = false; };
  }, [taskId]);
  return users;
}

/* ───────────────────────── small pieces ───────────────────────── */

export function Pill({ ui, children, className }: { ui: Ui; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', ui.chip, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', ui.dot)} />
      {children}
    </span>
  );
}

/* ───────────────────────── modal shell ───────────────────────── */

// only the top-most modal reacts to Esc; none of them lets it through to the task panel underneath
const modalStack: symbol[] = [];

export function ModalShell({
  onClose, children, className,
}: { onClose: () => void; children: React.ReactNode; className?: string }) {
  useEffect(() => {
    const id = Symbol('issue-modal');
    modalStack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      if (modalStack[modalStack.length - 1] === id) onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      modalStack.splice(modalStack.indexOf(id), 1);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[300] grid place-items-center bg-black/60 p-3 sm:p-4 animate-fade-in"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" className={cn('flex max-h-[94vh] w-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl', className)}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ModalHeader({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <header className="relative flex shrink-0 items-center gap-3 px-5 py-3 text-white bg-[image:var(--gradient-hero)]">
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-primary via-info to-accent" />
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
      <button onClick={onClose} aria-label="Close" title="Close (Esc)" className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-white/70 hover:bg-white/15 hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </header>
  );
}
