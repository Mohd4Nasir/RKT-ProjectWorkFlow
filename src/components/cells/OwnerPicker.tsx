import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { UserAvatar } from '@/components/UserAvatar';
import { User } from '@/types';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  users: User[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function OwnerPicker({ users, value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const selected = users.find((u) => u.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'group flex items-center gap-2 h-8 px-2 rounded-md hover:bg-muted/50 transition w-full min-w-0 text-left',
            className,
          )}
        >
          {selected ? (
            <>
              <UserAvatar name={selected.name} size="sm" />
              <span className="truncate text-xs font-medium flex-1">{selected.name}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground flex-1">Unassigned</span>
          )}
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search owner…" />
          <CommandList>
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              {users.map((u) => (
                <CommandItem
                  key={u.id}
                  value={u.name}
                  onSelect={() => { onChange(u.id); setOpen(false); }}
                  className="gap-2"
                >
                  <UserAvatar name={u.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{u.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{u.email}</div>
                  </div>
                  {value === u.id && <Check className="h-4 w-4 text-primary" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
