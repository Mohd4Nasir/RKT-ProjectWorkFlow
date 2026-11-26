import { useRef, useState } from 'react';
import { AlertCircle, Loader2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fileApiService } from '@/services/fileApiService';
import {
  Issue, IssueSeverity, IssueType, issueService,
} from '@/services/issueService';
import {
  INPUT_CLS, ISSUE_SEVERITIES, ISSUE_TYPES, ModalHeader, ModalShell, SELECT_CLS, SEVERITY_UI, TYPE_UI,
  useAssignable, useIssueLabels,
} from './issueUi';
import { showError, showWarning } from '@/lib/errorAlert';

const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`);

export interface TaskOption { taskId: number; taskTitle: string; listTitle?: string }

interface Props {
  /** set to edit an existing issue; leave out to report a new one */
  issue?: Issue;
  /** the task the issue is reported on. Without it the person picks one from `tasks` */
  taskId?: number;
  tasks?: TaskOption[];
  projectId?: number | string;
  onClose: () => void;
  onSaved: (issue: Issue) => void;
}

/** Report a new issue, or edit title / description / type / severity of an existing one. */
export function IssueFormModal({ issue, taskId, tasks, projectId, onClose, onSaved }: Props) {
  const editing = !!issue;
  const label = useIssueLabels();
  const [pickedTask, setPickedTask] = useState<string>(taskId ? String(taskId) : '');
  const [title, setTitle] = useState(issue?.title ?? '');
  const [description, setDescription] = useState(issue?.description ?? '');
  const [type, setType] = useState<IssueType>(issue?.type ?? 'BUG');
  const [severity, setSeverity] = useState<IssueSeverity>(issue?.severity ?? 'MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [busy, setBusy] = useState(false);
  // files picked while reporting; uploaded right after the issue exists (POST /file/upload-url needs the issue id)
  const [files, setFiles] = useState<File[]>([]);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const ownerTask = taskId ?? (pickedTask ? Number(pickedTask) : undefined);
  const people = useAssignable(editing ? undefined : projectId, editing ? undefined : ownerTask);
  const valid = !!title.trim() && (editing || !!ownerTask);

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      const saved = editing
        ? await issueService.update(issue!.id, { title: title.trim(), description: description.trim(), type, severity })
        : await issueService.create({
            taskId: ownerTask!, title: title.trim(), description: description.trim(), type, severity,
            assigneeId: assigneeId || null,
          });
      toast.success(editing ? 'Issue updated' : 'Issue reported');
      if (!editing && files.length) {
        const failed: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          setUploadMsg(`Uploading ${i + 1}/${files.length}: ${f.name}`);
          try {
            await fileApiService.uploadFile('ISSUE', saved.id, f);
          } catch (e) {
            failed.push(f.name);
            showError(e, `Failed to upload ${f.name}`);
          }
        }
        if (failed.length) showWarning(`Issue reported, but ${failed.length} file(s) failed. Add them again from the issue.`);
        else toast.success(`${files.length} file(s) attached`);
      }
      onSaved(saved);
    } catch (err) {
      showError(err, editing ? 'Failed to update issue' : 'Failed to report issue');
      setBusy(false);
    }
  };

  return (
    <ModalShell onClose={onClose} className="max-w-xl">
      <ModalHeader onClose={onClose}>
        <AlertCircle className="h-4 w-4 shrink-0" />
        <h2 className="truncate text-sm font-bold">{editing ? `Edit issue ISS-${issue!.id}` : 'Report an issue'}</h2>
      </ModalHeader>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 scrollbar-thin">
        {!editing && !taskId && (
          <label className="block text-[11px] font-bold uppercase tracking-wide text-primary/80">
            Task / subtask <span className="text-destructive">*</span>
            <select value={pickedTask} onChange={(e) => { setPickedTask(e.target.value); setAssigneeId(''); }} className={cn(SELECT_CLS, 'mt-1.5 w-full text-sm font-normal normal-case text-foreground')}>
              <option value="">Select the task this issue belongs to…</option>
              {(tasks ?? []).map((t) => (
                <option key={t.taskId} value={t.taskId}>{t.listTitle ? `${t.listTitle} › ` : ''}{t.taskTitle}</option>
              ))}
            </select>
          </label>
        )}

        <label className="block text-[11px] font-bold uppercase tracking-wide text-primary/80">
          Title <span className="text-destructive">*</span>
          <input
            autoFocus value={title} maxLength={255} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Short summary of the problem"
            className={cn(INPUT_CLS, 'mt-1.5 font-normal normal-case text-foreground')}
          />
        </label>

        <label className="block text-[11px] font-bold uppercase tracking-wide text-primary/80">
          Description
          <textarea
            value={description} rows={5} onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened? Steps to reproduce, expected vs. actual result…"
            className={cn(INPUT_CLS, 'mt-1.5 resize-y font-normal normal-case text-foreground')}
          />
        </label>

        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-primary/80">Type</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ISSUE_TYPES.map((t) => {
              const ui = TYPE_UI[t];
              const Icon = ui.icon;
              const on = type === t;
              return (
                <button
                  key={t} type="button" onClick={() => setType(t)} aria-pressed={on}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors',
                    on ? cn(ui.chip, 'ring-2 ring-primary/30') : 'border-border bg-card text-muted-foreground hover:bg-muted',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {label('type', t)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-primary/80">Severity</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ISSUE_SEVERITIES.map((s) => {
              const ui = SEVERITY_UI[s];
              const on = severity === s;
              return (
                <button
                  key={s} type="button" onClick={() => setSeverity(s)} aria-pressed={on}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors',
                    on ? cn(ui.chip, 'ring-2 ring-primary/30') : 'border-border bg-card text-muted-foreground hover:bg-muted',
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', ui.dot)} /> {label('severity', s)}
                </button>
              );
            })}
          </div>
        </div>

        {!editing && (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-primary/80">
              <span>Attachments <span className="font-medium normal-case tracking-normal text-muted-foreground">(optional)</span></span>
              <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs normal-case" disabled={busy} onClick={() => fileInput.current?.click()}>
                <Paperclip className="h-3.5 w-3.5" /> Add files
              </Button>
              <input
                ref={fileInput} type="file" multiple className="hidden"
                onChange={(e) => { const picked = Array.from(e.target.files ?? []); e.target.value = ''; setFiles((l) => [...l, ...picked]); }}
              />
            </div>
            {files.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">Screenshots, logs or recordings help to reproduce the problem.</p>
            ) : (
              <ul className="space-y-1.5">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate font-medium" title={f.name}>{f.name}</span>
                    <span className="shrink-0 text-muted-foreground">{fmtSize(f.size)}</span>
                    <button type="button" disabled={busy} onClick={() => setFiles((l) => l.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}
                      className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-50"><X className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!editing && (
          <label className="block text-[11px] font-bold uppercase tracking-wide text-primary/80">
            Assign to <span className="font-medium normal-case tracking-normal text-muted-foreground">(optional)</span>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={cn(SELECT_CLS, 'mt-1.5 w-full text-sm font-normal normal-case text-foreground')}>
              <option value="">Unassigned</option>
              {people.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button size="sm" onClick={submit} disabled={!valid || busy}>
          {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          {busy && uploadMsg ? uploadMsg : editing ? 'Save changes' : 'Report issue'}
        </Button>
      </footer>
    </ModalShell>
  );
}
