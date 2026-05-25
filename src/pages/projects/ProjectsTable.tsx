// import {
//   Edit2, Trash2, CalendarDays, Flag, AlertCircle, ClipboardList, MoreHorizontal,
// } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import {
//   DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { InlineEdit } from '@/components/cells/InlineEdit';
// import { StatusSelectCell } from '@/components/cells/StatusSelect';
// import { OwnerPicker } from '@/components/cells/OwnerPicker';
// import { DatePickerCell } from '@/components/cells/DatePickerCell';
// import { Project } from '@/types';
// import { userById } from '@/utils/format';
// import { cn } from '@/lib/utils';
// import { CountBar, PillEmpty } from './CountBar';
// import { ProjectStatsMap } from './ProjectStats';

// function projectCode(p: Project, idx: number) {
//   const n = parseInt(p.id.replace(/\D/g, ''), 10) || idx + 1;
//   return `KI-${100 + n * 7}`;
// }

// interface Props {
//   projects: Project[];
//   users: any[];
//   stats: ProjectStatsMap;
//   onEdit: (p: Project) => void;
//   onDelete: (id: string) => void;
//   onUpdate: (p: Project) => void;
//   onOpenTasks: (p: Project) => void;
// }

// export function ProjectsTable({
//   projects, users, stats, onEdit, onDelete, onUpdate, onOpenTasks,
// }: Props) {
//   const headers = [
//     { key: 'id', label: 'ID', w: 'w-20' },
//     { key: 'name', label: 'Project Name', w: 'min-w-[220px]' },
//     { key: 'pct', label: '%', w: 'w-20' },
//     { key: 'status', label: 'Status', w: 'w-32', icon: <Flag className="h-3.5 w-3.5" /> },
//     { key: 'owner', label: 'Owner', w: 'w-44' },
//     { key: 'tasks', label: 'Tasks', w: 'w-56', icon: <ClipboardList className="h-3.5 w-3.5" /> },
//     { key: 'milestones', label: 'Milestones', w: 'w-48', icon: <Flag className="h-3.5 w-3.5" /> },
//     { key: 'issues', label: 'Issues', w: 'w-44', icon: <AlertCircle className="h-3.5 w-3.5" /> },
//     { key: 'start', label: 'Start Date', w: 'w-32', icon: <CalendarDays className="h-3.5 w-3.5" /> },
//     { key: 'end', label: 'End Date', w: 'w-32', icon: <CalendarDays className="h-3.5 w-3.5" /> },
//     { key: 'actions', label: '', w: 'w-12' },
//   ];

