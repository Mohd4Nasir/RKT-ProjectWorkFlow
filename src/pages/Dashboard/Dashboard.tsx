/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { FolderKanban, ListChecks, CheckCircle2, Users as UsersIcon, Plus, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { AvatarStack, UserAvatar } from '@/components/UserAvatar';
import { relativeTime, userById } from '@/utils/format';
import { apiService } from '@/services/apiService';

export default function Dashboard() {
  const user = useAppSelector((s) => s.auth.user!);
  const projects = useAppSelector((s) => s.projects.items);
  const tasks = useAppSelector((s) => s.tasks.lists);
  const users = useAppSelector((s) => s.users.items);
   // State for API test
  const [apiResponse, setApiResponse] = useState<string>('');
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  const isAdmin = user.role === 'admin';
  const myProjects = isAdmin ? projects : projects.filter((p) => p.members.includes(user.id));
  const myTasks = isAdmin ? tasks : tasks.filter((t) => t.assigneeId === user.id);

  const completed = myTasks.filter((t) => t.status === 'done').length;
  const active = myTasks.filter((t) => t.status !== 'done').length;

  const taskTrend = useMemo(() => {
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'].map((m, i) => ({
      month: m,
      created: 12 + Math.round(Math.sin(i) * 6 + i * 1.5),
      completed: 8 + Math.round(Math.cos(i) * 5 + i * 1.4),
    }));
  }, []);

  const productivity = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => ({
    day: d, hours: 4 + Math.round(Math.abs(Math.sin(i + 1)) * 6),
  }));

  const statusBreak = [
    { name: 'Active', value: projects.filter(p => p.status === 'active').length, color: 'hsl(261 38% 59%)' },
    { name: 'On Hold', value: projects.filter(p => p.status === 'on-hold').length, color: 'hsl(38 92% 50%)' },
    { name: 'Completed', value: projects.filter(p => p.status === 'completed').length, color: 'hsl(160 84% 39%)' },
  ];

  const recentActivity = [
    { id: 'a1', userId: 'u1', text: 'completed task “Performance audit”', when: '1h ago' },
    { id: 'a2', userId: 'u2', text: 'commented on “Design dashboard widgets”', when: '3h ago' },
    { id: 'a3', userId: 'u3', text: 'created task “iOS push notifications”', when: '5h ago' },
    { id: 'a4', userId: 'u8', text: 'updated “Nimbus Cloud Migration”', when: 'Yesterday' },
    { id: 'a5', userId: 'u4', text: 'joined “Vector Analytics”', when: '2d ago' },
  ];

  
  // ✅ API Test Call - useEffect mein
  useEffect(() => {
    const callHelloAPI = async () => {
      setApiLoading(true);
      setApiError('');
      setApiResponse('');
      
      try {
          console.log("Dashboard Render-------------");

        const result = await apiService.getHello();
        console.log('✅ API Response:', result);
        setApiResponse(JSON.stringify(result, null, 2));
      } catch (err: any) {
        console.error('❌ API Error:', err);
        setApiError(err.message || 'API call failed');
      } finally {
        setApiLoading(false);
      }
    };

    // Call the API when dashboard loads
    // callHelloAPI();
  }, []); // Empty dependency array - runs once on mount

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${user.name.split(' ')[0]} 👋`}
        subtitle={isAdmin ? "Here's what's happening across your organization today." : "Here's an overview of your work."}
        actions={
          <Button className="bg-primary hover:opacity-95 shadow-glow" asChild>
            <Link to="/projects"><Plus className="h-4 w-4 mr-1" /> New Project</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={myProjects.length} icon={FolderKanban} trend={12} hint="vs last month" variant="primary" />
        <StatCard title="Active Tasks" value={active} icon={ListChecks} trend={8} hint="this week" variant="warning" />
        <StatCard title="Completed Tasks" value={completed} icon={CheckCircle2} trend={24} hint="this month" variant="success" />
        <StatCard title="Team Members" value={users.filter(u => u.status==='active').length} icon={UsersIcon} trend={-2} hint="active" variant="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-elevated p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg">Task Completion Trend</h3>
              <p className="text-xs text-muted-foreground">Created vs completed over time</p>
            </div>
            <span className="text-xs text-muted-foreground">Last 8 months</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={taskTrend}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(261 38% 59%)" stopOpacity={0.45}/>
                  <stop offset="100%" stopColor="hsl(261 38% 59%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160 84% 39%)" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="hsl(160 84% 39%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Area type="monotone" dataKey="created" stroke="hsl(261 38% 59%)" strokeWidth={2.5} fill="url(#g1)" />
              <Area type="monotone" dataKey="completed" stroke="hsl(160 84% 39%)" strokeWidth={2.5} fill="url(#g2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card-elevated p-6">
          <h3 className="font-display font-bold text-lg mb-4">Project Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusBreak} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={4}>
                {statusBreak.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusBreak.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                </div>
                <span className="font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-elevated p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">Productivity (hrs)</h3>
            <Link to="/reports" className="text-xs text-primary font-semibold hover:text-primary-hover inline-flex items-center gap-1">
              View report <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={productivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Bar dataKey="hours" fill="hsl(261 38% 59%)" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-elevated p-6">
          <h3 className="font-display font-bold text-lg mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((a) => {
              const u = userById(users, a.userId);
              return (
                <div key={a.id} className="flex gap-3">
                  <UserAvatar name={u?.name || '?'} size="sm" />
                  <div className="text-sm flex-1 min-w-0">
                    <p><span className="font-semibold">{u?.name}</span> <span className="text-muted-foreground">{a.text}</span></p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{a.when}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-lg">Recent Projects</h3>
            <p className="text-xs text-muted-foreground">Latest project activity</p>
          </div>
          <Link to="/projects" className="text-xs text-primary font-semibold hover:text-primary-hover inline-flex items-center gap-1">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-semibold">Project</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">SLA</th>
                <th className="px-3 py-2 font-semibold">Progress</th>
                <th className="px-3 py-2 font-semibold">Team</th>
                <th className="px-3 py-2 font-semibold">Due</th>
              </tr>
            </thead>
            <tbody>
              {myProjects.slice(0, 5).map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-9 rounded-lg grid place-items-center text-white font-bold text-xs" style={{ background: p.color }}>
                        {p.projectTitle.split(' ').map(w => w[0]).slice(0,2).join('')}
                      </span>
                      <div>
                        <div className="font-semibold">{p.projectTitle}</div>
                        <div className="text-[11px] text-muted-foreground">{p.tag}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><StatusBadge value={p.projectStatus} /></td>
                  <td className="px-3 py-3"><StatusBadge value={p.sla} /></td>
                  <td className="px-3 py-3 min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <Progress value={p.progress} className="h-1.5" />
                      <span className="text-xs font-semibold w-8 text-right">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3"><AvatarStack names={p.members.map(id => userById(users, id)?.name || '?')} /></td>
                  <td className="px-3 py-3 text-muted-foreground text-xs">{relativeTime(p.endDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
