import { Plus, List, LayoutGrid, Upload, ChevronDown, FilePlus2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TableToolbar } from './TableToolbar';

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  onOpenFilters: () => void;
  activeFilters?: number;
  placeholder?: string;
  showViewToggle?: boolean;
  view?: 'list' | 'grid';
  onViewChange?: (v: 'list' | 'grid') => void;
  showCreate?: boolean;
  onCreate?: () => void;
  showImport?: boolean;
  onImport?: () => void;
}

export function ProjectsToolbar({
  query, onQueryChange, onOpenFilters, activeFilters, placeholder,
  showViewToggle, view, onViewChange,
  showCreate, onCreate,
  showImport, onImport,
}: Props) {
  return (
    <TableToolbar
      query={query}
      onQueryChange={onQueryChange}
      onOpenFilters={onOpenFilters}
      activeFilters={activeFilters}
      placeholder={placeholder}
      right={
        <>
          {showViewToggle && (
            <div className="inline-flex rounded-md border border-border bg-card ">
              <button
                onClick={() => onViewChange?.('list')}
                className={cn('h-8 px-3  rounded-l-md text-xs font-medium inline-flex items-center gap-1.5',
                  view === 'list' ? 'bg-primary/60 text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <List className="h-3.5 w-3.5" /> List
              </button>
              <button
                onClick={() => onViewChange?.('grid')}
                className={cn('h-8 px-3 rounded-r-md text-xs font-medium inline-flex items-center gap-1.5',
                  view === 'grid' ? 'bg-primary/60 text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Grid
              </button>
            </div>
          )}

          {showCreate && showImport ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="shadow">
                  <Plus className="h-4 w-4 mr-1" /> New Project <ChevronDown className="h-4 w-4 ml-1.5 opacity-80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={onCreate} className="gap-2 cursor-pointer">
                  <FilePlus2 className="h-4 w-4" /> Create manually
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onImport} className="gap-2 cursor-pointer">
                  <Upload className="h-4 w-4" /> Import from Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : showCreate ? (
            <Button className="shadow" onClick={onCreate}>
              <Plus className="h-4 w-4 mr-1" /> New Project
            </Button>
          ) : showImport ? (
            <Button variant="outline" className="shadow-sm" onClick={onImport}>
              <Upload className="h-4 w-4 mr-1" /> Import Excel
            </Button>
          ) : null}
        </>
      }
    />
  );
}
