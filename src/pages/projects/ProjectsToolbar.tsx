import { Plus, List, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TableToolbar } from './TableToolbar';

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  onOpenFilters: () => void;
  placeholder?: string;
  showViewToggle?: boolean;
  view?: 'list' | 'grid';
  onViewChange?: (v: 'list' | 'grid') => void;
  showCreate?: boolean;
  onCreate?: () => void;
}

export function ProjectsToolbar({
  query, onQueryChange, onOpenFilters, placeholder,
  showViewToggle, view, onViewChange,
  showCreate, onCreate,
}: Props) {
  return (
    <TableToolbar
      query={query}
      onQueryChange={onQueryChange}
      onOpenFilters={onOpenFilters}
      placeholder={placeholder}
      right={
        <>
          {showViewToggle && (
            <div className="inline-flex rounded-md border border-border bg-card p-0.5">
              <button
                onClick={() => onViewChange?.('list')}
                className={cn('h-8 px-3 rounded text-xs font-medium inline-flex items-center gap-1.5',
                  view === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}
              >
                <List className="h-3.5 w-3.5" /> List
              </button>
              <button
                onClick={() => onViewChange?.('grid')}
                className={cn('h-8 px-3 rounded text-xs font-medium inline-flex items-center gap-1.5',
                  view === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Grid
              </button>
            </div>
          )}

          {showCreate && (
            <Button
              className="bg-primary hover:bg-primary-hover text-primary-foreground shadow"
              onClick={onCreate}
            >
              <Plus className="h-4 w-4 mr-1" /> New Project
            </Button>
          )}
        </>
      }
    />
  );
}
