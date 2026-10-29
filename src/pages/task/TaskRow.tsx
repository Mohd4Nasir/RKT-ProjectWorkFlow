
// ===================================================================================================================================================
import { ChevronRight, ChevronDown, MoreHorizontal, GripVertical, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubTaskNode, TaskNode } from '@/types/taskTypes';
import { Button } from '../../components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DEFAULT_TASK_STATUS_OPTIONS, findTaskStatusOption, prettyTaskStatusLabel,
  TaskStatusOption,
} from '@/utils/tasksTabUtils';

function StatusPill({
  status,
  statusOptions,
  disabled,
  onChange,
}: {
  status: string;
  statusOptions: TaskStatusOption[];
  disabled?: boolean;
  onChange: (next: string) => void;
}) {
  const options = statusOptions.length ? statusOptions : DEFAULT_TASK_STATUS_OPTIONS;
  const current = findTaskStatusOption(status, options);
  const selectValue = current?.value ?? options[0].value;
  const label = current?.label || prettyTaskStatusLabel(status) || '—';
  const dot = current?.dot ?? 'bg-muted-foreground';
  const badge = current?.badge ?? 'bg-muted text-paragraph border-border';

  return (
    <Select value={selectValue} disabled={disabled} onValueChange={onChange}>
      <SelectTrigger
        onClick={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        className={cn(
          'h-6 w-[128px] shrink-0 gap-1.5 rounded-full border px-2 text-[11px] font-medium whitespace-nowrap',
          'shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-60',
          badge
        )}
      >
        <span className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full', dot)} />
        <SelectValue>
          <span className="truncate">{label}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-[150px]">
        {options.map(opt => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
            <span className="flex w-full items-center gap-2">
              <span className={cn('h-1.5 w-1.5 rounded-full', opt.dot)} />
              <span className="flex-1">{opt.label}</span>
              {selectValue === opt.value && <Check className="h-3.5 w-3.5 text-primary" />}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface TaskRowProps {
  task: SubTaskNode;
  taskListId: string;
  depth: number;
  expandedTasks: Set<string>;
  onToggleTask: (id: string) => void;
  onOpenEditTask: (task: SubTaskNode) => void;
  onDeleteTask: (task: SubTaskNode) => void;
  onUpdateTask: (task: Partial<TaskNode>) => void;
  onUpdateTaskStatus: (taskId: string, taskStatus: string) => void;
  /** Options from GET /task/statuses. */
  statusOptions: TaskStatusOption[];
  statusSavingId?: string | null;
  onDragStart: (id: string, tlId: string, parentId: string | null) => void;
  onDrop: (e: React.DragEvent, targetId: string, before: boolean, tlId: string, parentId: string | null) => void;
  onContextMenu: (e: React.MouseEvent, task: SubTaskNode) => void;
  onThreeDots: (e: React.MouseEvent, task: SubTaskNode) => void;
  onTaskClick?: (task: SubTaskNode) => void;
}

export function TaskRow({
  task, taskListId, depth, expandedTasks, onToggleTask,
  onOpenEditTask, onDeleteTask, onUpdateTask, onUpdateTaskStatus, statusOptions, statusSavingId, onDragStart, onDrop,
  onContextMenu, onThreeDots, onTaskClick,
}: TaskRowProps) {
  // ✅ API se jo subTask array aaya hai, waisa hi — koi sort/filter nahi
  const children = task.subTask || [];
  const taskIdStr = String(task.taskId);
  const isExpanded = expandedTasks.has(taskIdStr);
  const hasChildren = children.length > 0;

  const depthColors = ['text-info'];
const iconColor =
  task.parentTaskId == null
    ? "text-heading"   // Main Task
    : "text-info";   // Subtask
  
  
  return (
    <>
      <tr
        draggable
        onContextMenu={e => onContextMenu(e, task)}
        onDragStart={() => onDragStart(taskIdStr, taskListId, task.parentTaskId ? String(task.parentTaskId) : null)}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          onDrop(e, taskIdStr, e.clientY < rect.top + rect.height / 2, taskListId, task.parentTaskId ? String(task.parentTaskId) : null);
        }}
        className="group border-b border-border hover:bg-muted/60 cursor-grab transition-colors"
      >
        <td className="py-1.5 px-3">
          <div className="flex items-center gap-1.5" style={{ paddingLeft: depth * 20 }}>
            {hasChildren ? (
              <button onClick={() => onToggleTask(taskIdStr)} className="flex-shrink-0 text-muted-foreground hover:text-heading">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-[14px] flex-shrink-0" />
            )}
            <GripVertical size={13} className="text-muted-foreground flex-shrink-0" />
            <button
              onClick={e => { e.stopPropagation(); onTaskClick?.(task); }}
              className={cn('text-sm font-medium truncate text-left hover:underline', iconColor)}
            >
              {task.taskTitle}
            </button>
          </div>
        </td>

        <td className="py-1.5 px-3">
          <StatusPill
            status={task.taskStatus}
            statusOptions={statusOptions}
            disabled={statusSavingId === taskIdStr}
            onChange={next => onUpdateTaskStatus(taskIdStr, next)}
          />
        </td>

        <td className="py-1.5 px-3">
          <span className="text-xs text-muted-foreground">{task.priority || 'Medium'}</span>
        </td>

        <td className="py-1.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
          {task.endDate || '-'}
        </td>

        <td className="py-1.5 px-3">
          <div className="flex items-center justify-end gap-0.5">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-foreground" title="More options" onClick={e => onThreeDots(e, task)}>
              <MoreHorizontal size={12} />
            </Button>
          </div>
        </td>
      </tr>

      {isExpanded && children.map(child => (
        <TaskRow
          key={child.taskId}
          task={child}
          taskListId={taskListId}
          depth={depth + 1}
          expandedTasks={expandedTasks}
          onToggleTask={onToggleTask}
          onOpenEditTask={onOpenEditTask}
          onDeleteTask={onDeleteTask}
          onUpdateTask={onUpdateTask}
          onUpdateTaskStatus={onUpdateTaskStatus}
          statusOptions={statusOptions}
          statusSavingId={statusSavingId}
          onDragStart={onDragStart}
          onDrop={onDrop}
          onContextMenu={onContextMenu}
          onThreeDots={onThreeDots}
          onTaskClick={onTaskClick}
        />
      ))}
    </>
  );
}