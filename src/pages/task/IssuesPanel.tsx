import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, MessageSquare, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';
import { Issue, issueService } from '@/services/issueService';
import { IssueFormModal, TaskOption } from './IssueFormModal';
import { IssueDetailModal } from './IssueDetailModal';
import { useMyProjectAccess } from '@/hooks/useMyProjectAccess';
import { issueAccess } from './issueAccess';
import {
  INPUT_CLS, ISSUE_SEVERITIES, ISSUE_STATUSES, ISSUE_TYPES, Pill, SELECT_CLS, SEVERITY_UI, STATUS_UI,
  isIssueClosed, typeUi, useIssueLabels,
} from './issueUi';
import { showError } from '@/lib/errorAlert';

interface Props {
  /** task or subtask → only its issues. Leave out to list the whole project's issues */
  taskId?: number;
  projectId?: number | string;
  /** tasks the person can pick when reporting from the project-wide view */
  tasks?: TaskOption[];
  /** number of still-open issues, for the tab badge */
  onCount?: (open: number) => void;
  /** raising/reopening an issue can move the task back to IN_PROGRESS, and open issues change openIssueCount → let the parent reload */
  onTaskChanged?: () => void | Promise<void>;
  /** open this issue's detail right away (deep link from the activity feed). `openIssueKey` changes to re-trigger the same id */
  openIssueId?: number | null;
  openIssueKey?: number;
}

const ago = (iso?: string) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(+d) ? formatDistanceToNow(d, { addSuffix: true }) : '';
};

const sortIssues = (list: Issue[]) =>
  [...list].sort((a, b) => Number(isIssueClosed(a.status)) - Number(isIssueClosed(b.status)) || +new Date(b.createdAt) - +new Date(a.createdAt));

