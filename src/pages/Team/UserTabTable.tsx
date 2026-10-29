/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import {
  useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, flexRender, ColumnDef, SortingState, ColumnFiltersState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Crown, Star, UserMinus, Pencil, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/utils/stringUtils';
import hashString from '@/utils/HashString';

interface UserTableProps {
  data: any[];
  projectOwnerId?: string | number;
  /** Every owner id on the project. Ownership is resolved from this list. */
  ownerIds?: (string | number)[];
  onRoleChange?: (userId: string, role: string) => void;
  onRemove: (user: any) => void;
  onEdit: (user: any) => void;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
}

export interface RoleMeta {
  label: string;
  badgeClassName: string;
  Icon: typeof Crown;
  /** The project owner's access can't be changed from this tab. */
  editable: boolean;
}

const MEMBER_META: RoleMeta = {
  label: 'Member',
  badgeClassName: 'bg-accent-55 text-heading',
  Icon: Star,
  editable: true,
};

const OWNER_META: RoleMeta = {
  label: 'Owner',
  badgeClassName: 'bg-primary-55 text-heading',
  Icon: Crown,
  editable: false,
};

const ROLE_META: Record<string, { label: string; badgeClassName: string; Icon: any }> = {
  OWNER: { label: 'Owner', badgeClassName: 'bg-primary-55 text-heading', Icon: Crown },
  MEMBER: { label: 'Member', badgeClassName: 'bg-accent-55 text-heading', Icon: Star },
  CONTRIBUTOR: { label: 'Contributor', badgeClassName: 'bg-accent-55 text-heading', Icon: Star },
  VIEWER: { label: 'Viewer', badgeClassName: 'bg-secondary-55 text-heading', Icon: Eye },
};

/**
 * `GET /team/{projectId}` returns the membership row, whose `id` is the
 * membership id, while `userId` is the user. Every write endpoint
 * (`add-member`, `update-member`, `remove-member`) takes the *user* id.
 */
export const getMemberUserId = (member?: any): string | number | undefined =>
  member?.userId ?? member?.id;

// /** Ids arrive as either strings or numbers depending on the endpoint. */
export const sameId = (a?: string | number | null, b?: string | number | null) =>
  a != null && b != null && String(a) === String(b);

/**
 * `GET /team/{projectId}` reports `teamRole: "OWNER"` on every row, so the
 * role alone can't identify the real owner and every row renders as
 * "Full Access" with no actions. Ownership is therefore resolved from the
 * project's owner list, which is authoritative.
 */
export function isProjectOwner(member: any, ownerIds: (string | number)[] = []): boolean {
  if (!ownerIds.length) return false;
  const userId = getMemberUserId(member);
  return ownerIds.some((ownerId) => sameId(ownerId, userId));
}

/**
 * Resolves a row's role badge. `editable` is driven by the owner list, not by
 * the row's own `teamRole` value, because that value is not trustworthy.
 */
export function resolveRoleMeta(member: any, ownerIds: (string | number)[] = []): RoleMeta {
  const owner = isProjectOwner(member, ownerIds);
  if (owner) return OWNER_META;

  // Fall back across the field names the role may arrive under.
  const raw = String(member?.teamRole ?? member?.projectRole ?? member?.role ?? '')
    .trim()
    .toUpperCase();

  // A non-owner claiming OWNER is reported as a plain member.
  if (!raw || raw === 'OWNER') return MEMBER_META;

  const known = ROLE_META[raw];
  if (known) return { ...known, editable: true };

  return {
    label: raw.charAt(0) + raw.slice(1).toLowerCase(),
    badgeClassName: 'bg-secondary-55 text-heading',
    Icon: Star,
    editable: true,
  };
}



/**
 * Same deterministic hash + brand palette used in ProjectsTable, so a
 * given user keeps the same avatar color across the app.
 */


const COLOR_PALETTE = [
  { tint: 'bg-primary-55', text: 'text-heading' },
  { tint: 'bg-secondary-55', text: 'text-heading' },
  { tint: 'bg-accent-55', text: 'text-heading' },
] as const;

function colorFor(key: string) {
  return COLOR_PALETTE[hashString(key) % COLOR_PALETTE.length];
}

export function UserTable({
  data, projectOwnerId, ownerIds, onRemove, onEdit, globalFilter, onGlobalFilterChange,
}: UserTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  console.log("UserTable data", data);
  const resolvedOwnerIds: (string | number)[] =
    ownerIds?.length
      ? ownerIds
      : projectOwnerId != null
        ? [projectOwnerId]
        : [];


  const columns: ColumnDef<any>[] = [
    {
      id: 'userId',
      accessorKey: 'userId',
      header: 'User ID',
      cell: ({ row }) => <span className="text-paragraph">{row.original.userId}</span>,
      enableHiding: true,
    },
    {
      id: 'userInfo',
      header: 'User',
      size: 260,
      cell: ({ row }) => {
        const c = colorFor(row.original.name ?? row.original.userId ?? 'user');
        return (
          <div className="flex items-center gap-3">
            <div
              className={`h-8 w-8 rounded-full ${c.tint} ${c.text} flex items-center justify-center text-xs font-semibold shrink-0`}
            >
              {getInitials(row.original.name)}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-heading truncate">{row.original.name}</div>
              {row.original.department && (
                <div className="text-xs text-muted-foreground truncate">{row.original.department}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'joinedOn',
      header: 'Joined Date',
      cell: ({ row }) => {
        const date = new Date(row.original.joinedOn);
        const formattedDate = Number.isNaN(date.getTime())
          ? '—'
          : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        return <span className="text-xs text-muted-foreground">{formattedDate}</span>;
      },
    },
    {
      accessorKey: 'teamRole',
      header: 'Role',
      cell: ({ row }) => {
        // ✅ Use exactly what the API sends
        const rawRole = String(row.original.teamRole ?? row.original.projectRole ?? row.original.role ?? '')
          .trim()
          .toUpperCase();

        const meta = ROLE_META[rawRole] ?? {
          label: rawRole || 'Unknown',
          badgeClassName: 'bg-secondary-55 text-heading',
          Icon: Star,
        };

        const Icon = meta.Icon;
        return (
          <Badge className={`border-0 font-medium ${meta.badgeClassName}`}>
            <Icon className="h-3 w-3 mr-1" />
            {meta.label}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Action',
      size: 96,
      cell: ({ row }) => {
        // If you still want to hide actions for OWNER, check the API role directly
        const rawRole = String(row.original.teamRole ?? row.original.projectRole ?? row.original.role ?? '')
          .trim()
          .toUpperCase();
        const isOwner = rawRole === 'OWNER';

        return (
          <div className="flex justify-end items-center gap-1">
            {isOwner ? (
              <span className="text-xs text-muted-foreground">Full Access</span>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${row.original.name}`}
                  title="Edit member"
                  onClick={() => onEdit(row.original)}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${row.original.name}`}
                  title="Remove member"
                  onClick={() => onRemove(row.original)}
                  className="h-7 w-7 text-muted-foreground hover:text-danger hover:bg-danger/10"
                >
                  <UserMinus className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
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
    initialState: {
      pagination: { pageSize: 10 },
      columnVisibility: { userId: false },
    },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const rangeStart = data.length === 0 ? 0 : pageIndex * pageSize + 1;
  const rangeEnd = Math.min((pageIndex + 1) * pageSize, table.getFilteredRowModel().rows.length);

  return (
    <div className="space-y-4">
      <div className="card-elevated overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-secondary-55 backdrop-blur">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-10 px-4 text-left font-semibold text-sm text-paragraph border-r border-border last:border-r-0 whitespace-nowrap"
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
                key={row.original.userId ?? row.original.id ?? row.id}
                className="border-b border-border last:border-b-0 hover:bg-primary/5 transition-colors group"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 border-r border-border last:border-r-0">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fixed: was `rows.length === 10`, which hid Prev/Next on any
          page that wasn't fully filled (e.g. a last page of 5). Now
          shown whenever there's more than one page, regardless of how
          many rows are on the current page. */}
      {table.getPageCount() > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing {rangeStart}-{rangeEnd} of {table.getFilteredRowModel().rows.length} members
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="border-border text-paragraph hover:bg-muted"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="border-border text-paragraph hover:bg-muted"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}