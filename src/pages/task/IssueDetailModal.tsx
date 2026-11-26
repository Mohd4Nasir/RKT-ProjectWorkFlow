import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, Loader2, MessageSquare, Paperclip, Pencil, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';
import { getParsedToken } from '@/services/keycloakService';
import { useMyProjectAccess, type MyProjectAccess } from '@/hooks/useMyProjectAccess';
import { issueAccess } from './issueAccess';
import { issueCommentAttachmentApi } from '@/services/fileApiService';
import {
  Issue, IssueComment, IssueStatus, IssueUser, issueService,
} from '@/services/issueService';
import { CommentEditor, CommentHtml } from './CommentEditor';
import { CommentAttachments, uploadCommentFiles } from './CommentAttachments';
import { OwnerDocuments } from '@/components/OwnerDocuments';
import { IssueFormModal } from './IssueFormModal';
import {
  ISSUE_STATUSES, ModalHeader, ModalShell, Pill, SELECT_CLS, SEVERITY_UI, STATUS_UI, typeUi,
  useAssignable, useIssueLabels,
} from './issueUi';
import { showError, showWarning } from '@/lib/errorAlert';

const me = () => {
  const p = getParsedToken();
  return p?.name || p?.preferred_username || '';
};
const ago = (iso?: string | null) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(+d) ? formatDistanceToNow(d, { addSuffix: true }) : '';
};
const full = (iso?: string | null) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(+d) ? format(d, 'PPpp') : '—';
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[92px_1fr] items-center gap-2">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-primary/80">{label}</dt>
      <dd className="min-w-0 text-xs font-medium">{children}</dd>
    </div>
  );
}

const Person = ({ u }: { u?: IssueUser | null }) =>
  u?.name ? (
    <span className="inline-flex items-center gap-2"><UserAvatar name={u.name} size="sm" className="!h-6 !w-6 !text-[9px] !ring-0" />{u.name}</span>
  ) : <span className="text-muted-foreground">—</span>;

/* ───────────────────────── comments ───────────────────────── */