export function IssuesPanel({ taskId, projectId, tasks, onCount, onTaskChanged, openIssueId, openIssueKey }: Props) {
  const projectWide = !taskId;
  const label = useIssueLabels();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [type, setType] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Issue | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const myAccess = useMyProjectAccess(projectId);
  const canRaise = !myAccess.role.includes('OBSERVER'); // observers can't raise issues

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(false);
    try {
      const rows = projectWide
        ? projectId ? await issueService.getByProject(projectId) : []
        : await issueService.getByTask(taskId!);
      setIssues(rows);
    } catch (err) {
      setError(true);
      showError(err, 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [projectWide, projectId, taskId]);

  // a different task (or project) was opened: forget the old filters and rows
  useEffect(() => {
    setIssues([]);
    setSearch(''); setStatus('all'); setSeverity('all'); setType('all');
    setOpenId(null);
    load();
  }, [load]);

  // declared after the reset above on purpose: it runs later in the same commit and wins
  useEffect(() => { if (openIssueId) setOpenId(openIssueId); }, [openIssueId, openIssueKey]);

  const open =useMemo(() => issues.filter((i) => !isIssueClosed(i.status)).length, [issues]);
  useEffect(() => { onCount?.(open); }, [open, onCount]);

  const stats = useMemo(() => ({
    open: issues.filter((i) => i.status === 'OPEN' || i.status === 'REOPENED').length,
    progress: issues.filter((i) => i.status === 'IN_PROGRESS').length,
    resolved: issues.filter((i) => isIssueClosed(i.status)).length,
    critical: issues.filter((i) => i.severity === 'CRITICAL' && !isIssueClosed(i.status)).length,
  }), [issues]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortIssues(issues).filter((i) =>
      (status === 'all' || i.status === status) &&
      (severity === 'all' || i.severity === severity) &&
      (type === 'all' || i.type === type) &&
      (!q || i.title.toLowerCase().includes(q) || (i.description ?? '').toLowerCase().includes(q) || `iss-${i.id}`.includes(q)),
    );
  }, [issues, search, status, severity, type]);
  const filtering = search || status !== 'all' || severity !== 'all' || type !== 'all';

  /** merge one changed issue into the list (null id = removed) */
  const patch = (id: number, next: Issue | null) =>
    setIssues((l) => (next ? l.map((i) => (i.id === id ? { ...i, ...next } : i)) : l.filter((i) => i.id !== id)));

  const remove = async (i: Issue) => {
    if (!window.confirm(`Delete issue "${i.title}"? This cannot be undone.`)) return;
    try {
      await issueService.remove(i.id);
      patch(i.id, null);
      toast.success('Issue deleted');
      onTaskChanged?.();
    } catch (err) {
      showError(err, 'Failed to delete issue');
    }
  };

  const tiles = [
    { label: 'Open', value: stats.open, tone: 'text-blue-700 bg-blue-500/10' },
    { label: 'In progress', value: stats.progress, tone: 'text-amber-700 bg-amber-500/10' },
    { label: 'Resolved / closed', value: stats.resolved, tone: 'text-emerald-700 bg-emerald-500/10' },
    { label: 'Critical open', value: stats.critical, tone: 'text-red-700 bg-red-500/10' },
  ];

  return (
    <div className="space-y-4">
      {/* summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-3">
            <span className={cn('grid h-9 w-9 place-items-center rounded-md', s.tone)}><AlertCircle className="h-4 w-4" /></span>
            <div className="min-w-0">
              <div className="text-lg font-bold leading-tight tabular-nums">{s.value}</div>
              <div className="truncate text-[11px] font-medium text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search issues…" className={cn(INPUT_CLS, '!py-1.5 pl-8 pr-7')} />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-muted-foreground" /></button>
          )}
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT_CLS} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {ISSUE_STATUSES.map((s) => <option key={s} value={s}>{label('status', s)}</option>)}
        </select>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={SELECT_CLS} aria-label="Filter by severity">
          <option value="all">All severities</option>
          {ISSUE_SEVERITIES.map((s) => <option key={s} value={s}>{label('severity', s)}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className={SELECT_CLS} aria-label="Filter by type">
          <option value="all">All types</option>
          {ISSUE_TYPES.map((t) => <option key={t} value={t}>{label('type', t)}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={() => load(true)} disabled={loading} title="Refresh">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
          {canRaise && (
            <Button size="sm" className="h-9" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Report issue
            </Button>
          )}
        </div>
      </div>

      {/* list */}
      {loading && !issues.length ? (
        <div className="py-12 text-center text-xs text-muted-foreground"><Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> Loading issues…</div>
      ) : error && !issues.length ? (
        <div className="py-12 text-center text-xs text-destructive">
          Couldn’t load issues. <button onClick={() => load()} className="font-semibold underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{filtering ? 'No issues match your filters' : 'No issues reported yet'}</p>
          {!filtering && canRaise && (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Report the first issue
            </Button>
          )}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((i) => {
            const tu = typeUi(i.type);
            const Icon = tu.icon;
            const done = isIssueClosed(i.status);
            const can = issueAccess(i, myAccess);
            return (
              <li
                key={i.id}
                onClick={() => setOpenId(i.id)}
                className="group flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <span className={cn('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg', tu.tile)}><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-muted-foreground">ISS-{i.id}</span>
                    <span className={cn('text-sm font-semibold', done && 'text-muted-foreground line-through')}>{i.title}</span>
                  </div>
                  {i.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{i.description}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Pill ui={SEVERITY_UI[i.severity]}>{label('severity', i.severity)}</Pill>
                    <Pill ui={STATUS_UI[i.status]}>{label('status', i.status)}</Pill>
                    <span className="text-[11px] text-muted-foreground">
                      {projectWide && i.taskTitle && <>on <span className="font-medium text-foreground/80">{i.taskTitle}</span> · </>}
                      {label('type', i.type)} · {i.reportedBy?.name ? `by ${i.reportedBy.name} · ` : ''}{ago(i.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {i.assignee?.name ? (
                    <UserAvatar name={i.assignee.name} size="sm" className="!ring-0" />
                  ) : (
                    <span className="rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground">Unassigned</span>
                  )}
                  <button onClick={() => setOpenId(i.id)} title="Open & discuss" className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
                  <span className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    {can.canEdit && <button onClick={() => setEditing(i)} title="Edit" className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>}
                    {can.canDelete && <button onClick={() => remove(i)} title="Delete" className="grid h-7 w-7 place-items-center rounded-md text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {formOpen && (
        <IssueFormModal
          taskId={taskId}
          tasks={tasks}
          projectId={projectId}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); load(true); onTaskChanged?.(); }}
        />
      )}
      {editing && (
        <IssueFormModal
          issue={editing}
          onClose={() => setEditing(null)}
          onSaved={(next) => { patch(editing.id, { ...editing, ...next }); setEditing(null); }}
        />
      )}
      {openId !== null && (
        <IssueDetailModal
          issueId={openId}
          projectId={projectId}
          onClose={() => setOpenId(null)}
          onChanged={(next) => { patch(openId, next); onTaskChanged?.(); }}
        />
      )}
    </div>
  );
}
