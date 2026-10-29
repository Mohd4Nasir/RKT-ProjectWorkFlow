
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronRight, ChevronDown, Folder, GripVertical, ChevronsDown, ChevronsUp,
  AlignJustify, MoreHorizontal, Edit, Trash2, Move, ListPlus, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { TaskListNode, TaskNode, SubTaskNode } from '@/types/taskTypes';
import { CreateTaskListRequest, CreateTaskRequest } from '@/types/taskTypes';
import { DeleteConfirmModal } from '@/pages/task/DeleteConfirmodal';
import { TaskRow, DropZone } from './TaskRow';
import { ContextMenu } from '../../components/ui/contextMenu';
import { Users } from '@/types/ProejctsType';
import { TaskTableHeader } from './TaskTableHeader';
import { FullscreenButton, FULLSCREEN_CLASS, useFullscreen } from '@/components/FullscreenButton';

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

export interface MoveTaskPayload {
  taskId: string;
  targetListId: string;
  targetParentTaskId: string | null;
  referenceTaskId: string;
  isAbove: boolean;
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
  onDeleteTask: (id: string) => void;
  onReorderTaskLists?: (orderedIds: string[], movedId?: string) => void;
  onReorderTasks?: (taskListId: string, parentTaskId: string | null, orderedIds: string[], movedId?: string) => void;
  /** Cross-list / nest-as-subtask move (PUT /task/move) */
  onMoveTask?: (p: MoveTaskPayload) => void;
  onEditList: (tl: TaskListNode) => void;
  onAddTaskListAbove: (referenceListId: string) => void;
  onAddTaskListBelow: (referenceListId: string) => void;
  onAddTaskAtPosition: (refTaskId: string, isAbove: boolean, listId: string, parentTaskId: string | null) => void;
  onEditTask: (task: SubTaskNode, listId: string) => void;
  onSimpleAddTask: (taskListId?: string, parentTaskId?: string | null) => void;
  onTaskClick?: (task: SubTaskNode) => void;
  /** localStorage key; when given, expanded lists/tasks survive a reload */
  storageKey?: string;
  /** open every list and task (used while a search / filter is active so matches are visible) */
  forceExpand?: boolean;
}

