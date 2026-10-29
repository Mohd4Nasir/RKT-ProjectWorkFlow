import { useState } from 'react';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { toast }    from 'sonner';
import { FileText, Upload, Search, Trash2, Download, Eye } from 'lucide-react';
import { format }   from 'date-fns';

interface Doc {
  id: string; name: string; size: string;
  uploadedBy: string; uploadedAt: string; type: string;
}

interface Props { projectId: string; }

export function DocumentsTab({ projectId }: Props) {
  const [search, setSearch] = useState('');

  // TODO: Replace with real API fetch
  // useEffect(() => { fetchDocuments(projectId).then(setDocs); }, [projectId]);
  const docs: Doc[] = [];

  const filtered = docs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpload = () => {
    // TODO: open file picker and call upload API
    toast.info('Upload coming soon');
  };

  const handleDelete = (id: string) => {
    // TODO: await documentApiService.delete(id); then refetch
    toast.info('Delete coming soon');
  };

  const handleDownload = (id: string) => {
    // TODO: await documentApiService.getDownloadUrl(id); then open url
    toast.info('Download coming soon');
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Documents</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Project files and attachments</p>
        </div>
        <Button onClick={handleUpload} className="bg-brand-cta hover:bg-brand-cta/90 text-white" size="sm">
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
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-border">
                {['Name', 'Type', 'Size', 'Uploaded By', 'Date', ''].map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
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
                      <FileText className="h-4 w-4 text-info flex-shrink-0" />
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
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(doc.id)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-danger hover:bg-red-50" onClick={() => handleDelete(doc.id)}>
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
    </div>
  );
}