import { useCallback, useEffect, useRef, useState } from 'react';
import { fileApiService, FileRecord, ViewUrlData, userLabel } from '@/services/fileApiService';
import { FilePreview } from '@/components/FilePreview';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { toast }    from 'sonner';
import { FileText, Upload, Search, Trash2, Download, Eye, X, Pencil } from 'lucide-react';
import { EditDescriptionDialog, FileBadge, UploadDialog, formatSize, type UploadItem } from '@/components/documents/docUi';
import { format }   from 'date-fns';
import { downloadFromUrl } from '@/lib/downloadFile';
import { showError } from '@/lib/errorAlert';

interface Doc {
  id: string; name: string; size: string;
  uploadedBy: string; uploadedAt: string; type: string;
  description: string;
}

const toDoc = (f: FileRecord): Doc => ({
  id: f.fileId,
  name: f.filename,
  size: formatSize(f.fileSize),
  uploadedBy: userLabel(f.uploadedBy),
  uploadedAt: f.uploadedAt,
  type: f.filename.includes('.') ? f.filename.split('.').pop()! : f.contentType,
  description: f.description ?? '',
});

interface Props {
  ownerType: string;           // e.g. 'PROJECT' | 'TASK'
  ownerId: number;
  subtitle?: string;
  className?: string;
  onCount?: (n: number) => void;
}

export function OwnerDocuments({ ownerType, ownerId, subtitle = 'Files and attachments', className = 'p-6 space-y-4', onCount }: Props) {
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<ViewUrlData | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pending, setPending] = useState<File[] | null>(null);
  const [editing, setEditing] = useState<Doc | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<Doc[]>([]);

  const fetchDocs = useCallback(async () => {
    try {
      const files = await fileApiService.listByOwner(ownerType, ownerId);
      setDocs(files.map(toDoc));
    } catch (err: any) {
      showError(err, 'Failed to load documents');
    }
  }, [ownerType, ownerId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setPreviewOpen(false); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [previewOpen]);
  useEffect(() => { onCount?.(docs.length); }, [docs.length, onCount]);

  const filtered = docs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpload = () => fileInputRef.current?.click();

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // allow re-selecting the same file
    if (files.length) setPending(files);
  };

  const doUpload = async (items: UploadItem[], onProgress: (i: number, p: number) => void) => {
    for (let i = 0; i < items.length; i++) {
      const { file, description } = items[i];
      try {
        await fileApiService.uploadFile(ownerType, ownerId, file, (p) => onProgress(i, p), { description });
        toast.success(`${file.name} uploaded`);
      } catch (err) {
        showError(err, `Failed to upload ${file.name}`);
      }
    }
    fetchDocs();
  };

  const saveDescription = async (doc: Doc, description: string) => {
    try {
      await fileApiService.updateFile(doc.id, { description });
      setDocs((cur) => cur.map((d) => (d.id === doc.id ? { ...d, description } : d)));
      toast.success('Description updated');
    } catch (err) {
      showError(err, 'Failed to update description');
      throw err;
    }
  };

  const handleView = async (doc: Doc) => {
    setPreviewName(doc.name);
    setPreview(null);
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      setPreview(await fileApiService.getViewUrl(doc.id));
    } catch (err: any) {
      setPreviewOpen(false);
      showError(err, 'Failed to open file');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDelete = async (doc: Doc) => {
    if (!window.confirm(`Delete "${doc.name}"? This cannot be undone.`)) return;
    try {
      await fileApiService.deleteFile(doc.id);
      toast.success(`${doc.name} deleted`);
      fetchDocs();
    } catch (err: any) {
      showError(err, 'Failed to delete file');
    }
  };

  const handleDownload = async (doc: Doc) => {
    try {
      const { downloadUrl, filename } = await fileApiService.getDownloadUrl(doc.id);
      await downloadFromUrl(downloadUrl, filename || doc.name);
    } catch (err: any) {
      showError(err, 'Failed to download file');
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Documents</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesSelected} />
        <Button onClick={handleUpload} size="sm">
          <Upload className="h-4 w-4 mr-2" /> Upload
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No documents yet</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={handleUpload}>
            <Upload className="h-3.5 w-3.5 mr-1" /> Upload your first file
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-none overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sidebar text-white/80 border-b border-border">
                {['Name', 'Type', 'Size', 'Uploaded By', 'Date', ''].map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-left text-[11px] font-semibold text-white/75 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => (
                <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileBadge name={doc.name} />
                      <div className="min-w-0">
                        <span className="font-medium text-[13px] break-all">{doc.name}</span>
                        {doc.description && (
                          <p className="mt-0.5 max-w-md text-xs text-muted-foreground line-clamp-2" title={doc.description}>{doc.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground uppercase">{doc.type}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{doc.size}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{doc.uploadedBy}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {format(new Date(doc.uploadedAt), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit description" onClick={() => setEditing(doc)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Preview" onClick={() => handleView(doc)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(doc)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => handleDelete(doc)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pending && (
        <UploadDialog
          initialFiles={pending}
          destination={ownerType === 'TASK' ? 'this task' : ownerType === 'ISSUE' ? 'this issue' : undefined}
          onClose={() => setPending(null)}
          onUpload={doUpload}
        />
      )}
      {editing && (
        <EditDescriptionDialog name={editing.name} initial={editing.description} onClose={() => setEditing(null)} onSave={(d) => saveDescription(editing, d)} />
      )}

      {/* Preview dialog - own overlay (z-[300]) so it also shows above the task side panel (z-[101]) */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-[300] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            role="dialog"
            aria-label={previewName}
            className="bg-background rounded-lg shadow-2xl w-[90vw] max-w-5xl h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
              <h4 className="text-sm font-semibold truncate">{previewName}</h4>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-auto p-4">
              {previewLoading || !preview ? (
                <p className="text-sm text-muted-foreground text-center py-16">Loading...</p>
              ) : (
                <FilePreview url={preview.viewUrl} filename={preview.filename} contentType={preview.contentType} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}