//   return (
//     <div className="card-elevated overflow-hidden">
//       <div className="overflow-auto scrollbar-thin max-h-[640px]">
//         <table className="w-full text-sm border-collapse">
//           <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
//             <tr className="border-b border-border">
//               {headers.map((h) => (
//                 <th
//                   key={h.key}
//                   className={cn(
//                     'h-10 px-3 text-left font-semibold text-xs text-muted-foreground border-r border-border last:border-r-0 whitespace-nowrap',
//                     h.w,
//                   )}
//                 >
//                   <div className="inline-flex items-center gap-1.5">
//                     {h.icon}
//                     {h.label}
//                   </div>
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {projects.map((p, idx) => {
//               const s = stats[p.id] || { total: 0, done: 0, pct: p.progress, milestones: 0, mDone: 0, issues: 0 };
//               const code = projectCode(p, idx);
//               const overdue = new Date(p.endDate).getTime() < Date.now() && p.status !== 'completed';
//               return (
//                 <tr
//                   key={p.id}
//                   className="border-b border-border last:border-b-0 hover:bg-primary/5 transition-colors group relative"
//                 >
//                   <td className="px-3 py-3 text-xs font-mono text-muted-foreground border-r border-border relative">
//                     <span
//                       className="absolute left-0 top-0 bottom-0 w-1"
//                       style={{ background: p.color }}
//                       aria-hidden
//                     />
//                     <span className="pl-1.5">{code}</span>
//                   </td>
//                   <td className="px-3 py-2 border-r border-border min-w-[220px]">
//                     <InlineEdit
//                       value={p.name}
//                       onSave={(v) => onUpdate({ ...p, name: v })}
//                       onClickWhenIdle={() => onOpenTasks(p)}
//                     />
//                     {p.tag && <div className="text-[10px] text-muted-foreground mt-0.5 pl-0.5">{p.tag}</div>}
//                   </td>
//                   <td className="px-3 py-3 border-r border-border font-semibold">{s.pct}%</td>
//                   <td className="px-2 py-2 border-r border-border">
//                     <StatusSelectCell value={p.status} onChange={(v) => onUpdate({ ...p, status: v })} />
//                   </td>
//                   <td className="px-2 py-2 border-r border-border">
//                     <OwnerPicker users={users} value={p.ownerId} onChange={(v) => onUpdate({ ...p, ownerId: v })} />
//                   </td>
//                   <td className="px-3 py-3 border-r border-border">
//                     <CountBar done={s.done} total={s.total} />
//                   </td>
//                   <td className="px-3 py-3 border-r border-border">
//                     {s.milestones > 0
//                       ? <CountBar done={s.mDone} total={s.milestones} colorClass="bg-info" />
//                       : <PillEmpty label="No Milestones" />}
//                   </td>
//                   <td className="px-3 py-3 border-r border-border">
//                     {s.issues > 0
//                       ? <CountBar done={Math.floor(s.issues / 2)} total={s.issues} colorClass="bg-danger" />
//                       : <PillEmpty label="No Issues" />}
//                   </td>
//                   <td className="px-2 py-2 border-r border-border whitespace-nowrap">
//                     <DatePickerCell value={p.startDate} onChange={(v) => onUpdate({ ...p, startDate: v })} />
//                   </td>
//                   <td className="px-2 py-2 border-r border-border whitespace-nowrap">
//                     <DatePickerCell
//                       value={p.endDate}
//                       onChange={(v) => onUpdate({ ...p, endDate: v })}
//                       className={overdue ? 'text-danger font-semibold' : ''}
//                     />
//                   </td>
//                   <td className="px-2 py-3">
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
//                           <MoreHorizontal className="h-4 w-4" />
//                         </Button>
//                       </DropdownMenuTrigger>
//                       <DropdownMenuContent align="end">
//                         <DropdownMenuItem onClick={() => onEdit(p)}>
//                           <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit
//                         </DropdownMenuItem>
//                         <DropdownMenuItem className="text-danger focus:text-danger" onClick={() => onDelete(p.id)}>
//                           <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
//                         </DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// src/components/projects/ProjectsTable.tsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store';
import { updateProject } from '@/store/slices/projectsSlice';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CalendarDays, Flag, AlertCircle, ClipboardList, Edit2, Trash2, MoreHorizontal,
} from 'lucide-react';
import {
  createColumnHelper, flexRender, getCoreRowModel,
  getPaginationRowModel, getFilteredRowModel, useReactTable,
} from '@tanstack/react-table';
import { Project, Users } from '@/types';
import { InlineEdit } from '@/components/cells/InlineEdit';
import { StatusSelectCell } from '@/components/cells/StatusSelect';
import { OwnerPicker } from '@/components/cells/OwnerPicker';
import { DatePickerCell } from '@/components/cells/DatePickerCell';
import { CountBar, PillEmpty } from './CountBar';
import { ChipGroup } from '@/components/ui/Chip';

export type ProjectStatsMap = Record<
  string,
  { total: number; done: number; pct: number; milestones: number; mDone: number; issues: number }
>;

interface ProjectsTableProps {
  projects: Project[];
  users: Users[];
  stats: ProjectStatsMap;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onUpdate: (project: Project) => void;
  onOpenTasks: (project: Project) => void;
}

/** Derives a stable KI-xxx code from a project id. */
function projectCode(p: Project, idx: number): string {
  const n = parseInt(p.id.replace(/\D/g, ''), 10) || idx + 1;
  return `KI-${100 + n * 7}`;
}

export function ProjectsTable({
  projects,
  users,
  stats,
  onEdit,
  onDelete,
  onUpdate,
  onOpenTasks,
}: ProjectsTableProps) {
  const columnHelper = createColumnHelper<Project>();
  function getRandomColor(): string {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'teal'];
    return colors[Math.floor(Math.random() * colors.length)];
  }



  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: ({ row, table }) => {
          const idx = table.getCoreRowModel().rows.findIndex((r) => r.id === row.id);
          const p = row.original;
          return (
            <div className="relative pl-3 flex items-center gap-1.5">
              <span
                className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                style={{ background: p.color }}
                aria-hidden
              />
              <span className="text-xs font-mono text-muted-foreground">
                {projectCode(p, idx)}
              </span>
            </div>
          );
        },
        size: 100,
      }),

      columnHelper.accessor('name', {
        header: 'Project Name',
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div>
              <InlineEdit
                value={p.name}
                onSave={(v) => onUpdate({ ...p, name: v })}
                onClickWhenIdle={() => onOpenTasks(p)}
              />
              {p.tag && (
                <div className="text-[10px] text-muted-foreground mt-0.5 pl-0.5">{p.tag}</div>
              )}
            </div>
          );
        },
        size: 250,
      }),

      columnHelper.accessor('progress', {
        header: '%',
        cell: ({ row }) => {
          const p = row.original;
          const pct = stats[p.id]?.pct ?? p.progress;
          return <span className="font-semibold">{pct}%</span>;
        },
        size: 80,
      }),

      columnHelper.accessor('status', {
        header: () => (
          <span className="inline-flex items-center gap-1.5">
            <Flag className="h-3 w-3" /> Status
          </span>
        ),
        cell: ({ row }) => {
          const p = row.original;
          return (
            <StatusSelectCell
              value={p.status}
              onChange={(v) => onUpdate({ ...p, status: v })}
            />
          );
        },
        size: 140,
      }),

      columnHelper.accessor('ownerId', {
        header: 'Owner',
        cell: ({ row }) => {
          const p = row.original;
          return (
            <OwnerPicker
              users={users}
              value={p.ownerId}
              onChange={(v) => onUpdate({ ...p, ownerId: v })}
            />
          );
        },
        size: 160,
      }),

      columnHelper.display({
        id: 'tasks',
        header: () => (
          <span className="inline-flex items-center gap-1.5">
            <ClipboardList className="h-3 w-3" /> Tasks
          </span>
        ),
        cell: ({ row }) => {
          const s = stats[row.original.id] ?? { done: 0, total: 0 };
          return <CountBar done={s.done} total={s.total} />;
        },
        size: 200,
      }),

      columnHelper.display({
        id: 'milestones',
        header: () => (
          <span className="inline-flex items-center gap-1.5">
            <Flag className="h-3 w-3" /> Milestones
          </span>
        ),
        cell: ({ row }) => {
          const s = stats[row.original.id];
          return s?.milestones > 0
            ? <CountBar done={s.mDone} total={s.milestones} colorClass="bg-info" />
            : <PillEmpty label="No Milestones" />;
        },
        size: 180,
      }),

      columnHelper.display({
        id: 'issues',
        header: () => (
          <span className="inline-flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" /> Issues
          </span>
        ),
        cell: ({ row }) => {
          const s = stats[row.original.id];
          return s?.issues > 0
            ? <CountBar done={Math.floor(s.issues / 2)} total={s.issues} colorClass="bg-danger" />
            : <PillEmpty label="No Issues" />;
        },
        size: 160,
      }),

      columnHelper.accessor('startDate', {
        header: () => (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3" /> Start Date
          </span>
        ),
        cell: ({ row }) => {
          const p = row.original;
          return (
            <DatePickerCell
              value={p.startDate}
              onChange={(v) => onUpdate({ ...p, startDate: v })}
            />
          );
        },
        size: 130,
      }),

      columnHelper.accessor('endDate', {
        header: () => (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3" /> End Date
          </span>
        ),
        cell: ({ row }) => {
          const p = row.original;
          const overdue = new Date(p.endDate).getTime() < Date.now() && p.status !== 'completed';
          return (
            <DatePickerCell
              value={p.endDate}
              onChange={(v) => onUpdate({ ...p, endDate: v })}
              className={overdue ? 'text-danger font-semibold' : ''}
            />
          );
        },
        size: 130,
      }),
      // If your Project type uses 'tag' instead of 'tags'
      columnHelper.accessor('tag', {
        header: 'Tags',
        cell: ({ row }) => {
          const p = row.original;
          const tags = p.tag ? p.tag.split(',').map(tag => tag.trim()) : [];

          const chipItems = tags.map(tag => ({
            label: tag,
            color: getRandomColor() // ya koi logic
          }));

          return <ChipGroup items={chipItems} size="sm" />;
        },
      }),


      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const p = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(p)}>
                  <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-danger focus:text-danger"
                  onClick={() => onDelete(p.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 50,
      }),
    ],
    [users, stats, onUpdate, onOpenTasks, onEdit, onDelete],
  );

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true, // pagination is handled externally by ProjectPagination
  });

  return (
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
                className="border-b border-border last:border-b-0 hover:bg-primary/5 transition-colors group"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-2 border-r border-border last:border-r-0"
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
  );
}
