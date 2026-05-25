import { useState } from 'react';
import { useAppSelector } from '@/store';
import { PageHeader } from '@/components/PageHeader';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';

export default function CalendarPage() {
  const tasks = useAppSelector((s) => s.tasks.items);
  const [cursor, setCursor] = useState(new Date('2026-05-01'));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const monthName = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const tasksOn = (d: Date) => tasks.filter((t) => {
    const td = new Date(t.dueDate);
    return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth() && td.getDate() === d.getDate();
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        subtitle="See your work mapped against deadlines."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="font-display font-bold text-lg w-44 text-center">{monthName}</span>
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        }
      />

      <div className="card-elevated overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/40 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => <div key={d} className="px-3 py-3 text-center">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((c, i) => {
            const dayTasks = c ? tasksOn(c) : [];
            const isToday = c && c.toDateString() === new Date('2026-05-01').toDateString();
            return (
              <div key={i} className={cn('min-h-[110px] border-t border-l border-border p-2 -ml-px -mt-px', !c && 'bg-muted/20')}>
                {c && (
                  <>
                    <div className={cn('text-xs font-semibold mb-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full', isToday && 'bg-primary text-primary-foreground')}>
                      {c.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((t) => (
                        <div key={t.id} className={cn(
                          'text-[10px] font-semibold truncate px-1.5 py-1 rounded-md border',
                          t.priority === 'high' && 'bg-danger/10 text-danger border-danger/20',
                          t.priority === 'medium' && 'bg-warning/10 text-warning border-warning/20',
                          t.priority === 'low' && 'bg-info/10 text-info border-info/20',
                        )}>
                          {t.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">+{dayTasks.length - 3} more</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
