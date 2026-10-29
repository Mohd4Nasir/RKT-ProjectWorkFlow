import { useEffect, useMemo, useState } from 'react';
import { differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';
import {
  ArrowLeft, CalendarCheck, CalendarDays, CalendarPlus, Check, ChevronDown,
  ChevronUp, ListChecks, Pencil, X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/richeditor';
import { cn } from '@/lib/utils';
import { Project } from '@/types/ProejctsType';
import { formatDate } from '@/utils/format';

// Fallback list (matches GET /project/status); `value` is what the API expects.
export const STATUS_OPTIONS = [
  { label: 'Open', value: 'OPEN', dot: 'bg-success' },
  { label: 'Closed', value: 'CLOSED', dot: 'bg-danger' },
  { label: 'On Hold', value: 'ON_HOLD', dot: 'bg-warning' },
  { label: 'Completed', value: 'COMPLETED', dot: 'bg-muted-foreground' },
];

// "In Progress" / "in-progress" / "IN_PROGRESS" all normalize to IN_PROGRESS.
const normalizeStatus = (s: string) => s.trim().toUpperCase().replace(/[\s-]+/g, '_');

export interface StatusOption {
  label: string;
  value: string;
  dot: string;
}

const DOT_BY_STATUS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((s) => [s.value, s.dot]),
);

const prettyLabel = (s: string) =>
  normalizeStatus(s).split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');

/** Turns the GET /project/status response into dropdown options. Accepts string[] or object[]. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapStatusOptions = (data: any): StatusOption[] => {
  const list = Array.isArray(data) ? data : data?.data ?? data?.statuses ?? data?.content ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return list.flatMap((item: any) => {
    const raw =
      typeof item === 'string'
        ? item
        : item?.projectStatus ?? item?.status ?? item?.value ?? item?.name ?? item?.statusName;
    if (!raw) return [];
    const value = String(raw);
    const label =
      typeof item === 'object' && (item.displayName ?? item.label ?? item.statusName ?? item.name)
        ? String(item.displayName ?? item.label ?? item.statusName ?? item.name)
        : prettyLabel(value);
    return [{ value, label, dot: DOT_BY_STATUS[normalizeStatus(value)] ?? 'bg-muted-foreground' }];
  });
};

export interface HeaderChanges {
  title?: string;
  description?: string;
  status?: string;
  startDate?: string; // 'yyyy-MM-dd'
  endDate?: string;   // 'yyyy-MM-dd'
}

interface Props {
  project: Project;
  onBack: () => void;
  /** Options from GET /project/status. Falls back to the built-in list while loading or on error. */
  statusOptions?: StatusOption[];
  /** Should call the API and throw on failure. */
  onUpdate: (changes: HeaderChanges) => Promise<void>;
}

const isEmptyHtml = (html: string) => !html.replace(/<[^>]*>/g, '').trim();

/** A change waiting on the user's confirmation before it is sent to the API. */
type PendingChange =
  | { kind: 'status'; value: string; label: string }
  | { kind: 'edit'; changes: HeaderChanges };

// Lightweight sanitizer (no dependency): drops dangerous tags, event handlers and js: URLs.
// For stricter protection, swap this for DOMPurify.sanitize.
const sanitizeHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,link,meta').forEach((n) => n.remove());
  doc.body.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((a) => {
      const name = a.name.toLowerCase();
      const val = a.value.trim().toLowerCase();
      if (name.startsWith('on') || ((name === 'href' || name === 'src') && val.startsWith('javascript:'))) {
        el.removeAttribute(a.name);
      }
    });
  });
  return doc.body.innerHTML;
};

const formatDateTime = (d?: string) => {
  if (!d) return '—';
  const parsed = parseISO(d);
  return isValid(parsed) ? format(parsed, 'dd MMM yyyy, hh:mm a') : '—';
};

// Ek chhota card jo Bar 2 mein baar-baar use hoga
function InfoCell({
  icon, label, children,
}: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border bg-background px-3 py-2 min-w-0"
      style={{ borderColor: 'hsl(var(--secondary))' }}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {icon}{label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{children}</div>
    </div>
  );
}