export function TaskTabTable({
  lists = [],
  users,
  onAddTaskList,
  onUpdateTaskList,
  onDeleteTaskList,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onReorderTaskLists,
  onReorderTasks,
  onMoveTask,
  onAddTaskAtPosition,
  onAddTaskListAbove,
  onAddTaskListBelow,
  onEditList,
  onEditTask,
  onSimpleAddTask,
  onTaskClick,
  storageKey,
  forceExpand = false,
}: TaskTabTableProps) {
  const saved = useMemo(() => {
    try {
      const raw = storageKey ? localStorage.getItem(storageKey) : null;
      return raw ? (JSON.parse(raw) as { lists?: string[]; tasks?: string[]; seen?: string[] }) : null;
    } catch {
      return null;
    }
  }, [storageKey]);
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set(saved?.lists ?? []));
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set(saved?.tasks ?? []));
  // lists we have already opened once — a list not in here is new and starts expanded
  const seenLists = useRef<Set<string>>(new Set(saved?.seen ?? []));

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        lists: [...expandedLists], tasks: [...expandedTasks], seen: [...seenLists.current],
      }));
    } catch { /* quota / private mode */ }
  }, [storageKey, expandedLists, expandedTasks]);

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

  const fs = useFullscreen();
  const dragRef = useRef<{ kind: 'list' | 'task'; id: string; taskListId: string; parentTaskId: string | null } | null>(null);
  const [overListId, setOverListId] = useState<string | null>(null);

  // ── A list we have not seen before opens by default; ones the user collapsed stay collapsed ──
  useEffect(() => {
    if (lists.length === 0) return;
    const fresh = lists.map(l => String(l.listId)).filter(id => !seenLists.current.has(id));
    if (fresh.length === 0) return;
    fresh.forEach(id => seenLists.current.add(id));
    setExpandedLists(prev => new Set([...prev, ...fresh]));
  }, [lists.map(l => l.listId).join(',')]);

  // click anywhere on a row (not on its buttons / menus / portalled popovers)
  const rowClick = (e: React.MouseEvent, fn: () => void) => {
    if (!e.currentTarget.contains(e.target as Node)) return; // bubbled up from a portal
    if ((e.target as HTMLElement).closest('button,a,input,select,textarea,[role="menuitem"],[role="combobox"]')) return;
    fn();
  };

  // ✅ NO SORT — jaisa API se aaya hai, waisa hi
  const sortedLists = lists;
  const visibleExpandedTasks = forceExpand
    ? new Set(lists.flatMap(l => collectIdsWithChildren(l.tasks || [])))
    : expandedTasks;
  //  console.log('sortedLists TaskTabTable:', sortedLists);

  const rootTaskCount = lists.reduce((s, l) => s + (l.tasks?.length || 0), 0);
  const totalTaskCount = lists.reduce((s, l) => s + countAllTasks(l.tasks || []), 0);
  const subTaskCount = totalTaskCount - rootTaskCount;
  const doneCount = lists.reduce(
    (s, l) => s + ['COMPLETED', 'CLOSED', 'DONE'].reduce((n, st) => n + countByStatus(l.tasks || [], st), 0),
    0,
  );
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
    { label: 'Move (WIP)', icon: <Move size={14} />, onClick: () => toast.info('Move coming soon'), dividerAbove: true },
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
  const handleDragStart = (id: string, tlId: string, parentId: string | null) => {
    dragRef.current = { kind: 'task', id, taskListId: tlId, parentTaskId: parentId };
  };

  // Is `maybeChildId` somewhere inside the subtree of `rootId`? (blocks dropping a task into itself)
  const isInSubtree = (rootId: string, maybeChildId: string) => {
    const root = findTaskAcrossLists(lists, Number(rootId));
    return !!root && !!findInNodes(root.subTask || [], Number(maybeChildId));
  };

  // Drop a task on a list header -> becomes the first task of that list
  const handleDropTaskOnList = (e: React.DragEvent, listId: string) => {
    e.preventDefault();
    const src = dragRef.current;
    dragRef.current = null;
    setOverListId(null);
    if (!src || src.kind !== 'task') return;
    const list = lists.find(l => String(l.listId) === listId);
    const first = list?.tasks?.[0];
    if (!first) {
      toast.info('Empty list — add a task first, then drag tasks next to it');
      return;
    }
    if (String(first.taskId) === src.id) return;
    onMoveTask?.({
      taskId: src.id,
      targetListId: listId,
      targetParentTaskId: null,
      referenceTaskId: String(first.taskId),
      isAbove: true,
    });
  };

  const handleDropList = (e: React.DragEvent, targetId: string, before: boolean) => {
    e.preventDefault();
    const src = dragRef.current;
    if (!src) return;

    const ids = sortedLists.map(l => String(l.listId));
    const fromIdx = ids.indexOf(src.id);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;

    ids.splice(fromIdx, 1);
    ids.splice(before ? toIdx : toIdx + 1, 0, src.id);
    onReorderTaskLists?.(ids, src.id);
    dragRef.current = null;
  };

  const handleDropTask = (
    e: React.DragEvent, targetId: string, before: boolean, tlId: string, parentId: string | null, zone?: DropZone,
  ) => {
    e.preventDefault();
    const src = dragRef.current;
    dragRef.current = null;
    if (!src || src.kind !== 'task' || src.id === targetId) return;

    // never drop a task into its own subtree
    if (isInSubtree(src.id, targetId)) {
      toast.error("A task can't be moved inside its own subtask");
      return;
    }

    // 1) middle of the row -> nest as a subtask of the target
    if (zone === 'inside') {
      const target = findTaskAcrossLists(lists, Number(targetId));
      const kids = target?.subTask || [];
      if (src.parentTaskId === targetId) return; // already its child
      setExpandedTasks(prev => new Set(prev).add(targetId)); // show the moved subtask
      onMoveTask?.({
        taskId: src.id,
        targetListId: tlId,
        targetParentTaskId: targetId,
        // API needs a reference task: last child if any, else the parent itself
        referenceTaskId: kids.length ? String(kids[kids.length - 1].taskId) : targetId,
        isAbove: false,
      });
      return;
    }

    // 2) edge of the row -> sibling of the target
    const sameContainer = src.taskListId === tlId && (src.parentTaskId ?? null) === (parentId ?? null);
    if (sameContainer) {
      const ids = getSiblingsArray(lists, tlId, parentId).map(t => String(t.taskId));
      const fromIdx = ids.indexOf(src.id);
      const toIdx = ids.indexOf(targetId);
      if (fromIdx < 0 || toIdx < 0) return;
      ids.splice(fromIdx, 1);
      ids.splice(before ? toIdx : toIdx + 1, 0, src.id);
      onReorderTasks?.(tlId, parentId, ids, src.id);
      return;
    }

    // different list / different parent
    onMoveTask?.({
      taskId: src.id,
      targetListId: tlId,
      targetParentTaskId: parentId,
      referenceTaskId: targetId,
      isAbove: before,
    });
  };

  return (
    <div className={cn('flex flex-col h-full min-h-0', fs.on && FULLSCREEN_CLASS)}>
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
    <div className="border border-border rounded-none overflow-hidden bg-card shadow-card flex flex-col flex-1 min-h-0">
      <div className="flex justify-end border-b border-border px-3 py-1.5 shrink-0">
        <FullscreenButton on={fs.on} onToggle={fs.toggle} />
      </div>

      <div className="overflow-auto scrollbar-thin flex-1 min-h-0">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-sidebar">
              {['Name', 'Status', 'Priority', 'Due Date', ''].map((h, i) => (
                <th key={i} className={cn(
                  'px-3 py-2.5 text-[11px] font-semibold text-white/75 uppercase tracking-wider whitespace-nowrap',
                  i === 4 ? 'text-right w-24' : 'text-left'
                )}>{h}</th>
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
                // ✅ list.tasks — API order, koi sort nahi
                const rootTasksForList = tl.tasks || [];
                const totalTaskandSubTask=tl.taskCount;
                const listIdStr = String(tl.listId);
                const isExpanded = forceExpand || expandedLists.has(listIdStr);

                return (
                  <React.Fragment key={`tl-${tl.listId}`}>
                    <tr
                      draggable
                      onClick={e => rootTasksForList.length > 0 && rowClick(e, () => toggleList(listIdStr))}
                      onContextMenu={e => handleContextMenu(e, 'list', tl)}
                      onDragStart={() => (dragRef.current = { kind: 'list', id: listIdStr, taskListId: listIdStr, parentTaskId: null })}
                      onDragOver={e => {
                        e.preventDefault();
                        if (dragRef.current?.kind === 'task' && overListId !== listIdStr) setOverListId(listIdStr);
                      }}
                      onDragLeave={e => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverListId(null);
                      }}
                      onDrop={e => {
                        if (dragRef.current?.kind === 'task') {
                          handleDropTaskOnList(e, listIdStr);
                          return;
                        }
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        handleDropList(e, listIdStr, e.clientY < rect.top + rect.height / 2);
                      }}
                      className={cn(
                        'cursor-grab border-b border-border group bg-gradient-to-r from-primary/[0.10] via-primary/[0.04] to-transparent',
                        tlIdx > 0 && 'border-t-2 border-t-border',
                        overListId === listIdStr && '[&>td]:bg-primary/15 [&>td]:shadow-[inset_0_0_0_1.5px_hsl(var(--primary))]',
                      )}
                    >
                      <td className="px-3 py-2.5 border-l-4 border-l-primary">
                        <div className="flex items-center gap-2">
                          <GripVertical size={13} className="text-muted-foreground/40 flex-shrink-0" />
                          {rootTasksForList.length > 0 ? (
                            <button onClick={() => toggleList(listIdStr)} className="flex-shrink-0 text-slate-500 hover:text-slate-700">
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          ) : (
                            <span className="w-[14px] flex-shrink-0" />
                          )}
                          <span className="h-6 w-6 rounded-md bg-primary/15 text-primary grid place-items-center flex-shrink-0">
                            <AlignJustify size={13} />
                          </span>
                          <span className="font-display font-bold text-[13.5px] text-foreground">{tl.listTitle}</span>
                          <Badge variant="secondary" className="text-[10px] bg-primary/15 text-primary hover:bg-primary/15 px-2 py-0 h-4 font-semibold">{totalTaskandSubTask} items</Badge>
                        </div>
                      </td>
                      <td colSpan={3} />
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Add task" onClick={() => onSimpleAddTask(listIdStr, null)}>
                            <Plus size={12} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-70 group-hover:opacity-100 hover:opacity-100 transition-opacity" title="More options" onClick={e => handleThreeDots(e, 'list', tl)}>
                            <MoreHorizontal size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      rootTasksForList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-3 text-center text-[12px] text-slate-400">No tasks yet — click + to add one</td>
                        </tr>
                      ) : (
                        rootTasksForList.map(task => (
                          <TaskRow
                            key={task.taskId}
                            task={task}
                            taskListId={listIdStr}
                            depth={1}
                            expandedTasks={visibleExpandedTasks}
                            onToggleTask={toggleTask}
                            onOpenEditTask={t => onEditTask(t, listIdStr)}
                            onDeleteTask={confirmDeleteTask}
                            onUpdateTask={onUpdateTask}
                            onDragStart={handleDragStart}
                            onDrop={handleDropTask}
                            onContextMenu={(e, t) => handleContextMenu(e, 'task', t, listIdStr)}
                            onThreeDots={(e, t) => handleThreeDots(e, 'task', t, listIdStr)}
                            onTaskClick={onTaskClick}
                            onAddSubtask={(t) => onSimpleAddTask(listIdStr, String(t.taskId))}
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
    </div>
  );
}