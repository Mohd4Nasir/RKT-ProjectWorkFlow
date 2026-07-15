// components/tasks/TaskFormModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReduxTask } from '@/store/slices/tasksSlice';
import { ReduxTaskList } from '@/store/slices/taskListsSlice';
import { cn } from '@/lib/utils';

interface TaskFormState {
  taskName: string;
  taskDescription: string;
  taskStartDate: string;
  taskEndDate: string;
  taskListId: string;
  insertAfterId: string;
}

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // null = create mode, Task = edit mode
  editing: ReduxTask | null;
  parentTaskId: string | null;
  taskListId: string;
  sortedLists: ReduxTaskList[];
  insertOptions: { value: string; label: string }[];
  form: TaskFormState;
  onFormChange: (form: TaskFormState) => void;
  onSave: () => void;
  tasks: ReduxTask[];
  // ── New props for position mode ──
  mode?: 'simple' | 'position';
  isAbove?: boolean;
  referenceTaskId?: string | null;
}

export function TaskFormModal({
  open,
  onOpenChange,
  editing,
  parentTaskId,
  taskListId,
  sortedLists,
  insertOptions,
  form,
  onFormChange,
  onSave,
  tasks,
  mode = 'simple',
  isAbove = false,
  referenceTaskId = null,
}: TaskFormModalProps) {
  const isSubtask = !!parentTaskId && mode === 'simple';
  const isEditing = !!editing;
  const isPositionMode = mode === 'position';

  // ── Get Modal Title ──────────────────────────────────────────────
  const getTitle = () => {
    if (isEditing) {
      return isSubtask ? 'Edit Subtask' : 'Edit Task';
    }
    
    if (isPositionMode) {
      return isAbove ? 'Add Task Above' : 'Add Task Below';
    }
    
    return isSubtask ? 'New Subtask' : 'New Task';
  };

  // ── Get Modal Description ────────────────────────────────────────
  const getDescription = () => {
    if (isEditing) {
      return 'Update task details';
    }
    
    if (isPositionMode) {
      const referenceTask = referenceTaskId 
        ? tasks.find(t => t.id === referenceTaskId)
        : null;
      
      return isAbove
        ? `Create a new task above "${referenceTask?.taskName || 'selected task'}"`
        : `Create a new task below "${referenceTask?.taskName || 'selected task'}"`;
    }
    
    return isSubtask ? 'Create a new subtask' : 'Create a new task in the selected list';
  };

  // ── Get Button Text ──────────────────────────────────────────────
  const getButtonText = () => {
    if (isEditing) return 'Save Changes';
    if (isPositionMode) {
      return isAbove ? 'Create Above' : 'Create Below';
    }
    return isSubtask ? 'Create Subtask' : 'Create Task';
  };

  // ── Get Button Color ─────────────────────────────────────────────
  const getButtonClass = () => {
    if (isEditing) return 'bg-[#E07B39] hover:bg-[#E07B39]/90 text-white';
    if (isPositionMode) {
      return isAbove 
        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
        : 'bg-green-600 hover:bg-green-700 text-white';
    }
    return 'bg-[#E07B39] hover:bg-[#E07B39]/90 text-white';
  };

  const parentTask = parentTaskId
    ? tasks.find(t => t.id === parentTaskId)
    : null;

  const referenceTask = referenceTaskId
    ? tasks.find(t => t.id === referenceTaskId)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {getDescription()}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* ── Position Info Banner ── */}
          {isPositionMode && referenceTask && (
            <div className={cn(
              'px-3 py-2 border rounded-lg text-sm',
              isAbove 
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-green-50 border-green-200 text-green-700'
            )}>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Position:</span>
                <span>
                  Task will be created <strong>{isAbove ? 'ABOVE' : 'BELOW'}</strong>{' '}
                  "{referenceTask.taskName}"
                </span>
              </div>
              {referenceTask.parentTaskId && (
                <div className="text-xs mt-1 opacity-75">
                  Parent: {tasks.find(t => t.id === referenceTask.parentTaskId)?.taskName || 'Unknown'}
                </div>
              )}
            </div>
          )}

          {/* ── Parent Task Info Banner (Subtask) ── */}
          {isSubtask && !isEditing && parentTask && (
            <div className="px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg text-xs text-purple-700">
              <span className="font-medium">Parent Task:</span>{' '}
              <span className="font-semibold">{parentTask.taskName}</span>
            </div>
          )}

          {/* ── Task Name ── */}
          <div className="space-y-1.5">
            <Label htmlFor="taskName">
              Task Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="taskName"
              placeholder="Enter task name..."
              autoFocus
              value={form.taskName}
              onChange={e =>
                onFormChange({ ...form, taskName: e.target.value })
              }
            />
          </div>

          {/* ── Description ── */}
          <div className="space-y-1.5">
            <Label htmlFor="taskDesc">Description</Label>
            <Textarea
              id="taskDesc"
              placeholder="Optional description..."
              rows={2}
              className="resize-none"
              value={form.taskDescription}
              onChange={e =>
                onFormChange({ ...form, taskDescription: e.target.value })
              }
            />
          </div>

          {/* ── Dates ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.taskStartDate}
                onChange={e =>
                  onFormChange({ ...form, taskStartDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={form.taskEndDate}
                onChange={e =>
                  onFormChange({ ...form, taskEndDate: e.target.value })
                }
              />
            </div>
          </div>

          {/* ── Task List Selector ── */}
          {/* Only for root tasks in simple create mode */}
          {!isSubtask && !isEditing && !isPositionMode && (
            <div className="space-y-1.5">
              <Label>
                Task List <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.taskListId}
                onValueChange={v =>
                  onFormChange({ ...form, taskListId: v, insertAfterId: 'end' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a list..." />
                </SelectTrigger>
                <SelectContent>
                  {sortedLists.map(tl => (
                    <SelectItem key={tl.id} value={tl.id}>
                      {tl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── For Position Mode - Show which list it will be added to ── */}
          {isPositionMode && (
            <div className="space-y-1.5">
              <Label>Task List</Label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700">
                {sortedLists.find(tl => tl.id === form.taskListId)?.name || 'Unknown List'}
              </div>
            </div>
          )}

          {/* ── Insert Position Selector ── */}
          {/* Only in create mode (not edit) and not position mode */}
          {/* {!isEditing && !isPositionMode && (
            <div className="space-y-1.5">
              <Label>Insert after</Label>
              <Select
                value={form.insertAfterId}
                onValueChange={v =>
                  onFormChange({ ...form, insertAfterId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {insertOptions.map(o => (
                    <SelectItem key={o.value || '__start__'} value={o.value || '__start__'}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )} */}

          {/* ── For Position Mode - Show reference info ── */}
          {isPositionMode && referenceTask && (
            <div className="text-xs text-muted-foreground border-t border-slate-200 pt-3 mt-1">
              <span className="font-medium">Reference Task ID:</span> {referenceTask.id}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className={getButtonClass()}
          >
            {getButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}