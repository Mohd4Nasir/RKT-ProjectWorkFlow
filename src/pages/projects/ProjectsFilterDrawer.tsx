import { useMemo, useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterField {
  id: string;
  label: string;
  type?: 'text' | 'date' | 'select';
  options?: { label: string; value: string }[];
}

export interface FilterValues {
  match: 'any' | 'all';
  values: Record<string, string>;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fields: FilterField[];
  value: FilterValues;
  onApply: (v: FilterValues) => void;
  onReset: () => void;
  title?: string;
}

export function ProjectsFilterDrawer({
  open, onOpenChange, fields, value, onApply, onReset, title = 'Filter',
}: Props) {
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<FilterValues>(value);

  useEffect(() => { if (open) setDraft(value); }, [open, value]);

  const visibleFields = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fields;
    return fields.filter((f) => f.label.toLowerCase().includes(q));
  }, [fields, search]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[380px] sm:max-w-[380px] p-0 flex flex-col gap-0"
      >
           {/* Header - Only one X button now */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-base">{title}</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setDraft({ match: 'any', values: {} }); onReset(); }}
              className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 rounded-full hover:bg-muted transition-colors inline-flex items-center justify-center"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filters"
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Scrollable filter list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {visibleFields.map((f) => (
            <FilterSection
              key={f.id}
              field={f}
              value={draft.values[f.id] || ''}
              onChange={(v) => setDraft((d) => ({ ...d, values: { ...d.values, [f.id]: v } }))}
            />
          ))}
          {visibleFields.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No matching filters</p>
          )}
        </div>

        {/* Match radios */}
        <div className="border-t border-border px-5 py-3">
          <RadioGroup
            value={draft.match}
            onValueChange={(v) => setDraft((d) => ({ ...d, match: v as 'any' | 'all' }))}
            className="flex items-center gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="m-any" value="any" />
              <Label htmlFor="m-any" className="text-xs">Any of these</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="m-all" value="all" />
              <Label htmlFor="m-all" className="text-xs">All of these</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
            onClick={() => { onApply(draft); onOpenChange(false); }}
          >
            Find
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function FilterSection({
  field, value, onChange,
}: { field: FilterField; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {field.label}
      </Label>
      {field.type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <option value="">Any</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <Input
          type={field.type === 'date' ? 'date' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.label.toLowerCase()}`}
          className="h-9"
        />
      )}
    </div>
  );
}
