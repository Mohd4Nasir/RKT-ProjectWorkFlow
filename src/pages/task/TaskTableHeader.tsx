// TaskTableHeader.tsx
import React from 'react';
import { ChevronsDown, ChevronsUp, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface StatItem {
  label: string;
  val: number;
  cls: string;
}

interface TaskTableHeaderProps {
  listsCount: number;
  rootTaskCount: number;
  subTaskCount: number;
  doneCount: number;
  activeCount: number;
  hasLists: boolean;
  firstListId?: string;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSimpleAddTask: (taskListId?: string, parentTaskId?: string | null) => void;
}

export function TaskTableHeader({
  listsCount,
  rootTaskCount,
  subTaskCount,
  doneCount,
  activeCount,
  hasLists,
  firstListId,
  onExpandAll,
  onCollapseAll,
  onSimpleAddTask,
}: TaskTableHeaderProps) {
  const stats: StatItem[] = [
    { label: 'Lists', val: listsCount, cls: 'text-primary' },
    { label: 'Tasks', val: rootTaskCount, cls: 'text-info' },
    { label: 'Subtasks', val: subTaskCount, cls: 'text-accent' },
    { label: 'Done', val: doneCount, cls: 'text-success' },
    { label: 'Active', val: activeCount, cls: 'text-warning' },
  ];

  return (
    <div className="flex items-center justify-between px-4 py-2.5 mb-5 border-b rounded-2xl border-border bg-secondary-55 flex-wrap gap-2">
      <div className="flex items-center gap-4 text-xs">
        {stats.map(s => (
          <span key={s.label} className="flex items-center gap-1">
            <strong className={cn('text-sm', s.cls)}>{s.val}</strong>
            <span className="text-muted-foreground">{s.label}</span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-foreground" onClick={onExpandAll}>
          <ChevronsDown size={12} /> Expand all
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-foreground" onClick={onCollapseAll}>
          <ChevronsUp size={12} /> Collapse all
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 text-foreground bg-primary/60"
          onClick={() => {
            if (!hasLists) {
              toast.error('Create a task list first');
              return;
            }
            onSimpleAddTask(firstListId, null);
          }}
        >
          <Plus size={12} /> Add Task
        </Button>
      </div>
    </div>
  );
}