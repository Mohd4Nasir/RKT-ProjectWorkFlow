import { memo, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ProjectStatus } from '@/types/ProejctsType';

export type StatusOption = {
  value: ProjectStatus;
  label: string;
  dot: string;
  badge: string;
  text: string;
};

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'active',      label: 'Active',      dot: 'bg-emerald-500', badge: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-700' },
  { value: 'in-progress', label: 'In Progress', dot: 'bg-blue-500',    badge: 'bg-blue-100 border-blue-300',    text: 'text-blue-700' },
  { value: 'on-hold',     label: 'On Hold',     dot: 'bg-amber-500',   badge: 'bg-amber-100 border-amber-300',   text: 'text-amber-700' },
  { value: 'delayed',     label: 'Delayed',     dot: 'bg-red-500',     badge: 'bg-red-100 border-red-300',     text: 'text-red-700' },
  { value: 'completed',   label: 'Completed',   dot: 'bg-violet-500',  badge: 'bg-violet-100 border-violet-300', text: 'text-violet-700' },
];

export const StatusBadge = memo(function StatusBadge({ status }: { status: ProjectStatus }) {
  const opt = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap',
      opt.badge, opt.text,
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', opt.dot)} />
      {opt.label}
    </span>
  );
});

interface StatusDropdownProps {
  value: ProjectStatus;
  onChange: (v: ProjectStatus) => void;
}

export const StatusDropdown = memo(function StatusDropdown({ value, onChange }: StatusDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-1 rounded-full hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <StatusBadge status={value} />
          <ChevronDown className={cn(
            'h-3 w-3 text-muted-foreground transition-transform flex-shrink-0 -ml-0.5',
            open && 'rotate-180',
          )} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1.5 shadow-lg" align="start">
        <div className="space-y-0.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left',
                value === opt.value
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-foreground',
              )}
            >
              <span className={cn('h-2 w-2 rounded-full flex-shrink-0', opt.dot)} />
              <span className="flex-1 font-medium text-xs">{opt.label}</span>
              {value === opt.value && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
});
