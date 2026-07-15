// // components/tabs/TaskRow.tsx
// import { useState, useMemo } from 'react';
// import { ChevronRight, ChevronDown, Plus, MoreHorizontal, GripVertical } from 'lucide-react';
// import { cn } from '@/lib/utils';
// import { ReduxTask } from '@/store/slices/tasksSlice';
// import { Button } from '../ui/button';

// // ─── Status config ────────────────────────────────────────────────────────────
// const STATUS_CFG: Record<string, { label: string; color: string; bg: string; badge: string }> = {
//   todo: {
//     label: 'To Do',
//     color: '#64748b',
//     bg: '#f1f5f9',
//     badge: 'bg-slate-100 text-slate-600 border-slate-200',
//   },
//   'in-progress': {
//     label: 'In Progress',
//     color: '#f59e0b',
//     bg: '#fffbeb',
//     badge: 'bg-amber-100 text-amber-700 border-amber-200',
//   },
//   done: {
//     label: 'Done',
//     color: '#22c55e',
//     bg: '#f0fdf4',
//     badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
//   },
// };

// const STATUS_CYCLE: ReduxTask['status'][] = ['todo', 'in-progress', 'done'];

// function cycleStatus(current: string): ReduxTask['status'] {
//   const idx = STATUS_CYCLE.indexOf(current as ReduxTask['status']);
//   return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
// }

// // ─── Status Pill ──────────────────────────────────────────────────────────────
// function StatusPill({
//   status,
//   onClick,
// }: {
//   status: string;
//   onClick?: () => void;
// }) {
//   const cfg = STATUS_CFG[status] ?? STATUS_CFG.todo;
//   return (
//     <button
//       onClick={e => {
//         e.stopPropagation();
//         onClick?.();
//       }}
//       className={cn(
//         'text-[11px] px-2.5 py-0.5 rounded-full font-medium border whitespace-nowrap transition-opacity hover:opacity-80',
//         cfg.badge
//       )}
//     >
//       {cfg.label}
//     </button>
//   );
// }

// // ─── TaskRow Props ────────────────────────────────────────────────────────────
// interface TaskRowProps {
//   task: ReduxTask;
//   allTasks: ReduxTask[];
//   taskListId: string;
//   depth: number;
//   expandedTasks: Set<string>;
//   onToggleTask: (id: string) => void;
//   onOpenCreateTask: (
//     tlId: string,
//     parentTaskId: string | null,
//     insertAfterId: string | null
//   ) => void;
//   onOpenEditTask: (task: ReduxTask) => void;
//   onDeleteTask: (task: ReduxTask) => void;
//   onUpdateTask: (task: ReduxTask) => void;
//   onDragStart: (id: string, tlId: string, parentId: string | null) => void;
//   onDrop: (
//     e: React.DragEvent,
//     targetId: string,
//     before: boolean,
//     tlId: string,
//     parentId: string | null
//   ) => void;
//   onContextMenu: (e: React.MouseEvent, task: ReduxTask) => void;
//   onThreeDots: (e: React.MouseEvent, task: ReduxTask) => void;
// }

// // ─── TaskRow Component ────────────────────────────────────────────────────────
// export function TaskRow({
//   task,
//   allTasks,
//   taskListId,
//   depth,
//   expandedTasks,
//   onToggleTask,
//   onOpenCreateTask,
//   onOpenEditTask,
//   onDeleteTask,
//   onUpdateTask,
//   onDragStart,
//   onDrop,
//   onContextMenu,
//   onThreeDots,
// }: TaskRowProps) {
//   const children = useMemo(
//     () =>
//       allTasks
//         .filter(t => t.parentTaskId === task.id)
//         .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
//     [allTasks, task.id]
//   );

//   const isExpanded = expandedTasks.has(task.id);
//   const hasChildren = children.length > 0;

//   // Indent: 12px base + 20px per depth level
//   const indent = 12 + depth * 20;

//   // Depth-based visual cue
//   const depthColors = [
//     'text-blue-600',
//     'text-teal-600',
//     'text-violet-600',
//     'text-rose-600',
//   ];
//   const iconColor = depthColors[Math.min(depth, depthColors.length - 1)];

