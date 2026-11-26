/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel,
  flexRender, ColumnDef, SortingState, ColumnFiltersState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Crown, Eye, Shield, UserMinus, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { UserAvatar } from '../../components/UserAvatar';

interface UserTableProps {
  data: any[];
  projectOwnerId: string;
  onRoleChange: (userId: string, role: string) => void;
  onRemove: (user: any) => void;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
}

const ROLE_UI: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  OWNER: { label: 'Owner', icon: Crown, cls: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/20 dark:text-violet-200 dark:border-violet-500/40' },
  MANAGER: { label: 'Manager', icon: Shield, cls: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-500/40' },
  CONTRIBUTOR: { label: 'Contributor', icon: Wrench, cls: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40' },
  OBSERVER: { label: 'Observer', icon: Eye, cls: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/20 dark:text-slate-200 dark:border-slate-500/40' },
};

export function RoleBadge({ role }: { role?: string }) {
  const r = ROLE_UI[(role || '').toUpperCase()] ?? {
    label: role || 'Member', icon: Shield, cls: 'bg-muted text-muted-foreground border-border',
  };
  const Icon = r.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold', r.cls)}>
      <Icon className="h-3 w-3" /> {r.label}
    </span>
  );
}

export function UserTable({ data, onRoleChange, onRemove, globalFilter, onGlobalFilterChange }: UserTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<any>[] = [
    { id: 'userId', accessorKey: 'userId', header: 'User ID', enableHiding: true },
    {
      id: 'userInfo',
      header: 'Member',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={row.original.name} size="sm" />
          <div className="min-w-0">
            <div className="font-semibold truncate">{row.original.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'joinedOn',
      header: 'Joined',
      cell: ({ row }) => {
        const d = new Date(row.original.joinedOn);
        return (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        );
      },
    },
    {
      accessorKey: 'teamRole',
      header: 'Role',
      cell: ({ row }) => <RoleBadge role={row.original.teamRole} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        if (row.original.teamRole === 'OWNER') {
          return <span className="text-xs text-muted-foreground">Full access</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <Select value={row.original.teamRole} onValueChange={(v) => onRoleChange(row.original.userId, v)}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Change role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="CONTRIBUTOR">Contributor</SelectItem>
                <SelectItem value="OBSERVER">Observer</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              title="Remove member"
              onClick={() => onRemove(row.original)}
              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <UserMinus className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 }, columnVisibility: { userId: false } },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-3">
      <div className="border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-sidebar">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-white/75 whitespace-nowrap">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No members match your search</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/70 last:border-b-0 hover:bg-primary/[0.04] transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} · {data.length} members
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
