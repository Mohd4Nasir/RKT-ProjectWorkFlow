// src/components/tasks/TaskCard.tsx
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/UserAvatar';
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { CalendarDays, Flag, Circle, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Task, Users } from '@/types/ProejctAndTask';
import { ReduxTask } from '@/store/slices/tasksSlice';

const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'bg-gray-500', icon: Circle },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500', icon: Clock },
  done: { label: 'Done', color: 'bg-emerald-500', icon: CheckCircle2 },
} as const;

interface TaskCardProps {
  task: ReduxTask;
  users: Users[];
  onClick: () => void;
}

export function TaskCard({ task, users, onClick }: TaskCardProps) {
  const assignee = users.find(user => user.id === task.assigneeId);
  const progress = task.status === 'done' ? 100 : task.status === 'in-progress' ? 50 : 0;
  const statusInfo = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.todo;
  const StatusIcon = statusInfo.icon;
  const startDate =
    typeof task.startDate === 'string' ||
    typeof task.startDate === 'number' ||
    task.startDate instanceof Date
      ? task.startDate
      : undefined;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <StatusIcon
              className={cn(
                'h-4 w-4 flex-shrink-0',
                task.status === 'done' ? 'text-emerald-500' : 'text-muted-foreground'
              )}
            />
            <CardTitle className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
              {task.title}
            </CardTitle>
          </div>
          <Badge variant="secondary" className={cn('text-xs', statusInfo.color, 'text-white')}>
            {statusInfo.label}
          </Badge>
        </div>
        {task.taskDescription && (
          <CardDescription className="text-xs line-clamp-2 mt-2">
            {task.taskDescription}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-3 space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {task.startDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            <span>Due {format(new Date(startDate), 'MMM dd, yyyy')}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserAvatar name={assignee?.name || 'Unassigned'} size="sm" />
          <span className="text-xs text-muted-foreground">
            {assignee?.name?.split(' ')[0] || 'Unassigned'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Flag className="h-3 w-3" />
          <span>#{task.id?.slice(-4)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}