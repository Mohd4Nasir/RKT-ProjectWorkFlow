import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Search, MoreHorizontal } from 'lucide-react';

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  onOpenFilters: () => void;
  placeholder?: string;
  left?: ReactNode;
  right?: ReactNode;
}

export function TableToolbar({ query, onQueryChange, onOpenFilters, placeholder = 'Search…', left, right }: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0 text-foreground"
        onClick={onOpenFilters}
        title="Filters"
      >
        <Filter className="h-4 w-4" />
      </Button>

      {left}

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 h-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-2 md:ml-auto">
        {right}
      </div>
    </div>
  );
}