export function ProjectDetailsHeader({ project, onBack, onUpdate, statusOptions }: Props) {
  const options = statusOptions?.length ? statusOptions : STATUS_OPTIONS;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = project as any;
  const title: string = p.projectTitle || p.name || 'Untitled Project';
  const description: string = p.projectDescription ?? p.description ?? '';
  const status: string = p.projectStatus || p.status || 'OPEN';
  const projectId = p.projectId ?? p.id;
  const completedTask = Number(p.completedTask ?? 0);
  const totalTask = Number(p.totalTask ?? 0);
  const pct = totalTask ? Math.round((completedTask / totalTask) * 100) : 0;

  const startISO = p.startDate ? String(p.startDate).slice(0, 10) : '';
  const endISO = p.endDate ? String(p.endDate).slice(0, 10) : '';

  // ---------- state (sabse pehle) ----------
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDesc, setDraftDesc] = useState(description);
  const [draftStart, setDraftStart] = useState(startISO);
  const [draftEnd, setDraftEnd] = useState(endISO);
  // Set when a change is waiting on the confirmation dialog. Nothing is
  // persisted until the user confirms.
  const [pending, setPending] = useState<PendingChange | null>(null);

  // ---------- derived (state ke baad) ----------
  const showDesc = expanded || editing;
  const datesValid = !draftStart || !draftEnd || draftEnd >= draftStart;

  const endDateObj = p.endDate ? parseISO(p.endDate) : null;
  const daysLeft =
    endDateObj && isValid(endDateObj) ? differenceInCalendarDays(endDateObj, new Date()) : null;
  const isCompleted = normalizeStatus(status) === 'COMPLETED';
  const deadline =
    isCompleted || daysLeft === null
      ? null
      : daysLeft < 0
        ? { text: `Overdue by ${-daysLeft} day${-daysLeft > 1 ? 's' : ''}`, cls: 'bg-danger/15 text-danger' }
        : daysLeft === 0
          ? { text: 'Due today', cls: 'bg-warning/15 text-warning' }
          : { text: `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`, cls: 'bg-success/15 text-success' };

  // Keep drafts in sync with the project while not editing.
  useEffect(() => {
    if (!editing) {
      setDraftTitle(title);
      setDraftDesc(description);
      setDraftStart(startISO);
      setDraftEnd(endISO);
    }
  }, [title, description, startISO, endISO, editing]);

  const initials = title.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const currentStatus: StatusOption =
    options.find((s) => normalizeStatus(s.value) === normalizeStatus(status)) ?? {
      value: status,
      label: prettyLabel(status),
      dot: 'bg-muted-foreground',
    };
  const titleValid = draftTitle.trim().length > 1;
  const safeDescription = useMemo(() => sanitizeHtml(description), [description]);

  const run = async (changes: HeaderChanges, onDone?: () => void) => {
    setSaving(true);
    try {
      await onUpdate(changes);
      onDone?.();
    } catch {
      // parent shows the error toast; stay in edit mode
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = () => {
    if (!titleValid || !datesValid) return;
    setPending({
      kind: 'edit',
      changes: {
        title: draftTitle.trim(),
        description: draftDesc,
        startDate: draftStart || undefined,
        endDate: draftEnd || undefined,
      },
    });
  };

  /** Actually persists whatever the confirmation dialog approved. */
  const confirmPending = () => {
    if (!pending) return;
    if (pending.kind === 'status') {
      run({ status: pending.value });
    } else {
      run(pending.changes, () => setEditing(false));
    }
    setPending(null);
  };

  const cancelEdit = () => {
    setPending(null);
    setDraftTitle(title);
    setDraftDesc(description);
    setDraftStart(startISO);
    setDraftEnd(endISO);
    setEditing(false);
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'hsl(var(--secondary-55))', borderColor: 'hsl(var(--secondary))', color: 'hsl(var(--heading))' }}
    >
      {/* Top: back + identity + status + edit */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: 'hsl(var(--secondary))' }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Back to projects"
          title="Back to projects"
          className="h-9 w-9 shrink-0 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <span
          className="h-10 w-10 rounded-xl grid place-items-center text-background text-sm font-bold shrink-0"
          style={{ background: 'hsl(var(--heading))' }}
        >
          {initials || 'P'}
        </span>

        <div className="min-w-0 flex-1">
          <span className="block text-xs font-mono font-semibold opacity-70">
            {p.code || `PRJ-${String(projectId).padStart(3, '0')}`}
          </span>
          {editing ? (
            <Input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Project title"
              autoFocus
              className="h-9 mt-1 max-w-xl font-bold"
            />
          ) : (
            <h2 className="font-bold text-lg leading-tight truncate">{title}</h2>
          )}
        </div>

        <Select
          value={currentStatus.value}
          disabled={saving || editing}
          onValueChange={(v) => {
            if (v === currentStatus.value) return;
            const next = options.find((o) => o.value === v);
            setPending({ kind: 'status', value: v, label: next?.label ?? prettyLabel(v) });
          }}
        >
          <SelectTrigger className="h-8 w-[140px] shrink-0 rounded-full bg-background text-foreground text-xs font-semibold">
            <SelectValue>
              <span className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', currentStatus.dot)} />
                {currentStatus.label}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                <span className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', s.dot)} />
                  {s.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {editing ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={saveEdit} disabled={!titleValid || !datesValid || saving}>
              <Check className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="shrink-0" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
          </Button>
        )}
      </div>

      {/* Meta row: dates + tasks */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-xs">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">Start</span>
          {editing ? (
            <Input
              type="date"
              value={draftStart}
              onChange={(e) => setDraftStart(e.target.value)}
              className="h-7 w-[140px] text-xs bg-background"
            />
          ) : (
            <span className="font-semibold">{formatDate(p.startDate)}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">End</span>
          {editing ? (
            <Input
              type="date"
              value={draftEnd}
              min={draftStart || undefined}
              onChange={(e) => setDraftEnd(e.target.value)}
              className={cn('h-7 w-[140px] text-xs bg-background text-foreground', !datesValid && 'border-danger')}
            />
          ) : (
            <>
              <span className="font-semibold">{formatDate(p.endDate)}</span>
              {deadline && (
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', deadline.cls)}>
                  {deadline.text}
                </span>
              )}
            </>
          )}
          {editing && !datesValid && (
            <span className="text-[10px] text-danger">End date start se pehle nahi ho sakti</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <CalendarPlus className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">Created</span>
          <span className="font-semibold">{formatDateTime(p.createdAt)}</span>
        </div>

        <div className="flex items-center gap-2 ml-auto min-w-[180px]">
          <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">Tasks</span>
          <span className="font-semibold">{completedTask}/{totalTask}</span>
          <div className="h-1.5 flex-1 rounded-full bg-secondary/70 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-bold text-primary">{pct}%</span>
        </div>
      </div>

      {/* Description toggle */}
      <div className="border-t px-4" >
        <button
          type="button"
          onClick={() => !editing && setExpanded((v) => !v)}
          disabled={editing}
          className="flex w-full items-center gap-1.5 py-2 text-xs font-semibold text-primary disabled:opacity-60"
        >
          {showDesc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span className="text-sm font-semibold">Description</span>
        </button>

        {showDesc && (
          <div className="pb-4">
            {editing ? (
              <div className="rounded-lg border bg-card overflow-hidden" style={{ borderColor: 'hsl(var(--secondary))' }}>
                <RichTextEditor
                  value={draftDesc}
                  onChange={setDraftDesc}
                  placeholder="Describe your project..."
                  minHeight={120}
                />
              </div>
            ) : isEmptyHtml(description) ? (
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                + Add a description
              </button>
            ) : (
              <div
                className="prose prose-sm max-w-none text-sm text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: safeDescription }}
              />
            )}
          </div>
        )}
      </div>

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.kind === 'status' ? 'Change project status?' : 'Save your changes?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.kind === 'status' ? (
                <>
                  This will change the status of <strong>{title}</strong> from{' '}
                  <strong>{currentStatus.label}</strong> to <strong>{pending.label}</strong>.
                </>
              ) : (
                <>
                  You are about to update the title, description and dates for{' '}
                  <strong>{title}</strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="text-foreground"
              onClick={() => (pending?.kind === 'edit' ? undefined : setPending(null))}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmPending}>
              {pending?.kind === 'status' ? 'Change status' : 'Save changes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}