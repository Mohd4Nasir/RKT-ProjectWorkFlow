import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowUpRight, CalendarClock, CheckCircle2, FolderKanban, ListChecks,
  Plus, RefreshCw, Target, Users as UsersIcon,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store';
import { StatCard } from '@/components/StatCard';
import { SectionCard, EmptyBlock, SkeletonBlock } from '@/components/SectionCard';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';
import { projectApiService } from '@/services/projectsApiService';
import { Project } from '@/types/ProejctsType';
import {
  fmtDate, isProjectOverdue, projectProgress, statusUi,
} from '@/pages/projects/projectUi';
import { showError } from '@/lib/errorAlert';

const STATUS_HEX: Record<string, string> = {
  OPEN: '#10b981',
  IN_PROGRESS: '#3b82f6',
  ON_HOLD: '#f97316',
  DELAYED: '#ef4444',
  COMPLETED: '#8b5cf6',
  CLOSED: '#71717a',
};

const tooltipStyle = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 12,
  fontSize: 12,
  boxShadow: 'var(--shadow-md)',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function daysLeft(d?: string): number | null {
  if (!d) return null;
  const end = new Date(d);
  if (isNaN(end.getTime())) return null;
  end.setHours(23, 59, 59, 999);
  return Math.ceil((end.getTime() - Date.now()) / 86_400_000);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === 'admin';
  const projectsBase = isAdmin ? '/projects' : '/my-projects';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setProjects(await projectApiService.getProjects());
    } catch (err) {
      setError(true);
      showError(err, 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const k = useMemo(() => {
    const totalTasks = projects.reduce((s, p) => s + Number(p.totalTask ?? 0), 0);
    const doneTasks = projects.reduce((s, p) => s + Number(p.completedTask ?? 0), 0);
    const overdue = projects.filter(isProjectOverdue);
    const owners = new Map<string, { name: string; count: number }>();
    projects.forEach((p) =>
      (p.owners ?? []).forEach((o) => {
        const key = String(o.ownerId);
        const cur = owners.get(key) ?? { name: o.ownerName, count: 0 };
        cur.count += 1;
        owners.set(key, cur);
      }),
    );
    const byStatus = Object.keys(STATUS_HEX)
      .map((st) => ({
        key: st,
        name: statusUi(st).label,
        value: projects.filter((p) => p.projectStatus === st).length,
        color: STATUS_HEX[st],
      }))
      .filter((s) => s.value > 0);

    const upcoming = projects
      .filter((p) => p.endDate && !['COMPLETED', 'CLOSED'].includes(p.projectStatus) && !isProjectOverdue(p))
      .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())
      .slice(0, 5);

    const taskBars = [...projects]
      .filter((p) => Number(p.totalTask ?? 0) > 0)
      .sort((a, b) => Number(b.totalTask) - Number(a.totalTask))
      .slice(0, 6)
      .map((p) => ({
        name: p.projectTitle.length > 16 ? `${p.projectTitle.slice(0, 15)}…` : p.projectTitle,
        Completed: Number(p.completedTask ?? 0),
        Remaining: Math.max(Number(p.totalTask ?? 0) - Number(p.completedTask ?? 0), 0),
      }));

    return {
      total: projects.length,
      active: projects.filter((p) => ['OPEN', 'IN_PROGRESS'].includes(p.projectStatus)).length,
      totalTasks,
      doneTasks,
      pct: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
      overdue,
      team: [...owners.values()].sort((a, b) => b.count - a.count),
      byStatus,
      upcoming,
      taskBars,
    };
  }, [projects]);

  const firstName = (user?.name || 'there').split(' ')[0];
  const recent = [...projects].sort((a, b) => Number(b.projectId) - Number(a.projectId)).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="hero-surface p-6 md:p-8">
        <div aria-hidden className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
        <div aria-hidden className="absolute -left-10 -bottom-24 h-56 w-56 rounded-full bg-info/20 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-display font-bold text-white">
              {greeting()}, {firstName} 👋
            </h1>
            <p className="mt-1.5 text-sm text-white/70 max-w-xl">
              {loading
                ? 'Loading your workspace…'
                : k.overdue.length > 0
                  ? `${k.overdue.length} project${k.overdue.length > 1 ? 's are' : ' is'} past due and need${k.overdue.length > 1 ? '' : 's'} your attention.`
                  : isAdmin
                    ? "Everything's on track across your organisation."
                    : "You're all caught up. Nice work!"}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild className="bg-white text-foreground hover:bg-white/90 shadow-none">
                <Link to={projectsBase}>
                  <Plus className="h-4 w-4 mr-1" /> {isAdmin ? 'New Project' : 'My Projects'}
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={load}
                disabled={loading}
              >
                <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} /> Refresh
              </Button>
            </div>
          </div>

          {/* Completion ring */}
          <div className="flex items-center gap-5 rounded-2xl bg-white/10 backdrop-blur px-6 py-5 ring-1 ring-white/15 self-start lg:self-auto">
            <ProgressRing value={k.pct} />
            <div>
              <div className="text-xs uppercase tracking-wider text-white/60">Overall completion</div>
              <div className="text-sm text-white/90 mt-1">
                <span className="font-bold text-lg">{k.doneTasks}</span>
                <span className="text-white/60"> / {k.totalTasks} tasks done</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="card-elevated border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-destructive font-medium">
            <AlertTriangle className="h-4 w-4" /> Couldn't load dashboard data.
          </span>
          <Button size="sm" variant="outline" onClick={load}>Retry</Button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={loading ? '—' : k.total} icon={FolderKanban} hint={`${k.active} active`} variant="primary" />
        <StatCard title="Total Tasks" value={loading ? '—' : k.totalTasks} icon={ListChecks} hint="across all projects" variant="info" />
        <StatCard title="Completed Tasks" value={loading ? '—' : k.doneTasks} icon={CheckCircle2} hint={`${k.pct}% completion`} variant="success" />
        <StatCard title="Overdue Projects" value={loading ? '—' : k.overdue.length} icon={AlertTriangle} hint="past end date" variant="warning" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <SectionCard className="xl:col-span-2" title="Tasks by project" subtitle="Top projects by task volume">
          {loading ? (
            <SkeletonBlock h={260} />
          ) : k.taskBars.length === 0 ? (
            <EmptyBlock icon={ListChecks} text="No tasks yet — create tasks inside a project to see progress here." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={k.taskBars} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
                <Bar dataKey="Completed" stackId="a" fill="hsl(var(--chart-3))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Remaining" stackId="a" fill="hsl(var(--chart-1) / 0.35)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Project status" subtitle="Distribution across all projects">
          {loading ? (
            <SkeletonBlock h={260} />
          ) : k.byStatus.length === 0 ? (
            <EmptyBlock icon={FolderKanban} text="No projects yet." />
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={k.byStatus} dataKey="value" innerRadius={58} outerRadius={84} paddingAngle={3} stroke="none">
                      {k.byStatus.map((e) => <Cell key={e.key} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-2xl font-bold font-display">{k.total}</div>
                    <div className="text-[11px] text-muted-foreground">projects</div>
                  </div>
                </div>
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {k.byStatus.map((s) => (
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

      {/* Deadlines / attention / team */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Upcoming deadlines" subtitle="Next projects due" icon={CalendarClock}>
          {loading ? (
            <SkeletonBlock h={180} />
          ) : k.upcoming.length === 0 ? (
            <EmptyBlock icon={CalendarClock} text="No upcoming deadlines." />
          ) : (
            <ul className="divide-y divide-border -my-2">
              {k.upcoming.map((p) => {
                const d = daysLeft(p.endDate);
                return (
                  <li key={p.projectId}>
                    <button
                      onClick={() => navigate(`${projectsBase}/${p.projectId}`)}
                      className="w-full flex items-center justify-between gap-3 py-3 text-left hover:opacity-80"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{p.projectTitle}</div>
                        <div className="text-[11px] text-muted-foreground">{fmtDate(p.endDate)}</div>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          d !== null && d <= 7 ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {d === 0 ? 'Today' : `${d}d left`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Needs attention" subtitle="Overdue projects" icon={AlertTriangle}>
          {loading ? (
            <SkeletonBlock h={180} />
          ) : k.overdue.length === 0 ? (
            <EmptyBlock icon={Target} text="Nothing overdue. You're on track!" />
          ) : (
            <ul className="divide-y divide-border -my-2">
              {k.overdue.slice(0, 5).map((p) => (
                <li key={p.projectId}>
                  <button
                    onClick={() => navigate(`${projectsBase}/${p.projectId}`)}
                    className="w-full flex items-center justify-between gap-3 py-3 text-left hover:opacity-80"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{p.projectTitle}</div>
                      <div className="text-[11px] text-muted-foreground">Due {fmtDate(p.endDate)}</div>
                    </div>
                    <span className="shrink-0 rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-[11px] font-semibold">
                      {Math.abs(daysLeft(p.endDate) ?? 0)}d overdue
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Team" subtitle="Project owners by workload" icon={UsersIcon}>
          {loading ? (
            <SkeletonBlock h={180} />
          ) : k.team.length === 0 ? (
            <EmptyBlock icon={UsersIcon} text="No owners assigned yet." />
          ) : (
            <ul className="space-y-3">
              {k.team.slice(0, 5).map((m) => (
                <li key={m.name} className="flex items-center gap-3">
                  <UserAvatar name={m.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{m.name}</span>
                      <span className="text-xs text-muted-foreground">{m.count} project{m.count > 1 ? 's' : ''}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.round((m.count / k.team[0].count) * 100)}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Recent projects */}
      <SectionCard
        title="Recent projects"
        subtitle="Latest projects and their progress"
        action={
          <Link to={projectsBase} className="text-xs text-primary font-semibold hover:text-primary-hover inline-flex items-center gap-1">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        }
        flush
      >
        {loading ? (
          <div className="p-5"><SkeletonBlock h={200} /></div>
        ) : recent.length === 0 ? (
          <EmptyBlock icon={FolderKanban} text="No projects yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-pro">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th className="min-w-[180px]">Progress</th>
                  <th>Owners</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => {
                  const st = statusUi(p.projectStatus);
                  const pct = projectProgress(p);
                  const overdue = isProjectOverdue(p);
                  return (
                    <tr
                      key={p.projectId}
                      className="cursor-pointer"
                      onClick={() => navigate(`${projectsBase}/${p.projectId}`)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="h-9 w-9 rounded-lg grid place-items-center bg-primary/10 text-primary font-bold text-xs shrink-0">
                            {p.projectTitle.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold truncate max-w-[260px]">{p.projectTitle}</div>
                            <div className="text-[11px] font-mono text-muted-foreground">
                              PRJ-{String(p.projectId).padStart(3, '0')}
                            </div>
                          </div>
                        </div>
                      </td>
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
                      <td>
                        <div className="flex -space-x-2">
                          {(p.owners ?? []).slice(0, 3).map((o) => (
                            <UserAvatar key={String(o.ownerId)} name={o.ownerName} size="sm" />
                          ))}
                          {(p.owners ?? []).length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className={cn('text-xs whitespace-nowrap', overdue ? 'text-destructive font-semibold' : 'text-muted-foreground')}>
                        {fmtDate(p.endDate)}
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
  );
}

/* ───────────── small building blocks ───────────── */

function ProgressRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="7" />
        <circle
          cx="40" cy="40" r={r} fill="none" stroke="white" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * value) / 100}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-lg font-bold font-display text-white">{value}%</div>
    </div>
  );
}
