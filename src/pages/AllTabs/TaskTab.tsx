
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { projectApiService } from '@/services/projectsApiService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, Filter, LayoutList, LayoutGrid, FolderPlus, CheckSquare, Columns3 } from 'lucide-react';
import { TaskBoard, BoardTask } from '@/components/board/TaskBoard';

import { TaskListFormModal } from '@/pages/task/TaskListFormModal';
import { TaskDetailPanel } from '@/pages/task/TaskDetailsPanel';
import { TaskFormModal } from '@/pages/task/TaskFormModal';

import { mapStatusFromApi, ViewMode } from '@/utils/tasksTabUtils';
import { ProjectsFilterDrawer } from '@/pages/projects/ProjectsFilterDrawer';
import { useFilterState } from '@/pages/projects/hooks/useProjectsFilter';
import { useTaskStatuses } from '@/pages/task/useTaskStatuses';
import { useTaskPriorities } from '@/pages/task/useTaskPriorities';
import { priorityOf } from '@/pages/task/taskUi';
import { buildTaskFilterFields, countActiveFilters, filterFlat, filterLists } from '@/pages/task/taskFilters';
import { taskService } from '@/services/taskservice';
import { TaskTabTable } from '@/pages/task/TaskTabtable';
import { TaskCard } from '@/pages/task/TaskCard';
import {
    setLoading,
    setProjectData,
    updateTask,
    updateTaskList,
    deleteTaskList,
    deleteTask,
    reorderTaskLists,
    reorderTasks,
} from '@/store/slices/taskSlice';
import { TaskListNode, TaskNode, SubTaskNode, CreateTaskListRequest, CreateTaskRequest } from '@/types/taskTypes';
import { cn } from '@/lib/utils';
import { showError, showWarning } from '@/lib/errorAlert';

interface TasksTabProps {
    projectId: string;
    /** the project ProjectDetails already loaded — Redux `projects` is empty after a reload */
    project?: any;
}

type ReduxTask = TaskNode;
type ReduxTaskList = TaskListNode;

// ── Recursively flatten tree → flat array (ONLY used for search/insertOptions/card-view, never for the tree table render) ──
function flattenTree(lists: TaskListNode[]): (SubTaskNode & { listId: number })[] {
    const out: (SubTaskNode & { listId: number })[] = [];
    const walk = (nodes: SubTaskNode[], listId: number) => {
        nodes.forEach(n => {
            out.push({ ...n, listId });
            if (n.subTask?.length) walk(n.subTask, listId);
        });
    };
    lists.forEach(l => walk(l.tasks || [], l.listId));
    return out;
}

