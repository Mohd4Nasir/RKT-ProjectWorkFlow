import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  ChevronRight, Download, Eye, Folder, FolderInput, FolderOpen, FolderPlus, Home, ListTree, MoreVertical,
  Pencil, Search, Trash2, Upload, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FilePreview } from '@/components/FilePreview';
import { cn } from '@/lib/utils';
import { downloadFromUrl } from '@/lib/downloadFile';
import { isObserver, isPrivileged, useMyProjectAccess } from '@/hooks/useMyProjectAccess';
import {
  fileApiService, folderApiService, MAX_FOLDER_DEPTH, userLabel,
  type DocumentFolder, type FileRecord, type ProjectDocuments as Listing, type ViewUrlData,
} from '@/services/fileApiService';
import {
  DescriptionField, EditDescriptionDialog, FileBadge, Modal, UploadDialog, formatSize, type UploadItem,
} from './docUi';
import { getErrorMessage, showError } from '@/lib/errorAlert';

interface Props { projectId: string }


const when = (iso?: string) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d.getTime()) ? format(d, 'dd MMM yyyy') : '';
};

type Row =
  | { kind: 'folder'; id: string; folder: DocumentFolder }
  | { kind: 'file'; id: string; file: FileRecord };

/* ───────────── component ───────────── */

