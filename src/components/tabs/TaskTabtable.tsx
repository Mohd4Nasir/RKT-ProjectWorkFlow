

// components/tabs/TaskTabTable.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  GripVertical,
  ChevronsDown,
  ChevronsUp,
  AlignJustify,
  MoreHorizontal,
  Link,
  Palette,
  Edit,
  Copy,
  Trash2,
  Move,
  Bell,
  ListPlus,
  BarChart2,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { ReduxTask } from '@/store/slices/tasksSlice';
import { ReduxTaskList } from '@/store/slices/taskListsSlice';

import { CreateTaskListRequest, CreateTaskRequest, Task, Users } from '@/types/ProejctAndTask';
import { DeleteConfirmModal } from '@/pages/task/DeleteConfirmodal';
import { TaskRow } from './TaskRow';
import { ContextMenu } from '../ui/contextMenu';
import { on } from 'events';

// ─── Props ────────────────────────────────────────────────────────────────────
interface TaskTabTableProps {
  taskLists: ReduxTaskList[];
  tasks: ReduxTask[];
  users: Users[];
  projectId: string | number;
  onAddTaskList: (req: CreateTaskListRequest) => void;
  onUpdateTaskList: (tl: ReduxTaskList) => void;
  onDeleteTaskList: (id: string) => void;
  onAddTask: (req: CreateTaskRequest ) => void;
  onUpdateTask: (task: ReduxTask) => void;
  onDeleteTask: (id: string) => void;
  onReorderTaskLists?: (orderedIds: string[]) => void;
  onReorderTasks?: (taskListId: string, parentTaskId: string | null, orderedIds: string[]) => void;
  onEditList: (tl: ReduxTaskList) => void;
  onAddTaskListAbove: ( referenceListId: string) => void;
  onAddTaskListBelow: (referenceListId: string) => void;
  // Opens the Add-Above/Add-Below modal (owned by TasksTab)
  onAddTaskAtPosition: (refTaskId: string, isAbove: boolean, listId: string, parentTaskId: string | null) => void;
  onEditTask: (task: ReduxTask) => void;
  // Opens the plain "Add Task" / "Add Subtask" modal (owned by TasksTab)
  onSimpleAddTask: (taskListId?: string, parentTaskId?: string | null) => void;
  onTaskClick?: (task: ReduxTask) => void; // 👈 ADD THIS

}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TaskTabTable({
  taskLists = [],
  tasks = [],
  users,
  projectId,
  onAddTaskList,
  onUpdateTaskList,
  onDeleteTaskList,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onReorderTaskLists,
  onReorderTasks,
  onAddTaskAtPosition,
  onAddTaskListAbove,
  onAddTaskListBelow,
  onEditList,
  onEditTask,
  onSimpleAddTask,
  onTaskClick, // 👈 ADD THIS
}: TaskTabTableProps) {
  // ── Expand state ─────────────────────────────────────────────────────────────
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // ── Context menu state ───────────────────────────────────────────────────────
  const [contextMenu, setContextMenu] = useState<{
    type: 'list' | 'task';
    item: ReduxTaskList | ReduxTask;
    x: number;
    y: number;
  } | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    label: string;
    onConfirm: () => void;
  }>({ open: false, label: '', onConfirm: () => { } });

  // ── Drag ref ─────────────────────────────────────────────────────────────────
  const dragRef = useRef<{
    id: string;
    taskListId: string;
    parentTaskId: string | null;
  } | null>(null);

  // ── Auto-expand all lists when data arrives ───────────────────────────────────
  useEffect(() => {
    if (taskLists.length > 0) {
      setExpandedLists(new Set(taskLists.map(tl => tl.id)));
    }
  }, [taskLists.map(tl => tl.id).join(',')]);

  // ── Sorted data ──────────────────────────────────────────────────────────────
  const sortedLists = useMemo(
    () => [...taskLists].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [taskLists]
  );

  const getRootTasksForList = (tlId: string) =>
    tasks
      .filter(t => t.taskListId === tlId && !t.parentTaskId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const getChildren = (parentId: string) =>
    tasks
      .filter(t => t.parentTaskId === parentId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // ── Stats ────────────────────────────────────────────────────────────────────
  const rootTasks = tasks.filter(t => !t.parentTaskId);
  const subTasks = tasks.filter(t => !!t.parentTaskId);
  const doneTasks = tasks.filter(t => t.status === 'done');
  const activeTasks = tasks.filter(t => t.status === 'in-progress');
 
  // ── Toggles ──────────────────────────────────────────────────────────────────
  const toggleList = (id: string) =>
    setExpandedLists(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleTask = (id: string) =>
    setExpandedTasks(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  // Recursively collect all task IDs that have children
  function collectAllTaskIdsWithChildren(taskList: ReduxTask[]): string[] {
    const parentIds = new Set(
      taskList.filter(t => t.parentTaskId).map(t => t.parentTaskId!)
    );
    return [...parentIds];
  }

  const expandAll = () => {
    // Expand all lists
    const allListIds = new Set(taskLists.map(tl => tl.id));
    setExpandedLists(allListIds);
    
    // Expand all parent tasks that have children
    const parentTaskIds = collectAllTaskIdsWithChildren(tasks);
    setExpandedTasks(new Set(parentTaskIds));
  };

  const collapseAll = () => {
    setExpandedLists(new Set());
    setExpandedTasks(new Set());
  };

  // ── Delete handlers ───────────────────────────────────────────────────────────
  const confirmDeleteList = (tl: ReduxTaskList) => {
    const count = tasks.filter(t => t.taskListId === tl.id).length;
    setDeleteModal({
      open: true,
      label: `Delete "${tl.name}"?${count ? ` This will remove ${count} task(s).` : ''}`,
      onConfirm: () => {
        onDeleteTaskList(tl.id);
      },
    });
  };

  const confirmDeleteTask = (task: ReduxTask) => {
    const childCount = getChildren(task.id).length;
    setDeleteModal({
      open: true,
      label: `Delete "${task.taskName}"?${childCount ? ` ${childCount} subtask(s) will also be removed.` : ''
        }`,
      onConfirm: () => {
        onDeleteTask(task.id);
      },
    });
  };

  // ── Build menu items ─────────────────────────────────────────────────────────
  const buildListMenuItems = (tl: ReduxTaskList) => [
    {
      label: 'Edit',
      icon: <Edit size={14} />,
      onClick: () => onEditList(tl),
    },
    {
      label: 'Move',
      icon: <Move size={14} />,
      onClick: () => toast.info('Move coming soon'),
      dividerAbove: true,
    },
    {
      label: 'Add task ',
      icon :<Plus size ={14}/>,
      onClick:()=>onSimpleAddTask(tl.id, null),
      dividerBelow:true,
    },
    {
      label: 'Create List Above',
      icon: <ListPlus size={14} />,
      onClick: () => onAddTaskListAbove(tl.id),
      shortcut: '⌃⇧↑',
      dividerAbove: true,
    },
    {
      label: 'Create List Below',
      icon: <ListPlus size={14} />,
      onClick: () => onAddTaskListBelow(tl.id),
      shortcut: '⌃⇧↓',
    },
    {
      label: 'Delete',
      icon: <Trash2 size={14} />,
      onClick: () => confirmDeleteList(tl),
      variant: 'danger' as const,
      dividerAbove: true,
    },
  ];

  const buildTaskMenuItems = (task: ReduxTask) => [
    
    {
      label: 'Edit',
      icon: <Edit size={14} />,
      onClick: () => onEditTask(task),
      dividerAbove: true,
    },
    {
      label: 'Add Subtask',
      icon: <Plus size={14} />,
      onClick: () => onSimpleAddTask(task.taskListId, task.id),
    },
   
    {
      label: 'Add Task Above',
      icon: <ListPlus size={14} />,
      onClick: () => onAddTaskAtPosition(task.id, true, task.taskListId, task.parentTaskId),
      dividerAbove: true,
      shortcut: '⌃⇧↑',
    },
    {
      label: 'Add Task Below',
      icon: <ListPlus size={14} />,
      onClick: () => onAddTaskAtPosition(task.id, false, task.taskListId, task.parentTaskId),
      shortcut: '⌃⇧↓',
    },
     {
      label: 'Delete',
      icon: <Trash2 size={14} />,
      onClick: () => confirmDeleteTask(task),
      variant: 'danger' as const,
    },
  ];

  // ── Context handlers ────────────────────────────────────────────────────────
  const handleContextMenu = (
    e: React.MouseEvent,
    type: 'list' | 'task',
    item: ReduxTaskList | ReduxTask
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ type, item, x: e.clientX, y: e.clientY });
  };

  // NOTE: TaskRow's three-dots button only forwards (e, task) — there's no "type"
  // to receive from it, since TaskRow only ever deals with tasks. We fix the
  // mismatch here instead of changing TaskRow's signature, since list rows call
  // handleThreeDots directly with their own 'list' type.
  const handleThreeDots = (
    e: React.MouseEvent,
    typeOrItem: 'list' | 'task' | ReduxTaskList | ReduxTask,
    maybeItem?: ReduxTaskList | ReduxTask
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    // Called as (e, 'list' | 'task', item) — explicit type provided
    if (typeOrItem === 'list' || typeOrItem === 'task') {
      setContextMenu({ type: typeOrItem, item: maybeItem as ReduxTaskList | ReduxTask, x: rect.right, y: rect.bottom });
      return;
    }

    // Called as (e, task) — from TaskRow, which only ever passes tasks
    setContextMenu({ type: 'task', item: typeOrItem as ReduxTask, x: rect.right, y: rect.bottom });
  };

  // ── Drag & drop ───────────────────────────────────────────────────────────────
  const handleDragStart = (
    id: string,
    tlId: string,
    parentId: string | null
  ) => {
    dragRef.current = { id, taskListId: tlId, parentTaskId: parentId };
  };

  const handleDropList = (
    e: React.DragEvent,
    targetId: string,
    before: boolean
  ) => {
    e.preventDefault();
    const src = dragRef.current;
    if (!src) return;

    const ids = sortedLists.map(tl => tl.id);
    const fromIdx = ids.indexOf(src.id);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;

    ids.splice(fromIdx, 1);
    ids.splice(before ? toIdx : toIdx + 1, 0, src.id);
    onReorderTaskLists?.(ids);
    dragRef.current = null;
  };

  const handleDropTask = (
    e: React.DragEvent,
    targetId: string,
    before: boolean,
    tlId: string,
    parentId: string | null
  ) => {
    e.preventDefault();
    const src = dragRef.current;
    if (!src || src.id === targetId) return;

    const siblings = parentId
      ? getChildren(parentId)
      : getRootTasksForList(tlId);
    const ids = siblings.map(t => t.id);
    const fromIdx = ids.indexOf(src.id);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;

    ids.splice(fromIdx, 1);
    ids.splice(before ? toIdx : toIdx + 1, 0, src.id);
    onReorderTasks?.(tlId, parentId, ids);
    dragRef.current = null;
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-400 bg-blue-100/75 flex-wrap gap-2">
        {/* Stats */}
        <div className="flex items-center gap-4 text-xs">
          {[
            { label: 'Lists', val: sortedLists.length, cls: 'text-violet-600' },
            { label: 'Tasks', val: rootTasks.length, cls: 'text-blue-600' },
            { label: 'Subtasks', val: subTasks.length, cls: 'text-teal-600' },
            { label: 'Done', val: doneTasks.length, cls: 'text-emerald-600' },
            { label: 'Active', val: activeTasks.length, cls: 'text-amber-600' },
          ].map(s => (
            <span key={s.label} className="flex items-center gap-1">
              <strong className={cn('text-sm', s.cls)}>{s.val}</strong>
              <span className="text-slate-400">{s.label}</span>
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={expandAll}
          >
            <ChevronsDown size={12} /> Expand all
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={collapseAll}
          >
            <ChevronsUp size={12} /> Collapse all
          </Button>

          <Button
            variant='outline'
            size="sm"
            className="h-7 text-xs gap-1  bg-primary "
            onClick={() => {
              if (!sortedLists.length) {
                toast.error('Create a task list first');
                return;
              }
              onSimpleAddTask(sortedLists[0].id, null);
            }}
          >
            <Plus size={12} /> Add Task
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-blue-200/60 border-b border-slate-200">
              {['Name', 'Status', 'Priority', 'Due Date', ''].map((h, i) => (
                <th
                  key={i}
                  className={cn(
                    'px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap',
                    i === 4 ? 'text-right w-24' : 'text-left'
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedLists.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-slate-400">
                  <Folder size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No task lists yet — click "New List" to start</p>
                </td>
              </tr>
            ) : (
              sortedLists.map((tl, tlIdx) => {
                const rootTasksForList = getRootTasksForList(tl.id);
                const isExpanded = expandedLists.has(tl.id);

                return (
                  <React.Fragment key={`tl-${tl.id}`}>
                    {/* ── Task List Header Row ── */}
                    <tr
                      draggable
                      onContextMenu={e => handleContextMenu(e, 'list', tl)}
                      onDragStart={() => (dragRef.current = { id: tl.id, taskListId: tl.id, parentTaskId: null })}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        handleDropList(e, tl.id, e.clientY < rect.top + rect.height / 2);
                      }}
                      className={cn(
                        'cursor-grab border-b border-slate-300 group',
                        tlIdx > 0 ? 'border-t border-slate-200' : '',
                        'bg-blue-50/80'
                      )}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <GripVertical size={13} className="text-slate-300 flex-shrink-0" />
                          {rootTasksForList.length > 0 ? (
                            <button onClick={() => toggleList(tl.id)} className="flex-shrink-0 text-slate-500 hover:text-slate-700">
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          ) : (
                            <span className="w-[14px] flex-shrink-0" />
                          )}
                          <AlignJustify size={15} className="text-violet-500 flex-shrink-0" />
                          <span className="font-semibold text-slate-700 text-[13px]">{tl.name}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            {rootTasksForList.length}
                          </Badge>
                        </div>
                      </td>
                      <td colSpan={3} />
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            variant="ghost" size="icon" className="h-6 w-6"
                            title="Add task"
                            onClick={() => onSimpleAddTask(tl.id, null)}
                          >
                            <Plus size={12} />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="More options"
                            onClick={e => handleThreeDots(e, 'list', tl)}
                          >
                            <MoreHorizontal size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* ── Tasks ── */}
                    {isExpanded && (
                      <>
                        {rootTasksForList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-3 text-center text-[12px] text-slate-400">
                              No tasks yet — click + to add one
                            </td>
                          </tr>
                        ) : (
                          rootTasksForList.map(task => (
                            <TaskRow
                              key={task.id}
                              task={task}
                              allTasks={tasks}
                              taskListId={tl.id}
                              depth={1}
                              expandedTasks={expandedTasks}
                              onToggleTask={toggleTask}
                              onOpenCreateTask={(tlId, parentTaskId) => onSimpleAddTask(tlId, parentTaskId)}
                              onOpenEditTask={onEditTask}
                              onDeleteTask={confirmDeleteTask}
                              onUpdateTask={onUpdateTask}
                              onDragStart={handleDragStart}
                              onDrop={handleDropTask}
                              onContextMenu={(e, t) => handleContextMenu(e, 'task', t)}
                              onThreeDots={handleThreeDots}
                              onTaskClick={onTaskClick} 

                            />
                          ))
                        )}
                      </>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>

        <DeleteConfirmModal
          open={deleteModal.open}
          onOpenChange={open => setDeleteModal(m => ({ ...m, open }))}
          label={deleteModal.label}
          onConfirm={deleteModal.onConfirm}
        />
      </div>

      {/* ── Context Menu ── */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={
            contextMenu.type === 'list'
              ? buildListMenuItems(contextMenu.item as ReduxTaskList)
              : buildTaskMenuItems(contextMenu.item as ReduxTask)
          }
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}