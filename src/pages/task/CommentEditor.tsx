import { useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import {
  Bold, Code, File as FileIcon, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, Paperclip, Quote, Smile, Strikethrough, Underline, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Rich comment editor + renderer (Zoho / Jira style): formatting toolbar, emoji, links, and
 * images that can be pasted (screenshots), dropped or picked from disk. Content is stored as sanitized HTML;
 * old plain-text comments still render fine.
 */

const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'p', 'div', 'br', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'span', 'h2', 'h3'];
const ALLOWED_ATTR = ['href', 'src', 'alt', 'target', 'rel'];

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export const clean = (html: string) =>
  DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|data:image\/)/i });

const HTML_RE = /<\/?[a-z][\s\S]*>/i;
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** legacy comments are plain text with newlines; new ones are html */
export const toHtml = (content: string) => (HTML_RE.test(content) ? clean(content) : escapeHtml(content).replace(/\n/g, '<br>'));

/** true when there is no text and no image */
export const isEmptyHtml = (html: string) => {
  if (/<img\b/i.test(html)) return false;
  const d = document.createElement('div');
  d.innerHTML = html;
  return !d.textContent?.trim();
};

/** shrink big screenshots so the comment payload stays reasonable */
const fileToDataUrl = (file: File, max = 1280): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const src = String(reader.result);
      if (file.type === 'image/gif' || file.type === 'image/svg+xml') return resolve(src);
      const img = new Image();
      img.onerror = () => resolve(src);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });

