// src/components/projects/ProjectsTable.tsx
import { FullscreenButton, FULLSCREEN_CLASS, useFullscreen } from '@/components/FullscreenButton';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  CalendarDays, ClipboardList, Edit2, Trash2, MoreHorizontal,
} from 'lucide-react';
import {
  createColumnHelper, flexRender, getCoreRowModel,
  getPaginationRowModel, getFilteredRowModel, useReactTable,
} from '@tanstack/react-table';
import { Project, Users } from '@/types/ProejctsType';
import { InlineEdit } from '@/components/cells/InlineEdit';
import { DatePickerCell } from '@/components/cells/DatePickerCell';
import { statusUi, PROJECT_STATUS_VALUES } from './projectUi';
import { CountBar } from './CountBar';
import type { CSSProperties } from 'react';

// first two columns stay pinned while scrolling horizontally
const STICKY_LEFT: Record<string, number> = { projectId: 0, projectTitle: 100 };
const stickyStyle = (id: string, width: number, z: number): CSSProperties =>
  id in STICKY_LEFT
    ? { width, minWidth: width, maxWidth: width, position: 'sticky', left: STICKY_LEFT[id], zIndex: z }
    : { width };

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
  onChangeStatus?: (project: Project, status: string) => void;
}

const PROJECT_STATUSES: string[] = PROJECT_STATUS_VALUES as unknown as string[];

type Owner = { ownerName: string; ownerId?: string | number };

/** Derives a stable PRI-xxx code from a project id. */
function projectCode(project: Project): string {
  const id = Number(String(project.projectId).replace(/\D/g, ''));
  return `PRI-${String(id).padStart(3, '0')}`;
}

/** Turns "Nasir Rajput" into "NR". */
function getInitials(name: string): string {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/**
 * Tiny deterministic string hash — same input always picks the same
 * palette color, so a given owner or status keeps its color even when
 * rows re-sort, re-filter, or re-paginate.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

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
        <span className="truncate text-sm">{first.ownerName}</span>
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
  onEdit,
  onDelete,
  onUpdate,
  onProjectClick,
  onChangeStatus,
}: ProjectsTableProps) {
  const columnHelper = createColumnHelper<Project>();
  const fs = useFullscreen();

  const handleProjectNameClick = (projectId: string | number) => {
    if (onProjectClick) {
      onProjectClick(String(projectId));
    }
  };
 console.log('ProjectsTable rendering with projects:', projects);
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
            <div className="w-[230px] max-w-[230px]" title={p.projectTitle}>
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
        size: 270,
      }),

      columnHelper.accessor('projectStatus', {
        header: 'Status',
        cell: ({ getValue, row }) => {
          const status = getValue();
          const p = row.original;
          return (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold hover:opacity-80 ${statusUi(status).badge}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusUi(status).dot}`} />
                  {statusUi(status).label}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-36 p-1" align="start" onClick={(e) => e.stopPropagation()}>
                {PROJECT_STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onChangeStatus?.(p, st)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted ${st === status ? 'bg-muted font-semibold' : ''}`}
                  >
                    {statusUi(st).label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
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
        size: 160,
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
        size: 160,
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
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 opacity-70 group-hover:opacity-100 hover:opacity-100 transition-opacity"
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
                  onClick={() => onDelete(p.projectId)}
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
    [users, onUpdate, onEdit, onDelete, onProjectClick, onChangeStatus],
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
    <div className={fs.on ? FULLSCREEN_CLASS : undefined}>
    <div className={`card-elevated rounded-none overflow-hidden ${fs.on ? 'flex flex-col flex-1 min-h-0' : ''}`}>
      <div className="flex justify-end border-b border-border px-3 py-1.5">
        <FullscreenButton on={fs.on} onToggle={fs.toggle} />
      </div>
      <div className={`overflow-auto scrollbar-thin ${fs.on ? 'flex-1 min-h-0' : 'max-h-[max(380px,calc(100vh-27rem))]'}`}>
        <table
          className="text-sm border-collapse"
          style={{ tableLayout: 'fixed', width: table.getTotalSize(), minWidth: '100%' }}
        >
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`h-11 px-4 text-left font-semibold text-[11px] uppercase tracking-wider text-muted-foreground whitespace-nowrap ${header.column.id in STICKY_LEFT ? 'bg-muted' : ''}`}
                    style={stickyStyle(header.column.id, header.column.getSize(), 11)}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={table.getVisibleLeafColumns().length} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No data found
                </td>
              </tr>
            )}
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/70 last:border-b-0 hover:bg-primary/[0.04] transition-colors group"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-4 py-2.5 whitespace-nowrap overflow-hidden ${cell.column.id in STICKY_LEFT ? 'bg-card group-hover:bg-muted' : ''}`}
                    style={stickyStyle(cell.column.id, cell.column.getSize(), 1)}
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
    </div>
  );
}