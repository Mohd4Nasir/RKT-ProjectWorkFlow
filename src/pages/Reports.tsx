import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, BarChart3, CheckCircle2, Download, FolderKanban, ListChecks, RefreshCw, Users as UsersIcon,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { SectionCard, EmptyBlock, SkeletonBlock } from '@/components/SectionCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { projectApiService } from '@/services/projectsApiService';
import { Project } from '@/types/ProejctsType';
import { fmtDate, isProjectOverdue, projectProgress, statusUi } from '@/pages/projects/projectUi';

const STATUS_HEX: Record<string, string> = {
  OPEN: '#10b981', IN_PROGRESS: '#3b82f6', ON_HOLD: '#f97316',
  DELAYED: '#ef4444', COMPLETED: '#8b5cf6', CLOSED: '#71717a',
};

const tooltipStyle = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 12,
  fontSize: 12,
  boxShadow: 'var(--shadow-md)',
};

const short = (s: string, n = 18) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export default function Reports() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setProjects(await projectApiService.getProjects());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const r = useMemo(() => {
    const totalTasks = projects.reduce((s, p) => s + Number(p.totalTask ?? 0), 0);
    const doneTasks = projects.reduce((s, p) => s + Number(p.completedTask ?? 0), 0);
    const overdue = projects.filter(isProjectOverdue);

    const byStatus = Object.keys(STATUS_HEX)
      .map((k) => ({ key: k, name: statusUi(k).label, value: projects.filter((p) => p.projectStatus === k).length, color: STATUS_HEX[k] }))
      .filter((x) => x.value > 0);

    const completion = [...projects]
      .filter((p) => Number(p.totalTask ?? 0) > 0)
      .map((p) => ({ name: short(p.projectTitle), pct: projectProgress(p) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 8);

    const owners = new Map<string, { name: string; projects: number }>();
    projects.forEach((p) =>
      (p.owners ?? []).forEach((o) => {
        const k = String(o.ownerId);
        const cur = owners.get(k) ?? { name: o.ownerName, projects: 0 };
        cur.projects += 1;
        owners.set(k, cur);
      }),
    );
    const workload = [...owners.values()].sort((a, b) => b.projects - a.projects).slice(0, 8)
      .map((o) => ({ name: short(o.name, 14), Projects: o.projects }));

    return {
      total: projects.length,
      totalTasks,
      doneTasks,
      pct: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
      overdue,
      byStatus,
      completion,
      workload,
    };
  }, [projects]);

  const exportCsv = () => {
    if (projects.length === 0) return toast.info('Nothing to export yet');
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Project ID', 'Title', 'Status', 'Owners', 'Total Tasks', 'Completed Tasks', 'Progress %', 'Start', 'End', 'Overdue'],
      ...projects.map((p) => [
        p.projectId, p.projectTitle, p.projectStatus, (p.owners ?? []).map((o) => o.ownerName).join('; '),
        p.totalTask ?? 0, p.completedTask ?? 0, projectProgress(p), p.startDate ?? '', p.endDate ?? '',
        isProjectOverdue(p) ? 'Yes' : 'No',
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `project-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Live analytics across all projects and tasks."
        actions={
          <>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} /> Refresh
            </Button>
            <Button onClick={exportCsv}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </>
        }
      />

      {error && (
        <div className="card-elevated border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-destructive font-medium">
            <AlertTriangle className="h-4 w-4" /> Couldn't load report data.
          </span>
          <Button size="sm" variant="outline" onClick={load}>Retry</Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Projects" value={loading ? '—' : r.total} icon={FolderKanban} variant="primary" />
        <StatCard title="Total Tasks" value={loading ? '—' : r.totalTasks} icon={ListChecks} variant="info" />
        <StatCard title="Completion" value={loading ? '—' : `${r.pct}%`} icon={CheckCircle2} hint={`${r.doneTasks} tasks done`} variant="success" />
        <StatCard title="Overdue" value={loading ? '—' : r.overdue.length} icon={AlertTriangle} hint="projects past end date" variant="warning" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <SectionCard className="xl:col-span-2" title="Completion by project" subtitle="% of tasks completed" icon={BarChart3}>
          {loading ? <SkeletonBlock h={280} /> : r.completion.length === 0 ? (
            <EmptyBlock icon={BarChart3} text="No task data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={r.completion} layout="vertical" margin={{ left: 8, right: 16 }} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} unit="%" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={120} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} formatter={(v: number) => `${v}%`} />
                <Bar dataKey="pct" name="Completed" fill="hsl(var(--chart-1))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Projects by status" subtitle="Current distribution">
          {loading ? <SkeletonBlock h={280} /> : r.byStatus.length === 0 ? (
            <EmptyBlock icon={FolderKanban} text="No projects yet." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={r.byStatus} dataKey="value" innerRadius={56} outerRadius={84} paddingAngle={3} stroke="none">
                    {r.byStatus.map((e) => <Cell key={e.key} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {r.byStatus.map((s) => (
                  <li key={s.key} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.name}
                    </span>
                    <span className="font-semibold">{s.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <SectionCard title="Owner workload" subtitle="Projects per owner" icon={UsersIcon}>
          {loading ? <SkeletonBlock h={240} /> : r.workload.length === 0 ? (
            <EmptyBlock icon={UsersIcon} text="No owners assigned yet." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={r.workload} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
                <Bar dataKey="Projects" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard className="xl:col-span-2" title="Project health" subtitle="Progress and deadlines" flush>
          {loading ? (
            <div className="p-5"><SkeletonBlock h={240} /></div>
          ) : projects.length === 0 ? (
            <EmptyBlock icon={FolderKanban} text="No projects yet." />
          ) : (
            <div className="overflow-auto max-h-[320px] scrollbar-thin">
              <table className="table-pro">
                <thead>
                  <tr><th>Project</th><th>Status</th><th className="min-w-[150px]">Progress</th><th>Due</th></tr>
                </thead>
                <tbody>
                  {projects.map((p) => {
                    const st = statusUi(p.projectStatus);
                    const pct = projectProgress(p);
                    const od = isProjectOverdue(p);
                    return (
                      <tr key={p.projectId} className="cursor-pointer" onClick={() => navigate(`/projects/${p.projectId}?tab=reports`)}>
                        <td className="font-semibold max-w-[240px] truncate">{p.projectTitle}</td>
                        <td>
                          <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border', st.badge)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} /> {st.label}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-semibold w-9 text-right tabular-nums">{pct}%</span>
                          </div>
                        </td>
                        <td className={cn('text-xs whitespace-nowrap', od ? 'text-destructive font-semibold' : 'text-muted-foreground')}>
                          {fmtDate(p.endDate)}{od && ' · overdue'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
