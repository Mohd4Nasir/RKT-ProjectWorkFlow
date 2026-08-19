
// ===================================================================================================================================================
import { ChevronRight, ChevronDown, MoreHorizontal, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubTaskNode, TaskNode } from '@/types/taskTypes';
import { Button } from '../../components/ui/button';

const STATUS_CFG: Record<string, { label: string; badge: string }> = {
  TODO: { label: 'To Do', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  IN_PROGRESS: { label: 'In Progress', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  DONE: { label: 'Done', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const STATUS_CYCLE = ['TODO', 'IN_PROGRESS', 'DONE'];

function cycleStatus(current: string): string {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

function StatusPill({ status, onClick }: { status: string; onClick?: () => void }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.TODO;
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick?.(); }}
      className={cn('text-[11px] px-2.5 py-0.5 rounded-full font-medium border whitespace-nowrap transition-opacity hover:opacity-80', cfg.badge)}
    >
      {cfg.label}
    </button>
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
  onDragStart: (id: string, tlId: string, parentId: string | null) => void;
  onDrop: (e: React.DragEvent, targetId: string, before: boolean, tlId: string, parentId: string | null) => void;
  onContextMenu: (e: React.MouseEvent, task: SubTaskNode) => void;
  onThreeDots: (e: React.MouseEvent, task: SubTaskNode) => void;
  onTaskClick?: (task: SubTaskNode) => void;
}

export function TaskRow({
  task, taskListId, depth, expandedTasks, onToggleTask,
  onOpenEditTask, onDeleteTask, onUpdateTask, onDragStart, onDrop,
  onContextMenu, onThreeDots, onTaskClick,
}: TaskRowProps) {
  // ✅ API se jo subTask array aaya hai, waisa hi — koi sort/filter nahi
  const children = task.subTask || [];
  const taskIdStr = String(task.taskId);
  const isExpanded = expandedTasks.has(taskIdStr);
  const hasChildren = children.length > 0;

  const depthColors = ['text-blue-600'];
const iconColor =
  task.parentTaskId == null
    ? "text-[#001858]"   // Main Task
    : "text-blue-500";   // Subtask
  
  
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
        className="group border-b border-slate-50 hover:bg-slate-50/60 cursor-grab transition-colors"
      >
        <td className="py-1.5 px-3">
          <div className="flex items-center gap-1.5" style={{ paddingLeft: depth * 20 }}>
            {hasChildren ? (
              <button onClick={() => onToggleTask(taskIdStr)} className="flex-shrink-0 text-slate-500 hover:text-slate-700">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-[14px] flex-shrink-0" />
            )}
            <GripVertical size={13} className="text-slate-300 flex-shrink-0" />
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
            onClick={() => onUpdateTask({ taskId: task.taskId, taskStatus: cycleStatus(task.taskStatus) })}
          />
        </td>

        <td className="py-1.5 px-3">
          <span className="text-xs text-slate-500">{task.priority || 'Medium'}</span>
        </td>

        <td className="py-1.5 px-3 text-xs text-slate-500 whitespace-nowrap">
          {task.endDate || '-'}
        </td>

        <td className="py-1.5 px-3">
          <div className="flex items-center justify-end gap-0.5">
            <Button variant="ghost" size="icon" className="h-6 w-6" title="More options" onClick={e => onThreeDots(e, task)}>
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