import { useEffect, useRef, useState, memo } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableCellProps {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  placeholder?: string;
  onClickWhenIdle?: () => void;
  type?: 'text' | 'number';
}

export const EditableCell = memo(function EditableCell({
  value,
  onSave,
  className,
  placeholder = 'Click to edit',
  onClickWhenIdle,
  type = 'text',
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setVal(value); }, [value]);
  useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select(); } }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = val.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setVal(value);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        type={type}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { setVal(value); setEditing(false); }
        }}
        placeholder={placeholder}
        className={cn(
          'w-full h-8 px-2 rounded-md border border-primary/50 bg-background text-sm',
          'outline-none ring-2 ring-primary/20 focus:ring-primary/40 transition-all',
          className,
        )}
      />
    );
  }

  return (
    <div className={cn('group/ec flex items-center gap-1.5 min-w-0 w-full', className)}>
      <button
        type="button"
        onClick={() => onClickWhenIdle ? onClickWhenIdle() : setEditing(true)}
        className="text-left font-medium text-foreground hover:text-primary truncate flex-1 text-sm"
        title={value}
      >
        {value || <span className="text-muted-foreground italic text-xs">{placeholder}</span>}
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        className="opacity-0 group-hover/ec:opacity-100 text-muted-foreground hover:text-primary p-0.5 rounded transition-opacity flex-shrink-0"
        aria-label="Edit"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  );
});
