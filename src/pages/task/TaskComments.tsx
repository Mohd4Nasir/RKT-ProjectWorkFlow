import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown, ChevronUp, Loader2, MessageSquare, MoreVertical, Pencil, ThumbsUp, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';
import { getParsedToken } from '@/services/keycloakService';
import { taskService, TaskComment, CommentLikeType } from '@/services/taskservice';
import { CommentEditor, CommentHtml } from './CommentEditor';
import { CommentAttachments, uploadCommentFiles } from './CommentAttachments';
import { showError, showWarning } from '@/lib/errorAlert';

/** Comments, replies and likes all come from the task-comment-controller API. */

const me = () => {
  const p = getParsedToken();
  return p?.name || p?.preferred_username || 'You';
};

const ago = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : formatDistanceToNow(d, { addSuffix: true });
};
const full = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : format(d, 'PPpp');
};

const Avatar = ({ name, small }: { name: string; small?: boolean }) => (
  <UserAvatar name={name || '?'} className={cn('shrink-0 !ring-0', small ? '!h-7 !w-7 !text-[10px]' : '!h-10 !w-10 !text-sm')} />
);

/* ───────────────────────── Composer ───────────────────────── */

function Composer({
  placeholder, submitLabel, busy, autoFocus, onSubmit, onCancel, small, note, initial, hideAvatar, allowFiles,
}: {
  allowFiles?: boolean;
  initial?: string;
  hideAvatar?: boolean;
  placeholder: string;
  submitLabel: string;
  busy?: boolean;
  autoFocus?: boolean;
  onSubmit: (html: string, files: File[]) => Promise<boolean> | boolean;
  onCancel?: () => void;
  small?: boolean;
  note?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      {!hideAvatar && <Avatar name={me()} small={small} />}
      <div className="flex-1 min-w-0">
        <CommentEditor
          initial={initial}
          autoFocus={autoFocus}
          placeholder={placeholder}
          submitLabel={submitLabel}
          busy={busy}
          compact={small}
          allowFiles={allowFiles}
          note={note}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}

/* ───────────────────────── One comment / reply ───────────────────────── */

const Body = ({ text }: { text: string }) => <CommentHtml content={text} />;

function ActionBtn({
  active, onClick, children, title,
}: { active?: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 h-7 rounded-full px-2.5 text-xs font-semibold transition-colors',
        active ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function Row({
  comment, small, onReact, onReply, onEdit, onDelete, deleting, attachVer,
}: {
  attachVer?: number;
  comment: TaskComment;
  small?: boolean;
  onReact: (c: TaskComment, t: CommentLikeType) => void;
  onReply?: () => void;
  onEdit: (text: string) => Promise<boolean> | boolean;
  onDelete: () => void;
  deleting?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { authorName, content, commentUpdatedOn: at, userLikeType: mine, likeCount = 0 } = comment;
  const mineAuthor = !!authorName && authorName === me();

  return (
    <div className="group flex gap-3">
      <Avatar name={authorName} small={small} />
      <div className={cn(
        'relative flex-1 min-w-0 overflow-hidden rounded-xl border bg-card px-4 pt-3 pb-2 shadow-sm transition-shadow hover:shadow-md',
        mineAuthor ? 'border-primary/25' : 'border-border',
        editing && 'border-0 bg-transparent p-0 shadow-none hover:shadow-none',
      )}>
        {mineAuthor && !editing && <span className="absolute inset-y-0 left-0 w-1 bg-primary/70" />}
        <div className={cn('flex items-center gap-2 text-xs', editing && 'hidden')}>
          <span className="font-bold text-[13px]">{authorName || 'Unknown'}</span>
          {mineAuthor && <span className="rounded bg-primary/10 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-primary">You</span>}
          <span className="text-muted-foreground" title={full(at)}>{ago(at)}</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="ml-auto h-7 w-7 grid place-items-center rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 hover:bg-muted"
                aria-label="More actions"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[200] w-36">
              <DropdownMenuItem onClick={() => setEditing(true)} className="gap-2 cursor-pointer">
                <Pencil className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {editing ? (
          <div className="mt-1">
            <Composer
              hideAvatar
              autoFocus
              small={small}
              initial={content}
              busy={saving}
              placeholder="Edit comment…"
              submitLabel="Save"
              note="Ctrl+Enter to save"
              onCancel={() => setEditing(false)}
              onSubmit={async (t) => {
                setSaving(true);
                const ok = await onEdit(t);
                setSaving(false);
                if (ok) setEditing(false);
                return ok;
              }}
            />
          </div>
        ) : (
          <Body text={content} />
        )}

        {!editing && <CommentAttachments commentId={comment.id} initial={comment.attachments} version={attachVer} />}

        <div className={cn('mt-2 -ml-1.5 flex items-center gap-1 pb-0.5', editing && 'hidden')}>
          <ActionBtn active={mine === 'LIKE'} onClick={() => onReact(comment, 'LIKE')} title="Like">
            <ThumbsUp className={cn('h-4 w-4', mine === 'LIKE' && 'fill-current')} />
            {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
          </ActionBtn>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Tab ───────────────────────── */

export function CommentsTab({ taskId, onCount }: { taskId: number; onCount: (n: number) => void }) {
  const [all, setAll] = useState<TaskComment[]>([]);
  const [replies, setReplies] = useState<Record<number, TaskComment[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [posting, setPosting] = useState(false);
  const [replyBusy, setReplyBusy] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);
  const [sort, setSort] = useState<'new' | 'old'>('old'); // oldest first, so the newest sits right above the composer
  const [attachVer, setAttachVer] = useState<Record<number, number>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [loadingReplies, setLoadingReplies] = useState<Set<number>>(new Set());

  // the list endpoint may or may not include replies — keep only top-level here
  const rows = useMemo(() => all.filter((c) => !c.parentCommentId), [all]);

  const latestTask = useRef(taskId);
  latestTask.current = taskId;

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const list = await taskService.getTaskComments(taskId);
      if (latestTask.current !== taskId) return; // user already moved to another task
      setAll(list);
      // if replies came along with the list, no need to fetch them again
      const grouped: Record<number, TaskComment[]> = {};
      list.filter((c) => c.parentCommentId).forEach((c) => { (grouped[c.parentCommentId!] ||= []).push(c); });
      setReplies(grouped);
    } catch (err) {
      setError(true);
      showError(err, 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    setAll([]); setReplies({}); setReplyingTo(null); setExpanded(new Set());
    load();
  }, [load]);

  const replyCountOf = (c: TaskComment) => Math.max(c.replyCount ?? 0, replies[c.id]?.length ?? 0);
  /** replies at every depth: use what is loaded, fall back to the server's replyCount for unopened branches */
  const descendants = (c: TaskComment): number =>
    (replies[c.id] ?? []).reduce((n, k) => n + 1 + descendants(k), 0) || replyCountOf(c);
  const total = rows.reduce((n, c) => n + 1 + descendants(c), 0);

  useEffect(() => onCount(total), [total, onCount]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => (sort === 'new' ? -1 : 1) * (+new Date(a.commentUpdatedOn) - +new Date(b.commentUpdatedOn))),
    [rows, sort],
  );

  /** apply a change to a comment wherever it lives (top-level list or a reply list) */
  const patch = (id: number, fn: (c: TaskComment) => TaskComment) => {
    setAll((l) => l.map((c) => (c.id === id ? fn(c) : c)));
    setReplies((m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.map((c) => (c.id === id ? fn(c) : c))])));
  };

  const react = async (c: TaskComment, type: CommentLikeType) => {
    const prev = c.userLikeType ?? null;
    const next = prev === type ? null : type;
    const dec = (t: CommentLikeType | null, n?: number) => Math.max(0, (n ?? 0) - (t ? 1 : 0));
    // optimistic
    patch(c.id, (x) => ({
      ...x,
      userLikeType: next,
      likeCount: (prev === 'LIKE' ? dec('LIKE', x.likeCount) : x.likeCount ?? 0) + (next === 'LIKE' ? 1 : 0),
      dislikeCount: (prev === 'DISLIKE' ? dec('DISLIKE', x.dislikeCount) : x.dislikeCount ?? 0) + (next === 'DISLIKE' ? 1 : 0),
    }));
    try {
      if (next) await taskService.likeTaskComment(c.id, next);
      else await taskService.unlikeTaskComment(c.id);
    } catch (err) {
      patch(c.id, () => c); // roll back to what we had
      showError(err, 'Could not update your reaction');
    }
  };

  /** upload picked files against a saved comment, then refresh that comment's attachment list */
  const attach = async (commentId: number | undefined, files: File[]) => {
    if (!files.length) return;
    if (!commentId) { showWarning('Comment saved, but the files could not be attached'); return; }
    const n = await uploadCommentFiles(commentId, files);
    if (n) {
      toast.success(`${n} file${n > 1 ? 's' : ''} attached`);
      setAttachVer((v) => ({ ...v, [commentId]: (v[commentId] ?? 0) + 1 }));
    }
  };

  const add = async (content: string, files: File[] = []) => {
    setPosting(true);
    try {
      const created = await taskService.addTaskComment(taskId, content);
      await attach(created?.id, files);
      setAll((l) => [created ?? { id: Date.now(), taskId, authorId: 0, authorName: me(), content, commentUpdatedOn: new Date().toISOString() }, ...l]);
      return true;
    } catch (err) {
      showError(err, 'Failed to post comment');
      return false;
    } finally {
      setPosting(false);
    }
  };

  const addReply = (parent: TaskComment) => async (content: string, files: File[] = []) => {
    setReplyBusy(true);
    try {
      const created = await taskService.replyToTaskComment(parent.id, taskId, content);
      await attach(created?.id, files);
      // always pin the reply to the comment it was written under, whatever depth that is
      const reply: TaskComment = {
        ...(created ?? { id: Date.now(), taskId, authorId: 0, authorName: me(), content, commentUpdatedOn: new Date().toISOString() }),
        parentCommentId: parent.id,
      };
      setReplies((m) => ({ ...m, [parent.id]: [...(m[parent.id] ?? []), reply] }));
      patch(parent.id, (x) => ({ ...x, replyCount: (x.replyCount ?? 0) + 1 }));
      setReplyingTo(null);
      setExpanded((s) => new Set(s).add(parent.id));
      return true;
    } catch (err) {
      showError(err, 'Failed to post reply');
      return false;
    } finally {
      setReplyBusy(false);
    }
  };

  const edit = (c: TaskComment) => async (content: string) => {
    try {
      const updated = await taskService.updateTaskComment(c.id, taskId, content);
      patch(c.id, (x) => ({ ...x, ...(updated ?? {}), content, commentUpdatedOn: updated?.commentUpdatedOn ?? new Date().toISOString() }));
      toast.success('Comment updated');
      return true;
    } catch (err) {
      showError(err, 'Failed to update comment');
      return false;
    }
  };

  const remove = async (c: TaskComment, parentId?: number) => {
    if (removing) return;
    setRemoving(c.id);
    try {
      await taskService.deleteTaskComment(c.id);
      if (parentId) {
        setReplies((m) => {
          const { [c.id]: _gone, ...rest } = m; // its own sub-thread goes with it
          return { ...rest, [parentId]: (rest[parentId] ?? []).filter((x) => x.id !== c.id) };
        });
        patch(parentId, (x) => ({ ...x, replyCount: Math.max(0, (x.replyCount ?? 1) - 1) }));
      } else {
        setAll((l) => l.filter((x) => x.id !== c.id));
      }
    } catch (err) {
      showError(err, 'Failed to delete comment');
    } finally {
      setRemoving(null);
    }
  };

  const toggle = async (c: TaskComment) => {
    const open = expanded.has(c.id);
    setExpanded((s) => {
      const n = new Set(s);
      if (open) n.delete(c.id); else n.add(c.id);
      return n;
    });
    if (open || replies[c.id]) return;
    setLoadingReplies((s) => new Set(s).add(c.id));
    try {
      const list = await taskService.getTaskCommentReplies(c.id);
      setReplies((m) => ({ ...m, [c.id]: list.map((r) => ({ ...r, parentCommentId: c.id })) }));
    } catch (err) {
      showError(err, 'Could not load replies');
      setExpanded((s) => { const n = new Set(s); n.delete(c.id); return n; });
    } finally {
      setLoadingReplies((s) => { const n = new Set(s); n.delete(c.id); return n; });
    }
  };

  /** reply box + "N replies" toggle + the replies themselves, recursively — each reply can have its own thread */
  const thread = (c: TaskComment, depth: number): React.ReactNode => {
    const kids = replies[c.id] ?? [];
    const n = replyCountOf(c);
    const open = expanded.has(c.id);
    return (
      <>
        {replyingTo === c.id && (
          <div className="mt-2 animate-fade-in">
            <Composer
              small
              autoFocus
              placeholder={`Reply to ${c.authorName || 'this comment'}…`}
              submitLabel="Reply"
              busy={replyBusy}
              allowFiles
              onSubmit={addReply(c)}
              onCancel={() => setReplyingTo(null)}
              note="Ctrl+Enter to reply"
            />
          </div>
        )}

        {n > 0 && (
          <button
            onClick={() => toggle(c)}
            className="mt-2 inline-flex items-center gap-1.5 h-7 rounded-full border border-primary/30 bg-primary/5 px-3 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
          >
            {loadingReplies.has(c.id)
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {n} {n === 1 ? 'reply' : 'replies'}
          </button>
        )}

        {open && kids.length > 0 && (
          <ul className="mt-3 space-y-3 animate-fade-in">
            {kids.map((r) => (
              <li key={r.id}>
                <Row
                  small
                  comment={r}
                  onReact={react}
                  onReply={() => setReplyingTo(replyingTo === r.id ? null : r.id)}
                  onEdit={edit(r)}
                  onDelete={() => remove(r, c.id)}
                  deleting={removing === r.id}
                  attachVer={attachVer[r.id]}
                />
                {/* indent per level, but stop after a few so deep chains stay readable */}
                <div className={depth < 3 ? 'ml-5 pl-5 border-l-2 border-border/60' : undefined}>{thread(r, depth + 1)}</div>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><MessageSquare className="h-4 w-4" /></span>
        <h4 className="text-[15px] font-bold">Discussion</h4>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold tabular-nums">{total}</span>
        {rows.length > 1 && (
          <div className="ml-auto inline-flex rounded-lg bg-muted p-0.5 text-xs font-semibold">
            {(['new', 'old'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setSort(k)}
                className={cn('rounded-md px-3 py-1 transition-colors', sort === k ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >{k === 'new' ? 'Newest' : 'Oldest'}</button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <ul className="space-y-4" aria-label="Loading comments">
          {[0, 1].map((i) => (
            <li key={i} className="flex gap-3 animate-pulse">
              <span className="h-10 w-10 shrink-0 rounded-full bg-muted" />
              <div className="flex-1 space-y-2 rounded-xl border border-border p-4">
                <div className="h-3 w-32 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>
            </li>
          ))}
        </ul>
      ) : error ? (
        <div className="py-8 text-center text-xs text-destructive">
          Couldn’t load comments. <button onClick={load} className="font-semibold underline">Retry</button>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"><MessageSquare className="h-5 w-5" /></span>
          <p className="text-sm font-semibold">No comments yet</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Start the conversation — share updates, screenshots or files.</p>
        </div>
      ) : (
        <ul className="space-y-5">
          {sorted.map((c) => (
            <li key={c.id}>
              <Row
                comment={c}
                onReact={react}
                onReply={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                onEdit={edit(c)}
                onDelete={() => remove(c)}
                deleting={removing === c.id}
                attachVer={attachVer[c.id]}
              />
              <div className="ml-5 pl-5 border-l-2 border-border/60">{thread(c, 0)}</div>
            </li>
          ))}
        </ul>
      )}

      {/* new comment goes below the existing ones */}
      <div className="border-t border-border pt-5">
        <Composer allowFiles placeholder="Write a comment… paste a screenshot or drop files" submitLabel="Comment" busy={posting} onSubmit={add} note="Ctrl+Enter to post · Ctrl+V to paste images" />
      </div>
    </div>
  );
}
