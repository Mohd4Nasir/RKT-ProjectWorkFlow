import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Eye, File as FileIcon, FileImage, FileSpreadsheet, FileText, Loader2, Paperclip, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { commentAttachmentApi, TaskCommentAttachment, ViewUrlData } from '@/services/fileApiService';
import { FilePreview } from '@/components/FilePreview';
import { downloadFromUrl } from '@/lib/downloadFile';
import { fmtBytes } from './CommentEditor';

/**
 * Files attached to one comment — task-comment-attachment-controller (object store, presigned URLs).
 * The comment list already returns `attachments`, so nothing extra is fetched unless a comment came without them
 * (e.g. replies) or files were just uploaded.
 */

/** upload the chosen files against a freshly created comment; resolves with how many succeeded */
export async function uploadCommentFiles(commentId: number, files: File[]): Promise<number> {
  let ok = 0;
  for (const f of files) {
    try {
      await commentAttachmentApi.upload(commentId, f);
      ok++;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || `Could not upload ${f.name}`);
    }
  }
  return ok;
}

const iconFor = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return FileImage;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx'].includes(ext)) return FileText;
  return FileIcon;
};

const isImage = (name: string) => /\.(png|jpe?g|gif|webp|svg)$/i.test(name);

/** small preview for image attachments, loaded from a presigned view URL */
function Thumb({ commentId, file, Icon }: { commentId: number; file: TaskCommentAttachment; Icon: typeof FileIcon }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!isImage(file.filename)) return;
    let live = true;
    commentAttachmentApi.viewUrl(commentId, file.fileId).then((r) => live && setSrc(r.viewUrl)).catch(() => {});
    return () => { live = false; };
  }, [commentId, file.fileId, file.filename]);
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-primary/10 text-primary">
      {src ? <img src={src} alt="" className="h-full w-full object-cover" onError={() => setSrc(null)} /> : <Icon className="h-4 w-4" />}
    </span>
  );
}

export function CommentAttachments({
  commentId, initial, version = 0,
}: { commentId: number; initial?: TaskCommentAttachment[]; version?: number }) {
  const [files, setFiles] = useState<TaskCommentAttachment[]>(initial ?? []);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setFiles(await commentAttachmentApi.list(commentId));
    } catch { /* keep what we have */ }
  }, [commentId]);

  // optimistic placeholders use Date.now() as id — never ask the server about those
  const real = commentId < 1e12;
  // the task-level comment list may omit or leave `attachments` empty — ask the attachment endpoint directly in that case
  useEffect(() => { if (real && (!initial?.length || version > 0)) load(); }, [load, real, initial, version]);
  useEffect(() => { if (initial?.length) setFiles(initial); }, [initial]);
  const [preview, setPreview] = useState<{ name: string; data: ViewUrlData | null } | null>(null);

  // Esc closes the dialog without also closing the task panel behind it
  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setPreview(null); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [preview]);

  if (!files.length) return null;

  const open = async (f: TaskCommentAttachment, download: boolean) => {
    setBusy(f.fileId);
    try {
      if (download) {
        const { downloadUrl, filename } = await commentAttachmentApi.downloadUrl(commentId, f.fileId);
        await downloadFromUrl(downloadUrl, filename || f.filename);
      } else {
        setPreview({ name: f.filename, data: null });
        try {
          setPreview({ name: f.filename, data: await commentAttachmentApi.viewUrl(commentId, f.fileId) });
        } catch (e) {
          setPreview(null);
          throw e;
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not open file');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (f: TaskCommentAttachment) => {
    if (!window.confirm(`Delete "${f.filename}"?`)) return;
    setBusy(f.fileId);
    try {
      await commentAttachmentApi.remove(commentId, f.fileId);
      setFiles((l) => l.filter((x) => x.fileId !== f.fileId));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not delete file');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-2.5 rounded-md border border-border bg-muted/30 p-2">
      {preview && createPortal(
        <div className="fixed inset-0 z-[500] grid place-items-center bg-black/70 p-4 animate-fade-in" onClick={() => setPreview(null)}>
          <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <FileIcon className="h-4 w-4 text-primary" />
              <h3 className="min-w-0 flex-1 truncate text-sm font-semibold" title={preview.name}>{preview.name}</h3>
              {preview.data && (
                <button
                  type="button"
                  onClick={() => downloadFromUrl(preview.data!.viewUrl, preview.data!.filename || preview.name)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input px-3 text-xs font-semibold hover:bg-muted"
                ><Download className="h-3.5 w-3.5" /> Download</button>
              )}
              <button onClick={() => setPreview(null)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-muted/30 p-3">
              {preview.data ? (
                <FilePreview url={preview.data.viewUrl} filename={preview.data.filename || preview.name} contentType={preview.data.contentType} />
              ) : (
                <div className="grid h-full place-items-center text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading preview…</div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        <Paperclip className="h-3 w-3" /> {files.length} {files.length === 1 ? 'attachment' : 'attachments'}
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {files.map((f) => {
          const Icon = iconFor(f.filename);
          return (
            <li key={f.fileId} className="group/file flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5">
              <button type="button" onClick={() => open(f, false)} title="Preview" className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <Thumb commentId={commentId} file={f} Icon={Icon} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold" title={f.filename}>{f.filename}</div>
                  <div className="text-[10px] text-muted-foreground">{fmtBytes(f.fileSize)}</div>
                </div>
              </button>
              {busy === f.fileId ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <div className="flex gap-0.5 opacity-60 group-hover/file:opacity-100">
                  <button onClick={() => open(f, false)} title="View" className="grid h-6 w-6 place-items-center rounded hover:bg-muted"><Eye className="h-3.5 w-3.5" /></button>
                  <button onClick={() => open(f, true)} title="Download" className="grid h-6 w-6 place-items-center rounded hover:bg-muted"><Download className="h-3.5 w-3.5" /></button>
                  <button onClick={() => remove(f)} title="Delete" className="grid h-6 w-6 place-items-center rounded text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
