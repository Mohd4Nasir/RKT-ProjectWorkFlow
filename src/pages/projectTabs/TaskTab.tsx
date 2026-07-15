

// src/components/tabs/TasksTab.tsx
import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
    deleteTask,
    deleteTasksByTaskList,
    ReduxTask,
    reorderTasks,
    setTasks,
    updateTask,
} from '@/store/slices/tasksSlice';
import {
    deleteTaskList,
    ReduxTaskList,
    reorderTaskLists,
    setTaskLists,
    updateTaskList,
} from '@/store/slices/taskListsSlice';
import { projectApiService } from '@/services/projectsApiService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Search,
    X,
    Filter,
    LayoutList,
    LayoutGrid,
    FolderPlus,
    CheckSquare,
    Plus,
} from 'lucide-react';

import { TaskListFormModal } from '@/pages/task/TaskListFormModal';
import { TaskDetailPanel } from '@/pages/task/TaskDetailsPanel';
import { TaskFormModal } from '@/pages/task/TaskFormModal';

import { mapStatusFromApi, ViewMode } from '@/utils/tasksTabUtils';
import { taskService } from '@/services/taskservice';
import { TaskTabTable } from '@/components/tabs/TaskTabtable';
import { TaskCard } from '@/components/tabs/TaskCard';
import { CreateTaskListRequest, CreateTaskRequest, Task, TaskList, SubTask } from '@/types/ProejctAndTask';

interface TasksTabProps {
    projectId: string;
}