const MAX_IMG_MB = 8;
const MAX_FILE_MB = 25;
const MAX_FILES = 10;
export const fmtBytes = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`);

const EMOJI = ['👍', '👎', '👏', '🙏', '🎉', '🚀', '🔥', '✅', '❌', '⚠️', '💡', '❤️', '😀', '😂', '😅', '😍', '🤔', '😢', '😡', '👀', '💯', '🐛', '📌', '⏰'];

const PROSE =
  'text-sm leading-relaxed break-words [&_p]:my-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:bg-muted/40 [&_blockquote]:pl-3 [&_blockquote]:py-0.5 [&_blockquote]:my-1 [&_blockquote]:text-muted-foreground ' +
  '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] ' +
  '[&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-2.5 [&_pre]:my-1 [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:text-[12px] ' +
  '[&_a]:text-primary [&_a]:underline [&_img]:my-1.5 [&_img]:max-h-72 [&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_img]:border-border';

/* ───────────────────────── Renderer ───────────────────────── */

export function CommentHtml({ content }: { content: string }) {
  const html = useMemo(() => toHtml(content), [content]);
  const [zoom, setZoom] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [tall, setTall] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el) setTall(el.scrollHeight > 220);
  }, [html]);

  return (
    <>
      <div
        ref={ref}
        className={cn(PROSE, 'mt-1 [&_img]:cursor-zoom-in', !open && 'max-h-[220px] overflow-hidden', tall && !open && '[mask-image:linear-gradient(#000_75%,transparent)]')}
        onClick={(e) => {
          const t = e.target as HTMLElement;
          if (t.tagName === 'IMG') setZoom((t as HTMLImageElement).src);
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {tall && (
        <button onClick={() => setOpen(!open)} className="mt-1 text-xs font-semibold text-primary hover:underline">
          {open ? 'Show less' : 'Show more'}
        </button>
      )}
      {zoom && (
        <div className="fixed inset-0 z-[400] bg-black/80 grid place-items-center p-6 cursor-zoom-out animate-fade-in" onClick={() => setZoom(null)}>
          <button className="absolute top-4 right-4 h-9 w-9 grid place-items-center rounded-full bg-white/15 text-white hover:bg-white/25" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-md shadow-2xl" />
        </div>
      )}
    </>
  );
}

/* ───────────────────────── Editor ───────────────────────── */

const Tool = ({ onClick, title, active, children }: { onClick: () => void; title: string; active?: boolean; children: React.ReactNode }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onMouseDown={(e) => e.preventDefault()} // keep the selection inside the editor
    onClick={onClick}
    className={cn(
      'h-7 w-7 grid place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
      active && 'bg-primary/10 text-primary',
    )}
  >
    {children}
  </button>
);

const Sep = () => <span className="mx-1 h-4 w-px bg-border" />;

export function CommentEditor({
  initial, placeholder, submitLabel, busy, autoFocus, onSubmit, onCancel, note, compact, allowFiles,
}: {
  allowFiles?: boolean;
  initial?: string;
  placeholder: string;
  submitLabel: string;
  busy?: boolean;
  autoFocus?: boolean;
  onSubmit: (html: string, files: File[]) => Promise<boolean> | boolean;
  onCancel?: () => void;
  note?: React.ReactNode;
  compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [empty, setEmpty] = useState(true);
  const [focused, setFocused] = useState(!!autoFocus);
  const [emoji, setEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [fmt, setFmt] = useState<Record<string, boolean>>({});
  const [files, setFiles] = useState<File[]>([]);
  const attachRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: File[]) => {
    if (!allowFiles || !list.length) return;
    const ok: File[] = [];
    for (const f of list) {
      if (f.size > MAX_FILE_MB * 1048576) toast.error(`${f.name} is larger than ${MAX_FILE_MB} MB`);
      else ok.push(f);
    }
    setFiles((cur) => {
      const next = [...cur, ...ok.filter((f) => !cur.some((c) => c.name === f.name && c.size === f.size))];
      if (next.length > MAX_FILES) toast.error(`You can attach up to ${MAX_FILES} files`);
      return next.slice(0, MAX_FILES);
    });
  };

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = initial ? toHtml(initial) : '';
    setEmpty(isEmptyHtml(ref.current.innerHTML));
    if (autoFocus) {
      ref.current.focus();
      const r = document.createRange();
      r.selectNodeContents(ref.current);
      r.collapse(false);
      const s = window.getSelection();
      s?.removeAllRanges();
      s?.addRange(r);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => {
    if (ref.current) setEmpty(isEmptyHtml(ref.current.innerHTML));
  };
  const track = () => {
    try {
      setFmt({
        bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'), strike: document.queryCommandState('strikeThrough'),
        ul: document.queryCommandState('insertUnorderedList'), ol: document.queryCommandState('insertOrderedList'),
      });
    } catch { /* ignore */ }
  };
  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    sync();
    track();
  };

  const insertImages = async (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return;
    setUploading(true);
    try {
      for (const f of imgs) {
        if (f.size > MAX_IMG_MB * 1048576) { toast.error(`${f.name || 'Image'} is larger than ${MAX_IMG_MB} MB`); continue; }
        exec('insertImage', await fileToDataUrl(f));
      }
    } catch {
      toast.error('Could not add the image');
    } finally {
      setUploading(false);
    }
  };

  const cancel = () => {
    if (ref.current) ref.current.innerHTML = initial ? toHtml(initial) : '';
    sync();
    setFiles([]);
    setFocused(false);
    setEmoji(false);
    onCancel?.();
  };

  const submit = async () => {
    if (!ref.current || (empty && !files.length) || busy || uploading) return;
    const html = empty ? `<p>📎 Attached ${files.length} file${files.length > 1 ? 's' : ''}</p>` : clean(ref.current.innerHTML);
    if (await onSubmit(html, files)) {
      if (initial === undefined) { ref.current.innerHTML = ''; setEmpty(true); }
      setFiles([]);
      setFocused(false);
      setEmoji(false);
    }
  };

  const open = focused || !empty || files.length > 0;

  return (
    <div
      className={cn(
        'rounded-lg border bg-background transition-shadow',
        drag ? 'border-primary ring-2 ring-primary/30' : focused ? 'border-primary/60 ring-2 ring-primary/15' : 'border-input',
      )}
      onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDrag(true); } }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        setDrag(false);
        const dropped = Array.from(e.dataTransfer.files);
        if (!dropped.length) return;
        e.preventDefault();
        insertImages(dropped);
        addFiles(dropped.filter((f) => !f.type.startsWith('image/')));
      }}
    >
      {open && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-1.5 py-1 rounded-t-lg animate-fade-in">
          <Tool onClick={() => exec('bold')} title="Bold (Ctrl+B)" active={fmt.bold}><Bold className="h-3.5 w-3.5" /></Tool>
          <Tool onClick={() => exec('italic')} title="Italic (Ctrl+I)" active={fmt.italic}><Italic className="h-3.5 w-3.5" /></Tool>
          <Tool onClick={() => exec('underline')} title="Underline (Ctrl+U)" active={fmt.underline}><Underline className="h-3.5 w-3.5" /></Tool>
          <Tool onClick={() => exec('strikeThrough')} title="Strikethrough" active={fmt.strike}><Strikethrough className="h-3.5 w-3.5" /></Tool>
          <Sep />
          <Tool onClick={() => exec('insertUnorderedList')} title="Bulleted list" active={fmt.ul}><List className="h-3.5 w-3.5" /></Tool>
          <Tool onClick={() => exec('insertOrderedList')} title="Numbered list" active={fmt.ol}><ListOrdered className="h-3.5 w-3.5" /></Tool>
          <Tool onClick={() => exec('formatBlock', 'BLOCKQUOTE')} title="Quote"><Quote className="h-3.5 w-3.5" /></Tool>
          <Tool onClick={() => exec('formatBlock', 'PRE')} title="Code block"><Code className="h-3.5 w-3.5" /></Tool>
          <Sep />
          <Tool
            title="Insert link"
            onClick={() => {
              const url = window.prompt('Link URL', 'https://');
              if (url && /^(https?:\/\/|mailto:)/i.test(url)) exec('createLink', url);
              else if (url) toast.error('Enter a valid http(s) link');
            }}
          ><Link2 className="h-3.5 w-3.5" /></Tool>
          <Tool onClick={() => fileRef.current?.click()} title="Insert image (you can also paste or drop)"><ImagePlus className="h-3.5 w-3.5" /></Tool>
          <div className="relative">
            <Tool onClick={() => setEmoji((v) => !v)} title="Emoji" active={emoji}><Smile className="h-3.5 w-3.5" /></Tool>
            {emoji && (
              <div className="absolute left-0 top-8 z-30 grid grid-cols-8 gap-0.5 rounded-lg border border-border bg-popover p-2 shadow-lg animate-fade-in">
                {EMOJI.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onMouseDown={(ev) => ev.preventDefault()}
                    onClick={() => { exec('insertText', e); setEmoji(false); }}
                    className="h-7 w-7 grid place-items-center rounded text-base hover:bg-muted"
                  >{e}</button>
                ))}
              </div>
            )}
          </div>
          {uploading && <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
      )}

      <div className="relative">
        {empty && (
          <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-muted-foreground">{placeholder}</span>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          onFocus={() => setFocused(true)}
          onInput={sync}
          onKeyUp={track}
          onMouseUp={track}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); submit(); }
            if (e.key === 'Escape') cancel();
          }}
          onPaste={(e) => {
            const pasted = Array.from(e.clipboardData.files);
            if (pasted.some((f) => f.type.startsWith('image/'))) { e.preventDefault(); insertImages(pasted); return; }
            if (pasted.length && allowFiles) { e.preventDefault(); addFiles(pasted); return; }
            // paste as clean text — no foreign fonts/colours from Word, web pages, etc.
            const html = e.clipboardData.getData('text/html');
            if (html) { e.preventDefault(); exec('insertHTML', clean(html)); }
          }}
          className={cn(PROSE, 'px-3 py-2.5 outline-none overflow-y-auto', compact ? 'min-h-[44px]' : 'min-h-[72px]', 'max-h-[320px]')}
        />
      </div>

      {allowFiles && open && (
        <div className="border-t border-dashed border-border bg-muted/20 px-3 py-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Attachments</span>
            {!!files.length && <span className="rounded-full bg-muted px-1.5 text-[10px] font-bold tabular-nums">{files.length}</span>}
            <button
              type="button"
              onClick={() => attachRef.current?.click()}
              className="ml-auto text-xs font-semibold text-primary hover:underline"
            >+ Attach files</button>
          </div>
          {files.length > 0 ? (
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {files.map((f, i) => (
                <li key={f.name + i} className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5">
                  <FileIcon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium" title={f.name}>{f.name}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{fmtBytes(f.size)}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive"
                  ><X className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[11px] text-muted-foreground">Drop any file here or use “Attach files” — PDF, Word, Excel, ZIP… up to {MAX_FILE_MB} MB each.</p>
          )}
        </div>
      )}

      {open && (
        <div className="flex items-center justify-between gap-2 border-t border-border px-2.5 py-2 animate-fade-in">
          <span className="text-[11px] text-muted-foreground">{note}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={cancel}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs" onClick={submit} disabled={(empty && !files.length) || busy || uploading}>
              {busy && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />} {submitLabel}
            </Button>
          </div>
        </div>
      )}

      <input
        ref={attachRef}
        type="file"
        multiple
        hidden
        onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => { insertImages(Array.from(e.target.files ?? [])); e.target.value = ''; }}
      />
    </div>
  );
}
