import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity as ActivityIcon, AlertCircle, Clock, Download, FileText, Loader2, MessageSquare,
  Paperclip, Pencil, Plus, RefreshCw, Trash2, Upload, UserPlus, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Wip } from '@/components/Wip';
import { getParsedToken } from '@/services/keycloakService';
import { projectApiService } from '@/services/projectsApiService';
import { CommentsTab } from './TaskComments';
import { OwnerDocuments } from '@/components/OwnerDocuments';

/**
 * Comments use the real task-comment-controller API. TODO(backend): time logs, documents and issues have no endpoints yet, so they are
 * persisted per task in localStorage through `extrasStore` below. Replace the body of
 * `read` / `write` (or each tab's handlers) with API calls once the endpoints exist.
 * Activity uses the real GET /activities/project/{id} feed, filtered to this task.
 */

/* ───────────────────────── Store ───────────────────────── */

type Kind = 'comments' | 'timelogs' | 'documents' | 'issues' | 'events';
const keyOf = (kind: Kind, taskId: number | string) => `rkt.task.${taskId}.${kind}`;

const extrasStore = {
  read<T>(kind: Kind, taskId: number | string): T[] {
    try {
      return JSON.parse(localStorage.getItem(keyOf(kind, taskId)) || '[]');
    } catch {
      return [];
    }
  },
  write<T>(kind: Kind, taskId: number | string, rows: T[]): boolean {
    try {
      localStorage.setItem(keyOf(kind, taskId), JSON.stringify(rows));
      return true;
    } catch {
      return false; // quota
    }
  },
};

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const me = () => {
  const p = getParsedToken();
  return p?.name || p?.preferred_username || 'You';
};

const initials = (n: string) =>
  n.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('') || '?';

function useRows<T extends { id: string }>(kind: Kind, taskId: number | string) {
  const [rows, setRows] = useState<T[]>(() => extrasStore.read<T>(kind, taskId));
  useEffect(() => { setRows(extrasStore.read<T>(kind, taskId)); }, [kind, taskId]);
  const commit = useCallback((next: T[]) => {
    if (!extrasStore.write(kind, taskId, next)) {
      toast.error('Storage full — could not save');
      return false;
    }
    setRows(next);
    return true;
  }, [kind, taskId]);
  return [rows, commit] as const;
}

/** logs a local activity event so Comments / Hours / Docs / Issues show up in the stream */
function pushEvent(taskId: number | string, text: string, icon: EventIcon) {
  const rows = extrasStore.read<TaskEvent>('events', taskId);
  extrasStore.write('events', taskId, [{ id: uid(), text, icon, actor: me(), at: new Date().toISOString() }, ...rows].slice(0, 200));
}

/* ───────────────────────── Types ───────────────────────── */

type EventIcon = 'comment' | 'time' | 'doc' | 'issue';
interface TaskEvent { id: string; text: string; icon: EventIcon; actor: string; at: string }
interface TimeLog { id: string; author: string; date: string; hours: number; note: string }
interface Doc { id: string; name: string; size: number; type: string; by: string; at: string; data: string }
interface Issue { id: string; title: string; severity: Severity; state: 'open' | 'resolved'; by: string; at: string }
type Severity = 'low' | 'medium' | 'high' | 'critical';

const SEVERITY: Record<Severity, string> = {
  low: 'bg-slate-100 text-slate-700 border-slate-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`);
const ago = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : formatDistanceToNow(d, { addSuffix: true });
};

function Avatar({ name, small }: { name: string; small?: boolean }) {
  return (
    <span className={cn('shrink-0 grid place-items-center rounded-full bg-primary/10 text-primary font-bold', small ? 'h-6 w-6 text-[9px]' : 'h-8 w-8 text-[11px]')}>
      {initials(name)}
    </span>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof FileText; text: string }) {
  return (
    <div className="py-10 text-center text-xs text-muted-foreground">
      <Icon className="h-6 w-6 mx-auto mb-2 opacity-40" />
      {text}
    </div>
  );
}

/* ───────────────────────── Log hours ───────────────────────── */

