import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity as ActivityIcon, AlertCircle, Clock, Folder, Download, FileText, Loader2, MessageSquare,
  Paperclip, Pencil, Plus, RefreshCw, Trash2, Upload, UserPlus, CheckCircle2, ArrowRightLeft,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { projectApiService } from '@/services/projectsApiService';
import { CommentsTab } from './TaskComments';
import { WorklogsTab } from './WorklogsTab';
import { OwnerDocuments } from '@/components/OwnerDocuments';
import { IssuesPanel } from './IssuesPanel';
import { useSearchParams } from 'react-router-dom';
import { actorOf, activityTarget, describeActivity, moveNames, type ActivityTarget, type ActivityCategory, type ActivityIconKey, type ActivityRow, type ActivityTone } from '@/utils/activity';
import { useAppSelector } from '@/store';
import { showError } from '@/lib/errorAlert';

/**
 * Comments use the real task-comment-controller API, Log hours the task worklog API, Documents the file API and Issues the
 * task-issue-controller API. Activity uses the real GET /activities/task/{id} feed (paginated, by category).
 */

const ago = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : formatDistanceToNow(d, { addSuffix: true });
};

function Empty({ icon: Icon, text }: { icon: typeof FileText; text: string }) {
  return (
    <div className="py-10 text-center text-xs text-muted-foreground">
      <Icon className="h-6 w-6 mx-auto mb-2 opacity-40" />
      {text}
    </div>
  );
}

/* ───────────────────────── Documents ───────────────────────── */

function DocumentsTab({ taskId, onCount }: { taskId: number; onCount: (n: number) => void }) {
  // real object-store backed documents (also used for subtasks, which open in this same panel)
  return <OwnerDocuments ownerType="TASK" ownerId={taskId} className="space-y-4" onCount={onCount} />;
}

/* ───────────────────────── Issues ───────────────────────── */

function IssuesTab({ taskId, projectId, onCount, onTaskChanged, openIssueId, openIssueKey }: { taskId: number; projectId?: number; onCount: (n: number) => void; onTaskChanged?: () => void | Promise<void>; openIssueId?: number | null; openIssueKey?: number }) {
  // real task-issue-controller API; a subtask opens in this same panel, so it gets its own issues too
  return <IssuesPanel taskId={taskId} projectId={projectId} onCount={onCount} onTaskChanged={onTaskChanged} openIssueId={openIssueId} openIssueKey={openIssueKey} />;
}

/* ───────────────────────── Activity stream ───────────────────────── */

/**
 * GET /activities/task/{taskId}?category=&page=&size= — everything on this task (task, comments, issues, files),
 * newest first, paginated. `metadata` differs per activityType, so rendering lives in `describeActivity` (utils/activity).
 */
type StreamIcon = ActivityIconKey;
interface StreamItem {
  id: string;
  actor: string;
  verb: string;
  at: string;
  icon: StreamIcon;
  tone: ActivityTone;
  details?: { label: string; value: string }[];
  /** where a click leads (server rows only) */
  target?: ActivityTarget | null;
}

const TONE: Record<ActivityTone, string> = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-200',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200',
};

const EVENT_ICON: Record<StreamIcon, typeof FileText> = {
  folder: Folder, comment: MessageSquare, time: Clock, issue: AlertCircle, file: Paperclip, generic: ActivityIcon,
  created: Plus, updated: Pencil, done: CheckCircle2, removed: Trash2, member: UserPlus, move: ArrowRightLeft,
};

const FEED_TABS: { key: ActivityCategory | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'TASK', label: 'Task' },
  { key: 'COMMENT', label: 'Comments' },
  { key: 'ISSUE', label: 'Issues' },
  { key: 'ATTACHMENT', label: 'Files' },
  { key: 'WORKLOG', label: 'Work logs' },
];
const PAGE_SIZE = 10;

const dayLabelOf = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Earlier';
  const key = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (key(d) === key(new Date())) return 'Today';
  if (key(d) === key(y)) return 'Yesterday';
  return format(d, 'EEE, dd MMM yyyy');
};

