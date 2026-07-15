// components/tasks/TaskListFormModal.tsx
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
import { ReduxTaskList } from '@/store/slices/taskListsSlice';

interface TaskListFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: ReduxTaskList | null;
  name: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  projectId: string | number;
}

export function TaskListFormModal({
  open,
  onOpenChange,
  editing,
  name,
  onNameChange,
  onSave,
  projectId,
}: TaskListFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit Task List' : 'New Task List'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* <div className="space-y-1.5">
            <Label>Project</Label>
            <div className="px-3 py-2 bg-muted rounded-md text-xs font-mono text-muted-foreground">
              {String(projectId)}
            </div>
          </div> */}

          <div className="space-y-1.5">
            <Label htmlFor="listName">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="listName"
              placeholder="Task list name..."
              autoFocus
              value={name}
              onChange={e => onNameChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSave()}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
          variant="outline"
            onClick={onSave}
            className="bg-primary  text-primary-foreground"
          >
            {editing ? 'Save Changes' : 'Create List'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}