export function TasksTab({ projectId, project: projectProp }: TasksTabProps) {
    const dispatch = useAppDispatch();

    // ✅ Ek hi source of truth — pura tree, AS-IS (no sort/filter here)
    const lists = useAppSelector(state => state.tasks.lists || []);
    console.log('TaskTab lists from Redux:', lists);
    const users = useAppSelector(state => state.users?.items || []);
    const reduxProject = useAppSelector(state => state.projects?.items?.find(p => p.id === projectId) || null);
    // Redux is only persisted for `ui`, so after a reload `projects.items` is empty and the panel
    // (which needs a project) never rendered. Fall back to the project the page already has.
    const project = reduxProject ?? (projectProp ? { ...projectProp, projectId: projectProp.projectId ?? projectProp.id, projectTitle: projectProp.projectTitle ?? projectProp.name } : null);

    // Sirf card-view/search/insertOptions ke liye flatten — table render iska use nahi karta
    const allTasksFlat = useMemo(() => flattenTree(lists), [lists]);


    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [search, setSearch] = useState<string>('');
    const [filterOpen, setFilterOpen] = useState(false);
    const filters = useFilterState();
    const statusOptions = useTaskStatuses();
    const priorityOptions = useTaskPriorities();
    const [selectedTask, setSelectedTask] = useState<ReduxTask | null>(null);
    // the open panel lives in the URL (?task=ID) so a reload brings it back
    const [searchParams, setSearchParams] = useSearchParams();
    const setTaskParam = (id: string | number | null) =>
        setSearchParams(prev => {
            const n = new URLSearchParams(prev);
            if (id == null) n.delete('task'); else n.set('task', String(id));
            return n;
        }, { replace: true });
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Kanban board data: every task + subtask, searchable
    const boardTasks: BoardTask[] = useMemo(() => {
        return filterFlat(allTasksFlat, search, filters.values)
            .map(t => {
                const kids = t.subTask || [];
                return {
                    key: String(t.taskId),
                    taskId: t.taskId,
                    projectId,
                    title: t.taskTitle,
                    status: t.taskStatus,
                    priority: priorityOf(t),
                    endDate: t.endDate,
                    listTitle: lists.find(l => l.listId === t.listId)?.listTitle,
                    openIssueCount: t.openIssueCount,
                    subtaskTotal: kids.length,
                    subtaskDone: kids.filter(k => ['COMPLETED', 'CLOSED', 'DONE'].includes((k.taskStatus || '').toUpperCase())).length,
                    isSubtask: !!t.parentTaskId,
                };
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allTasksFlat, lists, search, filters.values]);

    const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
    const [editingTask, setEditingTask] = useState<ReduxTask | null>(null);
    const [taskParentId, setTaskParentId] = useState<string | null>(null);
    const [taskListIdForModal, setTaskListIdForModal] = useState<string>('');
    const [taskModalMode, setTaskModalMode] = useState<'simple' | 'position'>('simple');
    const [positionData, setPositionData] = useState<{ referenceTaskId: string | null; isAbove: boolean }>({
        referenceTaskId: null,
        isAbove: false,
    });
    const [listPositionData, setListPositionData] = useState<{
        referenceListId: string | null;
        isAbove: boolean;
        mode: 'simple' | 'position';
    }>({ referenceListId: null, isAbove: false, mode: 'simple' });

    const [taskForm, setTaskForm] = useState({
        taskName: '',
        taskDescription: '',
        taskStartDate: '',
        taskEndDate: '',
        taskListId: '',
        insertAfterId: 'end',
    });
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    const [isListModalOpen, setIsListModalOpen] = useState<boolean>(false);
    const [editingList, setEditingList] = useState<ReduxTaskList | null>(null);
    const [listName, setListName] = useState<string>('');



    const insertOptions = useMemo(() => {
        const siblings = taskParentId
            ? allTasksFlat.filter(t => t.parentTaskId === Number(taskParentId))
            : taskForm.taskListId
                ? allTasksFlat.filter(t => t.listId === Number(taskForm.taskListId) && !t.parentTaskId)
                : [];

        return [
            { value: '__start__', label: '— At the beginning' },
            ...siblings.map(t => ({ value: String(t.taskId), label: t.taskTitle || 'Unnamed' })),
            { value: 'end', label: '— At the end' },
        ];
    }, [taskParentId, taskForm.taskListId, allTasksFlat]);

    const fetchProjectWithTasks = async (): Promise<void> => {
        if (!projectId) return;
        try {
            dispatch(setLoading(true));
            setIsLoading(true);
            toast.loading('Loading project...');

            const response = await projectApiService.getProjectById(projectId);
            console.log('Fetched project ke all task:', response.data.lists);
            // 🔥 As-is dispatch — no transformation, no sort
            dispatch(setProjectData({
                projectId: String(response.data.projectId),
                lists: response.data.lists || [],
            }));

            toast.dismiss();
            toast.success('Project loaded');
        } catch (error) {
            console.error(error);
            toast.dismiss();
            showError(error, 'Failed to load project');
        } finally {
            dispatch(setLoading(false));
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectWithTasks();
    }, [projectId]);

    const handleAddTaskListAbove = async (referenceListId: string): Promise<void> => {
        openCreateListAbove(referenceListId);
    };


    const handleAddTaskListBelow = async (referenceListId: string): Promise<void> => {
        openCreateListBelow(referenceListId);
    };

    const openCreateListAbove = (referenceListId: string): void => {
        const referenceList = lists.find(tl => String(tl.listId) === referenceListId);
        if (!referenceList) { showWarning('Reference list not found'); return; }
        setListName('');
        setEditingList(null);
        setListPositionData({ referenceListId, isAbove: true, mode: 'position' });
        setIsListModalOpen(true);
    };

    const openCreateListBelow = (referenceListId: string): void => {
        const referenceList = lists.find(tl => String(tl.listId) === referenceListId);
        if (!referenceList) { showWarning('Reference list not found'); return; }
        setListName('');
        setEditingList(null);
        setListPositionData({ referenceListId, isAbove: false, mode: 'position' });
        setIsListModalOpen(true);
    };

    const openSimpleAddTask = (taskListId?: string, parentTaskId?: string | null) => {
        const defaultListId = taskListId || String(lists[0]?.listId || '');
        setEditingTask(null);
        setTaskParentId(parentTaskId || null);
        setTaskListIdForModal(defaultListId);
        setTaskModalMode('simple');
        setPositionData({ referenceTaskId: null, isAbove: false });
        setTaskForm({
            taskName: '', taskDescription: '', taskStartDate: '', taskEndDate: '',
            taskListId: defaultListId, insertAfterId: 'end',
        });
        setIsTaskModalOpen(true);
    };

    const openPositionAddTask = (
        referenceTaskId: string, isAbove: boolean, listId: string, parentTaskId: string | null
    ) => {
        setEditingTask(null);
        setTaskParentId(parentTaskId);
        setTaskListIdForModal(listId);
        setTaskModalMode('position');
        setPositionData({ referenceTaskId, isAbove });
        setTaskForm({
            taskName: 'New Task', taskDescription: '', taskStartDate: '', taskEndDate: '',
            taskListId: listId, insertAfterId: 'end',
        });
        setIsTaskModalOpen(true);
    };

    const openEditTask = (task: ReduxTask, listId: string) => {
        setEditingTask(task);
        setTaskParentId(task.parentTaskId ? String(task.parentTaskId) : null);
        setTaskListIdForModal(listId);
        setTaskModalMode('simple');
        setPositionData({ referenceTaskId: null, isAbove: false });
        setTaskForm({
            taskName: task.taskTitle || '',
            taskDescription: task.taskDescription || '',
            taskStartDate: task.startDate || '',
            taskEndDate: task.endDate || '',
            taskListId: listId,
            insertAfterId: 'end',
        });
        setIsTaskModalOpen(true);
    };

    const saveTask = async (): Promise<void> => {
        if (!taskForm.taskName.trim()) { showWarning('Enter a task name'); return; }

        if (editingTask) {
            try {
                await taskService.updateTask(projectId, editingTask.taskId, {
                    taskTitle: taskForm.taskName.trim(),
                    taskDescription: taskForm.taskDescription,
                    taskStartDate: taskForm.taskStartDate,
                    taskEndDate: taskForm.taskEndDate,
                });
                dispatch(updateTask({
                    taskId: editingTask.taskId,
                    taskTitle: taskForm.taskName.trim(),
                    taskDescription: taskForm.taskDescription,
                    startDate: taskForm.taskStartDate,
                    endDate: taskForm.taskEndDate,
                }));
                toast.success('Task updated successfully');
                setIsTaskModalOpen(false);
                return;
            } catch (err) {
                showError(err, 'Failed to update task');
                return;
            }
        }

        if (taskModalMode === 'position' && positionData.referenceTaskId) {
            const loadingToast = toast.loading('Creating task...');
            try {
                await taskService.createTaskAtPosition({
                    taskTitle: taskForm.taskName.trim(),
                    taskDescription: taskForm.taskDescription,
                    taskStartDate: taskForm.taskStartDate,
                    taskEndDate: taskForm.taskEndDate,
                    refTaskId: Number(positionData.referenceTaskId),
                    isAbove: positionData.isAbove,
                });
                await fetchProjectWithTasks();
                toast.dismiss(loadingToast);
                toast.success(positionData.isAbove ? 'Task created above' : 'Task created below');
                setIsTaskModalOpen(false);
            } catch (err) {
                toast.dismiss(loadingToast);
                showError(err, 'Failed to create task');
            }
            return;
        }

        const loadingToast = toast.loading('Creating task...');
        try {
            await taskService.createTask({
                projectId,
                taskListId: Number(taskForm.taskListId),
                parentTaskId: taskParentId ? Number(taskParentId) : null,
                taskTitle: taskForm.taskName.trim(),
                taskDescription: taskForm.taskDescription,
                taskStartDate: taskForm.taskStartDate,
                taskEndDate: taskForm.taskEndDate,
                taskStatus: 'TODO',
            });
            await fetchProjectWithTasks();
            toast.dismiss(loadingToast);
            toast.success(taskParentId ? 'Subtask created' : 'Task created');
            setIsTaskModalOpen(false);
        } catch (err) {
            toast.dismiss(loadingToast);
            showError(err, 'Failed to create task');
        }
    };

    const saveList = async (): Promise<void> => {
        if (!listName.trim()) { showWarning('Enter a list name'); return; }
        const loadingToast = toast.loading(editingList ? 'Updating list...' : 'Creating list...');

        try {
            if (editingList) {
                await taskService.updateTaskList(projectId, editingList.listId, listName.trim());
                dispatch(updateTaskList({ ...editingList, listTitle: listName.trim() }));
                toast.dismiss(loadingToast);
                toast.success('List updated successfully');
                setIsListModalOpen(false);
                setEditingList(null);
                setListName('');
                return;
            }

            if (listPositionData.mode === 'position' && listPositionData.referenceListId) {
                const referenceList = lists.find(tl => String(tl.listId) === listPositionData.referenceListId);
                if (!referenceList) {
                    toast.dismiss(loadingToast);
                    showWarning('Reference list not found');
                    return;
                }
                await taskService.createTaskListAtPosition({
                    refListId: Number(listPositionData.referenceListId),
                    listTitle: listName.trim(),
                    isAbove: listPositionData.isAbove,
                });
                await fetchProjectWithTasks();
                toast.dismiss(loadingToast);
                toast.success(
                    listPositionData.isAbove
                        ? `✅ "${listName.trim()}" created above "${referenceList.listTitle}"`
                        : `✅ "${listName.trim()}" created below "${referenceList.listTitle}"`
                );
                setIsListModalOpen(false);
                setListPositionData({ referenceListId: null, isAbove: false, mode: 'simple' });
                setListName('');
                return;
            }

            await taskService.createTaskList({ projectId, listTitle: listName.trim() });
            await fetchProjectWithTasks();
            toast.dismiss(loadingToast);
            toast.success(`✅ "${listName.trim()}" created successfully`);
            setIsListModalOpen(false);
            setListName('');
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error('Error saving list:', error);
            showError(error, 'Failed to save list');
        }
    };

    // ✅ Sirf card-view ke liye filter — table tree isse untouched hai
    const filteredTasksForCards = useMemo(() => {
        return filterFlat(allTasksFlat, search, filters.values);
    }, [allTasksFlat, search, filters.values]);

    // all views read from redux; filters only narrow what is shown (no API calls)
    const filterFields = useMemo(() => buildTaskFilterFields({
        statuses: statusOptions,
        priorities: priorityOptions,
        users: users.map(u => ({ id: u.id, name: u.name })),
        lists: lists.map(l => ({ listId: l.listId, listTitle: l.listTitle })),
    }), [statusOptions, priorityOptions, users, lists]);
    const activeFilters = countActiveFilters(filterFields, filters.values.values);
    const isFiltering = activeFilters > 0 || !!search.trim();
    const visibleLists = useMemo(() => filterLists(lists, search, filters.values), [lists, search, filters.values]);

    const openCreateList = (): void => {
        setListName('');
        setEditingList(null);
        setListPositionData({ referenceListId: null, isAbove: false, mode: 'simple' });
        setIsListModalOpen(true);
    };

    const openEditList = (taskList: ReduxTaskList): void => {
        setListName(taskList.listTitle);
        setEditingList(taskList);
        setIsListModalOpen(true);
    };

    const handleAddTaskList = async (data: CreateTaskListRequest): Promise<void> => {
        try {
            await taskService.createTaskList({ projectId: data.projectId, listTitle: data.name });
            await fetchProjectWithTasks();
            toast.success('List created');
        } catch (err) {
            showError(err, 'Failed to create list');
            throw err;
        }
    };

    const handleUpdateTaskList = async (taskList: ReduxTaskList): Promise<void> => {
        try {
            await taskService.updateTaskList(projectId, taskList.listId, taskList.listTitle);
            dispatch(updateTaskList(taskList));
            toast.success('List updated');
        } catch (err) {
            showError(err, 'Failed to update list');
            throw err;
        }
    };

    const handleDeleteTaskList = async (listId: string): Promise<void> => {
        try {
            await taskService.deleteTaskList(listId);
            dispatch(deleteTaskList(listId));
            toast.success('List deleted');
        } catch (err) {
            showError(err, 'Failed to delete list');
            throw err;
        }
    };

    const handleAddTask = async (data: CreateTaskRequest & { insertAfterId?: string | null }): Promise<void> => {
        try {
            await taskService.createTask({
                projectId,
                taskListId: Number(data.taskListId),
                parentTaskId: data.parentTaskId ? Number(data.parentTaskId) : null,
                taskTitle: data.taskName,
                taskDescription: data.taskDescription || '',
                taskStartDate: data.taskStartDate || '',
                taskEndDate: data.taskEndDate || '',
                taskStatus: 'TODO',
                insertAfterId: data.insertAfterId ?? null,
            });
            await fetchProjectWithTasks();
            toast.success('Task created');
        } catch (err) {
            showError(err, 'Failed to create task');
            throw err;
        }
    };

    const handleUpdateTask = async (task: ReduxTask): Promise<void> => {
        try {
            // Status-only change (status dropdown) -> PUT /task/status
            const keys = Object.keys(task);
            if (keys.length === 2 && keys.includes('taskId') && keys.includes('taskStatus')) {
                await taskService.updateTaskStatus(projectId, task.taskId, task.taskStatus);
                dispatch(updateTask(task));
                toast.success('Status updated');
                return;
            }
            await taskService.updateTask(projectId, task.taskId, {
                taskTitle: task.taskTitle,
                taskDescription: task.taskDescription || '',
                taskStartDate: task.startDate || '',
                taskEndDate: task.endDate || '',
            });
            // status is a separate endpoint - only call it when it actually changed
            if (task.taskStatus) {
                await taskService.updateTaskStatus(projectId, task.taskId, task.taskStatus);
            }
            dispatch(updateTask(task));
            toast.success('Task updated');
        } catch (err) {
            showError(err, 'Failed to update task'); // 409 = open issues block completion
            throw err;
        }
    };

    const handleDeleteTask = async (taskId: string): Promise<void> => {
        try {
            await taskService.deleteTask(taskId);
            dispatch(deleteTask(taskId));
            toast.success('Task deleted');
        } catch (err) {
            showError(err, 'Failed to delete task');
            throw err;
        }
    };

    // Neighbour of the moved item in the new order -> (reference, isAbove)
    const neighbour = (orderedIds: string[], movedId: string) => {
        const i = orderedIds.indexOf(movedId);
        if (i < 0 || orderedIds.length < 2) return null;
        return i < orderedIds.length - 1
            ? { referenceId: orderedIds[i + 1], isAbove: true }
            : { referenceId: orderedIds[i - 1], isAbove: false };
    };

    const handleReorderTaskLists = async (orderedIds: string[], movedId?: string): Promise<void> => {
        try {
            const n = movedId ? neighbour(orderedIds, movedId) : null;
            if (movedId && n) {
                await taskService.updateListPosition({
                    projectId,
                    taskListId: movedId,
                    referenceListId: n.referenceId,
                    isAbove: n.isAbove,
                });
            }
            dispatch(reorderTaskLists({ projectId, orderedIds }));
            toast.success('Lists reordered');
        } catch (err) {
            showError(err, 'Failed to reorder lists');
            throw err;
        }
    };

    const handleReorderTasks = async (
        listId: string, parentTaskId: string | null, orderedIds: string[], movedId?: string
    ): Promise<void> => {
        try {
            const n = movedId ? neighbour(orderedIds, movedId) : null;
            if (movedId && n) {
                await taskService.moveTask({
                    projectId,
                    taskId: movedId,
                    targetListId: listId,
                    targetParentTaskId: parentTaskId,
                    referenceTaskId: n.referenceId,
                    isAbove: n.isAbove,
                });
            }
            dispatch(reorderTasks({ taskListId: listId, parentTaskId, orderedIds }));
            toast.success('Tasks reordered');
        } catch (err) {
            showError(err, 'Failed to reorder tasks');
            throw err;
        }
    };

    // Silent reload of the tree (used by the task detail panel after edits)
    const refreshTree = async (): Promise<void> => {
        try {
            const response = await projectApiService.getProjectById(projectId);
            dispatch(setProjectData({
                projectId: String(response.data.projectId),
                lists: response.data.lists || [],
            }));
        } catch (error) {
            console.error(error);
            showError(error, 'Failed to refresh tasks');
        }
    };

    // Drag & drop across lists / parents, or nesting a task as a subtask (PUT /task/move)
    const handleMoveTask = async (p: {
        taskId: string; targetListId: string; targetParentTaskId: string | null;
        referenceTaskId: string; isAbove: boolean;
    }): Promise<void> => {
        const t = toast.loading('Moving task…');
        try {
            await taskService.moveTask({
                projectId,
                taskId: p.taskId,
                targetListId: p.targetListId,
                targetParentTaskId: p.targetParentTaskId,
                referenceTaskId: p.referenceTaskId,
                isAbove: p.isAbove,
            });
            // tree changed shape (parent / list) -> reload it from the server
            const response = await projectApiService.getProjectById(projectId);
            dispatch(setProjectData({
                projectId: String(response.data.projectId),
                lists: response.data.lists || [],
            }));
            toast.success(p.targetParentTaskId ? 'Task moved' : 'Task moved to list', { id: t });
        } catch (error) {
            console.error(error);
            toast.dismiss(t);
            showError(error, 'Failed to move task');
        }
    };

    // ── Central function: taskId se API call → right panel render ──
    const openTaskDetailById = async (taskId: string | number) => {
        setIsDetailLoading(true);
        try {
            const res = await taskService.getTaskBoard(taskId);
            const d = res.data;
            console.log(" this Task on click ", d)

            const mappedTask: SubTaskNode = {
                id: String(d.taskId),
                taskId: String(d.taskId),
                taskTitle: d.taskTitle || '',
                title: d.taskTitle || '',
                description: d.taskDescription || '',
                taskDescription: d.taskDescription || '',
                status: mapStatusFromApi(d.taskStatus),
                taskStatus: d.taskStatus || 'TODO',
                taskPriority: priorityOf(d),
                priority: priorityOf(d),
                assigneeId: d.assigneeId || '',
                taskStartDate: d.startDate || '',
                taskEndDate: d.endDate || '',
                startDate: d.startDate || '',
                endDate: d.endDate || '',
                dueDate: d.endDate || '',
                order: d.taskSequence || 0,
                taskSequence: d.taskSequence || 0,
                taskListId: String(d.listId),
                listId: d.listId,
                listTitle: d.listTitle,
                projectId: String(d.projectId),
                projectTitle: d.projectTitle,
                parentTaskId: d.parentTaskId ? String(d.parentTaskId) : null,
                parentTaskTitle: d.parentTaskTitle || null,
                createdBy: d.createdBy || '',
                // GET /task/{id}/board -> issues of this task that are not CLOSED (null = 0)
                openIssueCount: d.openIssueCount ?? 0,
                comments: [],
                subtasks: [],
                subTask: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            setSelectedTask(mappedTask);
            setTaskParam(d.taskId);
        } catch (err) {
            setTaskParam(null);
            showError(err, 'Failed to load task details');
        } finally {
            setIsDetailLoading(false);
        }
    };

    // reload / shared link: reopen the task named in the URL
    useEffect(() => {
        const id = searchParams.get('task');
        if (id && !selectedTask) openTaskDetailById(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Table/card se click hone par
    const handleTaskClick = (task: ReduxTask) => {
        openTaskDetailById(task.taskId);
    }
    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 border-b border-border bg-card/50 shrink-0">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 shrink-0 relative"
                    onClick={() => setFilterOpen(true)}
                    title={activeFilters ? `Filters (${activeFilters} applied)` : 'Filters'}
                >
                    <Filter className="h-3.5 w-3.5" />
                    {activeFilters > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                            {activeFilters}
                        </span>
                    )}
                </Button>

                {(
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-8 h-7 text-xs"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                                <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                )}

                {activeFilters > 0 && (
                    <button onClick={filters.reset} className="text-xs font-semibold text-primary hover:underline">
                        Clear filters
                    </button>
                )}

                <div className="flex-1" />

                <div className="flex items-center gap-2"> 
                    <div className="inline-flex rounded-md border border-border bg-card ">
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn('h-8 px-3  rounded-l-md text-xs font-medium inline-flex items-center gap-1.5',
                                viewMode === 'table' ? 'bg-primary/60 text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                        >
                            <LayoutList className="h-3.5 w-3.5" /> List
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={cn('h-8 px-3 text-xs font-medium inline-flex items-center gap-1.5 border-x border-border',
                                viewMode === 'board' ? 'bg-primary/60 text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                        >
                            <Columns3 className="h-3.5 w-3.5" /> Board
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={cn('h-8 px-3 rounded-r-md text-xs font-medium inline-flex items-center gap-1.5',
                                viewMode === 'cards' ? 'bg-primary/60 text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                        >
                            <LayoutGrid className="h-3.5 w-3.5" /> Grid
                        </button>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 bg-primary/70 text-primary-foreground hover:bg-primary/90" onClick={openCreateList}>
                        <FolderPlus size={12} /> New List
                    </Button>
                </div>
            </div>

            <div className={cn('p-3 flex-1 min-h-0', viewMode === 'cards' ? 'overflow-y-auto' : 'overflow-hidden')}>
                {viewMode === 'board' ? (
                    <TaskBoard
                        tasks={boardTasks}
                        onStatusChange={(t, st) => handleUpdateTask({ taskId: Number(t.taskId), taskStatus: st } as ReduxTask)}
                        onOpen={(t) => handleTaskClick({ taskId: Number(t.taskId) } as ReduxTask)}
                    />
                ) : viewMode === 'table' && isFiltering && visibleLists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <CheckSquare className="h-10 w-10 mb-2 opacity-30" />
                        <p className="text-sm">No tasks match your search or filters</p>
                    </div>
                ) : viewMode === 'table' ? (
                    <TaskTabTable
                        storageKey={`rkt.taskTree.${projectId}`}
                        lists={visibleLists}
                        forceExpand={isFiltering}
                        users={users}
                        projectId={projectId}
                        onAddTaskList={handleAddTaskList}
                        onUpdateTaskList={handleUpdateTaskList}
                        onDeleteTaskList={handleDeleteTaskList}
                        onAddTask={handleAddTask}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                        onReorderTaskLists={handleReorderTaskLists}
                        onReorderTasks={handleReorderTasks}
                        onMoveTask={handleMoveTask}
                        onEditList={openEditList}
                        onAddTaskListAbove={handleAddTaskListAbove}
                        onAddTaskListBelow={handleAddTaskListBelow}
                        onAddTaskAtPosition={openPositionAddTask}
                        onEditTask={openEditTask}
                        onSimpleAddTask={openSimpleAddTask}
                        onTaskClick={handleTaskClick}
                    />
                ) : filteredTasksForCards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <CheckSquare className="h-10 w-10 mb-2 opacity-30" />
                        <p className="text-sm">No tasks found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTasksForCards.map(task => (
                            <TaskCard key={task.taskId} task={task} users={users} onClick={() => handleTaskClick(task as ReduxTask)} />
                        ))}
                    </div>
                )}
            </div>

            <ProjectsFilterDrawer
                open={filterOpen}
                onOpenChange={setFilterOpen}
                fields={filterFields}
                value={filters.values}
                onApply={filters.setValues}
                onReset={filters.reset}
                title="Filter Tasks"
            />

            <TaskListFormModal
                open={isListModalOpen}
                onOpenChange={open => { setIsListModalOpen(open); if (!open) { setEditingList(null); setListName(''); } }}
                editing={editingList}
                name={listName}
                onNameChange={setListName}
                onSave={saveList}
                projectId={projectId}
            />

            <TaskFormModal
                open={isTaskModalOpen}
                onOpenChange={(open) => {
                    setIsTaskModalOpen(open);
                    if (!open) {
                        setEditingTask(null);
                        setTaskModalMode('simple');
                        setPositionData({ referenceTaskId: null, isAbove: false });
                    }
                }}
                editing={editingTask}
                parentTaskId={taskParentId}
                taskListId={taskListIdForModal}
                sortedLists={lists}
                insertOptions={insertOptions}
                form={taskForm}
                onFormChange={setTaskForm}
                onSave={saveTask}
                tasks={allTasksFlat}
                mode={taskModalMode}
                isAbove={positionData.isAbove}
                referenceTaskId={positionData.referenceTaskId}
            />

            {selectedTask && project && (
                <TaskDetailPanel
                    task={selectedTask}
                    users={users}
                    project={project}
                    onClose={() => { setSelectedTask(null); setTaskParam(null); }}
                    onChanged={refreshTree}
                    onSelectTask={(taskId) => {
                        openTaskDetailById(taskId);
                    }}
                    onUpdate={(updatedTask) => {
                        dispatch(updateTask({
                            taskId: Number(updatedTask.taskId),
                            taskTitle: updatedTask.taskTitle,
                            taskDescription: updatedTask.taskDescription || '',
                            taskStatus: updatedTask.taskStatus,
                            taskSequence: updatedTask.taskSequence || 0,
                            startDate: updatedTask.startDate || '',
                            endDate: updatedTask.endDate,
                            assigneeId: updatedTask.assigneeId || '',
                            taskPriority: priorityOf(updatedTask),
                            priority: priorityOf(updatedTask),
                        }));
                        setSelectedTask(updatedTask as any);
                    }}
                />
            )}
        </div>
    );
}