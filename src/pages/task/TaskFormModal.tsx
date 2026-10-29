// components/tasks/TaskFormModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { cn } from '@/lib/utils';
import { SubTaskNode, TaskListNode } from '@/types/taskTypes';
import { Badge, Briefcase, File } from 'lucide-react';

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

  editing: SubTaskNode | null;

  parentTaskId: string | null;
  taskListId: string;

  sortedLists: TaskListNode[];

  insertOptions: {
    value: string;
    label: string;
  }[];

  form: TaskFormState;

  onFormChange: (form: TaskFormState) => void;

  onSave: () => void;

  tasks: SubTaskNode[];

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
        ? tasks.find(t => String(t.taskId) === referenceTaskId)
        : null;

      return isAbove
        ? `Create a new task above "${referenceTask?.taskTitle || 'selected task'}"`
        : `Create a new task below "${referenceTask?.taskTitle || 'selected task'}"`;
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
    if (isEditing) return 'bg-brand-cta hover:bg-brand-cta/90 text-white';
    if (isPositionMode) {
      return isAbove
        ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : 'bg-green-600 hover:bg-green-700 text-white';
    }
    return 'bg-brand-cta hover:bg-brand-cta/90 text-white';
  };

  const parentTask = parentTaskId
    ? tasks.find(t => String(t.taskId) === parentTaskId)
    : null;

  const referenceTask = referenceTaskId
    ? tasks.find(t => String(t.taskId) === referenceTaskId)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0 max-h-[92vh] flex flex-col rounded-2xl border-none shadow-2xl">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6" style={{ background: 'hsl(var(--secondary))' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: 'hsl(var(--primary))' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-10" style={{ background: 'hsl(var(--accent))' }} />

          <div className="relative flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0, 24, 88, 0.1)' }}>
              {editing ? (
                <Briefcase className="h-7 w-7" style={{ color: 'hsl(var(--heading))' }} />
              ) : (
                <File className="h-7 w-7" style={{ color: 'hsl(var(--heading))' }} />
              )}
            </div>
            <div className="flex-1">
              <DialogHeader className="space-y-1.5">
                <DialogTitle className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--heading))' }}>
                  {getTitle()}
                </DialogTitle>
                <DialogDescription style={{ color: 'rgba(0, 24, 88, 0.7)' }}>
                  {getDescription()}
                </DialogDescription>
              </DialogHeader>
            </div>

          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto px-8 py-6 space-y-6"
          style={{ background: "hsl(var(--card))" }}
        >          {/* ── Position Info Banner ── */}
          {isPositionMode && referenceTask && (
            <div className={cn(
              'px-3 py-2 border rounded-lg text-sm',
              isAbove
                ? 'bg-blue-50 border-blue-200 text-info'
                : 'bg-green-50 border-green-200 text-success'
            )}>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Position:</span>
                <span>
                  Task will be created <strong>{isAbove ? 'ABOVE' : 'BELOW'}</strong>{' '}
                  "{referenceTask.taskTitle}"
                </span>
              </div>
              {referenceTask.parentTaskId && (
                <div className="text-xs mt-1 opacity-75">
                  Parent: {tasks.find(t => t.taskId === referenceTask.parentTaskId)?.taskTitle || 'Unknown'}
                </div>
              )}
            </div>
          )}

          {/* ── Parent Task Info Banner (Subtask) ── */}
          {isSubtask && !isEditing && parentTask && (
            <div className="px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg text-xs text-primary">
              <span className="font-medium">Parent Task:</span>{' '}
              <span className="font-semibold">{parentTask.taskTitle}</span>
            </div>
          )}

          {/* ── Task Name ── */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-heading">
              Task Name <span className="text-danger">*</span>
            </Label>
            <Input
              id="taskName"
              placeholder="Enter task name..."
              autoFocus
              value={form.taskName}
              className="h-12 px-4 text-base transition-all  text-heading duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{
                border: '2px solid #f3d2c1',
                background: 'hsl(var(--card))',
                color: 'hsl(var(--heading))',
                borderRadius: '12px'
              }}
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
              style={{
                border: '2px solid #f3d2c1',
                background: 'hsl(var(--card))',
                color: 'hsl(var(--heading))',
                borderRadius: '12px'
              }}
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
                style={{
                  border: '2px solid #f3d2c1',
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--heading))',
                  borderRadius: '12px'
                }}
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
                style={{
                  border: '2px solid #f3d2c1',
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--heading))',
                  borderRadius: '12px'
                }}
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
                Task List <span className="text-danger">*</span>
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
                  {sortedLists.map((tl) => (
                    <SelectItem
                      key={String(tl.listId)}
                      value={String(tl.listId)}
                    >
                      {tl.listTitle}
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
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-heading">
                {sortedLists.find(tl => String(tl.listId) === form.taskListId)?.listTitle || 'Unknown List'}
              </div>
            </div>
          )}



          {/* ── For Position Mode - Show reference info ── */}
          {isPositionMode && referenceTask && (
            <div className="text-xs text-muted-foreground border-t border-slate-200 pt-3 mt-1">
              <span className="font-medium">Reference Task ID:</span> {referenceTask.taskId}
            </div>
          )}
        </div>

        <DialogFooter
          className="px-8 py-5 border-t-2 flex items-center justify-end gap-3"
          style={{
            borderColor: "hsl(var(--secondary))",
            background: "hsl(var(--card))",
          }}
        >          <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
          className="rounded-xl px-6 h-11 font-medium transition-all duration-200 hover:bg-secondary"
          style={{ color: "hsl(var(--heading))" }}
        >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className="
        rounded-xl
        h-11
        px-8
        font-semibold
        shadow-md
        transition-all
        duration-200
        hover:scale-105
        hover:shadow-lg
    "
            style={{
              background: "#EEBBC3",
              color: "hsl(var(--heading))",
            }}
          >
            {getButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}