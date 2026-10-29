import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Search, MoreHorizontal } from 'lucide-react';

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  onOpenFilters: () => void;
  /** number of filters currently applied, shown as a badge on the filter button */
  activeFilters?: number;
  placeholder?: string;
  left?: ReactNode;
  right?: ReactNode;
}

export function TableToolbar({ query, onQueryChange, onOpenFilters, activeFilters = 0, placeholder = 'Search…', left, right }: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0 relative"
        onClick={onOpenFilters}
        title={activeFilters ? `Filters (${activeFilters} applied)` : 'Filters'}
      >
        <Filter className="h-4 w-4" />
        {activeFilters > 0 && (
          <span className="absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {activeFilters}
          </span>
        )}
      </Button>

      {left}

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 h-9 bg-card border-border"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 md:ml-auto">
        {right}
        <Button variant="outline" size="icon" className="h-9 w-9">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