//   return (
//     <>
//       <tr
//         draggable
//         onContextMenu={e => onContextMenu(e, task)}
//         onDragStart={() => onDragStart(task.id, taskListId, task.parentTaskId)}
//         onDragOver={e => e.preventDefault()}
//         onDrop={e => {
//           const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
//           onDrop(e, task.id, e.clientY < rect.top + rect.height / 2, taskListId, task.parentTaskId);
//         }}
//         className="group border-b border-slate-50 hover:bg-slate-50/60 cursor-grab transition-colors"
//       >
//         {/* Task Name with indentation */}
//         <td className="py-1.5 px-3">
//           <div 
//             className="flex items-center gap-1.5"
//             style={{ paddingLeft: depth * 20 }}
//           >
//             {hasChildren ? (
//               <button 
//                 onClick={() => onToggleTask(task.id)} 
//                 className="flex-shrink-0 text-slate-500 hover:text-slate-700"
//               >
//                 {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
//               </button>
//             ) : (
//               <span className="w-[14px] flex-shrink-0" />
//             )}
//             <GripVertical size={13} className="text-slate-300 flex-shrink-0" />
//             <span className={cn('text-sm font-medium truncate', iconColor)}>
//               {task.taskName}
//             </span>
//           </div>
//         </td>

//         {/* Status */}
//         <td className="py-1.5 px-3">
//           <StatusPill
//             status={task.status}
//             onClick={() => {
//               const newStatus = cycleStatus(task.status);
//               onUpdateTask({ ...task, status: newStatus });
//             }}
//           />
//         </td>

//         {/* Priority */}
//         <td className="py-1.5 px-3">
//           <span className="text-xs text-slate-500">
//             {task.priority || 'Medium'}
//           </span>
//         </td>

//         {/* Due Date */}
//         <td className="py-1.5 px-3 text-xs text-slate-500 whitespace-nowrap">
//           {task.dueDate || task.taskEndDate || '-'}
//         </td>

//         {/* Actions */}
//         <td className="py-1.5 px-3">
//           <div className="flex items-center justify-end gap-0.5">
          
//             <Button
//               variant="ghost" 
//               size="icon" 
//               className="h-6 w-6"
//               title="More options"
//               onClick={e => onThreeDots(e, task)}
//             >
//               <MoreHorizontal size={12} />
//             </Button>
//           </div>
//         </td>
//       </tr>

