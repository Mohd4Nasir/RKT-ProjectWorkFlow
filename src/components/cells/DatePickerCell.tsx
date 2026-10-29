import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface Props {
  value?: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePickerCell({ value, onChange, placeholder = 'Pick date', className }: Props) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2 h-8 px-2 rounded-md text-xs hover:bg-muted/50 w-full text-left text-foreground',
            !date && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          {date ? format(date, 'dd MMM yyyy') : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
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
          className={cn('p-3 pointer-events-auto')}
        />
      </PopoverContent>
    </Popover>
  );
}
