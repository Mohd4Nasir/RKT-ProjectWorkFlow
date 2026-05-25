import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Image as ImageIcon, FileArchive, MoreHorizontal, Download, Trash2 } from 'lucide-react';
import { formatDate } from '@/utils/format';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FileItem { id: string; name: string; size: string; type: 'pdf' | 'image' | 'doc' | 'zip'; uploadedAt: string; project: string; uploader: string; }

const initial: FileItem[] = [
  { id: 'f1', name: 'Q3-roadmap.pdf', size: '2.1 MB', type: 'pdf', uploadedAt: '2026-04-22', project: 'Atlas Banking Portal', uploader: 'Aarav Sharma' },
  { id: 'f2', name: 'wireframes-v3.png', size: '4.8 MB', type: 'image', uploadedAt: '2026-04-20', project: 'Atlas Banking Portal', uploader: 'Priya Patel' },
  { id: 'f3', name: 'migration-runbook.docx', size: '320 KB', type: 'doc', uploadedAt: '2026-04-18', project: 'Nimbus Cloud Migration', uploader: 'Isha Kapoor' },
  { id: 'f4', name: 'design-system.zip', size: '12.4 MB', type: 'zip', uploadedAt: '2026-04-12', project: 'Helios CRM Revamp', uploader: 'Sneha Iyer' },
  { id: 'f5', name: 'analytics-spec.pdf', size: '1.6 MB', type: 'pdf', uploadedAt: '2026-04-08', project: 'Vector Analytics', uploader: 'Kabir Mehta' },
];

const tones = {
  pdf: 'bg-danger/10 text-danger',
  image: 'bg-info/10 text-info',
  doc: 'bg-primary-soft text-primary',
  zip: 'bg-warning/10 text-warning',
};
const icons = { pdf: FileText, image: ImageIcon, doc: FileText, zip: FileArchive };

export default function Files() {
  const [files, setFiles] = useState<FileItem[]>(initial);

  const onUpload = () => {
    const f: FileItem = {
      id: 'f' + Date.now(), name: `upload-${files.length + 1}.pdf`, size: '1.2 MB', type: 'pdf',
      uploadedAt: new Date().toISOString().slice(0, 10), project: 'Atlas Banking Portal', uploader: 'You',
    };
    setFiles([f, ...files]);
    toast.success('File uploaded');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Files"
        subtitle="Documents and attachments shared across projects."
        actions={<Button className="bg-gradient-primary shadow-glow" onClick={onUpload}><Upload className="h-4 w-4 mr-1" />Upload</Button>}
      />

      <div
        onClick={onUpload}
        className="card-elevated p-10 border-2 border-dashed border-primary/30 bg-primary-soft/30 text-center cursor-pointer hover:border-primary hover:bg-primary-soft/60 transition"
      >
        <Upload className="h-10 w-10 text-primary mx-auto mb-3" />
        <h3 className="font-display font-bold text-lg">Drop files here or click to upload</h3>
        <p className="text-sm text-muted-foreground mt-1">PDF, PNG, JPG, DOCX, ZIP — up to 20MB each</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((f) => {
          const Icon = icons[f.type];
          return (
            <div key={f.id} className="card-elevated p-5 hover:shadow-elevated transition">
              <div className="flex items-start justify-between mb-3">
                <div className={`stat-icon ${tones[f.type]}`}><Icon className="h-5 w-5" /></div>
                <DropdownMenu>
                  <DropdownMenuTrigger><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem><Download className="h-4 w-4 mr-2" />Download</DropdownMenuItem>
                    <DropdownMenuItem className="text-danger" onClick={() => setFiles(files.filter((x) => x.id !== f.id))}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h4 className="font-semibold truncate">{f.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{f.size} · {f.type.toUpperCase()}</p>
              <div className="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-border">
                <div>{f.project}</div>
                <div className="mt-0.5">By {f.uploader} · {formatDate(f.uploadedAt)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
