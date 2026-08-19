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
    { label: 'Lists', val: listsCount, cls: 'text-violet-600' },
    { label: 'Tasks', val: rootTaskCount, cls: 'text-blue-600' },
    { label: 'Subtasks', val: subTaskCount, cls: 'text-teal-600' },
    { label: 'Done', val: doneCount, cls: 'text-emerald-600' },
    { label: 'Active', val: activeCount, cls: 'text-amber-600' },
  ];

  return (
    <div className="flex items-center justify-between px-4 py-2.5 mb-5 border-b rounded-2xl border-slate-200 bg-secondary-55 flex-wrap gap-2">
      <div className="flex items-center gap-4 text-xs">
        {stats.map(s => (
          <span key={s.label} className="flex items-center gap-1">
            <strong className={cn('text-sm', s.cls)}>{s.val}</strong>
            <span className="text-slate-400">{s.label}</span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onExpandAll}>
          <ChevronsDown size={12} /> Expand all
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onCollapseAll}>
          <ChevronsUp size={12} /> Collapse all
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 bg-primary/60"
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