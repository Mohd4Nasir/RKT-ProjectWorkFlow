import { useRef, useState } from 'react';
import { FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ExcelImportReport, projectApiService } from '@/services/projectsApiService';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported?: () => void;
}

export function ImportExcelDialog({ open, onOpenChange, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [skipExisting, setSkipExisting] = useState(true);
  const [mapUsersByName, setMapUsersByName] = useState(true);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ExcelImportReport | null>(null);

  const reset = () => {
    setFile(null);
    setReport(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleOpenChange = (v: boolean) => {
    if (loading) return;
    if (!v) reset();
    onOpenChange(v);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await projectApiService.importFromExcel(file, { skipExisting, mapUsersByName });
      if (res.success === false) {
        toast.error(res.message || 'Import failed');
        return;
      }
      setReport(res.data ?? null);
      toast.success(res.message || 'Excel imported');
      onImported?.();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to import Excel');
    } finally {
      setLoading(false);
    }
  };

  const rows: [string, number, number, number?][] = report
    ? [
        ['Projects', report.totalProjects, report.projectsCreated, report.projectsSkipped],
        ['Tasks', report.totalTasks, report.tasksCreated, report.tasksSkipped],
        ['Comments', report.totalComments, report.commentsCreated],
        ['Attachments', report.totalAttachments, report.attachmentsCreated],
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from Excel</DialogTitle>
          <DialogDescription>Upload an .xlsx file to import projects, tasks and comments.</DialogDescription>
        </DialogHeader>

        {!report ? (
          <div className="space-y-4">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground hover:bg-muted/50"
            >
              {file ? <FileSpreadsheet className="h-6 w-6 text-primary" /> : <Upload className="h-6 w-6" />}
              <span className="break-all">{file ? file.name : 'Click to choose an Excel file'}</span>
            </button>

            <div className="flex items-center gap-2">
              <Checkbox id="skipExisting" checked={skipExisting} onCheckedChange={(v) => setSkipExisting(v === true)} />
              <Label htmlFor="skipExisting">Skip existing projects/tasks</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="mapUsersByName" checked={mapUsersByName} onCheckedChange={(v) => setMapUsersByName(v === true)} />
              <Label htmlFor="mapUsersByName">Map users by name</Label>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <table className="w-full">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1">Type</th><th>Total</th><th>Created</th><th>Skipped</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, total, created, skipped]) => (
                  <tr key={label} className="border-t border-border">
                    <td className="py-1">{label}</td><td>{total}</td><td>{created}</td><td>{skipped ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!!report.warnings?.length && (
              <div className="max-h-24 overflow-auto rounded bg-orange-500/10 p-2 text-xs">
                {report.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
              </div>
            )}
            {!!report.errors?.length && (
              <div className="max-h-24 overflow-auto rounded bg-destructive/10 p-2 text-xs text-destructive">
                {report.errors.map((w, i) => <div key={i}>✖ {w}</div>)}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {report ? (
            <Button onClick={() => handleOpenChange(false)}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>Cancel</Button>
              <Button onClick={handleImport} disabled={!file || loading}>
                {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Import
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
