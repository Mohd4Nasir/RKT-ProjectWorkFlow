import { useCallback, useEffect, useRef, useState } from 'react';
import { fileApiService, FileRecord, ViewUrlData } from '@/services/fileApiService';
import { FilePreview } from '@/components/FilePreview';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { toast }    from 'sonner';
import { FileText, Upload, Search, Trash2, Download, Eye, X } from 'lucide-react';
import { format }   from 'date-fns';
import { downloadFromUrl } from '@/lib/downloadFile';

interface Doc {
  id: string; name: string; size: string;
  uploadedBy: string; uploadedAt: string; type: string;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const toDoc = (f: FileRecord): Doc => ({
  id: f.fileId,
  name: f.filename,
  size: formatSize(f.fileSize),
  // API only returns the user id
  uploadedBy: `User #${f.uploadedBy}`,
  uploadedAt: f.uploadedAt,
  type: f.filename.includes('.') ? f.filename.split('.').pop()! : f.contentType,
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
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<Doc[]>([]);

  const fetchDocs = useCallback(async () => {
    try {
      const files = await fileApiService.listByOwner(ownerType, ownerId);
      setDocs(files.map(toDoc));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load documents');
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

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // allow re-selecting the same file
    if (!files.length) return;

    setUploading(true);
    for (const file of files) {
      setProgress(0);
      try {
        await fileApiService.uploadFile(ownerType, ownerId, file, setProgress);
        toast.success(`${file.name} uploaded`);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err?.message || `Failed to upload ${file.name}`);
      }
    }
    setUploading(false);
    fetchDocs();
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
      toast.error(err?.response?.data?.message || err?.message || 'Failed to open file');
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
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete file');
    }
  };

  const handleDownload = async (doc: Doc) => {
    try {
      const { downloadUrl, filename } = await fileApiService.getDownloadUrl(doc.id);
      await downloadFromUrl(downloadUrl, filename || doc.name);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to download file');
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
        <Button onClick={handleUpload} size="sm" disabled={uploading}>
          <Upload className="h-4 w-4 mr-2" /> {uploading ? `Uploading ${progress}%` : 'Upload'}
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
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="font-medium text-[13px]">{doc.name}</span>
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
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleView(doc)}>
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