import { Project } from '@/types/ProejctsType';

export interface ProjectStat {
  total: number; done: number; pct: number;
  milestones: number; mDone: number; issues: number;
}

export type ProjectStatsMap = Record<string, ProjectStat>;

interface Props { projects: Project[]; stats: ProjectStatsMap; }

export function ProjectStats({ projects, stats }: Props) {
  const totals = projects.reduce(
    (acc, p) => {
      const s = stats[p.id];
      if (!s) return acc;
      acc.tasks += s.total;
      acc.done += s.done;
      acc.issues += s.issues;
      acc.milestones += s.milestones;
      return acc;
    },
    { tasks: 0, done: 0, issues: 0, milestones: 0 },
  );

  const Item = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-baseline gap-2">
      <span className="text-base font-semibold text-foreground tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-6">
      <Item label="Projects" value={projects.length} />
      <Item label="Tasks" value={totals.tasks} />
      <Item label="Completed" value={totals.done} />
      <Item label="Milestones" value={totals.milestones} />
      <Item label="Issues" value={totals.issues} />
    </div>
  );
}
