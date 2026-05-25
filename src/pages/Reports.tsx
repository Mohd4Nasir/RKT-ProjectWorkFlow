import { useAppSelector } from '@/store';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Progress } from '@/components/ui/progress';
import { UserAvatar } from '@/components/UserAvatar';
import { toast } from 'sonner';

export default function Reports() {
  const projects = useAppSelector((s) => s.projects.items);
  const tasks = useAppSelector((s) => s.tasks.items);
  const users = useAppSelector((s) => s.users.items);

  const projProgress = projects.map((p) => ({ name: p.name.split(' ')[0], progress: p.progress }));
  const sla = [
    { name: 'On track', value: projects.filter((p) => p.sla === 'on-track').length, color: 'hsl(160 84% 39%)' },
    { name: 'At risk', value: projects.filter((p) => p.sla === 'at-risk').length, color: 'hsl(38 92% 50%)' },
    { name: 'Breached', value: projects.filter((p) => p.sla === 'breached').length, color: 'hsl(0 84% 60%)' },
  ];

  const userPerf = users.slice(0, 6).map((u) => {
    const t = tasks.filter((x) => x.assigneeId === u.id);
    return {
      user: u.name.split(' ')[0],
      completed: t.filter(x => x.status === 'done').length,
      open: t.filter(x => x.status !== 'done').length,
    };
  });

  const trend = ['W1','W2','W3','W4','W5','W6','W7','W8'].map((w, i) => ({
    week: w, productivity: 60 + Math.round(Math.sin(i / 1.5) * 15 + i * 2),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Track team performance, project progress and SLA health."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success('PDF export queued')}><FileText className="h-4 w-4 mr-1" /> PDF</Button>
            <Button variant="outline" onClick={() => toast.success('Excel export queued')}><Download className="h-4 w-4 mr-1" /> Excel</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-elevated p-6 lg:col-span-2">
          <h3 className="font-display font-bold text-lg mb-1">Project Progress</h3>
          <p className="text-xs text-muted-foreground mb-4">% completion across all active projects</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={projProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Bar dataKey="progress" fill="hsl(261 38% 59%)" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-elevated p-6">
          <h3 className="font-display font-bold text-lg mb-1">SLA Performance</h3>
          <p className="text-xs text-muted-foreground mb-4">Service-level adherence</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sla} dataKey="value" innerRadius={50} outerRadius={85} paddingAngle={3}>
                {sla.map((s) => <Cell key={s.name} fill={s.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-elevated p-6 lg:col-span-2">
          <h3 className="font-display font-bold text-lg mb-1">Team Productivity Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Weighted productivity score</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Line type="monotone" dataKey="productivity" stroke="hsl(273 67% 49%)" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card-elevated p-6">
          <h3 className="font-display font-bold text-lg mb-4">Task Completion / User</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={userPerf} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis type="category" dataKey="user" stroke="hsl(var(--muted-foreground))" fontSize={11} width={70} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Bar dataKey="completed" stackId="a" fill="hsl(160 84% 39%)" radius={[0,0,0,0]} />
              <Bar dataKey="open" stackId="a" fill="hsl(38 92% 50%)" radius={[0,8,8,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-elevated p-6">
        <h3 className="font-display font-bold text-lg mb-4">Project Health</h3>
        <div className="space-y-4">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-4">
              <span className="h-9 w-9 rounded-lg grid place-items-center text-white font-bold text-xs shrink-0" style={{ background: p.color }}>
                {p.name.split(' ').map(w => w[0]).slice(0,2).join('')}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm truncate">{p.name}</div>
                  <div className="text-xs font-semibold ml-2">{p.progress}%</div>
                </div>
                <Progress value={p.progress} className="h-1.5 mt-1.5" />
              </div>
              <div className="hidden sm:flex -space-x-2">
                {p.members.slice(0, 3).map((id) => {
                  const u = users.find((x) => x.id === id);
                  return u ? <UserAvatar key={id} name={u.name} size="sm" /> : null;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
