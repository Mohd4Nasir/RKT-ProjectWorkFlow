import { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

interface Props {
  url: string;
  filename: string;
  contentType: string;
}

const TEXT_EXT = [
  'txt', 'log', 'md', 'json', 'xml', 'yaml', 'yml', 'ini', 'env', 'sql', 'html', 'htm', 'css',
  'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'php', 'sh', 'bat',
];
const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'];
const VIDEO_EXT = ['mp4', 'webm', 'ogg', 'mov', 'm4v'];
const AUDIO_EXT = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
const SHEET_EXT = ['xlsx', 'xls', 'xlsm', 'xlsb', 'csv', 'tsv', 'ods'];

type Kind = 'image' | 'video' | 'audio' | 'pdf' | 'docx' | 'sheet' | 'pptx' | 'text' | 'none';

function detectKind(filename: string, ct: string): Kind {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (ct.startsWith('image/') || IMAGE_EXT.includes(ext)) return 'image';
  if (ct.startsWith('video/') || VIDEO_EXT.includes(ext)) return 'video';
  if (ct.startsWith('audio/') || AUDIO_EXT.includes(ext)) return 'audio';
  if (ct === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'pptx') return 'pptx';
  if (SHEET_EXT.includes(ext)) return 'sheet';
  if (TEXT_EXT.includes(ext) || ct.startsWith('text/')) return 'text';
  return 'none';
}

const Fallback = ({ url, filename, message }: { url: string; filename: string; message: string }) => (
  <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
    <FileText className="h-12 w-12 text-muted-foreground/40" />
    <p className="text-sm text-muted-foreground">{message}</p>
    <Button asChild size="sm" variant="outline">
      <a href={url} download={filename}><Download className="h-3.5 w-3.5 mr-1" /> Download</a>
    </Button>
  </div>
);

// Fetches the file and renders it in the browser. Libraries are lazy-loaded
// so they only cost bundle size when a matching file is previewed.
function ClientRendered({ url, filename, kind }: { url: string; filename: string; kind: 'docx' | 'sheet' | 'pptx' | 'text' }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [text, setText] = useState('');
  const [sheets, setSheets] = useState<{ name: string; html: string }[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        if (kind === 'text') {
          const t = await res.text();
          if (!cancelled) { setText(t); setState('ready'); }
          return;
        }

        const buf = await res.arrayBuffer();
        if (cancelled) return;

        if (kind === 'docx') {
          const { renderAsync } = await import('docx-preview');
          if (hostRef.current) await renderAsync(buf, hostRef.current, undefined, { inWrapper: true });
        } else if (kind === 'pptx') {
          const { init } = await import('pptx-preview');
          if (hostRef.current) {
            const w = hostRef.current.clientWidth || 900;
            init(hostRef.current, { width: w, height: Math.round((w * 9) / 16) }).preview(buf);
          }
        } else {
          const XLSX = await import('xlsx');
          const wb = XLSX.read(buf, { type: 'array' });
          const out = wb.SheetNames.map(name => ({
            name,
            html: DOMPurify.sanitize(XLSX.utils.sheet_to_html(wb.Sheets[name], { header: '', footer: '' })),
          }));
          if (!cancelled) setSheets(out);
        }
        if (!cancelled) setState('ready');
      } catch (e) {
        console.error('[FilePreview]', e);
        if (!cancelled) setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, [url, kind]);

  if (state === 'error')
    return <Fallback url={url} filename={filename} message="Could not render this file. Try downloading it." />;

  return (
    <div className="h-full">
      {state === 'loading' && <p className="text-sm text-muted-foreground text-center py-16">Loading preview...</p>}
      {kind === 'text' && state === 'ready' && (
        <pre className="text-xs whitespace-pre-wrap break-words p-3 bg-muted/30 rounded">{text}</pre>
      )}
      {kind === 'sheet' && state === 'ready' && (
        <div className="flex flex-col h-full">
          {sheets.length > 1 && (
            <div className="flex gap-1 border-b mb-2 overflow-x-auto">
              {sheets.map((s, i) => (
                <button
                  key={s.name}
                  onClick={() => setActive(i)}
                  className={`px-3 py-1.5 text-xs whitespace-nowrap ${i === active ? 'border-b-2 border-primary font-semibold' : 'text-muted-foreground'}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
          <div
            className="flex-1 overflow-auto text-xs [&_table]:border-collapse [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:px-2"
            dangerouslySetInnerHTML={{ __html: sheets[active]?.html ?? '' }}
          />
        </div>
      )}
      {/* docx / pptx libraries render straight into this node */}
      <div ref={hostRef} className={kind === 'docx' || kind === 'pptx' ? 'overflow-auto h-full' : 'hidden'} />
    </div>
  );
}

export function FilePreview({ url, filename, contentType }: Props) {
  const kind = detectKind(filename, contentType || '');

  switch (kind) {
    case 'image':
      return <img src={url} alt={filename} className="max-h-full max-w-full object-contain mx-auto" />;
    case 'video':
      return <video src={url} controls className="max-h-full max-w-full mx-auto" />;
    case 'audio':
      return <audio src={url} controls className="w-full" />;
    case 'pdf':
      return <iframe src={url} title={filename} className="w-full h-full border-0" />;
    case 'docx':
    case 'sheet':
    case 'pptx':
    case 'text':
      return <ClientRendered url={url} filename={filename} kind={kind} />;
    default: {
      const old = ['doc', 'ppt'].includes(filename.split('.').pop()?.toLowerCase() ?? '');
      return (
        <Fallback
          url={url}
          filename={filename}
          message={old ? 'Old .doc/.ppt formats cannot be previewed in the browser.' : 'Preview is not available for this file type.'}
        />
      );
    }
  }
}
