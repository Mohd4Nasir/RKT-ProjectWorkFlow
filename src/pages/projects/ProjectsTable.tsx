// src/components/projects/ProjectsTable.tsx
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  CalendarDays, Flag, AlertCircle, ClipboardList, Edit2, Trash2, MoreHorizontal,
} from 'lucide-react';
import {
  createColumnHelper, flexRender, getCoreRowModel,
  getPaginationRowModel, getFilteredRowModel, useReactTable,
} from '@tanstack/react-table';
import { Project, Users } from '@/types/ProejctsType';
import { InlineEdit } from '@/components/cells/InlineEdit';
import { DatePickerCell } from '@/components/cells/DatePickerCell';
import { CountBar, PillEmpty } from './CountBar';
import { getInitials } from '@/utils/stringUtils';
import hashString from '@/utils/HashString';

export type ProjectStatsMap = Record<
  string,
  { total: number; done: number; pct: number; milestones: number; mDone: number; issues: number }
>;

interface ProjectsTableProps {
  projects: Project[];
  users: Users[];
  stats: ProjectStatsMap;
  onEdit: (project: Project) => void;
  onDelete: (id: string | number) => void;
  onUpdate: (project: Project) => void;
  onOpenTasks: (project: Project) => void;
  onProjectClick?: (projectId: string | number) => void;
}

type Owner = { ownerName: string; ownerId?: string | number };

/** Derives a stable PRI-xxx code from a project id. */
function projectCode(project: Project): string {
  const id = Number(String(project.projectId).replace(/\D/g, ''));
  return `PRI-${String(id).padStart(3, '0')}`;
}



/**
 * Tiny deterministic string hash — same input always picks the same
 * palette color, so a given owner or status keeps its color even when
 * rows re-sort, re-filter, or re-paginate.
 */

/**
 * The 3 on-brand colors from index.css: primary (pink), secondary
 * (peach), accent (teal). `tint` = the -55 wash used for chip/avatar
 * backgrounds, `solid` = full-strength, used for the left ID bar.
 */
const COLOR_PALETTE = [
  { solid: 'bg-primary', tint: 'bg-primary-55', text: 'text-heading' },
  { solid: 'bg-secondary', tint: 'bg-secondary-55', text: 'text-heading' },
  { solid: 'bg-accent', tint: 'bg-accent-55', text: 'text-heading' },
] as const;

function colorFor(key: string) {
  return COLOR_PALETTE[hashString(key) % COLOR_PALETTE.length];
}

/**
 * Status -> Tailwind classes. COMPLETED/BLOCKED get their semantic
 * success/danger colors; anything else falls back to a hashed pick
 * from the brand palette so every status is visually distinct.
 */
const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-success/15 text-success',
  BLOCKED: 'bg-danger/15 text-danger',
};

function statusClasses(status: string) {
  if (STATUS_STYLES[status]) return STATUS_STYLES[status];
  const c = colorFor(status);
  return `${c.tint} ${c.text}`;
}

/** Owner avatar cluster: first owner inline, rest revealed in a
 *  popover that opens on hover (not just click). */
