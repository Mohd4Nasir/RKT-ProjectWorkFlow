import { memo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { UserAvatar } from '@/components/UserAvatar';
import { User } from '@/types/ProejctsType';
import { cn } from '@/lib/utils';

interface OwnerSelectProps {
  users: User[];
  value: string | number;
  onChange: (id: string | number) => void;
  className?: string;
}

export const OwnerSelect = memo(function OwnerSelect({ users, value, onChange, className }: OwnerSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = users.find((u) => u.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'group flex items-center gap-2 h-8 px-2 rounded-lg w-full text-left',
            'hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary/30',
            className,
          )}
        >
          {selected ? (
            <>
              <UserAvatar name={selected.name} size="sm" />
              <span className="truncate text-xs font-medium flex-1 text-foreground">{selected.name}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground flex-1">Unassigned</span>
          )}
          <ChevronsUpDown className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 shadow-lg" align="start">
        <Command>
          <CommandInput placeholder="Search people…" className="h-9" />
          <CommandList className="max-h-56">
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              {users.map((u) => (
                <CommandItem
                  key={u.id}
                  value={u.name}
                  onSelect={() => { onChange(u.id); setOpen(false); }}
                  className="flex items-center gap-2.5 px-3 py-2 cursor-pointer"
                >
                  <UserAvatar name={u.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{u.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{u.email}</div>
                  </div>
                  {value === u.id && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});
