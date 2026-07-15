import { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link2, Heading2, Quote, Undo2, Redo2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

const Btn = ({ onClick, title, children, active }: any) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    className={cn(
      'h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition',
      active && 'bg-muted text-foreground',
    )}
  >
    {children}
  </button>
);

export function RichTextEditor({ value, onChange, placeholder, className, minHeight = 140 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className={cn('rounded-lg border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring', className)}>
      <div className="flex items-center gap-0.5 px-1.5 py-1 border-b bg-muted/30">
        <Btn onClick={() => exec('bold')} title="Bold"><Bold className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec('italic')} title="Italic"><Italic className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec('underline')} title="Underline"><Underline className="h-3.5 w-3.5" /></Btn>
        <div className="w-px h-5 bg-border mx-1" />
        <Btn onClick={() => exec('formatBlock', 'H2')} title="Heading"><Heading2 className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec('formatBlock', 'BLOCKQUOTE')} title="Quote"><Quote className="h-3.5 w-3.5" /></Btn>
        <div className="w-px h-5 bg-border mx-1" />
        <Btn onClick={() => exec('insertUnorderedList')} title="Bulleted list"><List className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec('insertOrderedList')} title="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></Btn>
        <Btn
          onClick={() => {
            const url = window.prompt('Enter URL');
            if (url) exec('createLink', url);
          }}
          title="Link"
        ><Link2 className="h-3.5 w-3.5" /></Btn>
        <div className="ml-auto flex items-center gap-0.5">
          <Btn onClick={() => exec('undo')} title="Undo"><Undo2 className="h-3.5 w-3.5" /></Btn>
          <Btn onClick={() => exec('redo')} title="Redo"><Redo2 className="h-3.5 w-3.5" /></Btn>
        </div>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        data-placeholder={placeholder}
        className="px-3 py-2.5 text-sm outline-none prose-sm max-w-none [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-1 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-muted-foreground"
        style={{ minHeight }}
      />
    </div>
  );
}
