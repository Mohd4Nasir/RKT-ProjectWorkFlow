import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  onClickWhenIdle?: () => void; // optional: e.g. open detail when clicking text
}

export function InlineEdit({ value, onSave, className, inputClassName, placeholder, onClickWhenIdle }: Props) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setVal(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (val.trim() && val !== value) onSave(val.trim());
    else setVal(value);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setVal(value); setEditing(false); }
        }}
        placeholder={placeholder}
        className={cn(
          'w-full h-8 px-2 rounded-md border border-primary/40 bg-card text-sm outline-none ring-2 ring-primary/20',
          inputClassName,
        )}
      />
    );
  }

  return (
    <div className={cn('group/inline flex items-center gap-1.5 min-w-0', className)}>
      <button
        type="button"
        onClick={() => onClickWhenIdle ? onClickWhenIdle() : setEditing(true)}
        className="text-left font-medium text-foreground hover:text-primary truncate flex-1"
        title={value}
      >
        {value || <span className="text-muted-foreground italic">{placeholder}</span>}
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        className="opacity-0 group-hover/inline:opacity-100 text-muted-foreground hover:text-primary p-0.5 rounded"
        aria-label="Edit"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
