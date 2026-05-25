import { memo, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface DatePickerCellProps {
  value?: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  className?: string;
  highlightOverdue?: boolean;
}

export const DatePickerCell = memo(function DatePickerCell({
  value,
  onChange,
  placeholder = 'Set date',
  className,
  highlightOverdue = false,
}: DatePickerCellProps) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : undefined;
  const isOverdue = highlightOverdue && date && date.getTime() < Date.now();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'group inline-flex items-center gap-2 h-8 px-2 rounded-lg text-xs w-full text-left',
            'hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary/30',
            !date && 'text-muted-foreground',
            isOverdue && 'text-red-600 font-semibold',
            className,
          )}
        >
          <CalendarIcon className={cn(
            'h-3.5 w-3.5 flex-shrink-0 transition-colors',
            isOverdue ? 'text-red-400' : 'text-muted-foreground group-hover:text-primary',
          )} />
          <span className="truncate">
            {date ? format(date, 'dd MMM yyyy') : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 shadow-xl" align="start">
        <div className="p-1">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) {
                onChange(d.toISOString().slice(0, 10));
                setOpen(false);
              }
            }}
            initialFocus
            className="pointer-events-auto scale-105 origin-top-left"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
});
