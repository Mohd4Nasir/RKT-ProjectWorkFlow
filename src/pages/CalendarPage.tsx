import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth,
  startOfMonth, startOfWeek, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Flag, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store';
import { useAllTasks } from '@/hooks/useAllTasks';
import { isTaskDone, taskStatusUi } from '@/pages/task/taskUi';

interface CalItem {
  id: string;
  kind: 'task' | 'project';
  title: string;
  projectId: number;
  projectTitle: string;
  date: Date;
  dot: string;
  done: boolean;
}

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const parse = (d?: string) => {
  if (!d) return null;
  const x = new Date(d);
  return isNaN(x.getTime()) ? null : x;
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const base = user?.role === 'admin' ? '/projects' : '/my-projects';

  const { projects, tasks, projectOptions, loading, reload } = useAllTasks();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [project, setProject] = useState('all');
  const [showDone, setShowDone] = useState(true);
  const [showProjects, setShowProjects] = useState(true);

  const items: CalItem[] = useMemo(() => {
    const out: CalItem[] = [];
    tasks.forEach((t) => {
      const d = parse(t.endDate);
      if (!d) return;
      out.push({
        id: `t-${t.projectId}-${t.taskId}`, kind: 'task', title: t.taskTitle,
        projectId: t.projectId, projectTitle: t.projectTitle, date: d,
        dot: taskStatusUi(t.taskStatus).dot, done: isTaskDone(t.taskStatus),
      });
    });
    if (showProjects) {
      projects.forEach((p) => {
        const d = parse(p.endDate);
        if (!d) return;
        out.push({
          id: `p-${p.projectId}`, kind: 'project', title: p.projectTitle,
          projectId: Number(p.projectId), projectTitle: p.projectTitle, date: d,
          dot: 'bg-primary', done: ['COMPLETED', 'CLOSED'].includes(p.projectStatus),
        });
      });
    }
    return out.filter((i) => (project === 'all' || String(i.projectId) === project) && (showDone || !i.done));
  }, [tasks, projects, project, showDone, showProjects]);

  const days = useMemo(
    () => eachDayOfInterval({
      start: startOfWeek(cursor, { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
    }),
    [cursor],
  );

  const monthCount = items.filter((i) => isSameMonth(i.date, cursor)).length;
  const today = new Date();

  const open = (i: CalItem) =>
    navigate(`${base}/${i.projectId}${i.kind === 'task' ? '?tab=tasks' : ''}`);

  return (
    <div className="page-fill !gap-4">
      <PageHeader
        title="Calendar"
        subtitle="Task due dates and project deadlines at a glance."
        actions={
          <Button variant="outline" onClick={reload} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} /> Refresh
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="card-elevated p-3 flex flex-wrap items-center gap-2 shrink-0 -mt-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCursor((c) => subMonths(c, 1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="h-9" onClick={() => setCursor(startOfMonth(new Date()))}>Today</Button>
        </div>

        <h2 className="font-display text-lg font-bold px-2 min-w-[150px]">{format(cursor, 'MMMM yyyy')}</h2>
        <span className="text-xs text-muted-foreground">{monthCount} item{monthCount === 1 ? '' : 's'}</span>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <Select value={project} onValueChange={setProject}>
            <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Project" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projectOptions.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input type="checkbox" checked={showProjects} onChange={(e) => setShowProjects(e.target.checked)} className="accent-primary" />
            Project deadlines
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="accent-primary" />
            Completed
          </label>
        </div>
      </div>

      {/* Grid */}
      <div className="fill-area flex flex-col border border-border bg-card shadow-card overflow-x-auto">
        <div className="grid grid-cols-7 bg-sidebar shrink-0" style={{ minWidth: 720 }}>
          {WEEK.map((d) => (
            <div key={d} className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/75">{d}</div>
          ))}
        </div>

        <div
          className="grid grid-cols-7 flex-1 min-h-0"
          style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(96px, 1fr))`, minWidth: 720 }}
        >
          {days.map((day) => {
            const list = items.filter((i) => isSameDay(i.date, day));
            const inMonth = isSameMonth(day, cursor);
            const isToday = isSameDay(day, today);
            const shown = list.slice(0, 3);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'border-r border-b border-border/70 p-1.5 min-h-0 overflow-hidden flex flex-col gap-1',
                  !inMonth && 'bg-muted/40',
                  (day.getDay() === 0 || day.getDay() === 6) && inMonth && 'bg-muted/20',
                )}
              >
                <span
                  className={cn(
                    'text-xs font-semibold h-6 w-6 grid place-items-center rounded-full self-start',
                    isToday ? 'bg-primary text-primary-foreground' : inMonth ? 'text-foreground' : 'text-muted-foreground/60',
                  )}
                >
                  {format(day, 'd')}
                </span>

                {shown.map((i) => <Chip key={i.id} item={i} onOpen={open} />)}

                {list.length > shown.length && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-left text-[11px] font-semibold text-primary hover:underline px-1">
                        +{list.length - shown.length} more
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-2 space-y-1" align="start">
                      <div className="px-1 pb-1 text-xs font-semibold">{format(day, 'EEEE, d MMM')}</div>
                      {list.map((i) => <Chip key={i.id} item={i} onOpen={open} />)}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Flag className="h-3 w-3 text-primary" /> Project deadline</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-600" /> In progress</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600" /> Completed</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-600" /> Delayed</span>
        <span>Click an item to open its project.</span>
      </div>
    </div>
  );
}

function Chip({ item, onOpen }: { item: CalItem; onOpen: (i: CalItem) => void }) {
  return (
    <button
      onClick={() => onOpen(item)}
      title={`${item.title} — ${item.projectTitle}`}
      className={cn(
        'w-full flex items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-[11px] font-medium border border-border/70 bg-background hover:border-primary/50 hover:bg-primary/5 transition-colors',
        item.done && 'opacity-60 line-through',
      )}
    >
      {item.kind === 'project'
        ? <Flag className="h-3 w-3 shrink-0 text-primary" />
        : <span className={cn('h-2 w-2 rounded-full shrink-0', item.dot)} />}
      <span className="truncate">{item.title}</span>
    </button>
  );
}
