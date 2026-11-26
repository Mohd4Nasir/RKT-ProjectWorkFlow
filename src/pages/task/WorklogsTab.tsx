import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Loader2, MoreVertical, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';
import {
  MAX_WORKLOG_DESCRIPTION, MAX_WORKLOG_MINUTES, TaskWorklogs, Worklog, fmtMinutes, worklogService,
} from '@/services/worklogService';
import { isObserver, isPrivileged, useMyProjectAccess } from '@/hooks/useMyProjectAccess';
import { INPUT_CLS, ModalHeader, ModalShell, SELECT_CLS, useAssignable } from './issueUi';
import { showError, showWarning } from '@/lib/errorAlert';

const today = () => format(new Date(), 'yyyy-MM-dd');
const dayOf = (d: string) => new Date(`${d}T00:00:00`);
const dayTitle = (d: string) => {
  const x = dayOf(d);
  return isNaN(+x) ? d : format(x, 'EEE, dd MMM yyyy');
};
const QUICK = [30, 60, 120, 240, 480];

/* ───────────────────────── log / edit dialog ───────────────────────── */

function WorklogDialog({ taskId, log, onClose, onSaved }: {
  taskId: number; log?: Worklog; onClose: () => void; onSaved: () => void;
}) {
  const [date, setDate] = useState(log?.workDate ?? today());
  const [hours, setHours] = useState(log ? String(Math.floor(log.timeSpentMinutes / 60)) : '');
  const [mins, setMins] = useState(log ? String(log.timeSpentMinutes % 60) : '');
  const [text, setText] = useState(log?.description ?? '');
  const [busy, setBusy] = useState(false);

  const total = (Number(hours) || 0) * 60 + (Number(mins) || 0);
  const future = !!date && date > today();
  const valid = !!date && !future && total >= 1 && total <= MAX_WORKLOG_MINUTES && !!text.trim() && text.length <= MAX_WORKLOG_DESCRIPTION;

  const setTotal = (m: number) => { setHours(String(Math.floor(m / 60))); setMins(String(m % 60)); };

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      // PUT is a full replace, so always send all three fields
      const dto = { workDate: date, timeSpentMinutes: total, description: text.trim() };
      if (log) await worklogService.update(log.worklogId, dto);
      else await worklogService.add(taskId, dto);
      toast.success(log ? 'Work log updated' : 'Work logged');
      onSaved();
    } catch (err) {
      // 409 says how much of the 24h is left on that day, 401 = not allowed
      showError(err, log ? 'Failed to update work log' : 'Failed to log work');
      setBusy(false);
    }
  };

  return (
    <ModalShell onClose={onClose} className="max-w-lg">
      <ModalHeader onClose={onClose}>
        <Clock className="h-4 w-4 shrink-0" />
        <h2 className="truncate text-sm font-bold">{log ? 'Edit work log' : 'Log work'}</h2>
      </ModalHeader>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 scrollbar-thin">
        <label className="block text-[11px] font-bold uppercase tracking-wide text-primary/80">
          Date <span className="text-destructive">*</span>
          <input
            type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)}
            className={cn(INPUT_CLS, 'mt-1.5 font-normal normal-case text-foreground')}
          />
          {future && <span className="mt-1 block text-[11px] font-normal normal-case text-destructive">Future dates can’t be logged.</span>}
        </label>

        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-primary/80">
            Time spent <span className="text-destructive">*</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number" min={0} max={24} value={hours} onChange={(e) => setHours(e.target.value)} placeholder="0" aria-label="Hours"
              className={cn(INPUT_CLS, 'w-24')}
            />
            <span className="text-sm text-muted-foreground">h</span>
            <input
              type="number" min={0} max={59} value={mins} onChange={(e) => setMins(e.target.value)} placeholder="0" aria-label="Minutes"
              className={cn(INPUT_CLS, 'w-24')}
            />
            <span className="text-sm text-muted-foreground">m</span>
            <span className="ml-auto text-xs font-semibold tabular-nums text-muted-foreground">{total > 0 ? fmtMinutes(total) : ''}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button
                key={q} type="button" onClick={() => setTotal(q)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                  total === q ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {fmtMinutes(q)}
              </button>
            ))}
          </div>
          {total > MAX_WORKLOG_MINUTES && <p className="mt-1 text-[11px] text-destructive">One entry can be at most 24h.</p>}
        </div>

        <label className="block text-[11px] font-bold uppercase tracking-wide text-primary/80">
          What did you work on? <span className="text-destructive">*</span>
          <textarea
            value={text} rows={5} maxLength={MAX_WORKLOG_DESCRIPTION} onChange={(e) => setText(e.target.value)}
            placeholder="Fixed the login bug, wrote tests…"
            className={cn(INPUT_CLS, 'mt-1.5 resize-y font-normal normal-case text-foreground')}
          />
          <span className="mt-1 block text-right text-[11px] font-normal normal-case tabular-nums text-muted-foreground">
            {text.length} / {MAX_WORKLOG_DESCRIPTION}
          </span>
        </label>
      </div>

      <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button size="sm" onClick={submit} disabled={!valid || busy}>
          {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          {log ? 'Save changes' : 'Log work'}
        </Button>
      </footer>
    </ModalShell>
  );
}