function HoursTab({ taskId, onCount }: { taskId: number; onCount: (n: number) => void }) {
  const [rows, commit] = useRows<TimeLog>('timelogs', taskId);
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => onCount(rows.length), [rows.length, onCount]);

  const total = useMemo(() => rows.reduce((s, r) => s + r.hours, 0), [rows]);
  const h = parseFloat(hours);
  const valid = !isNaN(h) && h > 0 && h <= 24 && !!date;

  const add = () => {
    if (!valid) return;
    const row: TimeLog = { id: uid(), author: me(), date, hours: Math.round(h * 100) / 100, note: note.trim() };
    if (commit([row, ...rows])) {
      pushEvent(taskId, `logged ${row.hours}h`, 'time');
      setHours('');
      setNote('');
    }
  };

  const fmtH = (n: number) => `${n.toFixed(2).replace(/\.?0+$/, '') || '0'}h`;
  const weekStart = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return format(d, 'yyyy-MM-dd');
  }, []);
  const week = useMemo(() => rows.filter((r) => r.date >= weekStart).reduce((s, r) => s + r.hours, 0), [rows, weekStart]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total logged', value: fmtH(total), tone: 'text-primary bg-primary/10' },
          { label: 'This week', value: fmtH(week), tone: 'text-emerald-700 bg-emerald-500/10' },
          { label: 'Entries', value: String(rows.length), tone: 'text-amber-700 bg-amber-500/10' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-3">
            <span className={cn('h-9 w-9 grid place-items-center rounded-md', s.tone)}><Clock className="h-4 w-4" /></span>
            <div className="min-w-0">
              <div className="text-lg font-bold leading-tight tabular-nums">{s.value}</div>
              <div className="text-[11px] font-medium text-muted-foreground truncate">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-[150px_100px_1fr_auto] gap-2 items-end rounded-lg border border-border bg-muted/30 p-3">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Date
          <input type="date" value={date} max={format(new Date(), 'yyyy-MM-dd')} onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm font-normal normal-case text-foreground" />
        </label>
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Hours
          <input type="number" min="0" max="24" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="1.5"
            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm font-normal text-foreground" />
        </label>
        <label className="col-span-2 sm:col-span-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          What did you work on?
          <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Optional note"
            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm font-normal normal-case text-foreground" />
        </label>
        <Button size="sm" onClick={add} disabled={!valid} className="col-span-2 sm:col-span-1 h-9">
          <Plus className="h-4 w-4 mr-1" /> Log
        </Button>
      </div>

      {rows.length === 0 ? <Empty icon={Clock} text="No time logged yet." /> : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-3 py-2">Date</th>
                <th className="text-left font-semibold px-3 py-2">User</th>
                <th className="text-left font-semibold px-3 py-2">Note</th>
                <th className="text-right font-semibold px-3 py-2">Hours</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {[...rows].sort((a, b) => b.date.localeCompare(a.date)).map((r) => (
                <tr key={r.id} className="group border-t border-border/60 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 whitespace-nowrap">{format(new Date(r.date + 'T00:00:00'), 'dd MMM yyyy')}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2"><Avatar name={r.author} small />{r.author}</span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{r.note || '—'}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold tabular-nums text-primary">{r.hours}h</span>
                  </td>
                  <td className="pr-2">
                    <button onClick={() => commit(rows.filter((x) => x.id !== r.id))}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" title="Delete entry">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Documents ───────────────────────── */

function DocumentsTab({ taskId, onCount }: { taskId: number; onCount: (n: number) => void }) {
  // real object-store backed documents (also used for subtasks, which open in this same panel)
  return <OwnerDocuments ownerType="TASK" ownerId={taskId} className="space-y-4" onCount={onCount} />;
}

/* ───────────────────────── Issues ───────────────────────── */

function IssuesTab({ taskId, onCount }: { taskId: number; onCount: (n: number) => void }) {
  const [rows, commit] = useRows<Issue>('issues', taskId);
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const open = rows.filter((r) => r.state === 'open').length;
  useEffect(() => onCount(open), [open, onCount]);

  const add = () => {
    const v = title.trim();
    if (!v) return;
    if (commit([{ id: uid(), title: v, severity, state: 'open', by: me(), at: new Date().toISOString() }, ...rows])) {
      pushEvent(taskId, `reported issue “${v}”`, 'issue');
      setTitle('');
    }
  };

  const toggle = (i: Issue) => {
    const state = i.state === 'open' ? 'resolved' : 'open';
    if (commit(rows.map((r) => (r.id === i.id ? { ...r, state } : r)))) {
      pushEvent(taskId, `${state === 'resolved' ? 'resolved' : 'reopened'} issue “${i.title}”`, 'issue');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Describe the issue…"
          className="flex-1 min-w-[200px] rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20" />
        <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}
          className="rounded-md border border-input bg-card px-2 py-2 text-sm capitalize">
          {(Object.keys(SEVERITY) as Severity[]).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Button size="sm" className="h-9" onClick={add} disabled={!title.trim()}><Plus className="h-4 w-4 mr-1" /> Report</Button>
      </div>

      {rows.length === 0 ? <Empty icon={AlertCircle} text="No issues reported." /> : (
        <ul className="rounded-lg border border-border bg-card divide-y divide-border/60 overflow-hidden">
          {rows.map((i) => (
            <li key={i.id} className="group flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors">
              <input type="checkbox" checked={i.state === 'resolved'} onChange={() => toggle(i)} className="h-4 w-4 accent-emerald-600" title="Mark resolved" />
              <div className="flex-1 min-w-0">
                <div className={cn('truncate text-sm font-medium', i.state === 'resolved' && 'line-through text-muted-foreground')}>{i.title}</div>
                <div className="text-[11px] text-muted-foreground">{i.by} · {ago(i.at)}</div>
              </div>
              <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize', SEVERITY[i.severity])}>{i.severity}</span>
              <button onClick={() => commit(rows.filter((r) => r.id !== i.id))}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" title="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ───────────────────────── Activity stream ───────────────────────── */

/**
 * GET /activities/project/{projectId} → [{ id, projectId, activityType, resourceType, createdAt, metadata }].
 * `metadata` differs per activityType (taskId, taskName, createdByUserName, memberName, ...), so everything is read defensively.
 * The feed is per project; only rows that carry this task's id are kept.
 */
interface ServerActivity {
  id: number;
  projectId?: number;
  activityType?: string;
  resourceType?: string;
  resourceId?: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

type Tone = 'blue' | 'violet' | 'emerald' | 'amber' | 'teal' | 'rose' | 'slate';
type StreamIcon = EventIcon | 'server' | 'created' | 'updated' | 'done' | 'removed' | 'member';
interface StreamItem {
  id: string;
  actor: string;
  verb: string;
  at: string;
  icon: StreamIcon;
  tone: Tone;
  details?: { label: string; value: string }[];
}

const TONE: Record<Tone, string> = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-200',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200',
};

const EVENT_ICON: Record<StreamIcon, typeof FileText> = {
  comment: MessageSquare, time: Clock, doc: Paperclip, issue: AlertCircle, server: ActivityIcon,
  created: Plus, updated: Pencil, done: CheckCircle2, removed: Trash2, member: UserPlus,
};

const str = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '');
const pick = (m: Record<string, unknown>, keys: string[]) => keys.map((k) => str(m[k])).find(Boolean) ?? '';
const sentence = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());

/** turn one server row into "{actor} {verb}" plus a few detail chips */
function describeActivity(a: ServerActivity): Omit<StreamItem, 'id' | 'at'> {
  const m = a.metadata ?? {};
  const type = (a.activityType ?? '').toUpperCase();
  const actor = pick(m, ['createdByUserName', 'updatedByUserName', 'addedByUserName', 'assignedByUserName', 'changedByUserName', 'deletedByUserName', 'removedByUserName', 'userName', 'actorName']) || 'Someone';

  const details: { label: string; value: string }[] = [];
  const from = pick(m, ['oldStatus', 'fromStatus', 'previousStatus', 'oldValue']);
  const to = pick(m, ['newStatus', 'toStatus', 'status', 'newValue']);
  if (to) details.push({ label: from ? 'Status' : 'Value', value: from ? `${from} → ${to}` : to });
  const who = pick(m, ['memberName', 'assigneeName', 'ownerName']);
  if (who) details.push({ label: 'Member', value: who });
  const role = pick(m, ['memberRole']);
  if (role) details.push({ label: 'Role', value: role });

  let verb = sentence(type || 'activity');
  let icon: StreamIcon = 'updated';
  let tone: Tone = 'slate';

  if (type.includes('DELET') || type.includes('REMOV')) { verb = 'removed ' + (type.includes('TASK') ? 'a task' : 'an item'); icon = 'removed'; tone = 'rose'; }
  else if (type.includes('COMPLET') || type.includes('DONE') || type.includes('CLOSED')) { verb = 'marked this task as complete'; icon = 'done'; tone = 'teal'; }
  else if (type.includes('MEMBER') || type.includes('ASSIGN')) { verb = who ? `added ${who} to the task` : 'updated the people on this task'; icon = 'member'; tone = 'violet'; }
  else if (type.includes('STATUS')) { verb = 'changed the status'; icon = 'updated'; tone = 'amber'; }
  else if (type.includes('COMMENT')) { verb = 'commented'; icon = 'comment'; tone = 'blue'; }
  else if (type.includes('CREATE') || type.includes('ADDED')) { verb = type.includes('TASK') ? 'created this task' : 'added ' + sentence(type.replace(/_?(CREATED|ADDED)/, '')).toLowerCase(); icon = 'created'; tone = 'emerald'; }
  else if (type.includes('UPDAT') || type.includes('EDIT') || type.includes('CHANG')) { verb = 'updated this task'; icon = 'updated'; tone = 'amber'; }

  return { actor, verb, icon, tone, details };
}

const dayLabelOf = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Earlier';
  const key = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (key(d) === key(new Date())) return 'Today';
  if (key(d) === key(y)) return 'Yesterday';
  return format(d, 'EEE, dd MMM yyyy');
};

function ActivityStream({ taskId, projectId }: { taskId: number; projectId?: number }) {
  const [server, setServer] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    let live = true;
    setLoading(true);
    setError(false);
    projectApiService.activtiyTracker(projectId)
      .then((res: { data?: unknown }) => {
        if (!live) return;
        const list = (Array.isArray(res?.data) ? res.data : []) as ServerActivity[];
        setServer(
          list
            .filter((a) => {
              const m = a.metadata ?? {};
              const id = Number(m.taskId ?? m.subtaskId ?? (/TASK/i.test(a.resourceType ?? '') ? a.resourceId : undefined));
              return id === Number(taskId);
            })
            .map((a) => ({ id: `s${a.id}`, at: a.createdAt, ...describeActivity(a) })),
        );
      })
      .catch(() => { if (live) { setServer([]); setError(true); } })
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [projectId, taskId, tick]);

  const items = useMemo<StreamItem[]>(() => {
    const local: StreamItem[] = extrasStore.read<TaskEvent>('events', taskId).map((e) => ({
      id: e.id, at: e.at, actor: e.actor, verb: e.text, icon: e.icon,
      tone: e.icon === 'issue' ? 'rose' : e.icon === 'time' ? 'amber' : e.icon === 'doc' ? 'violet' : 'blue',
    }));
    return [...server, ...local].sort((a, b) => +new Date(b.at) - +new Date(a.at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server, taskId, tick]);

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
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{items.length} {items.length === 1 ? 'event' : 'events'}</span>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setTick((n) => n + 1)} disabled={loading}>
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} /> Refresh
        </Button>
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
                  const Icon = EVENT_ICON[a.icon];
                  const d = new Date(a.at);
                  return (
                    <li key={a.id} className="relative ml-6 rounded-md px-3 py-2 transition-colors hover:bg-muted/40">
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
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Tabs shell ───────────────────────── */

type TabKey = 'comments' | 'hours' | 'documents' | 'issues' | 'activity';

const TABS: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: 'comments', label: 'Comments', icon: MessageSquare },
  { key: 'hours', label: 'Log Hours', icon: Clock },
  { key: 'documents', label: 'Documents', icon: Paperclip },
  { key: 'issues', label: 'Issues', icon: AlertCircle },
  { key: 'activity', label: 'Activity', icon: ActivityIcon },
];

export function TaskPanelTabs({ taskId, projectId }: { taskId: number; projectId?: number }) {
  const [tab, setTab] = useState<TabKey>('comments');
  const [counts, setCounts] = useState<Partial<Record<TabKey, number>>>(() => ({
    hours: extrasStore.read('timelogs', taskId).length,
    documents: 0,
    issues: extrasStore.read<Issue>('issues', taskId).filter((i) => i.state === 'open').length,
  }));
  useEffect(() => setTab('comments'), [taskId]);

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
              {key !== 'activity' && key !== 'comments' && key !== 'documents' && <Wip hint="Saved in this browser only — not connected to the server yet" />}
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
        {tab === 'hours' && <HoursTab taskId={taskId} onCount={onHours} />}
        {tab === 'documents' && <DocumentsTab taskId={taskId} onCount={onDocs} />}
        {tab === 'issues' && <IssuesTab taskId={taskId} onCount={onIssues} />}
        {tab === 'activity' && <ActivityStream taskId={taskId} projectId={projectId} />}
      </div>
    </section>
  );
}
