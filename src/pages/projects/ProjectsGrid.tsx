import { ArrowRight, Edit2, Trash2, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/UserAvatar';
import { Project, Users } from '@/types/ProejctsType';
import { ProjectStatsMap } from './ProjectStats';
import { cn } from '@/lib/utils';

function fmtDMY(d?: string) {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${dt.getFullYear()}`;
}

const statusMap: Record<string, { label: string; chip: string }> = {
  OPEN: { label: 'Open', chip: 'bg-muted text-muted-foreground' },
  IN_PROGRESS: { label: 'In Progress', chip: 'bg-info text-info-foreground' },
  COMPLETED: { label: 'Completed', chip: 'bg-success text-success-foreground' },
  ON_HOLD: { label: 'On Hold', chip: 'bg-warning text-warning-foreground' },
  DELAYED: { label: 'Delayed', chip: 'bg-danger text-danger-foreground' },
  CLOSED: { label: 'Closed', chip: 'bg-muted text-muted-foreground' },
};

interface Props {
  projects: Project[];
  users: Users[];
  stats: ProjectStatsMap;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
}

export function ProjectsGrid({ projects, users, stats, onEdit, onDelete }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {projects.map((p, i) => {
        const owners = p.owners ?? [];
        const totalTask = p.totalTask ?? stats[p.projectId]?.total ?? 0;
        const completedTask = p.completedTask ?? stats[p.projectId]?.done ?? 0;
        const pct = totalTask ? Math.round((completedTask / totalTask) * 100) : 0;
        const st = statusMap[p.projectStatus] ?? statusMap.OPEN;

        return (
          <article
            key={p.projectId}
            className={cn(
              'group flex flex-col overflow-hidden rounded-2xl border border-border/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated',
              i % 2 === 0 ? 'project-card-surface' : 'project-card-surface-alt'
            )}
          >
            <div className="flex items-start gap-2.5 p-3.5">
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/70 text-[11px] font-extrabold uppercase text-heading ring-1 ring-white/60 transition-transform duration-300 group-hover:scale-105"
                style={p.color ? { color: p.color } : undefined}
              >
                {p.projectTitle.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </span>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold leading-tight text-heading">
                  {p.projectTitle}
                </h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      st.chip
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                    {st.label}
                  </span>
                  <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-paragraph">
                    #{p.projectId}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 rounded-md hover:bg-primary-55 hover:text-primary"
                  onClick={() => onEdit(p)}
                  aria-label={`Edit ${p.projectTitle}`}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 rounded-md text-danger hover:bg-danger/10"
                  onClick={() => onDelete(String(p.id))}
                  aria-label={`Delete ${p.projectTitle}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {(() => {
              const band = (
                <div className="project-card-band mx-3.5 mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-paragraph">
                  <UsersIcon className="h-3 w-3 shrink-0 opacity-60" />
                  {owners[0] ? (
                    <UserAvatar name={owners[0].ownerName} size="sm" className="h-6 w-6 text-[9px]" />
                  ) : null}
                  {owners.length > 1 && (
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      +{owners.length - 1}
                    </span>
                  )}
                  <span className="truncate font-medium">
                    {owners.length ? owners[0].ownerName : 'Unassigned'}
                  </span>
                </div>
              );

              if (owners.length < 2) return band;

              return (
                <Tooltip>
                  <TooltipTrigger asChild>{band}</TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[15rem] p-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Owners ({owners.length})
                    </p>
                    <ul className="flex flex-col gap-1">
                      {owners.map((o) => (
                        <li key={String(o.ownerId)} className="flex items-center gap-2 text-xs">
                          <UserAvatar name={o.ownerName} size="sm" className="h-5 w-5 text-[8px]" />
                          <span className="truncate">{o.ownerName}</span>
                        </li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              );
            })()}

            <div className="mt-auto px-3.5 pb-3.5 pt-3">
              <div className="project-card-band flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[11px] tabular-nums text-paragraph">
                <span>{fmtDMY(p.startDate)}</span>
                <ArrowRight className="h-3 w-3 shrink-0 opacity-50" />
                <span>{fmtDMY(p.endDate)}</span>
                <span className="ml-auto rounded-full bg-accent-55 px-1.5 py-px font-semibold text-accent-foreground">
                  {pct}%
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/60">
                  <div className="h-full rounded-full bg-accent-55" style={{ width: `${pct}%` }} />
                </div>
                <span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {completedTask}/{totalTask} tasks
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