/* ───────────────────────── tab ───────────────────────── */

export function WorklogsTab({ taskId, projectId, onCount }: { taskId: number; projectId?: number; onCount: (n: number) => void }) {
  const me = useMyProjectAccess(projectId);
  const members = useAssignable(undefined, taskId);
  const [data, setData] = useState<TaskWorklogs>({ totalMinutes: 0, worklogs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [userId, setUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [dialog, setDialog] = useState<{ log?: Worklog } | null>(null);
  const [open, setOpen] = useState<Set<number>>(new Set()); // rows with the full description shown

  const filtering = !!(userId || from || to);
  const badRange = !!from && !!to && from > to; // the API answers 400 for from > to

  const load = useCallback(async (quiet = false) => {
    if (badRange) return;
    if (!quiet) setLoading(true);
    setError(false);
    try {
      const res = await worklogService.list(taskId, { userId, from, to });
      setData(res);
      if (!userId && !from && !to) onCount(res.worklogs.length);
    } catch (err) {
      setError(true);
      showError(err, 'Failed to load work logs');
    } finally {
      setLoading(false);
    }
  }, [taskId, userId, from, to, badRange, onCount]);

  useEffect(() => { load(); }, [load]);

  // a different task: forget the old filters
  useEffect(() => { setUserId(''); setFrom(''); setTo(''); setOpen(new Set()); }, [taskId]);

  // only (non-observer) task members can add; unknown role / member list -> show it and let the server (401) decide
  const canLog = !isObserver(me.role) && (me.userId == null || members.length === 0 || members.some((m) => m.id === me.userId));
  const canEdit = (l: Worklog) => me.userId != null && l.user?.userId === me.userId;
  const canDelete = (l: Worklog) => canEdit(l) || isPrivileged(me.role);

  const remove = async (l: Worklog) => {
    if (!window.confirm(`Delete this work log of ${fmtMinutes(l.timeSpentMinutes)} for ${dayTitle(l.workDate)}?`)) return;
    try {
      await worklogService.remove(l.worklogId);
      toast.success('Work log deleted');
      load(true);
    } catch (err) {
      showError(err, 'Failed to delete work log');
    }
  };

  const groups = useMemo(() => {
    const out: { date: string; rows: Worklog[]; minutes: number }[] = [];
    data.worklogs.forEach((l) => {
      const last = out[out.length - 1];
      if (last?.date === l.workDate) { last.rows.push(l); last.minutes += l.timeSpentMinutes; }
      else out.push({ date: l.workDate, rows: [l], minutes: l.timeSpentMinutes });
    });
    return out;
  }, [data.worklogs]);

  const weekStart = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return format(d, 'yyyy-MM-dd');
  }, []);
  const week = useMemo(
    () => data.worklogs.filter((l) => l.workDate >= weekStart).reduce((s, l) => s + l.timeSpentMinutes, 0),
    [data.worklogs, weekStart],
  );

  const tiles = [
    { label: filtering ? 'Total (filtered)' : 'Total logged', value: fmtMinutes(data.totalMinutes), tone: 'text-primary bg-primary/10' },
    { label: 'This week', value: fmtMinutes(week), tone: 'text-emerald-700 bg-emerald-500/10' },
    { label: 'Entries', value: String(data.worklogs.length), tone: 'text-amber-700 bg-amber-500/10' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {tiles.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-3">
            <span className={cn('grid h-9 w-9 place-items-center rounded-md', s.tone)}><Clock className="h-4 w-4" /></span>
            <div className="min-w-0">
              <div className="text-lg font-bold leading-tight tabular-nums">{s.value}</div>
              <div className="truncate text-[11px] font-medium text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={userId} onChange={(e) => setUserId(e.target.value)} className={SELECT_CLS} aria-label="Filter by person">
          <option value="">Everyone</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          From
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={cn(SELECT_CLS, 'font-normal normal-case text-foreground')} />
        </label>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          To
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={cn(SELECT_CLS, 'font-normal normal-case text-foreground')} />
        </label>
        {filtering && (
          <button onClick={() => { setUserId(''); setFrom(''); setTo(''); }} className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" /> Clear
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={() => load(true)} disabled={loading} title="Refresh">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
          {canLog && (
            <Button size="sm" className="h-9" onClick={() => setDialog({})}>
              <Plus className="mr-1 h-4 w-4" /> Log work
            </Button>
          )}
        </div>
      </div>
      {badRange && <p className="text-xs text-destructive">“From” can’t be after “To”.</p>}

      {loading && !data.worklogs.length ? (
        <div className="py-10 text-center text-xs text-muted-foreground"><Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> Loading work logs…</div>
      ) : error && !data.worklogs.length ? (
        <div className="py-10 text-center text-xs text-destructive">
          Couldn’t load work logs. <button onClick={() => load()} className="font-semibold underline">Retry</button>
        </div>
      ) : groups.length === 0 ? (
        <div className="py-10 text-center text-xs text-muted-foreground">
          <Clock className="mx-auto mb-2 h-6 w-6 opacity-40" />
          {filtering ? 'No work logs match your filters.' : 'No work logged yet.'}
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.date}>
              <h5 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {dayTitle(g.date)}
                <span className="h-px flex-1 bg-border" />
                <span className="rounded-full bg-muted px-2 py-0.5 tabular-nums text-foreground">{fmtMinutes(g.minutes)}</span>
              </h5>
              <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border bg-card">
                {g.rows.map((l) => {
                  const name = l.user?.name || l.user?.email || 'Unknown user';
                  const long = l.description.length > 140 || l.description.includes('\n');
                  const expanded = open.has(l.worklogId);
                  const edited = l.updatedAt && l.updatedAt !== l.createdAt;
                  return (
                    <li key={l.worklogId} className="group flex items-start gap-3 px-3.5 py-3">
                      <UserAvatar name={name} size="sm" className="mt-0.5 !ring-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-[13px] font-semibold">{name}</span>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold tabular-nums text-primary">{fmtMinutes(l.timeSpentMinutes)}</span>
                          {edited && <span className="text-muted-foreground">(edited)</span>}
                        </div>
                        <p className={cn('mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground', !expanded && 'line-clamp-2')}>{l.description}</p>
                        {long && (
                          <button
                            onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(l.worklogId)) n.delete(l.worklogId); else n.add(l.worklogId); return n; })}
                            className="mt-0.5 text-[11px] font-semibold text-primary hover:underline"
                          >
                            {expanded ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                      {(canEdit(l) || canDelete(l)) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Actions"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {canEdit(l) && <DropdownMenuItem onClick={() => setDialog({ log: l })}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>}
                            {canDelete(l) && (
                              <DropdownMenuItem onClick={() => remove(l)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {dialog && (
        <WorklogDialog
          taskId={taskId}
          log={dialog.log}
          onClose={() => setDialog(null)}
          onSaved={() => { setDialog(null); load(true); }}
        />
      )}
    </div>
  );
}