function OwnersCell({ owners }: { owners: Owner[] }) {
  const [open, setOpen] = useState(false);

  if (owners.length === 0) {
    return <span className="text-xs text-muted-foreground">Unassigned</span>;
  }

  const [first, ...rest] = owners;
  const firstColor = colorFor(first.ownerName);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-8 w-8 rounded-full ${firstColor.tint} ${firstColor.text} flex items-center justify-center text-xs font-semibold shrink-0`}
      >
        {getInitials(first.ownerName)}
      </div>
      <div className="flex items-center gap-1 min-w-0">
        <span className="truncate text-sm text-foreground">{first.ownerName}</span>
        {rest.length > 0 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <span
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0 cursor-default hover:bg-accent-55 hover:text-heading transition-colors"
              >
                +{rest.length}
              </span>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-56 p-2 z-popover"
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
            >
              <p className="text-xs font-semibold text-heading mb-1.5 px-1">
                Other owners
              </p>
              <div className="flex flex-col gap-1">
                {rest.map((owner, i) => {
                  const c = colorFor(owner.ownerName);
                  return (
                    <div
                      key={owner.ownerId ?? `${owner.ownerName}-${i}`}
                      className="flex items-center gap-2 px-1 py-1 rounded-md hover:bg-muted"
                    >
                      <div
                        className={`h-6 w-6 rounded-full ${c.tint} ${c.text} flex items-center justify-center text-[10px] font-semibold shrink-0`}
                      >
                        {getInitials(owner.ownerName)}
                      </div>
                      <span className="text-sm text-paragraph truncate">
                        {owner.ownerName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}

export function ProjectsTable({
  projects,
  users,
  stats,
  onEdit,
  onDelete,
  onUpdate,
  onProjectClick,
}: ProjectsTableProps) {
  const columnHelper = createColumnHelper<Project>();

  const handleProjectNameClick = (projectId: string | number) => {
    if (onProjectClick) {
      onProjectClick(String(projectId));
    }
  };
//  console.log('ProjectsTable rendering with projects:', projects);
  const columns = useMemo(
    () => [
      columnHelper.accessor('projectId', {
        header: 'ID',
        cell: ({ row }) => {
          const p = row.original;
          const barColor = colorFor(String(p.projectId)).solid;
          return (
            <div className="relative pl-3 flex items-center gap-1.5">
              <span
                className={`absolute left-0 top-0 bottom-0 w-1 rounded-r ${barColor}`}
                aria-hidden
              />
              <span className="text-xs font-mono text-muted-foreground">
                {projectCode(p)}
              </span>
            </div>
          );
        },
        size: 100,
      }),

      columnHelper.accessor('projectTitle', {
        header: 'Project Name',
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div>
              <InlineEdit
                value={p.projectTitle}
                onSave={(v) => onUpdate({ ...p, projectTitle: v })}
                onClickWhenIdle={() => handleProjectNameClick(p.projectId)}
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
          const pct = Math.min(100, Math.max(0, stats[p.projectId]?.pct ?? p.progress ?? 0));
          return (
            <div className="flex flex-col gap-1 w-full min-w-[70px]">
              <span className="text-xs font-semibold text-heading">{pct}%</span>
              <div className="h-1.5 w-full rounded-full bg-accent-55 overflow-hidden">
                {/* Width is a runtime percentage, not a fixed design
                    value, so it stays inline style — same reasoning as
                    the ID color bar: Tailwind can't statically generate
                    a class for a number that only exists at render time. */}
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        },
        size: 110,
      }),

      columnHelper.accessor('projectStatus', {
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue();
          return (
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusClasses(status)}`}>
              {status}
            </span>
          );
        },
        size: 140,
      }),

      // Owner column — a project can now have MULTIPLE owners.
      // First owner shows inline; the rest live in a hover popover
      // (OwnersCell above) instead of a plain title tooltip.
      columnHelper.accessor('owners', {
        header: 'Owner',
        cell: ({ getValue }) => <OwnersCell owners={getValue() || []} />,
        size: 220,
      }),

      columnHelper.display({
        id: 'tasks',
        header: () => (
          <span className="inline-flex items-center gap-1.5">
            <ClipboardList className="h-3 w-3" /> Tasks
          </span>
        ),
        cell: ({ row }) => (
          <CountBar
            done={row.original.completedTask || 0}
            total={row.original.totalTask || 0}
          />
        ),
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
          const s = stats[row.original.projectId];
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
          const s = stats[row.original.projectId];
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
          const overdue = p.endDate
            ? new Date(p.endDate).getTime() < Date.now() && p.projectStatus !== 'COMPLETED'
            : false;
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

      // columnHelper.display({
      //   id: 'actions',
      //   header: '',
      //   cell: ({ row }) => {
      //     const p = row.original;
      //     return (
      //       <DropdownMenu>
      //         <DropdownMenuTrigger asChild>
      //           <Button
      //             variant="outline"
      //             size="icon"
      //             className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
      //           >
      //             <MoreHorizontal className="h-4 w-4" />
      //           </Button>
      //         </DropdownMenuTrigger>
      //         <DropdownMenuContent align="end">
      //           <DropdownMenuItem onClick={() => onEdit(p)}>
      //             <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit
      //           </DropdownMenuItem>
      //           <DropdownMenuItem
      //             className="text-danger focus:text-danger"
      //             onClick={() => onDelete(p.projectId)}
      //           >
      //             <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
      //           </DropdownMenuItem>
      //         </DropdownMenuContent>
      //       </DropdownMenu>
      //     );
      //   },
      //   size: 50,
      // }),
    ],
    [users, stats, onUpdate, onEdit, onDelete, onProjectClick],
  );

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
  });

  return (
    <div className="card-elevated overflow-hidden">
      <div className="overflow-auto scrollbar-thin max-h-[640px]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-secondary-55 backdrop-blur">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-10 px-3 text-left font-semibold text-sm text-paragraph border-r border-border last:border-r-0 whitespace-nowrap"
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