export function ProjectDocuments({ projectId }: Props) {
  const [params, setParams] = useSearchParams();
  const folderId = params.get('folder');
  const withTasks = params.get('tasks') === '1';

  const me = useMyProjectAccess(projectId);
  const observer = isObserver(me.role);
  const privileged = isPrivileged(me.role);

  const [data, setData] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dragOver, setDragOver] = useState<string | null>(null); // folderId | 'root' | '__upload'
  const fileInput = useRef<HTMLInputElement>(null);

  const [uploadFiles, setUploadFiles] = useState<File[] | null>(null);
  const [folderForm, setFolderForm] = useState<{ mode: 'create' } | { mode: 'edit'; folder: DocumentFolder } | null>(null);
  const [editDesc, setEditDesc] = useState<FileRecord | null>(null);
  const [moving, setMoving] = useState<Row | null>(null);
  const [preview, setPreview] = useState<{ name: string; data: ViewUrlData | null } | null>(null);

  const go = useCallback((id: string | null, tasks = withTasks) => {
    const next = new URLSearchParams(params);
    next.set('tab', 'documents');
    if (id) next.set('folder', id); else next.delete('folder');
    if (tasks && !id) next.set('tasks', '1'); else next.delete('tasks');
    setSearch('');
    setParams(next);
  }, [params, setParams, withTasks]);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      setData(await fileApiService.listProject(projectId, { folderId, includeTaskFiles: withTasks && !folderId }));
    } catch (err) {
      showError(err, 'Failed to load documents');
      // a stale / foreign folder id in the URL: fall back to the root
      if (folderId) go(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, folderId, withTasks, go]);

  useEffect(() => { load(); }, [load]);

  const depth = data?.breadcrumb.length ?? 0;
  const atMaxDepth = depth >= MAX_FOLDER_DEPTH;
  const currentName = data?.breadcrumb[depth - 1]?.name ?? 'Documents';
  const parentName = depth >= 2 ? data!.breadcrumb[depth - 2].name : 'Documents';

  const canManageFile = (f: FileRecord) => privileged || (me.userId != null && f.uploadedBy?.userId === me.userId);
  const canDeleteFolder = (f: DocumentFolder) => privileged || (me.userId != null && f.createdBy?.userId === me.userId);

  const q = search.trim().toLowerCase();
  const rows: Row[] = useMemo(() => {
    if (!data) return [];
    const match = (...t: (string | null | undefined)[]) => !q || t.some((x) => x?.toLowerCase().includes(q));
    return [
      ...data.folders.filter((f) => match(f.name, f.description)).map((folder): Row => ({ kind: 'folder', id: folder.folderId, folder })),
      ...data.files.filter((f) => match(f.filename, f.description)).map((file): Row => ({ kind: 'file', id: file.fileId, file })),
    ];
  }, [data, q]);
  const taskFiles = useMemo(
    () => (data?.taskFiles ?? []).filter((f) => !q || f.filename.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q)),
    [data, q],
  );

  /* ───── actions ───── */

  const doUpload = async (items: UploadItem[], onProgress: (i: number, p: number) => void) => {
    for (let i = 0; i < items.length; i++) {
      const { file, description } = items[i];
      try {
        await fileApiService.uploadFile('PROJECT', Number(projectId), file, (p) => onProgress(i, p), { description, folderId });
        toast.success(`${file.name} uploaded`);
      } catch (err) {
        showError(err, `Failed to upload ${file.name}`);
      }
    }
    load(true);
  };

  const view = async (f: FileRecord) => {
    setPreview({ name: f.filename, data: null });
    try {
      setPreview({ name: f.filename, data: await fileApiService.getViewUrl(f.fileId) });
    } catch (err) {
      setPreview(null);
      showError(err, 'Failed to open file');
    }
  };

  const download = async (f: FileRecord) => {
    try {
      const { downloadUrl, filename } = await fileApiService.getDownloadUrl(f.fileId);
      await downloadFromUrl(downloadUrl, filename || f.filename);
    } catch (err) {
      showError(err, 'Failed to download file');
    }
  };

  const removeFile = async (f: FileRecord) => {
    if (!window.confirm(`Delete "${f.filename}"? This cannot be undone.`)) return;
    try {
      await fileApiService.deleteFile(f.fileId);
      toast.success(`${f.filename} deleted`);
      load(true);
    } catch (err) {
      showError(err, 'Failed to delete file');
    }
  };

  const removeFolder = async (f: DocumentFolder) => {
    try {
      await folderApiService.remove(projectId, f.folderId, false);
      toast.success(`Folder "${f.name}" deleted`);
      load(true);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((err as any)?.response?.status === 409 && /not empty/i.test(getErrorMessage(err, ''))) {
        const target = f.parentFolderId ? parentName : 'Documents';
        if (!window.confirm(`"${f.name}" is not empty.\n\nDelete the folder and move its contents to "${target}"? No files will be deleted.`)) return;
        try {
          await folderApiService.remove(projectId, f.folderId, true);
          toast.success(`Folder "${f.name}" deleted, contents moved to ${target}`);
          load(true);
        } catch (e2) {
          showError(e2, 'Failed to delete folder');
        }
      } else {
        showError(err, 'Failed to delete folder');
      }
    }
  };

  /** drag a row onto a folder / breadcrumb crumb */
  const dropOn = async (target: string | null, payload: string) => {
    setDragOver(null);
    const [kind, id] = payload.split(':');
    try {
      if (kind === 'file') {
        await fileApiService.updateFile(id, target ? { folderId: target } : { moveToRoot: true });
      } else if (kind === 'folder') {
        if (id === target) return;
        await folderApiService.move(projectId, id, target);
      } else return;
      toast.success('Moved');
      load(true);
    } catch (err) {
      showError(err, 'Failed to move');
    }
  };

  const empty = !loading && rows.length === 0 && taskFiles.length === 0;

  /* ───── render ───── */

  const crumbDrop = (target: string | null) => ({
    onDragOver: (e: React.DragEvent) => { if (e.dataTransfer.types.includes('text/x-doc')) { e.preventDefault(); setDragOver(target ?? 'root'); } },
    onDragLeave: () => setDragOver(null),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); const p = e.dataTransfer.getData('text/x-doc'); if (p) dropOn(target, p); },
  });

  return (
    <div
      className="space-y-4 p-6"
      onDragOver={(e) => { if (!observer && e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDragOver('__upload'); } }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver((d) => (d === '__upload' ? null : d)); }}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setDragOver(null);
        if (!observer) setUploadFiles(Array.from(e.dataTransfer.files));
      }}
    >
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">Documents</h3>
          <nav aria-label="Folder path" className="mt-1 flex flex-wrap items-center gap-1 text-sm">
            <button
              type="button"
              onClick={() => go(null)}
              {...crumbDrop(null)}
              className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted', !folderId ? 'font-semibold text-foreground' : 'text-muted-foreground', dragOver === 'root' && 'bg-primary/15 ring-1 ring-primary')}
            >
              <Home className="h-3.5 w-3.5" /> Documents
            </button>
            {(data?.breadcrumb ?? []).map((c, i, arr) => (
              <span key={c.folderId} className="inline-flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                <button
                  type="button"
                  disabled={i === arr.length - 1}
                  onClick={() => go(c.folderId)}
                  {...crumbDrop(c.folderId)}
                  className={cn('rounded-md px-1.5 py-0.5 transition-colors', i === arr.length - 1 ? 'font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted', dragOver === c.folderId && 'bg-primary/15 ring-1 ring-primary')}
                >
                  {c.name}
                </button>
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ''; if (f.length) setUploadFiles(f); }} />
          {!observer && (
            <>
              <span title={atMaxDepth ? `Folders can be nested up to ${MAX_FOLDER_DEPTH} levels` : undefined}>
                <Button variant="outline" size="sm" disabled={atMaxDepth} onClick={() => setFolderForm({ mode: 'create' })}>
                  <FolderPlus className="mr-1.5 h-4 w-4" /> New folder
                </Button>
              </span>
              <Button size="sm" onClick={() => fileInput.current?.click()}>
                <Upload className="mr-1.5 h-4 w-4" /> Upload
              </Button>
            </>
          )}
        </div>
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search in this folder…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-sm" />
        </div>
        {!folderId && (
          <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" className="accent-primary" checked={withTasks} onChange={(e) => go(null, e.target.checked)} />
            <ListTree className="h-3.5 w-3.5" /> Include task files
          </label>
        )}
      </div>

      {/* drop zone hint */}
      {dragOver === '__upload' && (
        <div className="rounded-xl border-2 border-dashed border-primary bg-primary/5 py-6 text-center text-sm font-medium text-primary">
          Drop files to upload to “{currentName}”
        </div>
      )}

      {/* listing */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/60" />)}
        </div>
      ) : empty ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <FolderOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm font-medium">{q ? 'No matches in this folder' : 'This folder is empty'}</p>
          {!q && !observer && <p className="mt-1 text-xs text-muted-foreground">Upload a file, drop files here, or create a folder.</p>}
          {!q && !observer && (
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={atMaxDepth} onClick={() => setFolderForm({ mode: 'create' })}><FolderPlus className="mr-1.5 h-3.5 w-3.5" /> New folder</Button>
              <Button size="sm" onClick={() => fileInput.current?.click()}><Upload className="mr-1.5 h-3.5 w-3.5" /> Upload</Button>
            </div>
          )}
        </div>
      ) : (
        <>
          {rows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-sidebar">
                    {['Name', 'Size', 'Uploaded by', 'Date', ''].map((h, i) => (
                      <th key={i} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/75">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isFolder = row.kind === 'folder';
                    const f = isFolder ? row.folder : null;
                    const file = row.kind === 'file' ? row.file : null;
                    const manageFile = file ? canManageFile(file) : false;
                    const mayEdit = isFolder ? !observer : manageFile;
                    const mayDelete = isFolder ? canDeleteFolder(f!) : manageFile;
                    const desc = isFolder ? f!.description : file!.description;
                    return (
                      <tr
                        key={row.id}
                        draggable={mayEdit}
                        onDragStart={(e) => { e.dataTransfer.setData('text/x-doc', `${row.kind}:${row.id}`); e.dataTransfer.effectAllowed = 'move'; }}
                        onDragOver={isFolder && !observer ? (e) => { if (e.dataTransfer.types.includes('text/x-doc')) { e.preventDefault(); setDragOver(row.id); } } : undefined}
                        onDragLeave={isFolder ? () => setDragOver(null) : undefined}
                        onDrop={isFolder && !observer ? (e) => { const p = e.dataTransfer.getData('text/x-doc'); if (p) { e.preventDefault(); e.stopPropagation(); dropOn(row.id, p); } } : undefined}
                        onDoubleClick={() => (isFolder ? go(f!.folderId) : view(file!))}
                        className={cn('group border-b border-border transition-colors last:border-0 hover:bg-muted/40', dragOver === row.id && 'bg-primary/10 ring-1 ring-inset ring-primary')}
                      >
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => (isFolder ? go(f!.folderId) : view(file!))}
                            className="flex w-full items-center gap-2.5 text-left"
                          >
                            {isFolder ? (
                              <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500"><Folder className="h-4 w-4 fill-current" /></span>
                            ) : (
                              <FileBadge name={file!.filename} />
                            )}
                            <span className="min-w-0">
                              <span className="block break-all text-[13px] font-medium group-hover:text-primary">{isFolder ? f!.name : file!.filename}</span>
                              {desc && <span className="mt-0.5 block max-w-xl text-xs text-muted-foreground line-clamp-1" title={desc}>{desc}</span>}
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{isFolder ? '—' : formatSize(file!.fileSize)}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {(isFolder ? f!.createdBy : file!.uploadedBy)?.userId === me.userId ? 'You' : userLabel(isFolder ? f!.createdBy : file!.uploadedBy)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">{when(isFolder ? f!.createdAt : file!.uploadedAt)}</td>
                        <td className="px-2 py-2.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Actions"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {isFolder ? (
                                <DropdownMenuItem onClick={() => go(f!.folderId)}><FolderOpen className="mr-2 h-4 w-4" /> Open</DropdownMenuItem>
                              ) : (
                                <>
                                  <DropdownMenuItem onClick={() => view(file!)}><Eye className="mr-2 h-4 w-4" /> Preview</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => download(file!)}><Download className="mr-2 h-4 w-4" /> Download</DropdownMenuItem>
                                </>
                              )}
                              {mayEdit && <DropdownMenuSeparator />}
                              {isFolder && !observer && (
                                <DropdownMenuItem onClick={() => setFolderForm({ mode: 'edit', folder: f! })}><Pencil className="mr-2 h-4 w-4" /> Rename / edit</DropdownMenuItem>
                              )}
                              {!isFolder && manageFile && (
                                <DropdownMenuItem onClick={() => setEditDesc(file!)}><Pencil className="mr-2 h-4 w-4" /> Edit description</DropdownMenuItem>
                              )}
                              {mayEdit && (
                                <DropdownMenuItem onClick={() => setMoving(row)}><FolderInput className="mr-2 h-4 w-4" /> Move to…</DropdownMenuItem>
                              )}
                              {mayDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => (isFolder ? removeFolder(f!) : removeFile(file!))}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!observer && rows.length > 0 && <p className="text-[11px] text-muted-foreground">Tip: drag files or folders onto a folder or the path above to move them. Drop files from your computer to upload.</p>}

          {withTasks && !folderId && taskFiles.length > 0 && (
            <section>
              <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ListTree className="h-3.5 w-3.5" /> From tasks <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{taskFiles.length}</span>
              </h4>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {taskFiles.map((f) => (
                  <li key={f.fileId} className="flex items-center gap-3 px-4 py-2.5">
                    <FileBadge name={f.filename} />
                    <div className="min-w-0 flex-1">
                      <p className="break-all text-[13px] font-medium">{f.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        <button type="button" className="font-medium text-primary hover:underline" onClick={() => { const n = new URLSearchParams(params); n.set('tab', 'tasks'); n.set('task', String(f.ownerId)); n.set('panel', 'documents'); n.delete('folder'); n.delete('tasks'); setParams(n); }}>
                          Task #{f.ownerId}
                        </button>
                        {f.description ? ` · ${f.description}` : ''}
                      </p>
                    </div>
                    <span className="hidden text-xs text-muted-foreground sm:block">{formatSize(f.fileSize)}</span>
                    <span className="hidden text-xs text-muted-foreground sm:block">{when(f.uploadedAt)}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Preview" onClick={() => view(f)}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Download" onClick={() => download(f)}><Download className="h-3.5 w-3.5" /></Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* dialogs */}
      {uploadFiles && (
        <UploadDialog
          initialFiles={uploadFiles}
          destination={depth ? ['Documents', ...data!.breadcrumb.map((b) => b.name)].join(' › ') : 'Documents'}
          onClose={() => setUploadFiles(null)}
          onUpload={doUpload}
        />
      )}

      {folderForm && (
        <FolderDialog
          mode={folderForm.mode}
          folder={folderForm.mode === 'edit' ? folderForm.folder : undefined}
          where={depth ? currentName : 'Documents'}
          onClose={() => setFolderForm(null)}
          onSubmit={async (name, description) => {
            try {
              if (folderForm.mode === 'create') {
                await folderApiService.create(projectId, { name, description: description || undefined, parentFolderId: folderId });
                toast.success(`Folder "${name}" created`);
              } else {
                const cur = folderForm.folder;
                const body: { name?: string; description?: string } = {};
                if (name !== cur.name) body.name = name;
                if (description !== (cur.description ?? '')) body.description = description;
                await folderApiService.update(projectId, cur.folderId, body);
                toast.success('Folder updated');
              }
              load(true);
            } catch (err) {
              showError(err, 'Failed to save folder');
              throw err;
            }
          }}
        />
      )}

      {editDesc && (
        <EditDescriptionDialog
          name={editDesc.filename}
          initial={editDesc.description}
          onClose={() => setEditDesc(null)}
          onSave={async (description) => {
            try {
              await fileApiService.updateFile(editDesc.fileId, { description });
              toast.success('Description updated');
              load(true);
            } catch (err) {
              showError(err, 'Failed to update description');
              throw err;
            }
          }}
        />
      )}

      {moving && (
        <MoveDialog
          projectId={projectId}
          row={moving}
          onClose={() => setMoving(null)}
          onMove={async (target) => {
            try {
              if (moving.kind === 'file') await fileApiService.updateFile(moving.id, target ? { folderId: target } : { moveToRoot: true });
              else await folderApiService.move(projectId, moving.id, target);
              toast.success('Moved');
              load(true);
            } catch (err) {
              showError(err, 'Failed to move');
              throw err;
            }
          }}
        />
      )}

      {preview && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <div role="dialog" aria-label={preview.name} className="flex h-[85vh] w-[90vw] max-w-5xl flex-col rounded-lg bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h4 className="truncate text-sm font-semibold">{preview.name}</h4>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreview(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              {!preview.data ? <p className="py-16 text-center text-sm text-muted-foreground">Loading...</p>
                : <FilePreview url={preview.data.viewUrl} filename={preview.data.filename} contentType={preview.data.contentType} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────── new folder / rename+description ───────────── */

function FolderDialog({
  mode, folder, where, onClose, onSubmit,
}: {
  mode: 'create' | 'edit'; folder?: DocumentFolder; where: string;
  onClose: () => void; onSubmit: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = useState(folder?.name ?? '');
  const [description, setDescription] = useState(folder?.description ?? '');
  const [busy, setBusy] = useState(false);
  const trimmed = name.trim();
  const changed = mode === 'create' || trimmed !== folder?.name || description.trim() !== (folder?.description ?? '').trim();

  const submit = async () => {
    if (!trimmed) return;
    setBusy(true);
    try { await onSubmit(trimmed, description.trim()); onClose(); } catch { /* toast already shown */ } finally { setBusy(false); }
  };

  return (
    <Modal
      title={mode === 'create' ? 'New folder' : 'Edit folder'}
      subtitle={mode === 'create' ? `in ${where}` : folder?.name}
      onClose={onClose}
      footer={(
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={busy || !trimmed || !changed}>{busy ? 'Saving…' : mode === 'create' ? 'Create folder' : 'Save'}</Button>
        </>
      )}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Folder name</label>
          <Input
            autoFocus
            value={name}
            maxLength={255}
            placeholder="e.g. Contracts"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Description <span className="font-normal">(optional)</span></label>
          <DescriptionField value={description} onChange={setDescription} rows={3} placeholder="What goes in this folder?" />
        </div>
      </div>
    </Modal>
  );
}

/* ───────────── "Move to…" folder picker (drill-down, reuses the listing endpoint) ───────────── */

function MoveDialog({
  projectId, row, onClose, onMove,
}: { projectId: string; row: Row; onClose: () => void; onMove: (target: string | null) => Promise<void> }) {
  const [at, setAt] = useState<string | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    setLoading(true);
    fileApiService.listProject(projectId, { folderId: at })
      .then((d) => live && setListing(d))
      .catch((err) => showError(err, 'Failed to load folders'))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [projectId, at]);

  const moveId = row.id;
  const isFolder = row.kind === 'folder';
  const currentParent = isFolder ? row.folder.parentFolderId : row.file.folderId ?? null;
  const name = isFolder ? row.folder.name : row.file.filename;
  const crumbs = listing?.breadcrumb ?? [];
  // dropping a folder here would put it at depth+1: block when that goes past the limit
  const full = crumbs.length >= MAX_FOLDER_DEPTH && isFolder;
  const sameSpot = (at ?? null) === (currentParent ?? null);
  // can't move a folder into itself; its subtree is rejected by the server with a readable message
  const inside = isFolder && crumbs.some((c) => c.folderId === moveId);

  const confirm = async () => {
    setBusy(true);
    try { await onMove(at); onClose(); } catch { /* toast shown */ } finally { setBusy(false); }
  };

  return (
    <Modal
      wide
      title={`Move ${isFolder ? 'folder' : 'file'}`}
      subtitle={name}
      onClose={onClose}
      footer={(
        <>
          <span className="mr-auto truncate text-xs text-muted-foreground">
            Destination: <b className="text-foreground">{crumbs.length ? crumbs[crumbs.length - 1].name : 'Documents'}</b>
          </span>
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button size="sm" onClick={confirm} disabled={busy || sameSpot || full || inside}>{busy ? 'Moving…' : 'Move here'}</Button>
        </>
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-1 text-xs">
        <button type="button" onClick={() => setAt(null)} className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-muted', !at && 'font-semibold')}><Home className="h-3 w-3" /> Documents</button>
        {crumbs.map((c) => (
          <span key={c.folderId} className="inline-flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
            <button type="button" onClick={() => setAt(c.folderId)} className={cn('rounded px-1.5 py-0.5 hover:bg-muted', c.folderId === at && 'font-semibold')}>{c.name}</button>
          </span>
        ))}
      </div>

      <div className="min-h-[160px] rounded-lg border border-border">
        {loading ? (
          <p className="py-10 text-center text-xs text-muted-foreground">Loading…</p>
        ) : (listing?.folders.length ?? 0) === 0 ? (
          <p className="py-10 text-center text-xs text-muted-foreground">No subfolders here. You can move it into this location.</p>
        ) : (
          <ul className="divide-y divide-border">
            {listing!.folders.map((f) => {
              const self = isFolder && f.folderId === moveId;
              return (
                <li key={f.folderId}>
                  <button
                    type="button"
                    disabled={self}
                    onClick={() => setAt(f.folderId)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Folder className="h-4 w-4 flex-shrink-0 fill-amber-500/80 text-amber-500" />
                    <span className="flex-1 truncate">{f.name}</span>
                    {self ? <span className="text-[10px] text-muted-foreground">moving this</span> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {full && <p className="mt-2 text-xs text-amber-600">Folders can be nested only {MAX_FOLDER_DEPTH} levels deep, so it can't go in here.</p>}
      {inside && <p className="mt-2 text-xs text-amber-600">A folder can't be moved into itself.</p>}
      {sameSpot && !full && !inside && <p className="mt-2 text-xs text-muted-foreground">It's already in this location.</p>}
    </Modal>
  );
}
