
import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight, ChevronDown, Folder, GripVertical, ChevronsDown, ChevronsUp,
  AlignJustify, MoreHorizontal, Edit, Trash2, Move, ListPlus, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { TaskListNode, TaskNode, SubTaskNode } from '@/types/taskTypes';

/** Thin insertion line showing where a dragged list will land. */
function DropIndicatorLine() {
  return (
    <tr className="pointer-events-none select-none" aria-hidden="true">
      <td colSpan={5} className="p-0">
        <div className="relative h-0">
          <div className="absolute inset-x-2 -top-px h-0.5 rounded-full bg-primary" />
          <div className="absolute -top-[3px] left-0 h-2 w-2 rounded-full bg-primary" />
        </div>
      </td>
    </tr>
  );
}
import { CreateTaskListRequest, CreateTaskRequest } from '@/types/taskTypes';
import { DeleteConfirmModal } from '@/pages/Task/DeleteConfirmodal';
import { TaskRow } from './TaskRow';
import { ContextMenu } from '../../components/ui/contextMenu';
import { Users } from '@/types/ProejctsType';
import { TaskTableHeader } from './TaskTableHeader';
import { TaskStatusOption } from '@/utils/tasksTabUtils';

// ── Tree search helpers (D&D ke liye — render order ko touch nahi karte) ──
function findInNodes(nodes: SubTaskNode[], taskId: number): SubTaskNode | null {
  for (const n of nodes) {
    if (n.taskId === taskId) return n;
    if (n.subTask?.length) {
      const f = findInNodes(n.subTask, taskId);
      if (f) return f;
    }
  }
  return null;
}
function findTaskAcrossLists(lists: TaskListNode[], taskId: number): SubTaskNode | null {
  for (const list of lists) {
    const f = findInNodes(list.tasks, taskId);
    if (f) return f;
  }
  return null;
}
/** true agar `taskId` root ke andar (ya root khud) ho — parent ko child ke andar drop karne se rokta hai. */
function isInSubtree(root: SubTaskNode, taskId: number): boolean {
  if (root.taskId === taskId) return true;
  return (root.subTask || []).some(child => isInSubtree(child, taskId));
}
function getSiblingsArray(lists: TaskListNode[], listId: string, parentTaskId: string | null): SubTaskNode[] {
  const list = lists.find(l => String(l.listId) === listId);
  if (!list) return [];
  if (parentTaskId === null) return list.tasks;
  const parent = findTaskAcrossLists(lists, Number(parentTaskId));
  return parent?.subTask || [];
}
function countAllTasks(nodes: SubTaskNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + (n.subTask ? countAllTasks(n.subTask) : 0), 0);
}
function countByStatus(nodes: SubTaskNode[], status: string): number {
  return nodes.reduce(
    (sum, n) => sum + (n.taskStatus === status ? 1 : 0) + (n.subTask ? countByStatus(n.subTask, status) : 0),
    0
  );
}

interface TaskTabTableProps {
  lists: TaskListNode[];
  users: Users[];
  projectId: string | number;
  onAddTaskList: (req: CreateTaskListRequest) => void;
  onUpdateTaskList: (tl: TaskListNode) => void;
  onDeleteTaskList: (id: string) => void;
  onAddTask: (req: CreateTaskRequest) => void;
  onUpdateTask: (task: TaskNode) => void;
  onUpdateTaskStatus: (taskId: string, taskStatus: string) => void;
  /** Options from GET /task/statuses. */
  statusOptions: TaskStatusOption[];
  statusSavingId?: string | null;
  onDeleteTask: (id: string) => void;
  onReorderTaskLists?: (move: { taskListId: string; referenceListId: string; isAbove: boolean }) => void;
  onReorderTasks?: (move: {
    taskId: string;
    referenceTaskId: string;
    isAbove: boolean;
    /** Target list — jahan task land karega */
    taskListId: string;
    /** Target parent (null = list root) */
    parentTaskId: string | null;
    orderedIds: string[];
    /** Source scope — same-list reorder ke liye same, cross-list move me alag */
    sourceTaskListId?: string;
    sourceParentTaskId?: string | null;
  }) => void;
  onEditList: (tl: TaskListNode) => void;
  onAddTaskListAbove: (referenceListId: string) => void;
  onAddTaskListBelow: (referenceListId: string) => void;
  onAddTaskAtPosition: (refTaskId: string, isAbove: boolean, listId: string, parentTaskId: string | null) => void;
  onEditTask: (task: SubTaskNode, listId: string) => void;
  onSimpleAddTask: (taskListId?: string, parentTaskId?: string | null) => void;
  onTaskClick?: (task: SubTaskNode) => void;
}

