/* eslint-disable @typescript-eslint/no-explicit-any */
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender, ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Crown, Star, UserMinus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { UserAvatar } from '../UserAvatar';
import { rollupVersion } from 'vite';

interface UserTableProps {
    data: any[];
    projectOwnerId: string;
    onRoleChange: (userId: string, role: string) => void;
    onRemove: (user: any) => void;
    globalFilter: string;
    onGlobalFilterChange: (value: string) => void;
}

export function UserTable({ data, projectOwnerId, onRoleChange, onRemove, globalFilter, onGlobalFilterChange }: UserTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const columns: ColumnDef<any>[] = [
        {
            id: 'userId',
            accessorKey: 'userId',
            header: 'User ID',
            cell: ({ row }) => <span style={{ color: '#222525' }}>{row.original.userId}</span>,
            // Hide this column by default
            enableHiding: true,
        },
        {
            id: 'userInfo',
            header: 'User',
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-3">
                        <UserAvatar name={row.original.name} size='sm' />
                        <div className="font-medium" style={{ color: '#232323' }}>
                            {row.original.name}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ row }) => (
                <span className="text-xs" style={{ color: '#222525' }}>
                    {row.original.email}
                </span>
            ),
        },
        {
            accessorKey: 'joinedOn',
            header: 'Joined Date',
            cell: ({ row }) => {
                const date = new Date(row.original.joinedOn);
                const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                return <span className="text-xs" style={{ color: '#222525' }}>{formattedDate || '—'}</span>;
            },
        },
        {
            accessorKey: 'teamRole',
            header: 'Role',
            cell: ({ row }) => {
                const isOwner = row.original.teamRole === 'OWNER';
                return (
                    <Badge
                        className={isOwner ? 'text-amber-700' : 'text-blue-700'}
                        style={{
                            backgroundColor: isOwner ? '#f8f5f2' : '#f8f5f2',
                            color: isOwner ? '#232323' : '#232323',
                            border: `1px solid ${isOwner ? '#232323' : '#232323'}`
                        }}
                    >
                        {isOwner ? <Crown className="h-3 w-3 mr-1" style={{ color: '#f45d48' }} /> : <Star className="h-3 w-3 mr-1" style={{ color: '#078080' }} />}
                        {isOwner ? 'Owner' : 'Member'}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const isOwner = row.original.teamRole === 'OWNER';
                if (isOwner) return <span className="text-xs" style={{ color: '#222525' }}>Full Access</span>;

                return (
                    <div className="flex items-center gap-2">
                        <Select onValueChange={(v) => onRoleChange(row.original.userId, v)}>
                            <SelectTrigger
                                className="w-[110px] h-7 text-xs"
                                style={{
                                    backgroundColor: '#fffffe',
                                    borderColor: '#232323',
                                    color: '#232323'
                                }}
                            >
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent style={{ backgroundColor: '#fffffe', borderColor: '#232323' }}>
                                <SelectItem value="MEMBER" style={{ color: '#232323' }}>Member</SelectItem>
                                <SelectItem value="CONTRIBUTOR" style={{ color: '#232323' }}>Contributor</SelectItem>
                                <SelectItem value="VIEWER" style={{ color: '#232323' }}>Viewer</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemove(row.original)}
                            className="text-red-600 hover:bg-transparent"
                            style={{ color: '#f45d48' }}
                        >
                            <UserMinus className="h-3.5 w-3.5" />
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
        onGlobalFilterChange: onGlobalFilterChange,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: { pageSize: 10 },
            columnVisibility: {
                userId: false, // Hide userId column by default
            }
        },
    });

    return (
        <div className="space-y-4" >
            <div className="rounded-2xl border" style={{ backgroundColor: '#fffffe', }}>
                <table className="w-full rounded-2xl text-sm">
                    <thead  className =" rounded-2xl bg-blue-100/75   " >
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="h-10 px-4 text-left font-medium"
                                        style={{ color: '#232323' }}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id} className="border-b" style={{ borderColor: '#f8f5f2' }}>
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="px-4 py-3" style={{ color: '#222525' }}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {table.getRowModel().rows.length === 10 && (
                <div className="flex justify-between items-center">
                    <div className="text-sm" style={{ color: '#222525' }}>
                        Showing {table.getRowModel().rows.length} of {data.length} members
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            style={{
                                backgroundColor: '#E07B39',
                                color: '#232323',
                                borderColor: '#E07B39'
                            }}
                            className="hover:opacity-80"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            style={{
                                backgroundColor: '#E07B39',
                                color: '#232323',
                                borderColor: '#E07B39'
                            }}
                            className="hover:opacity-80"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

        </div>
    );
}