export function TasksTab({ projectId }: TasksTabProps) {
    const dispatch = useAppDispatch();

    const taskLists = useAppSelector(state =>
        state.taskLists.items.filter(taskList => String(taskList.projectId) === String(projectId))
    );

    const tasks = useAppSelector(state =>
        state.tasks.items.filter(task => task.projectId === projectId)
    );

    const users = useAppSelector(state => state.users.items);
    const project = useAppSelector(state => state.projects.items.find(project => project.id === projectId));

    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [filter, setFilter] = useState<string>('all');
    const [search, setSearch] = useState<string>('');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // ── Task Modal State (single source of truth — TaskTabTable no longer owns its own) ──
    const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
    const [editingTask, setEditingTask] = useState<ReduxTask | null>(null);
    const [taskParentId, setTaskParentId] = useState<string | null>(null);
    const [taskListIdForModal, setTaskListIdForModal] = useState<string>('');
    const [taskModalMode, setTaskModalMode] = useState<'simple' | 'position'>('simple');
    const [positionData, setPositionData] = useState<{
        referenceTaskId: string | null;
        isAbove: boolean;
    }>({
        referenceTaskId: null,
        isAbove: false,
    });
    const [listPositionData, setListPositionData] = useState<{
        referenceListId: string | null;
        isAbove: boolean;
        mode: 'simple' | 'position';
    }>({
        referenceListId: null,
        isAbove: false,
        mode: 'simple',
    });
    // ── Task Form Data ──
    const [taskForm, setTaskForm] = useState({
        taskName: '',
        taskDescription: '',
        taskStartDate: '',
        taskEndDate: '',
        taskListId: '',
        insertAfterId: 'end',
    });

    // List modal state
    const [isListModalOpen, setIsListModalOpen] = useState<boolean>(false);
    const [editingList, setEditingList] = useState<ReduxTaskList | null>(null);
    const [listName, setListName] = useState<string>('');

    // ── Sort Lists ──
    const sortedLists = useMemo(
        () => [...taskLists].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        [taskLists]
    );

    // ── Insert Options for Modal ──
    const insertOptions = useMemo(() => {
        const siblings = taskParentId
            ? tasks.filter(t => t.parentTaskId === taskParentId)
            : taskForm.taskListId
                ? tasks.filter(t => t.taskListId === taskForm.taskListId && !t.parentTaskId)
                : [];

        const sortedSiblings = [...siblings].sort((a, b) => (a.order || 0) - (b.order || 0));

        return [
            { value: '__start__', label: '— At the beginning' },
            ...sortedSiblings.map(t => ({ value: t.id, label: t.taskName || t.title || 'Unnamed' })),
            { value: 'end', label: '— At the end' },
        ];
    }, [taskParentId, taskForm.taskListId, tasks]);

    // Fetch project with tasks
    const fetchProjectWithTasks = async (): Promise<void> => {
        if (!projectId) {
            return;
        }

        try {
            setIsLoading(true);
            toast.loading('Loading project...');

            const response = await projectApiService.getProjectById(projectId);
             console.log('Fetched project with tasks:', response.data);
            const { projectId: projectIdFromResponse, lists } = response.data;

            // Map Task Lists (API shape → Redux shape)
            const mappedTaskLists: ReduxTaskList[] = lists.map((list: TaskList) => ({
                id: String(list.listId),
                name: list.listTitle || 'Untitled List',
                projectId: String(projectIdFromResponse),
                order: list.sequence || 0,
                createdAt: new Date().toISOString(),
            }));
            dispatch(setTaskLists(mappedTaskLists));

            // Map Tasks + SubTasks flat into Redux
            const flatTasks: ReduxTask[] = [];

            lists.forEach((list: TaskList) => {
                (list.tasks || []).forEach((task: Task) => {
                    // Root task
                    flatTasks.push({
                        id: String(task.taskId),
                        taskListId: String(list.listId),
                        projectId: String(projectIdFromResponse),
                        parentTaskId: null,
                        taskName: task.taskTitle,
                        title: task.taskTitle,
                        description: task.taskDescription || '',
                        taskDescription: task.taskDescription || '',
                        status: mapStatusFromApi(task.taskStatus),
                        order: task.taskSequence || 0,
                        taskStartDate: task.startDate ?? '',
                        taskEndDate: task.endDate ?? '',
                        dueDate: task.endDate ?? '',
                        assigneeId: task.assigneeId || '',
                        priority: task.priority || 'medium',
                        createdAt: new Date().toISOString(),
                    });

                    // SubTasks — parentTaskId = the task above
                    (task.subTask || []).forEach((subTask: SubTask) => {
                        flatTasks.push({
                            id: String(subTask.taskId),
                            taskListId: String(list.listId),
                            projectId: String(projectIdFromResponse),
                            parentTaskId: String(task.taskId),
                            taskName: subTask.taskTitle,
                            title: subTask.taskTitle,
                            description: subTask.taskDescription || '',
                            taskDescription: subTask.taskDescription || '',
                            status: mapStatusFromApi(subTask.taskStatus),
                            order: subTask.taskSequence || 0,
                            taskStartDate: subTask.startDate ?? '',
                            taskEndDate: subTask.endDate ?? '',
                            dueDate: subTask.endDate ?? '',
                            assigneeId: subTask.assigneeId || '',
                            priority: subTask.priority || 'medium',
                            createdAt: new Date().toISOString(),
                        });
                    });
                });
            });

            dispatch(setTasks(flatTasks));
            toast.dismiss();
            toast.success('Project loaded');
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error('Failed to load project');
        } finally {
            setIsLoading(false);
        }
    };

    // Call on mount and when ID changes
    useEffect(() => {
        fetchProjectWithTasks();
    }, [projectId]);

    // ── Add Task List Above ────────────────────────────────────────────────────
    const handleAddTaskListAbove = async (referenceListId: string): Promise<void> => {
        openCreateListAbove(referenceListId);

    };
    //open task Detail panel
    // Add this after your existing state and functions
    // ── Handle Task Click to Open Detail Panel ──
    const handleTaskClick = (task: ReduxTask) => {
        // Map ReduxTask to Task type expected by TaskDetailPanel
        const mappedTask: Task = {
            id: task.id,
            taskId: task.id,
            taskTitle: task.taskName || task.title || '',
            title: task.taskName || task.title || '',
            description: task.taskDescription || task.description || '',
            taskDescription: task.taskDescription || task.description || '',
            status: task.status || 'todo',
            taskStatus: task.status || 'todo',
            priority: task.priority || 'medium',
            assigneeId: task.assigneeId || '',
            taskStartDate: task.taskStartDate || '',
            taskEndDate: task.taskEndDate || task.dueDate || '',
            startDate: task.taskStartDate || '',
            endDate: task.taskEndDate || task.dueDate || '',
            dueDate: task.taskEndDate || task.dueDate || '',
            order: task.order || 0,
            taskSequence: task.order || 0,
            taskListId: task.taskListId,
            projectId: task.projectId,
            parentTaskId: task.parentTaskId,
            comments: task.comments || [],
            subtasks: task.subtasks || [],
            subTask: task.subtasks || [],
            createdBy: task.createdBy || '',
            createdAt: task.createdAt || new Date().toISOString(),
            updatedAt: task.updatedAt || new Date().toISOString(),
        };

        setSelectedTask(mappedTask);
    };

    // ── Add Task List Below ────────────────────────────────────────────────────
    const handleAddTaskListBelow = async (referenceListId: string): Promise<void> => {
        openCreateListBelow(referenceListId);


    };
    // TasksTab.tsx - openCreateListAbove
    const openCreateListAbove = (referenceListId: string): void => {
        const referenceList = taskLists.find(taskList => taskList.id === referenceListId);
        if (!referenceList) {
            toast.error('Reference list not found');
            return;
        }

        // Set modal state
        setListName(''); // Empty by default
        setEditingList(null);
        setListPositionData({
            referenceListId,
            isAbove: true,
            mode: 'position',
        });
        setIsListModalOpen(true); // ← Modal opens
    };

    // Same for Below
    const openCreateListBelow = (referenceListId: string): void => {
        const referenceList = taskLists.find(taskList => taskList.id === referenceListId);
        if (!referenceList) {
            toast.error('Reference list not found');
            return;
        }

        setListName('');
        setEditingList(null);
        setListPositionData({
            referenceListId,
            isAbove: false,
            mode: 'position',
        });
        setIsListModalOpen(true); // ← Modal opens
    };
    // ── Open Simple Add Task (used by toolbar "Add Task" + list "+" + "Add Subtask") ──
    const openSimpleAddTask = (taskListId?: string, parentTaskId?: string | null) => {
        const defaultListId = taskListId || sortedLists[0]?.id || '';

        setEditingTask(null);
        setTaskParentId(parentTaskId || null);
        setTaskListIdForModal(defaultListId);
        setTaskModalMode('simple');
        setPositionData({ referenceTaskId: null, isAbove: false });
        setTaskForm({
            taskName: '',
            taskDescription: '',
            taskStartDate: '',
            taskEndDate: '',
            taskListId: defaultListId,
            insertAfterId: 'end',
        });
        setIsTaskModalOpen(true);
    };

    // ── Open Position Add Task (Above/Below — used by the three-dot context menu) ──
    const openPositionAddTask = (
        referenceTaskId: string,
        isAbove: boolean,
        listId: string,
        parentTaskId: string | null
    ) => {
        setEditingTask(null);
        setTaskParentId(parentTaskId);
        setTaskListIdForModal(listId);
        setTaskModalMode('position');
        setPositionData({ referenceTaskId, isAbove });
        setTaskForm({
            taskName: 'New Task',
            taskDescription: '',
            taskStartDate: '',
            taskEndDate: '',
            taskListId: listId,
            insertAfterId: 'end',
        });
        setIsTaskModalOpen(true);
    };

    // ── Open Edit Task ──
    const openEditTask = (task: ReduxTask) => {
        setEditingTask(task);
        setTaskParentId(task.parentTaskId);
        setTaskListIdForModal(task.taskListId);
        setTaskModalMode('simple');
        setPositionData({ referenceTaskId: null, isAbove: false });
        setTaskForm({
            taskName: task.taskName || task.title || '',
            taskDescription: task.taskDescription || task.description || '',
            taskStartDate: task.taskStartDate || '',
            taskEndDate: task.taskEndDate || task.dueDate || '',
            taskListId: task.taskListId,
            insertAfterId: 'end',
        });
        setIsTaskModalOpen(true);
    };

    // ── Save Task (handles edit / position / simple-create, all in one place) ──
    const saveTask = async (): Promise<void> => {
        if (!taskForm.taskName.trim()) {
            toast.error('Enter a task name');
            return;
        }

        // ── EDIT MODE ──
        if (editingTask) {
            try {
                await taskService.updateTask(editingTask.id, {
                    taskTitle: taskForm.taskName.trim(),
                    taskDescription: taskForm.taskDescription,
                    taskStartDate: taskForm.taskStartDate,
                    taskEndDate: taskForm.taskEndDate,
                });

                dispatch(updateTask({
                    ...editingTask,
                    taskName: taskForm.taskName.trim(),
                    title: taskForm.taskName.trim(),
                    taskDescription: taskForm.taskDescription,
                    description: taskForm.taskDescription,
                    taskStartDate: taskForm.taskStartDate,
                    taskEndDate: taskForm.taskEndDate,
                    dueDate: taskForm.taskEndDate,
                }));

                toast.success('Task updated successfully');
                setIsTaskModalOpen(false);
                return;
            } catch {
                toast.error('Failed to update task');
                return;
            }
        }

        // ── POSITION MODE (Add Above / Add Below from three-dot menu) ──
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
            } catch {
                toast.dismiss(loadingToast);
                toast.error('Failed to create task');
            }
            return;
        }

        // ── SIMPLE MODE (toolbar Add Task / list-row + / Add Subtask) ──
        const loadingToast = toast.loading('Creating task...');
        try {
            await taskService.createTask({
                projectId,
                taskListId: taskForm.taskListId,
                parentTaskId: taskParentId || null,
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
        } catch {
            toast.dismiss(loadingToast);
            toast.error('Failed to create task');
        }
    };

    // save task lIst
    // TasksTab.tsx - saveList
    // ── Save List (Handles Simple Create, Edit, and Position Create) ──
    const saveList = async (): Promise<void> => {
        if (!listName.trim()) {
            toast.error('Enter a list name');
            return;
        }

        const loadingToast = toast.loading(
            editingList ? 'Updating list...' : 'Creating list...'
        );

        try {
            // ── EDIT MODE ──
            if (editingList) {
                await taskService.updateTaskList(editingList.id, {
                    listTitle: listName.trim(),
                    sequence: editingList.order || 0,
                });
                dispatch(updateTaskList({ ...editingList, name: listName.trim() }));
                toast.dismiss(loadingToast);
                toast.success('List updated successfully');
                setIsListModalOpen(false);
                setEditingList(null);
                setListName('');
                return;
            }

            // ── POSITION MODE (Create Above/Below) ──
            if (listPositionData.mode === 'position' && listPositionData.referenceListId) {
                const referenceList = taskLists.find(tl => tl.id === listPositionData.referenceListId);
                if (!referenceList) {
                    toast.dismiss(loadingToast);
                    toast.error('Reference list not found');
                    return;
                }

                // 🔥 API CALL - Create list at position
                const response = await taskService.createTaskListAtPosition({
                    refListId: Number(listPositionData.referenceListId),
                    listTitle: listName.trim(),
                    isAbove: listPositionData.isAbove,
                });

                // Refetch to get updated data with correct order
                await fetchProjectWithTasks();

                toast.dismiss(loadingToast);
                toast.success(
                    listPositionData.isAbove
                        ? `✅ "${listName.trim()}" created above "${referenceList.name}"`
                        : `✅ "${listName.trim()}" created below "${referenceList.name}"`
                );
                setIsListModalOpen(false);
                setListPositionData({
                    referenceListId: null,
                    isAbove: false,
                    mode: 'simple',
                });
                setListName('');
                return;
            }

            // ── SIMPLE CREATE MODE ──
            const response = await taskService.createTaskList({
                projectId,
                listTitle: listName.trim(),
            });

            await fetchProjectWithTasks();

            toast.dismiss(loadingToast);
            toast.success(`✅ "${listName.trim()}" created successfully`);
            setIsListModalOpen(false);
            setListName('');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.dismiss(loadingToast);
            console.error('Error saving list:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save list';
            toast.error(`❌ ${errorMessage}`);
        }
    };

    const filteredTasks = useMemo(() => {
        let result = tasks;

        if (filter !== 'all') {
            result = result.filter(task => task.status === filter);
        }

        if (search) {
            result = result.filter(task =>
                task.title?.toLowerCase().includes(search.toLowerCase()) ||
                task.description?.toLowerCase().includes(search.toLowerCase())
            );
        }

        return result;
    }, [tasks, filter, search]);

    // List modal handlers
    const openCreateList = (): void => {
        setListName('');
        setEditingList(null);
        setListPositionData({
            referenceListId: null,
            isAbove: false,
            mode: 'simple',
        });
        setIsListModalOpen(true);
    };

    const openEditList = (taskList: ReduxTaskList): void => {
        setListName(taskList.name);
        setEditingList(taskList);
        setIsListModalOpen(true);
    };

    // const saveList = async (): Promise<void> => {
    //     if (!listName.trim()) {
    //         toast.error('Enter a list name');
    //         return;
    //     }

    //     try {
    //         if (editingList) {
    //             await taskService.updateTaskList(editingList.id, {
    //                 listTitle: listName.trim(),
    //                 sequence: editingList.order || 0,
    //             });
    //             dispatch(updateTaskList({ ...editingList, name: listName.trim() }));
    //             toast.success('List updated');
    //         } else {
    //             await taskService.createTaskList({
    //                 projectId,
    //                 listTitle: listName.trim(),
    //             });
    //             await fetchProjectWithTasks();
    //             toast.success('List created');
    //         }
    //         setIsListModalOpen(false);
    //         setEditingList(null);
    //         setListName('');
    //     } catch {
    //         toast.error('Failed to save list');
    //     }
    // };

    // Task List handlers (passed down to TaskTabTable)
    const handleAddTaskList = async (data: CreateTaskListRequest): Promise<void> => {
        try {
            await taskService.createTaskList({
                projectId: data.projectId,
                listTitle: data.name,
            });
            await fetchProjectWithTasks();
            toast.success('List created');
        } catch {
            toast.error('Failed to create list');
            throw new Error();
        }
    };

    const handleUpdateTaskList = async (taskList: ReduxTaskList): Promise<void> => {
        try {
            await taskService.updateTaskList(taskList.id, {
                listTitle: taskList.name,
                sequence: taskList.order || 0,
            });
            dispatch(updateTaskList(taskList));
            toast.success('List updated');
        } catch {
            toast.error('Failed to update list');
            throw new Error();
        }
    };

    const handleDeleteTaskList = async (listId: string): Promise<void> => {
        try {
            await taskService.deleteTaskList(listId);
            dispatch(deleteTaskList(listId));
            dispatch(deleteTasksByTaskList(listId));
            toast.success('List deleted');
        } catch {
            toast.error('Failed to delete list');
            throw new Error();
        }
    };

    // Task handlers (passed down to TaskTabTable — no longer used for create, kept for delete/update)
    const handleAddTask = async (data: CreateTaskRequest & { insertAfterId?: string | null }): Promise<void> => {
        try {
            await taskService.createTask({
                projectId,
                taskListId: data.taskListId,
                parentTaskId: data.parentTaskId || null,
                taskTitle: data.taskName,
                taskDescription: data.taskDescription || '',
                taskStartDate: data.taskStartDate || '',
                taskEndDate: data.taskEndDate || '',
                taskStatus: 'TODO',
                insertAfterId: data.insertAfterId ?? null,
            });
            await fetchProjectWithTasks();
            toast.success('Task created');
        } catch {
            toast.error('Failed to create task');
            throw new Error();
        }
    };

    const handleUpdateTask = async (task: ReduxTask): Promise<void> => {
        try {
            await taskService.updateTask(task.id, {
                taskTitle: task.taskName || task.title,
                taskStatus: task.status,
                taskDescription: task.taskDescription || task.description,
                taskStartDate: task.taskStartDate,
                taskEndDate: task.taskEndDate || task.dueDate,
                priority: task.priority,
            });
            dispatch(updateTask(task));
            toast.success('Task updated');
        } catch {
            toast.error('Failed to update task');
            throw new Error();
        }
    };

    const handleDeleteTask = async (taskId: string): Promise<void> => {
        try {
            await taskService.deleteTask(taskId);
            dispatch(deleteTask(taskId));
            toast.success('Task deleted');
        } catch {
            toast.error('Failed to delete task');
            throw new Error();
        }
    };

    const handleReorderTaskLists = async (orderedIds: string[]): Promise<void> => {
        try {
            for (const [index, id] of orderedIds.entries()) {
                await taskService.updateTaskList(id, { sequence: index });
            }
            dispatch(reorderTaskLists({ projectId, orderedIds }));
            toast.success('Lists reordered');
        } catch {
            toast.error('Failed to reorder lists');
            throw new Error();
        }
    };

    const handleReorderTasks = async (
        listId: string,
        parentTaskId: string | null,
        orderedIds: string[]
    ): Promise<void> => {
        try {
            for (const [index, id] of orderedIds.entries()) {
                await taskService.updateTask(id, { sequence: index });
            }
            dispatch(reorderTasks({ taskListId: listId, parentTaskId, orderedIds }));
            toast.success('Tasks reordered');
        } catch {
            toast.error('Failed to reorder tasks');
            throw new Error();
        }
    };

    return (
        <div className="flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/50">
                <div className="flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="h-7 w-[130px] text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Tasks</SelectItem>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {viewMode === 'table' && (
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            className="pl-8 h-7 text-xs"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2"
                            >
                                <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                )}

                <div className="flex-1" />

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border rounded-lg p-0.5">
                        <Button
                            variant={viewMode === 'table' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                            className="h-7 px-2"
                        >
                            <LayoutList className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant={viewMode === 'cards' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('cards')}
                            className="h-7 px-2"
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 bg-primary "
                        onClick={openCreateList}
                    >
                        <FolderPlus size={12} /> New List
                    </Button>

                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {viewMode === 'table' ? (
                    <TaskTabTable
                        taskLists={taskLists}
                        tasks={tasks}
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
                        onEditList={openEditList}
                        onAddTaskListAbove={handleAddTaskListAbove}
                        onAddTaskListBelow={handleAddTaskListBelow}
                        onAddTaskAtPosition={openPositionAddTask}
                        onEditTask={openEditTask}
                        onSimpleAddTask={openSimpleAddTask}
                        onTaskClick={handleTaskClick} // 👈 ADD THIS

                    />
                ) : filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <CheckSquare className="h-10 w-10 mb-2 opacity-30" />
                        <p className="text-sm">No tasks found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                users={users}
                                onClick={() => setSelectedTask(task)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Task List Form Modal ── */}
            <TaskListFormModal
                open={isListModalOpen}
                onOpenChange={open => {
                    setIsListModalOpen(open);
                    if (!open) {
                        setEditingList(null);
                        setListName('');
                    }
                }}
                editing={editingList}
                name={listName}
                onNameChange={setListName}
                onSave={saveList}
                projectId={projectId}
            />

            {/* ── Task Form Modal (single instance — handles create/edit/above/below) ── */}
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
                sortedLists={sortedLists}
                insertOptions={insertOptions}
                form={taskForm}
                onFormChange={setTaskForm}
                onSave={saveTask}
                tasks={tasks}
                mode={taskModalMode}
                isAbove={positionData.isAbove}
                referenceTaskId={positionData.referenceTaskId}
            />

            {/* ── Task Detail Panel ── */}
            {/* At the bottom of TasksTab */}
            {selectedTask && project && (
                <TaskDetailPanel
                    task={selectedTask}
                    users={users}
                    project={project}
                    onClose={() => setSelectedTask(null)} // Close panel
                    onUpdate={(updatedTask) => {
                        // Update task when changes are made in panel
                        const reduxTask: ReduxTask = {
                            id: updatedTask.id,
                            taskListId: updatedTask.taskListId,
                            projectId: updatedTask.projectId || projectId,
                            parentTaskId: updatedTask.parentTaskId || null,
                            taskName: updatedTask.taskTitle,
                            title: updatedTask.title,
                            description: updatedTask.description || '',
                            taskDescription: updatedTask.taskDescription || '',
                            status: updatedTask.status,
                            order: updatedTask.order || 0,
                            taskStartDate: updatedTask.taskStartDate || '',
                            taskEndDate: updatedTask.taskEndDate || updatedTask.dueDate || '',
                            dueDate: updatedTask.dueDate || '',
                            assigneeId: updatedTask.assigneeId || '',
                            priority: updatedTask.priority || 'medium',
                            comments: updatedTask.comments || [],
                            subtasks: updatedTask.subtasks || [],
                            createdAt: updatedTask.createdAt || new Date().toISOString(),
                            updatedAt: updatedTask.updatedAt || new Date().toISOString(),
                        };

                        dispatch(updateTask(reduxTask));
                        setSelectedTask(updatedTask);
                    }}
                />
            )}
        </div>
    );
}