function IssueComments({ issueId, access, canComment }: { issueId: number; access: MyProjectAccess; canComment: boolean }) {
  const [list, setList] = useState<IssueComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const mine = me();

  const load = useCallback(async () => {
    try {
      setList(await issueService.getComments(issueId));
    } catch (err) {
      showError(err, 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const add = async (html: string, files: File[]) => {
    setBusy(true);
    try {
      const created = await issueService.addComment(issueId, html);
      if (files.length && created?.id) await uploadCommentFiles(created.id, files, issueCommentAttachmentApi);
      await load();
      return true;
    } catch (err) {
      showError(err, 'Failed to add comment');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const save = async (c: IssueComment, html: string) => {
    try {
      await issueService.editComment(c.id, html);
      setEditing(null);
      await load();
      return true;
    } catch (err) {
      showError(err, 'Failed to edit comment');
      return false;
    }
  };

  const remove = async (c: IssueComment) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await issueService.deleteComment(c.id);
      setList((l) => l.filter((x) => x.id !== c.id));
    } catch (err) {
      showError(err, 'Failed to delete comment');
    }
  };

  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-info/15 text-info"><MessageSquare className="h-3.5 w-3.5" /></span>
        Discussion
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">{list.length}</span>
      </h3>

      {canComment && (
        <div className="mb-4 flex gap-3">
          <UserAvatar name={mine || '?'} className="!h-9 !w-9 shrink-0 !ring-0" />
          <div className="min-w-0 flex-1">
            <CommentEditor placeholder="Add a comment, steps or a screenshot…" submitLabel="Comment" busy={busy} allowFiles onSubmit={add} />
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-6 text-center text-xs text-muted-foreground"><Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> Loading comments…</div>
      ) : list.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">No comments yet.</div>
      ) : (
        <ul className="space-y-3">
          {list.map((c) => {
            const name = c.author?.name || 'Unknown';
            // only the author may edit / delete: compare ids, fall back to the name until our id is known
            const own = access.userId != null && c.author?.userId != null ? c.author.userId === access.userId : !!mine && name === mine;
            const edited = c.commentUpdatedOn && c.commentUpdatedOn !== c.createdAt;
            return (
              <li key={c.id} className="group flex gap-3">
                <UserAvatar name={name} className="!h-9 !w-9 shrink-0 !ring-0" />
                {editing === c.id ? (
                  <div className="min-w-0 flex-1">
                    <CommentEditor initial={c.content} placeholder="Edit comment" submitLabel="Save" autoFocus onSubmit={(html) => save(c, html)} onCancel={() => setEditing(null)} />
                  </div>
                ) : (
                  <div className={cn('relative min-w-0 flex-1 overflow-hidden rounded-xl border bg-card px-4 pb-3 pt-3 shadow-sm', own ? 'border-primary/25' : 'border-border')}>
                    {own && <span className="absolute inset-y-0 left-0 w-1 bg-primary/70" />}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[13px] font-bold">{name}</span>
                      {own && <span className="rounded bg-primary/10 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-primary">You</span>}
                      <span className="text-muted-foreground" title={full(c.createdAt)}>{ago(c.createdAt)}{edited ? ' · edited' : ''}</span>
                      {own && (
                        <span className="ml-auto flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button onClick={() => setEditing(c.id)} title="Edit" className="grid h-6 w-6 place-items-center rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => remove(c)} title="Delete" className="grid h-6 w-6 place-items-center rounded text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                        </span>
                      )}
                    </div>
                    <CommentHtml content={c.content} />
                    <CommentAttachments commentId={c.id} initial={c.attachments} api={issueCommentAttachmentApi} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ───────────────────────── detail ───────────────────────── */

interface Props {
  issueId: number;
  projectId?: number | string;
  onClose: () => void;
  /** called with the fresh issue after any change, or null once it has been deleted */
  onChanged: (issue: Issue | null) => void;
}

export function IssueDetailModal({ issueId, projectId, onClose, onChanged }: Props) {
  const label = useIssueLabels();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  // attachments are collapsed by default (they take a lot of room); the button beside Reopened toggles them
  const [showFiles, setShowFiles] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const people = useAssignable(projectId, issue?.taskId);
  const myAccess = useMyProjectAccess(projectId ?? issue?.projectId);
  const can = issue ? issueAccess(issue, myAccess) : null;

  useEffect(() => {
    let live = true;
    setIssue(null);
    setFailed(false);
    issueService.get(issueId).then((i) => live && setIssue(i)).catch((err) => { if (live) { setFailed(true); showError(err, 'Failed to load issue'); } });
    return () => { live = false; };
  }, [issueId]);

  const apply = (next: Issue) => {
    setIssue(next);
    onChanged(next);
  };

  const run = async (job: () => Promise<Issue>, ok: string, fail: string) => {
    setSaving(true);
    try {
      apply(await job());
      toast.success(ok);
    } catch (err) {
      showError(err, fail);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = (s: IssueStatus) =>
    issue && s !== issue.status && run(() => issueService.updateStatus(issue.id, s), `Status: ${label('status', s)}`, 'Failed to update status');

  const changeAssignee = (v: string) =>
    issue && run(() => issueService.assign(issue.id, v || null), v ? 'Issue assigned' : 'Issue unassigned', 'Failed to assign issue');

  const remove = async () => {
    if (!issue || !window.confirm(`Delete issue "${issue.title}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await issueService.remove(issue.id);
      toast.success('Issue deleted');
      onChanged(null);
      onClose();
    } catch (err) {
      showError(err, 'Failed to delete issue');
      setSaving(false);
    }
  };

  const tu = typeUi(issue?.type);
  const TypeIcon = tu.icon;
  // keep the current assignee selectable even if the member lists did not return them
  const assignee = issue?.assignee;
  const options = assignee && !people.some((p) => p.id === assignee.userId) ? [{ id: assignee.userId, name: assignee.name }, ...people] : people;

  return (
    <ModalShell onClose={onClose} className="max-w-5xl">
      <ModalHeader onClose={onClose}>
        <span className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-xs font-semibold">ISS-{issueId}</span>
        {issue?.taskTitle && <span className="truncate text-xs text-white/70" title={issue.taskTitle}>on “{issue.taskTitle}”</span>}
      </ModalHeader>

      {failed ? (
        <div className="grid flex-1 place-items-center py-20 text-sm text-destructive">Couldn’t load this issue. It may have been deleted.</div>
      ) : !issue ? (
        <div className="grid flex-1 place-items-center py-20 text-sm text-muted-foreground"><span><Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading issue…</span></div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
            <main className="min-w-0 flex-1 space-y-6 px-6 py-5 scrollbar-thin lg:overflow-y-auto">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Pill ui={tu}><TypeIcon className="h-3 w-3" />{label('type', issue.type)}</Pill>
                  <Pill ui={SEVERITY_UI[issue.severity]}>{label('severity', issue.severity)}</Pill>
                  <Pill ui={STATUS_UI[issue.status]}>{label('status', issue.status)}</Pill>
                  <button
                    type="button" onClick={() => setShowFiles((v) => !v)} aria-pressed={showFiles}
                    title={showFiles ? 'Hide attachments' : 'Show attachments'}
                    className={cn(
                      'ml-auto inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors',
                      showFiles ? 'border-primary bg-primary text-primary-foreground' : 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20',
                    )}
                  >
                    <Paperclip className="h-3.5 w-3.5" /> Attachments
                    <span className={cn('rounded-full px-1.5 text-[10px] tabular-nums', showFiles ? 'bg-primary-foreground/25' : 'bg-primary text-primary-foreground')}>{fileCount}</span>
                  </button>
                </div>
                <h1 className="font-display text-2xl font-bold leading-tight">{issue.title}</h1>
              </div>

              <section>
                <h3 className="mb-2 text-sm font-bold">Description</h3>
                <div className={cn('min-h-[56px] whitespace-pre-wrap rounded-lg border border-dashed border-info/40 bg-info/[0.04] px-3 py-3 text-sm', !issue.description && 'italic text-muted-foreground')}>
                  {issue.description || 'No description provided.'}
                </div>
              </section>

              {/* files on the issue itself: /file/upload-url with ownerType ISSUE, GET /file/issue/{id}.
                  Stays mounted (just hidden) so the count on the button is known before it is opened */}
              <section className={cn(!showFiles && 'hidden')}>
                <OwnerDocuments ownerType="ISSUE" ownerId={issue.id} className="space-y-3" subtitle="Screenshots, logs and recordings" onCount={setFileCount} />
              </section>

              <IssueComments issueId={issue.id} access={myAccess} canComment={can!.canRaise} />
            </main>

            <aside className="shrink-0 space-y-4 border-t border-border bg-muted/40 px-5 py-5 scrollbar-thin lg:w-[320px] lg:overflow-y-auto lg:border-l lg:border-t-0">
              <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <h3 className="bg-[image:var(--gradient-hero)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white">Status</h3>
                <div className="grid grid-cols-2 gap-1.5 p-3">
                  {/* the current status, plus only the moves the flow and this user's role allow */}
                  {ISSUE_STATUSES.filter((s) => s === issue.status || can!.nextStatuses.includes(s)).map((s) => {
                    const on = issue.status === s;
                    return (
                      <button
                        key={s} disabled={saving || on} onClick={() => changeStatus(s)} aria-pressed={on}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-60',
                          on ? cn(STATUS_UI[s].chip, 'ring-2 ring-primary/30') : 'border-border text-muted-foreground hover:bg-muted',
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_UI[s].dot)} /> {label('status', s)}
                      </button>
                    );
                  })}
                  {can!.nextStatuses.length === 0 && (
                    <p className="col-span-2 pt-1 text-center text-[11px] text-muted-foreground">No status changes available to you.</p>
                  )}
                </div>
              </section>

              <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <h3 className="bg-[image:var(--gradient-hero)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white">Details</h3>
                <dl className="space-y-3.5 p-4">
                  <Field label="Assignee">
                    <div className="flex items-center gap-1.5">
                      <UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <select
                        value={assignee?.userId ?? ''} disabled={saving || !can!.canAssign}
                        title={can!.canAssign ? undefined : issue.status === 'CLOSED' ? 'A closed issue can’t be reassigned, reopen it first' : 'Only the reporter, a manager or the owner can assign'}
                        onChange={(e) => changeAssignee(e.target.value)}
                        className={cn(SELECT_CLS, 'w-full !py-1 text-xs')}
                      >
                        <option value="">Unassigned</option>
                        {options.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  </Field>
                  <Field label="Reporter"><Person u={issue.reportedBy} /></Field>
                  <Field label="Created"><span title={full(issue.createdAt)}>{ago(issue.createdAt)}</span></Field>
                  <Field label="Updated"><span title={full(issue.updatedAt)}>{ago(issue.updatedAt) || '—'}</span></Field>
                  {issue.resolvedAt && (
                    <Field label="Resolved">
                      <div className="space-y-1"><Person u={issue.resolvedBy} /><div className="flex items-center gap-1 text-[11px] text-muted-foreground" title={full(issue.resolvedAt)}><CheckCircle2 className="h-3 w-3" />{ago(issue.resolvedAt)}</div></div>
                    </Field>
                  )}
                  {issue.closedAt && (
                    <Field label="Closed">
                      <div className="space-y-1"><Person u={issue.closedBy} /><div className="flex items-center gap-1 text-[11px] text-muted-foreground" title={full(issue.closedAt)}><CalendarClock className="h-3 w-3" />{ago(issue.closedAt)}</div></div>
                    </Field>
                  )}
                </dl>
              </section>

              <div className="flex gap-2">
                {can!.canEdit && (
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(true)} disabled={saving}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                )}
                {can!.canDelete && (
                  <Button variant="outline" size="sm" className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={remove} disabled={saving}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                  </Button>
                )}
              </div>
            </aside>
          </div>

          {editing && (
            <IssueFormModal
              issue={issue}
              onClose={() => setEditing(false)}
              onSaved={(next) => { setEditing(false); apply({ ...issue, ...next }); }}
            />
          )}
        </>
      )}
    </ModalShell>
  );
}