function ActivityStream({ taskId, onOpen }: { taskId: number; projectId?: number; onOpen?: (t: ActivityTarget) => void }) {
  const lists = useAppSelector((s) => s.tasks.lists || []);
  const [category, setCategory] = useState<ActivityCategory | 'ALL'>('ALL');
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  // TASK_MOVED carries ids; resolve them from the board data we already have
  const names = useMemo(() => moveNames(lists, rows), [lists, rows]);

  // first page: whenever the task, tab or a manual refresh changes
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(false);
    setRows([]);
    setPage(0);
    projectApiService.taskActivities(taskId, { category: category === 'ALL' ? undefined : category, page: 0, size: PAGE_SIZE })
      .then((res) => {
        if (!live) return;
        setRows(res?.content ?? []);
        setHasNext(!!res?.hasNext);
        setTotal(res?.totalElements ?? res?.content?.length ?? 0);
      })
      .catch((err) => { if (live) { setError(true); showError(err, 'Failed to load activity'); } })
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [taskId, category, tick]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const res = await projectApiService.taskActivities(taskId, { category: category === 'ALL' ? undefined : category, page: page + 1, size: PAGE_SIZE });
      setRows((r) => [...r, ...(res?.content ?? [])]);
      setPage(res?.page ?? page + 1);
      setHasNext(!!res?.hasNext);
    } catch (err) {
      showError(err, 'Could not load more activity');
    } finally {
      setLoadingMore(false);
    }
  }, [taskId, category, page]);

  // load the next page when the marker at the bottom scrolls into view
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNext || loading || loadingMore || error) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) loadMore(); }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNext, loading, loadingMore, error, loadMore, rows.length]);

  const items = useMemo<StreamItem[]>(() => {
    const server: StreamItem[] = rows.map((a) => {
      const d = describeActivity(a, names);
      return { id: `s${a.id}`, at: a.createdAt, actor: actorOf(a as never) || 'Someone', verb: d.verb, icon: d.icon, tone: d.tone, details: d.details, target: ((t) => (t?.panel ? t : null))(activityTarget(a)) };
    });
    return server.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [rows, names]);

  const groups = useMemo(() => {
    const out: { label: string; rows: StreamItem[] }[] = [];
    items.forEach((it) => {
      const label = dayLabelOf(it.at);
      const last = out[out.length - 1];
      if (last?.label === label) last.rows.push(it); else out.push({ label, rows: [it] });
    });
    return out;
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" className="flex flex-wrap gap-1">
          {FEED_TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={category === t.key}
              onClick={() => setCategory(t.key)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                category === t.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">{total} {total === 1 ? 'event' : 'events'}</span>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setTick((n) => n + 1)} disabled={loading}>
            <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} /> Refresh
          </Button>
        </div>
      </div>

      {loading && !items.length ? (
        <div className="py-8 text-center text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Loading activity…</div>
      ) : error && !items.length ? (
        <div className="py-8 text-center text-xs text-destructive">
          Couldn’t load activity. <button onClick={() => setTick((n) => n + 1)} className="font-semibold underline">Retry</button>
        </div>
      ) : items.length === 0 ? <Empty icon={ActivityIcon} text="No activity yet." /> : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.label}>
              <h5 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {g.label} <span className="h-px flex-1 bg-border" />
              </h5>
              <ol className="relative ml-3.5 space-y-1 border-l-2 border-border/70">
                {g.rows.map((a) => {
                  const Icon = EVENT_ICON[a.icon] ?? ActivityIcon;
                  const d = new Date(a.at);
                  return (
                    <li
                      key={a.id}
                      role={a.target ? 'link' : undefined}
                      tabIndex={a.target ? 0 : undefined}
                      title={a.target ? 'Open' : undefined}
                      onClick={a.target ? () => onOpen?.(a.target!) : undefined}
                      onKeyDown={a.target ? (e) => { if (e.key === 'Enter') onOpen?.(a.target!); } : undefined}
                      className={cn('relative ml-6 rounded-md px-3 py-2 transition-colors hover:bg-muted/40', a.target && 'cursor-pointer')}
                    >
                      <span className={cn('absolute -left-[41px] top-2 grid h-7 w-7 place-items-center rounded-full ring-4 ring-card', TONE[a.tone])}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <p className="text-sm"><span className="font-semibold">{a.actor}</span> <span className="text-muted-foreground">{a.verb}</span></p>
                      {!!a.details?.length && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {a.details.map((x) => (
                            <span key={x.label + x.value} className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[11px]">
                              <span className="text-muted-foreground">{x.label}:</span> <span className="font-semibold">{x.value}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="mt-0.5 text-[11px] text-muted-foreground" title={isNaN(+d) ? '' : format(d, 'PPpp')}>
                        {isNaN(+d) ? '' : `${format(d, 'hh:mm a')} · ${ago(a.at)}`}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
          {/* infinite scroll: reaching this marker loads the next 10 */}
          {hasNext && (
            <div ref={sentinel} className="py-3 text-center text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" /> Loading more…
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Tabs shell ───────────────────────── */

type TabKey = 'comments' | 'hours' | 'documents' | 'issues' | 'activity';

const TABS: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: 'comments', label: 'Comments', icon: MessageSquare },
  { key: 'hours', label: 'Work Logs', icon: Clock },
  { key: 'documents', label: 'Documents', icon: Paperclip },
  { key: 'issues', label: 'Issues', icon: AlertCircle },
  { key: 'activity', label: 'Activity', icon: ActivityIcon },
];

export function TaskPanelTabs({ taskId, projectId, onTaskChanged, openIssueCount }: { taskId: number; projectId?: number; onTaskChanged?: () => void | Promise<void>; openIssueCount?: number | null }) {
  // deep link from the project's Activity tab: ?task=ID&panel=issues&issue=ID opens that tab and that issue
  const [searchParams, setSearchParams] = useSearchParams();
  const panelFromUrl = (): TabKey | null => {
    const p = searchParams.get('panel');
    return TABS.some((t) => t.key === p) ? (p as TabKey) : null;
  };
  const issueFromUrl = () => {
    const n = Number(searchParams.get('issue'));
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const [tab, setTab] = useState<TabKey>(() => panelFromUrl() ?? 'comments');
  // `k` changes on every click so the same issue can be opened again after it was closed
  const [openIssue, setOpenIssue] = useState<{ id: number; k: number } | null>(() => { const id = issueFromUrl(); return id ? { id, k: 0 } : null; });
  const [counts, setCounts] = useState<Partial<Record<TabKey, number>>>(() => ({
    documents: 0,
    // the Issues tab is not mounted until opened, so start from the board API's openIssueCount
    issues: openIssueCount ?? 0,
  }));
  useEffect(() => {
    setCounts((c) => (c.issues === (openIssueCount ?? 0) ? c : { ...c, issues: openIssueCount ?? 0 }));
  }, [taskId, openIssueCount]);
  useEffect(() => {
    const id = issueFromUrl();
    setTab(panelFromUrl() ?? 'comments');
    setOpenIssue(id ? { id, k: Date.now() } : null);
    // the params did their job, keep the URL clean (reload then simply shows the task)
    if (searchParams.has('panel') || searchParams.has('issue')) {
      setSearchParams((prev) => { const n = new URLSearchParams(prev); n.delete('panel'); n.delete('issue'); return n; }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  /** a row of this task's Activity tab was clicked */
  const openFromActivity = (t: ActivityTarget) => {
    if (!t.panel) return;
    setTab(t.panel);
    if (t.issue) setOpenIssue({ id: t.issue, k: Date.now() });
  };

  const setCount = (k: TabKey) => (n: number) => setCounts((c) => (c[k] === n ? c : { ...c, [k]: n }));
  const onComments = useCallback(setCount('comments'), []);
  const onHours = useCallback(setCount('hours'), []);
  const onDocs = useCallback(setCount('documents'), []);
  const onIssues = useCallback(setCount('issues'), []);

  return (
    <section className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <div role="tablist" className="flex items-center gap-1 px-2 border-b border-border bg-muted/40 overflow-x-auto scrollbar-thin">
        {TABS.map(({ key, label, icon: Icon }) => {
          const n = counts[key];
          const active = tab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={cn(
                'relative inline-flex items-center gap-2 whitespace-nowrap px-3.5 py-3 text-[13px] font-semibold transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" /> {label}
              {!!n && (
                <span className={cn(
                  'min-w-[20px] rounded-full px-1.5 py-px text-center text-[10px] font-bold tabular-nums',
                  active ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/15 text-foreground',
                )}>{n}</span>
              )}
              {active && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-primary" />}
            </button>
          );
        })}
      </div>

      <div className="p-5">
        {tab === 'comments' && <CommentsTab taskId={taskId} onCount={onComments} />}
        {tab === 'hours' && <WorklogsTab taskId={taskId} projectId={projectId} onCount={onHours} />}
        {tab === 'documents' && <DocumentsTab taskId={taskId} onCount={onDocs} />}
        {tab === 'issues' && <IssuesTab taskId={taskId} projectId={projectId} onCount={onIssues} onTaskChanged={onTaskChanged} openIssueId={openIssue?.id} openIssueKey={openIssue?.k} />}
        {tab === 'activity' && <ActivityStream taskId={taskId} projectId={projectId} onOpen={openFromActivity} />}
      </div>
    </section>
  );
}
