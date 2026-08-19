
import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { projectApiService } from '@/services/projectsApiService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter, LayoutList, LayoutGrid, FolderPlus, CheckSquare } from 'lucide-react';

import { TaskListFormModal } from '@/pages/Task/TaskListFormModal';
import { TaskDetailPanel } from '@/pages/Task/TaskDetailsPanel';
import { TaskFormModal } from '@/pages/Task/TaskFormModal';

import { mapStatusFromApi, ViewMode } from '@/utils/tasksTabUtils';
import { taskService } from '@/services/taskservice';
import { TaskTabTable } from '@/pages/Task/TaskTabtable';
import { TaskCard } from '@/pages/Task/TaskCard';
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

interface TasksTabProps {
    projectId: string;
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

export function TasksTab({ projectId }: TasksTabProps) {
    const dispatch = useAppDispatch();

    // ✅ Ek hi source of truth — pura tree, AS-IS (no sort/filter here)
    const lists = useAppSelector(state => state.tasks.lists || []);
    console.log('TaskTab lists from Redux:', lists);
    const users = useAppSelector(state => state.users?.items || []);
    const project = useAppSelector(state => state.projects?.items?.find(p => p.id === projectId) || null);

    // Sirf card-view/search/insertOptions ke liye flatten — table render iska use nahi karta
    const allTasksFlat = useMemo(() => flattenTree(lists), [lists]);

    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [filter, setFilter] = useState<string>('all');
    const [search, setSearch] = useState<string>('');
    const [selectedTask, setSelectedTask] = useState<ReduxTask | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

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
            toast.error('Failed to load project');
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
        if (!referenceList) { toast.error('Reference list not found'); return; }
        setListName('');
        setEditingList(null);
        setListPositionData({ referenceListId, isAbove: true, mode: 'position' });
        setIsListModalOpen(true);
    };

    const openCreateListBelow = (referenceListId: string): void => {
        const referenceList = lists.find(tl => String(tl.listId) === referenceListId);
        if (!referenceList) { toast.error('Reference list not found'); return; }
        setListName('');
        setEditingList(null);
        setListPositionData({ referenceListId, isAbove: false, mode: 'position' });
        setIsListModalOpen(true);
    };

    const openSimpleAddTask = (taskListId?: string, parentTaskId?: string | null) => {
        const defaultListId = taskListId || String(sortedLists[0]?.listId || '');
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
        if (!taskForm.taskName.trim()) { toast.error('Enter a task name'); return; }

        if (editingTask) {
            try {
                await taskService.updateTask(String(editingTask.taskId), {
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
            } catch {
                toast.error('Failed to update task');
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
            } catch {
                toast.dismiss(loadingToast);
                toast.error('Failed to create task');
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
        } catch {
            toast.dismiss(loadingToast);
            toast.error('Failed to create task');
        }
    };

    const saveList = async (): Promise<void> => {
        if (!listName.trim()) { toast.error('Enter a list name'); return; }
        const loadingToast = toast.loading(editingList ? 'Updating list...' : 'Creating list...');

        try {
            if (editingList) {
                await taskService.updateTaskList(String(editingList.listId), {
                    listTitle: listName.trim(),
                    sequence: editingList.sequence || 0,
                });
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
                    toast.error('Reference list not found');
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
        } catch (error: any) {
            toast.dismiss(loadingToast);
            console.error('Error saving list:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save list';
            toast.error(`❌ ${errorMessage}`);
        }
    };

    // ✅ Sirf card-view ke liye filter — table tree isse untouched hai
    const filteredTasksForCards = useMemo(() => {
        let result = allTasksFlat;
        if (filter !== 'all') result = result.filter(t => mapStatusFromApi(t.taskStatus) === filter);
        if (search) {
            result = result.filter(t =>
                t.taskTitle?.toLowerCase().includes(search.toLowerCase()) ||
                t.taskDescription?.toLowerCase().includes(search.toLowerCase())
            );
        }
        return result;
    }, [allTasksFlat, filter, search]);

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
        } catch {
            toast.error('Failed to create list');
            throw new Error();
        }
    };

    const handleUpdateTaskList = async (taskList: ReduxTaskList): Promise<void> => {
        try {
            await taskService.updateTaskList(String(taskList.listId), {
                listTitle: taskList.listTitle,
                sequence: taskList.sequence || 0,
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
            toast.success('List deleted');
        } catch {
            toast.error('Failed to delete list');
            throw new Error();
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
        } catch {
            toast.error('Failed to create task');
            throw new Error();
        }
    };

    const handleUpdateTask = async (task: ReduxTask): Promise<void> => {
        try {
            await taskService.updateTask(String(task.taskId), {
                taskTitle: task.taskTitle,
                taskStatus: task.taskStatus,
                taskDescription: task.taskDescription || '',
                taskStartDate: task.startDate || '',
                taskEndDate: task.endDate || '',
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
        listId: string, parentTaskId: string | null, orderedIds: string[]
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
                priority: d.priority || 'medium',
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
                comments: [],
                subtasks: [],
                subTask: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            setSelectedTask(mappedTask);
        } catch {
            toast.error('Failed to load task details');
        } finally {
            setIsDetailLoading(false);
        }
    };

    // Table/card se click hone par
    const handleTaskClick = (task: ReduxTask) => {
        openTaskDetailById(task.taskId);
    }
    return (
        <div className="flex flex-col">
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/50">
                <div className="flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="h-7 w-[130px] text-xs"><SelectValue /></SelectTrigger>
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

            <div className="p-4">
                {viewMode === 'table' ? (
                    <TaskTabTable
                        lists={lists}
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
                    onClose={() => setSelectedTask(null)}
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
                            priority: updatedTask.priority || 'medium',
                        }));
                        setSelectedTask(updatedTask as any);
                    }}
                />
            )}
        </div>
    );
}