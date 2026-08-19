import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Globe, Lock, LucideIcon, Users as UsersIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';
import { userById } from '@/utils/format';
import { Users } from '@/types/ProejctsType';
import { PublicProject } from '@/services/publicProject';
import { ProjectActionCell } from './ProjectActionCell';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  projects: PublicProject[];
  users: Users[];
  loading?: boolean;
  onJoin: (id: string) => void;
}

interface AccessIconConfig {
  icon: LucideIcon;
  label: string;
  cls: string;
}

const ACCESS_ICON: Record<PublicProject['access'], AccessIconConfig> = {
  public: { icon: Globe, label: 'Public', cls: 'text-success' },
  restricted: { icon: UsersIcon, label: 'Restricted', cls: 'text-warning' },
  private: { icon: Lock, label: 'Private', cls: 'text-muted-foreground' },
};

export function PublicProjectsTable({ projects, users, loading, onJoin }: Props) {
  const [pageSize, setPageSize] = useState(10);
  
  const columnHelper = createColumnHelper<PublicProject>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: ({ getValue }) => (
          <span className="text-xs font-mono text-muted-foreground">
            {getValue()}
          </span>
        ),
        size: 100,
      }),

      columnHelper.accessor('name', {
        header: 'Project Name',
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
        size: 300,
      }),

      columnHelper.accessor('ownerId', {
        header: 'Owner',
        cell: ({ getValue }) => {
          const owner = userById(users, getValue());
          return (
            <div className="flex items-center gap-2 min-w-0">
              {owner && <UserAvatar name={owner.name} size="sm" />}
              <span className="truncate text-sm">{owner?.name || '—'}</span>
            </div>
          );
        },
        size: 180,
      }),

      columnHelper.accessor('access', {
        header: 'Access',
        cell: ({ getValue }) => {
          const A = ACCESS_ICON[getValue()];
          const Icon = A.icon;
          return (
            <span
              className={cn('inline-flex items-center gap-1.5 text-sm font-medium', A.cls)}
              title={A.label}
            >
              <Icon className="h-4 w-4" />
              {A.label}
            </span>
          );
        },
        size: 140,
      }),

      columnHelper.display({
        id: 'action',
        header: 'Join',
        cell: ({ row }) => {
          const project = row.original;
          return (
            <ProjectActionCell
              joined={project.joined}
              onJoin={() => onJoin(project.id)}
            />
          );
        },
        size: 100,
      }),
    ],
    [users, onJoin],
  );

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: pageSize,
        pageIndex: 0,
      },
    },
    state: {
      pagination: {
        pageSize: pageSize,
        pageIndex: 0,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater(table.getState().pagination);
        setPageSize(newState.pageSize);
      }
    },
    manualPagination: false,
  });

  if (loading) {
    return (
      <div className="card-elevated p-4 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="card-elevated p-16 text-center">
        <h3 className="font-semibold">No public projects found</h3>
        <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
      </div>
    );
  }

  const { pageIndex, pageSize: currentPageSize } = table.getState().pagination;
  const totalRows = projects.length;
  const startRow = pageIndex * currentPageSize;
  const endRow = Math.min(startRow + currentPageSize, totalRows);

  return (
    <>
      <div className="card-elevated overflow-hidden">
        <div className="overflow-auto scrollbar-thin max-h-[640px]">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-10 px-3 text-left font-semibold text-xs text-muted-foreground border-r border-border last:border-r-0 whitespace-nowrap"
                      style={{ width: header.column.getSize() }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-b-0 hover:bg-primary/5 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 py-3 border-r border-border last:border-r-0"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <Select
            value={String(currentPageSize)}
            onValueChange={(v) => {
              table.setPageSize(Number(v));
              setPageSize(Number(v));
            }}
          >
            <SelectTrigger className="h-8 w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="ml-3">
            {totalRows === 0 ? 0 : startRow + 1}–{endRow} of {totalRows}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.setPageIndex(0)}
          >
            « First
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            ‹ Prev
          </Button>
          <span className="px-3 font-medium text-foreground">
            Page {pageIndex + 1} / {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next ›
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!table.getCanNextPage()}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          >
            Last »
          </Button>
        </div>
      </div>
    </>
  );
}