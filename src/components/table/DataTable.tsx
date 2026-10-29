import {
  useCallback, useEffect, useMemo, useRef, useState, memo,
} from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  Row,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  className?: string;
  rowClassName?: (row: Row<TData>) => string;
  getRowId?: (row: TData) => string;
  stickyFirstCol?: boolean;
}

function DataTableInner<TData>({
  data,
  columns,
  className,
  rowClassName,
  getRowId,
  stickyFirstCol = false,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLTableRowElement>(null);

  // Reset visible count when data changes (e.g., filter)
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [data]);

  const visibleData = useMemo(() => data.slice(0, visibleCount), [data, visibleCount]);

  const table = useReactTable({
    data: visibleData,
    columns,
//      enableColumnPinning: true,
//  initialState: {
//     columnPinning: {
//       left: ['name', 'id'],    
//       right: ['actions'],         
//     },
//   },
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
  });

  // Infinite scroll via IntersectionObserver on a sentinel row
  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, data.length));
  }, [data.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { root: scrollRef.current, rootMargin: '100px', threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, visibleData.length]);

  const hasMore = visibleCount < data.length;

  return (
    <div className={cn('card-elevated overflow-hidden', className)}>
      {/* Table with vertical + horizontal scroll, sticky header */}
      <div
        ref={scrollRef}
        className="overflow-auto max-h-[640px] scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
      >
        <table className="w-full text-sm border-collapse min-w-max">
          <thead className="sticky top-0 z-20">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border bg-brand-surface/60 backdrop-blur-sm">
                {hg.headers.map((header, colIdx) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      className={cn(
                        'h-11 px-3 text-left font-semibold text-[11px] text-muted-foreground',
                        'border-r border-border last:border-r-0 whitespace-nowrap uppercase tracking-wide',
                        'select-none',
                        canSort && 'cursor-pointer hover:text-foreground hover:bg-primary/5 transition-colors',
                        stickyFirstCol && colIdx === 0 && 'sticky left-0 z-10 bg-brand-surface/80',
                      )}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="inline-flex items-center gap-1.5">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-muted-foreground/60">
                            {sorted === 'asc' ? (
                              <ChevronUp className="h-3 w-3 text-primary" />
                            ) : sorted === 'desc' ? (
                              <ChevronDown className="h-3 w-3 text-primary" />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3 opacity-40" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-border last:border-b-0',
                  'hover:bg-primary/5 transition-colors duration-100 group',
                  rowClassName?.(row),
                )}
              >
                {row.getVisibleCells().map((cell, colIdx) => (
                  <td
                    key={cell.id}
                    className={cn(
                      'px-3 py-2.5 border-r border-border last:border-r-0 align-middle',
                      stickyFirstCol && colIdx === 0 && 'sticky left-0 z-10 bg-background group-hover:bg-primary/5',
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}

            {/* Sentinel row for infinite scroll */}
            {hasMore && (
              <tr ref={sentinelRef}>
                <td colSpan={columns.length} className="py-4 text-center">
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
                    Loading more rows…
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: row count */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <span>
          Showing <strong className="text-foreground">{visibleData.length}</strong> of{' '}
          <strong className="text-foreground">{data.length}</strong> rows
          {hasMore && ' — scroll down to load more'}
        </span>
        {hasMore && (
          <button
            type="button"
            onClick={loadMore}
            className="text-primary hover:underline font-medium"
          >
            Load {Math.min(PAGE_SIZE, data.length - visibleCount)} more
          </button>
        )}
      </div>
    </div>
  );
}

// Cast to preserve generic types after memo
export const DataTable = memo(DataTableInner) as typeof DataTableInner;
