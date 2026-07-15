import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { UserAvatar } from '@/components/UserAvatar';
import { ProjectStatusPill } from '@/components/cells/StatusSelect';
import { Project } from '@/types/ProejctAndTask';
import { userById } from '@/utils/format';
import { CountBar } from './CountBar';
import { ProjectStatsMap } from './ProjectStats';

function fmtDMY(d?: string) {
  if (!d) return '—';
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${dt.getFullYear()}`;
}

interface Props {
  projects: Project[];
  users: any[];
  stats: ProjectStatsMap;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
}

export function ProjectsGrid({ projects, users, stats, onEdit, onDelete }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {projects.map((p) => {
        const owner = userById(users, p.ownerId);
        const s = stats[p.id];
        return (
          <div key={p.id} className="card-elevated p-5 hover:shadow-md transition-all hover:-translate-y-0.5 group">
            <div className="flex items-start justify-between mb-3">
              <span className="h-11 w-11 rounded-xl grid place-items-center text-white font-bold text-sm shadow"
                style={{ background: p.color }}>
                {p.name.split(' ').map(w => w[0]).slice(0,2).join('')}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(p)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-danger" onClick={() => onDelete(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <h3 className="font-display font-bold text-base mb-1 truncate">{p.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{p.description}</p>
            <div className="flex items-center gap-2 mb-3">
              <ProjectStatusPill status={p.status} />
              <StatusBadge value={p.sla} />
            </div>
            <CountBar done={s?.done || 0} total={s?.total || 0} />
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border text-xs">
              <div className="flex items-center gap-2 min-w-0">
                {owner && <UserAvatar name={owner.name} size="sm" />}
                <span className="truncate">{owner?.name}</span>
              </div>
              <span className="text-muted-foreground">{fmtDMY(p.endDate)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
