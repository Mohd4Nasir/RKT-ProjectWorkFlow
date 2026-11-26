import { CalendarDays, CheckSquare, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { Project } from '@/types/ProejctsType';
import { cn } from '@/lib/utils';
import { fmtDate, isProjectOverdue, projectProgress, statusUi } from './projectUi';

interface Props {
  projects: Project[];
  users?: unknown[];
  stats?: unknown;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
  onProjectClick?: (projectId: string | number) => void;
}

export function ProjectsGrid({ projects, onEdit, onDelete, onProjectClick }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {projects.map((p) => {
        const st = statusUi(p.projectStatus);
        const pct = projectProgress(p);
        const overdue = isProjectOverdue(p);
        const owners = p.owners ?? [];
        const title = p.projectTitle || 'Untitled';

        return (
          <div
            key={p.projectId}
            role="button"
            tabIndex={0}
            onClick={() => onProjectClick?.(p.projectId)}
            onKeyDown={(e) => e.key === 'Enter' && onProjectClick?.(p.projectId)}
            className="card-elevated p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <div className="flex items-start justify-between mb-3 gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <span className="h-10 w-10 rounded-xl grid place-items-center text-white font-bold text-sm shadow shrink-0 bg-primary">
                  {title.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-sm truncate">{title}</h3>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    PRJ-{String(p.projectId).padStart(3, '0')}
                  </span>
                </div>
              </div>
              <div className="flex gap-0.5 opacity-70 group-hover:opacity-100 hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(p)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(String(p.id))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border', st.badge)}>
                <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                {st.label}
              </span>
              {overdue && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-red-50 text-red-700 border-red-200">
                  Overdue
                </span>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                <span className="inline-flex items-center gap-1">
                  <CheckSquare className="h-3 w-3" /> {p.completedTask ?? 0}/{p.totalTask ?? 0} tasks
                </span>
                <span className="font-semibold text-foreground">{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
              <div className="flex items-center min-w-0">
                {owners.length === 0 ? (
                  <span className="text-muted-foreground">Unassigned</span>
                ) : (
                  <div className="flex -space-x-2">
                    {owners.slice(0, 3).map((o) => (
                      <UserAvatar key={String(o.ownerId)} name={o.ownerName} size="sm" />
                    ))}
                    {owners.length > 3 && (
                      <span className="h-7 w-7 rounded-full bg-muted grid place-items-center text-[10px] font-semibold ring-2 ring-card">
                        +{owners.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <span className={cn('inline-flex items-center gap-1', overdue ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                <CalendarDays className="h-3 w-3" /> {fmtDate(p.endDate)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
