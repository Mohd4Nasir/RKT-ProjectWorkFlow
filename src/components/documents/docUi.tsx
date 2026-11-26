import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  File as FileIcon, FileArchive, FileAudio, FileCode, FileImage, FileSpreadsheet, FileText, FileVideo,
  Presentation, Upload, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MAX_DESCRIPTION } from '@/services/fileApiService';

/* ───────────── helpers ───────────── */

export const formatSize = (bytes: number) => {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const extOf = (name: string) => (name.includes('.') ? name.split('.').pop()!.toLowerCase() : '');

/** icon + colour for a file, picked from its extension */
export function fileVisual(name: string): { Icon: typeof FileIcon; tone: string } {
  const e = extOf(name);
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(e)) return { Icon: FileImage, tone: 'text-violet-500 bg-violet-500/10' };
  if (['pdf'].includes(e)) return { Icon: FileText, tone: 'text-rose-500 bg-rose-500/10' };
  if (['doc', 'docx', 'txt', 'rtf', 'md'].includes(e)) return { Icon: FileText, tone: 'text-blue-500 bg-blue-500/10' };
  if (['xls', 'xlsx', 'csv'].includes(e)) return { Icon: FileSpreadsheet, tone: 'text-emerald-500 bg-emerald-500/10' };
  if (['ppt', 'pptx'].includes(e)) return { Icon: Presentation, tone: 'text-orange-500 bg-orange-500/10' };
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) return { Icon: FileArchive, tone: 'text-amber-500 bg-amber-500/10' };
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(e)) return { Icon: FileVideo, tone: 'text-pink-500 bg-pink-500/10' };
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(e)) return { Icon: FileAudio, tone: 'text-cyan-500 bg-cyan-500/10' };
  if (['js', 'ts', 'tsx', 'jsx', 'json', 'html', 'css', 'xml', 'yml', 'yaml', 'java', 'py', 'sql'].includes(e)) return { Icon: FileCode, tone: 'text-slate-500 bg-slate-500/10' };
  return { Icon: FileIcon, tone: 'text-slate-500 bg-slate-500/10' };
}

export function FileBadge({ name, className }: { name: string; className?: string }) {
  const { Icon, tone } = fileVisual(name);
  return (
    <span className={cn('inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg', tone, className)}>
      <Icon className="h-4 w-4" />
    </span>
  );
}

/* ───────────── modal shell (z-[300]: also shows above the task side panel) ───────────── */

export function Modal({
  title, subtitle, onClose, children, footer, wide,
}: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[1px]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn('flex max-h-[88vh] w-full flex-col rounded-xl border border-border bg-background shadow-2xl', wide ? 'max-w-xl' : 'max-w-md')}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold">{title}</h4>
            {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="icon" className="-mr-2 h-7 w-7 flex-shrink-0" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/* ───────────── description textarea with a live counter ───────────── */

export function DescriptionField({
  value, onChange, placeholder = 'Add a short description (optional)', rows = 3, autoFocus,
}: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; autoFocus?: boolean }) {
  const left = MAX_DESCRIPTION - value.length;
  return (
    <div>
      <textarea
        autoFocus={autoFocus}
        rows={rows}
        value={value}
        maxLength={MAX_DESCRIPTION}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-shadow placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30"
      />
      <div className={cn('mt-0.5 text-right text-[10px] tabular-nums', left < 50 ? 'text-amber-600' : 'text-muted-foreground')}>
        {value.length} / {MAX_DESCRIPTION}
      </div>
    </div>
  );
}

/* ───────────── "edit description" dialog ───────────── */

export function EditDescriptionDialog({
  name, initial, onClose, onSave,
}: { name: string; initial?: string | null; onClose: () => void; onSave: (description: string) => Promise<void> }) {
  const [text, setText] = useState(initial ?? '');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await onSave(text.trim()); onClose(); } finally { setBusy(false); }
  };
  return (
    <Modal
      title="Edit description"
      subtitle={name}
      onClose={onClose}
      footer={(
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={busy || text.trim() === (initial ?? '').trim()}>{busy ? 'Saving…' : 'Save'}</Button>
        </>
      )}
    >
      <DescriptionField value={text} onChange={setText} autoFocus rows={4} />
      {!!initial && <p className="mt-1 text-[11px] text-muted-foreground">Save an empty description to clear it.</p>}
    </Modal>
  );
}

/* ───────────── upload dialog: every chosen file with its own description ───────────── */

export interface UploadItem { file: File; description: string }

export function UploadDialog({
  initialFiles, destination, onClose, onUpload,
}: {
  initialFiles: File[];
  /** e.g. "Documents › Contracts" */
  destination?: string;
  onClose: () => void;
  onUpload: (items: UploadItem[], onProgress: (index: number, percent: number) => void) => Promise<void>;
}) {
  const [items, setItems] = useState<UploadItem[]>(() => initialFiles.map((file) => ({ file, description: '' })));
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ index: number; percent: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const add = (files: FileList | null) => {
    if (!files?.length) return;
    setItems((cur) => [...cur, ...Array.from(files).map((file) => ({ file, description: '' }))]);
  };

  const submit = async () => {
    setBusy(true);
    try {
      await onUpload(items, (index, percent) => setProgress({ index, percent }));
      onClose();
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <Modal
      wide
      title={`Upload ${items.length} file${items.length === 1 ? '' : 's'}`}
      subtitle={destination ? `to ${destination}` : undefined}
      onClose={busy ? () => undefined : onClose}
      footer={(
        <>
          <input ref={input} type="file" multiple className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
          <Button variant="ghost" size="sm" className="mr-auto" onClick={() => input.current?.click()} disabled={busy}>+ Add more</Button>
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={busy || items.length === 0}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {busy && progress ? `Uploading ${progress.index + 1}/${items.length} · ${progress.percent}%` : 'Upload'}
          </Button>
        </>
      )}
    >
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li key={`${it.file.name}-${i}`} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2.5">
              <FileBadge name={it.file.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{it.file.name}</p>
                <p className="text-[11px] text-muted-foreground">{formatSize(it.file.size)}</p>
              </div>
              {!busy && (
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Remove" onClick={() => setItems((c) => c.filter((_, x) => x !== i))}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {busy && progress?.index === i && (
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress.percent}%` }} /></div>
            )}
            <div className="mt-2">
              <DescriptionField
                rows={2}
                value={it.description}
                placeholder="Description (optional)"
                onChange={(v) => setItems((c) => c.map((x, k) => (k === i ? { ...x, description: v } : x)))}
              />
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