export function TaskTabTable({
  lists = [],
  users,
  onAddTaskList,
  onUpdateTaskList,
  onDeleteTaskList,
  onAddTask,
onUpdateTask,
onUpdateTaskStatus,
  statusOptions,
  statusSavingId,
onDeleteTask,
  onReorderTaskLists,
  onReorderTasks,
  onAddTaskAtPosition,
  onAddTaskListAbove,
  onAddTaskListBelow,
  onEditList,
  onEditTask,
  onSimpleAddTask,
  onTaskClick,
}: TaskTabTableProps) {
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const [contextMenu, setContextMenu] = useState<{
    type: 'list' | 'task';
    item: TaskListNode | SubTaskNode;
    listId?: string;
    x: number;
    y: number;
  } | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; label: string; onConfirm: () => void }>({
    open: false, label: '', onConfirm: () => {},
  });

  const dragRef = useRef<{ id: string; type: 'list' | 'task'; taskListId: string; parentTaskId: string | null } | null>(null);

  // Where the dragged list would land — drives the insertion line.
  const [dropTarget, setDropTarget] = useState<{ listId: string; isAbove: boolean } | null>(null);

  // ── Auto-expand all lists jab data pehli baar aaye ──
  useEffect(() => {
    if (lists.length > 0) {
      setExpandedLists(new Set(lists.map(l => String(l.listId))));
    }
  }, [lists.map(l => l.listId).join(',')]);

  // ✅ NO SORT — jaisa API se aaya hai, waisa hi
  const sortedLists = lists;
  //  console.log('sortedLists TaskTabTable:', sortedLists);

  const rootTaskCount = lists.reduce((s, l) => s + (l.tasks?.length || 0), 0);
  const totalTaskCount = lists.reduce((s, l) => s + countAllTasks(l.tasks || []), 0);
  const subTaskCount = totalTaskCount - rootTaskCount;
  const doneCount = lists.reduce((s, l) => s + countByStatus(l.tasks || [], 'DONE'), 0);
  const activeCount = lists.reduce((s, l) => s + countByStatus(l.tasks || [], 'IN_PROGRESS'), 0);

  const toggleList = (id: string) =>
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    setExpandedLists(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleTask = (id: string) =>
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    setExpandedTasks(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  function collectIdsWithChildren(nodes: SubTaskNode[]): string[] {
    let ids: string[] = [];
    nodes.forEach(n => {
      if (n.subTask?.length) {
        ids.push(String(n.taskId));
        ids = ids.concat(collectIdsWithChildren(n.subTask));
      }
    });
    return ids;
  }

  const expandAll = () => {
    setExpandedLists(new Set(lists.map(l => String(l.listId))));
    const ids = lists.flatMap(l => collectIdsWithChildren(l.tasks || []));
    setExpandedTasks(new Set(ids));
  };

  const collapseAll = () => {
    setExpandedLists(new Set());
    setExpandedTasks(new Set());
  };

  const confirmDeleteList = (tl: TaskListNode) => {
    const count = countAllTasks(tl.tasks || []);
    setDeleteModal({
      open: true,
      label: `Delete "${tl.listTitle}"?${count ? ` This will remove ${count} task(s).` : ''}`,
      onConfirm: () => onDeleteTaskList(String(tl.listId)),
    });
  };

  const confirmDeleteTask = (task: SubTaskNode) => {
    const childCount = task.subTask?.length || 0;
    setDeleteModal({
      open: true,
      label: `Delete "${task.taskTitle}"?${childCount ? ` ${childCount} subtask(s) will also be removed.` : ''}`,
      onConfirm: () => onDeleteTask(String(task.taskId)),
    });
  };

  const buildListMenuItems = (tl: TaskListNode) => [
    { label: 'Edit', icon: <Edit size={14} />, onClick: () => onEditList(tl) },
    { label: 'Move', icon: <Move size={14} />, onClick: () => toast.info('Move coming soon'), dividerAbove: true },
    { label: 'Add task', icon: <Plus size={14} />, onClick: () => onSimpleAddTask(String(tl.listId), null), dividerBelow: true },
    { label: 'Create List Above', icon: <ListPlus size={14} />, onClick: () => onAddTaskListAbove(String(tl.listId)), shortcut: '⌃⇧↑', dividerAbove: true },
    { label: 'Create List Below', icon: <ListPlus size={14} />, onClick: () => onAddTaskListBelow(String(tl.listId)), shortcut: '⌃⇧↓' },
    { label: 'Delete', icon: <Trash2 size={14} />, onClick: () => confirmDeleteList(tl), variant: 'danger' as const, dividerAbove: true },
  ];

  const buildTaskMenuItems = (task: SubTaskNode, listId: string) => [
    { label: 'Edit', icon: <Edit size={14} />, onClick: () => onEditTask(task, listId), dividerAbove: true },
  
    { label: 'Add Subtask', icon: <Plus size={14} />, onClick: () => onSimpleAddTask(listId, String(task.taskId)) },
      
    {
      label: 'Add Task Above', icon: <ListPlus size={14} />,
      onClick: () => onAddTaskAtPosition(String(task.taskId), true, listId, task.parentTaskId ? String(task.parentTaskId) : null),
      dividerAbove: true, shortcut: '⌃⇧↑',
    },
    {
      label: 'Add Task Below', icon: <ListPlus size={14} />,
      onClick: () => onAddTaskAtPosition(String(task.taskId), false, listId, task.parentTaskId ? String(task.parentTaskId) : null),
      shortcut: '⌃⇧↓',
    },
    { label: 'Delete', icon: <Trash2 size={14} />, onClick: () => confirmDeleteTask(task), variant: 'danger' as const },
  ];

  const handleContextMenu = (e: React.MouseEvent, type: 'list' | 'task', item: TaskListNode | SubTaskNode, listId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ type, item, listId, x: e.clientX, y: e.clientY });
  };

  const handleThreeDots = (e: React.MouseEvent, type: 'list' | 'task', item: TaskListNode | SubTaskNode, listId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ type, item, listId, x: rect.right, y: rect.bottom });
  };

  // ── Drag & Drop (siblings tree se derive hote hain, render order untouched) ──
  const isAbovePointer = (e: React.DragEvent<HTMLElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return e.clientY < rect.top + rect.height / 2;
  };

  const handleDragStart = (id: string, tlId: string, parentId: string | null) => {
    dragRef.current = { id, type: 'task', taskListId: tlId, parentTaskId: parentId };
  };

  const clearDropTarget = () => setDropTarget(null);

  const handleDropList = (e: React.DragEvent, targetId: string, before: boolean) => {
    e.preventDefault();
    const src = dragRef.current;
    setDropTarget(null);
    if (!src || src.type !== 'list' || src.id === targetId) return;

    onReorderTaskLists?.({ taskListId: src.id, referenceListId: targetId, isAbove: before });
    dragRef.current = null;
  };

  /**
   * Task drop — task row par.
   * Same sibling-set ho ya cross-list/cross-parent — ek hi logic:
   * target siblings me se src hatao, target ke upar/neeche insert karo.
   */
  const handleDropTask = (e: React.DragEvent, targetId: string, before: boolean, tlId: string, parentId: string | null) => {
    e.preventDefault();
    const src = dragRef.current;
    setDropTarget(null);
    if (!src || src.type !== 'task' || src.id === targetId) return;

    // Parent ko apne hi child ke andar drop nahi kar sakte (tree corrupt ho jayega)
    const srcTask = findTaskAcrossLists(lists, Number(src.id));
    const targetTask = findTaskAcrossLists(lists, Number(targetId));
    if (srcTask && targetTask && isInSubtree(srcTask, targetTask.taskId)) {
      toast.info('A task cannot be moved inside itself');
      return;
    }

    const siblings = getSiblingsArray(lists, tlId, parentId);
    const ids = siblings.map(t => String(t.taskId)).filter(id => id !== src.id);
    const toIdx = ids.indexOf(targetId);
    if (toIdx < 0) return;

    // toIdx removal ke baad nikalte ho — upar/neeche dono case me sahi rahega
    ids.splice(before ? toIdx : toIdx + 1, 0, src.id);

    onReorderTasks?.({
      taskId: src.id,
      referenceTaskId: targetId,
      isAbove: before,
      taskListId: tlId,
      parentTaskId: parentId,
      orderedIds: ids,
      sourceTaskListId: src.taskListId,
      sourceParentTaskId: src.parentTaskId,
    });
    dragRef.current = null;
  };

  /**
   * Task drop — list header row par.
   * Header ke upar → list me sabse top, neeche → sabse bottom.
   * Reference task API ke liye list ka pechla/akhri root task hota hai.
   */
  const handleDropTaskOnList = (e: React.DragEvent, targetListId: string, before: boolean) => {
    e.preventDefault();
    const src = dragRef.current;
    setDropTarget(null);
    if (!src || src.type !== 'task') return;

    const targetList = lists.find(l => String(l.listId) === targetListId);
    const rootTasks = targetList?.tasks || [];
    const candidates = rootTasks.filter(t => String(t.taskId) !== src.id);

    if (candidates.length === 0) {
      // Empty list (ya src hi ek root task hai) — referenceTaskId ke bina move possible nahi
      if (rootTasks.length === 0) toast.info('Target list is empty — add a task there first');
      dragRef.current = null;
      return;
    }

    const reference = before ? candidates[0] : candidates[candidates.length - 1];
    const ids = rootTasks.map(t => String(t.taskId)).filter(id => id !== src.id);
    if (before) ids.unshift(src.id);
    else ids.push(src.id);

    onReorderTasks?.({
      taskId: src.id,
      referenceTaskId: String(reference.taskId),
      isAbove: before,
      taskListId: targetListId,
      parentTaskId: null,
      orderedIds: ids,
      sourceTaskListId: src.taskListId,
      sourceParentTaskId: src.parentTaskId,
    });
    dragRef.current = null;
  };

  return (
    <>
    
    <TaskTableHeader
  listsCount={sortedLists.length}
  rootTaskCount={rootTaskCount}
  subTaskCount={subTaskCount}
  doneCount={doneCount}
  activeCount={activeCount}
  hasLists={sortedLists.length > 0}
  firstListId={sortedLists[0] ? String(sortedLists[0].listId) : undefined}
  onExpandAll={expandAll}
  onCollapseAll={collapseAll}
  onSimpleAddTask={onSimpleAddTask}
/>
    <div className="border border-border rounded-xl overflow-hidden bg-card text-foreground">

      <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-accent-55 border-b border-border">
              {['Name', 'Status', 'Priority', 'Due Date', ''].map((h, i) => (
                <th key={i} className={cn(
                  'px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap',
                  i === 4 ? 'text-right w-24' : 'text-left'
                )}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedLists.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-muted-foreground">
                  <Folder size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No task lists yet — click "New List" to start</p>
                </td>
              </tr>
            ) : (
              sortedLists.map((tl, tlIdx) => {
                // ✅ list.tasks — API order, koi sort nahi
                const rootTasksForList = tl.tasks || [];
                const totalTaskandSubTask=tl.taskCount;
                const listIdStr = String(tl.listId);
                const isExpanded = expandedLists.has(listIdStr);

                return (
                  <React.Fragment key={`tl-${tl.listId}`}>
                    {dropTarget?.listId === listIdStr && dropTarget.isAbove && <DropIndicatorLine />}
                    <tr
                      draggable
                      onContextMenu={e => handleContextMenu(e, 'list', tl)}
                      onDragStart={() => (dragRef.current = { id: listIdStr, type: 'list', taskListId: listIdStr, parentTaskId: null })}
                      onDragOver={e => {
                        e.preventDefault();
                        const isAbove = isAbovePointer(e);
                        setDropTarget(prev =>
                          prev && prev.listId === listIdStr && prev.isAbove === isAbove
                            ? prev
                            : { listId: listIdStr, isAbove }
                        );
                      }}
                      onDragLeave={e => {
                        // Ignore events bubbling up from the row's own children.
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) clearDropTarget();
                      }}
                      onDragEnd={clearDropTarget}
                      onDrop={e => {
                        if (dragRef.current?.type === 'task') handleDropTaskOnList(e, listIdStr, isAbovePointer(e));
                        else handleDropList(e, listIdStr, isAbovePointer(e));
                      }}
                      className={cn(
                        'cursor-grab border-b border-border group transition-colors',
                        tlIdx > 0 ? 'border-t border-border' : '',
                        'bg-secondary/50',
                        dropTarget?.listId === listIdStr && 'bg-primary-55'
                      )}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <GripVertical size={13} className="text-muted-foreground flex-shrink-0" />
                          {rootTasksForList.length > 0 ? (
                            <button onClick={() => toggleList(listIdStr)} className="flex-shrink-0 text-muted-foreground hover:text-heading">
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          ) : (
                            <span className="w-[14px] flex-shrink-0" />
                          )}
                          <AlignJustify size={15} className="text-primary flex-shrink-0" />
                          <span className="font-semibold text-heading text-[13px]">{tl.listTitle}</span>
                          <Badge variant="secondary" className="text-[10px] bg-primary px-1.5 py-0 h-4">{totalTaskandSubTask}</Badge>
                        </div>
                      </td>
                      <td colSpan={3} />
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Add task" onClick={() => onSimpleAddTask(listIdStr, null)}>
                            <Plus size={12} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" title="More options" onClick={e => handleThreeDots(e, 'list', tl)}>
                            <MoreHorizontal size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {dropTarget?.listId === listIdStr && !dropTarget.isAbove && <DropIndicatorLine />}

                    {isExpanded && (
                      rootTasksForList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-3 text-center text-[12px] text-muted-foreground">No tasks yet — click + to add one</td>
                        </tr>
                      ) : (
                        rootTasksForList.map(task => (
                          <TaskRow
                            key={task.taskId}
                            task={task}
                            taskListId={listIdStr}
                            depth={1}
                            expandedTasks={expandedTasks}
                            onToggleTask={toggleTask}
                            onOpenEditTask={t => onEditTask(t, listIdStr)}
                            onDeleteTask={confirmDeleteTask}
                            onUpdateTask={onUpdateTask}
                            onUpdateTaskStatus={onUpdateTaskStatus}
                            statusOptions={statusOptions}
                            statusSavingId={statusSavingId}
                            onDragStart={handleDragStart}
                            onDrop={handleDropTask}
                            onContextMenu={(e, t) => handleContextMenu(e, 'task', t, listIdStr)}
                            onThreeDots={(e, t) => handleThreeDots(e, 'task', t, listIdStr)}
                            onTaskClick={onTaskClick}
                          />
                        ))
                      )
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

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={
            contextMenu.type === 'list'
              ? buildListMenuItems(contextMenu.item as TaskListNode)
              : buildTaskMenuItems(contextMenu.item as SubTaskNode, contextMenu.listId!)
          }
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
    </>
  );
}