//       {/* Render children if expanded */}
//       {isExpanded && children.map(child => (
//         <TaskRow
//           key={child.id}
//           task={child}
//           allTasks={allTasks}
//           taskListId={taskListId}
//           depth={depth + 1}
//           expandedTasks={expandedTasks}
//           onToggleTask={onToggleTask}
//           onOpenCreateTask={onOpenCreateTask}
//           onOpenEditTask={onOpenEditTask}
//           onDeleteTask={onDeleteTask}
//           onUpdateTask={onUpdateTask}
//           onDragStart={onDragStart}
//           onDrop={onDrop}
//           onContextMenu={onContextMenu}
//           onThreeDots={onThreeDots}
//         />
//       ))}
//     </>
//   );
// }
// components/tabs/TaskRow.tsx
import { useMemo } from 'react';
import { ChevronRight, ChevronDown, MoreHorizontal, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReduxTask } from '@/store/slices/tasksSlice';
import { Button } from '../ui/button';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; badge: string }> = {
  todo: {
    label: 'To Do',
    color: '#64748b',
    bg: '#f1f5f9',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  'in-progress': {
    label: 'In Progress',
    color: '#f59e0b',
    bg: '#fffbeb',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  done: {
    label: 'Done',
    color: '#22c55e',
    bg: '#f0fdf4',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
};

const STATUS_CYCLE: ReduxTask['status'][] = ['todo', 'in-progress', 'done'];

function cycleStatus(current: string): ReduxTask['status'] {
  const idx = STATUS_CYCLE.indexOf(current as ReduxTask['status']);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

// ─── Status Pill ──────────────────────────────────────────────────────────────
function StatusPill({
  status,
  onClick,
}: {
  status: string;
  onClick?: () => void;
}) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.todo;
  return (
    <button
      onClick={e => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        'text-[11px] px-2.5 py-0.5 rounded-full font-medium border whitespace-nowrap transition-opacity hover:opacity-80',
        cfg.badge
      )}
    >
      {cfg.label}
    </button>
  );
}

// ─── TaskRow Props ────────────────────────────────────────────────────────────
interface TaskRowProps {
  task: ReduxTask;
  allTasks: ReduxTask[];
  taskListId: string;
  depth: number;
  expandedTasks: Set<string>;
  onToggleTask: (id: string) => void;
  // (taskListId, parentTaskId) — opens the simple add-task modal scoped to this list/parent
  onOpenCreateTask: (tlId: string, parentTaskId: string | null) => void;
  onOpenEditTask: (task: ReduxTask) => void;
  onDeleteTask: (task: ReduxTask) => void;
  onUpdateTask: (task: ReduxTask) => void;
  onDragStart: (id: string, tlId: string, parentId: string | null) => void;
  onDrop: (
    e: React.DragEvent,
    targetId: string,
    before: boolean,
    tlId: string,
    parentId: string | null
  ) => void;
  // Always called for a task row — parent decides the 'type' when forwarding
  onContextMenu: (e: React.MouseEvent, task: ReduxTask) => void;
  onThreeDots: (e: React.MouseEvent, task: ReduxTask) => void;
  onTaskClick: (task: ReduxTask) => void; // New prop for handling task clicks
}

// ─── TaskRow Component ────────────────────────────────────────────────────────
export function TaskRow({
  task,
  allTasks,
  taskListId,
  depth,
  expandedTasks,
  onToggleTask,
  onOpenCreateTask,
  onOpenEditTask,
  onDeleteTask,
  onUpdateTask,
  onDragStart,
  onDrop,
  onContextMenu,
  onThreeDots,
  onTaskClick, // Destructure the new prop
}: TaskRowProps) {
  const children = useMemo(
    () =>
      allTasks
        .filter(t => t.parentTaskId === task.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [allTasks, task.id]
  );

  const isExpanded = expandedTasks.has(task.id);
  const hasChildren = children.length > 0;

  // Depth-based visual cue
  const depthColors = [
    'text-blue-600',
    'text-teal-600',
    'text-violet-600',
    'text-rose-600',
  ];
  const iconColor = depthColors[Math.min(depth, depthColors.length - 1)];

  return (
    <>
      <tr
        draggable
        onContextMenu={e => onContextMenu(e, task)}
        onDragStart={() => onDragStart(task.id, taskListId, task.parentTaskId)}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          onDrop(e, task.id, e.clientY < rect.top + rect.height / 2, taskListId, task.parentTaskId);
        }}
        className="group border-b border-slate-50 hover:bg-slate-50/60 cursor-grab transition-colors"
      >
        {/* Task Name with indentation */}
        <td className="py-1.5 px-3">
          <div
            className="flex items-center gap-1.5"
            style={{ paddingLeft: depth * 20 }}
          >
            {hasChildren ? (
              <button
                onClick={() => onToggleTask(task.id)}
                className="flex-shrink-0 text-slate-500 hover:text-slate-700"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-[14px] flex-shrink-0" />
            )}
            <GripVertical size={13} className="text-slate-300 flex-shrink-0" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTaskClick(task);
              }}
              className={cn('text-sm font-medium truncate text-left hover:underline', iconColor)}
            >
              {task.taskName}
            </button>
          </div>
        </td>

        {/* Status */}
        <td className="py-1.5 px-3">
          <StatusPill
            status={task.status}
            onClick={() => {
              const newStatus = cycleStatus(task.status);
              onUpdateTask({ ...task, status: newStatus });
            }}
          />
        </td>

        {/* Priority */}
        <td className="py-1.5 px-3">
          <span className="text-xs text-slate-500">
            {task.priority || 'Medium'}
          </span>
        </td>

        {/* Due Date */}
        <td className="py-1.5 px-3 text-xs text-slate-500 whitespace-nowrap">
          {task.dueDate || task.taskEndDate || '-'}
        </td>

        {/* Actions */}
        <td className="py-1.5 px-3">
          <div className="flex items-center justify-end gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title="More options"
              onClick={e => onThreeDots(e, task)}
            >
              <MoreHorizontal size={12} />
            </Button>
          </div>
        </td>
      </tr>

      {/* Render children if expanded */}
      {isExpanded && children.map(child => (
        <TaskRow
          key={child.id}
          task={child}
          allTasks={allTasks}
          taskListId={taskListId}
          depth={depth + 1}
          expandedTasks={expandedTasks}
          onToggleTask={onToggleTask}
          onOpenCreateTask={onOpenCreateTask}
          onOpenEditTask={onOpenEditTask}
          onDeleteTask={onDeleteTask}
          onUpdateTask={onUpdateTask}
          onDragStart={onDragStart}
          onDrop={onDrop}
          onContextMenu={onContextMenu}
          onThreeDots={onThreeDots}
        />
      ))}
    </>
  );
}