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
import { Briefcase, File } from 'lucide-react';
import { SubTaskNode } from '@/types/taskTypes';

interface TaskListFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: SubTaskNode | null;
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
<DialogContent className="max-w-xl p-0 overflow-y-auto max-h-[94dvh] gap-0 rounded-2xl border-none shadow-2xl"> 
  
         <div
  className="relative px-8 pt-8 pb-6"
  style={{ background: 'var(--gradient-hero)' }}
>
  <div
    className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20"
    style={{ background: "hsl(337 78% 62%)" }}
  />
  <div
    className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-10"
    style={{ background: "#8bd3dd" }}
  />

  <div className="relative flex items-start gap-4">
    <div
      className="h-14 w-14 rounded-2xl flex items-center justify-center"
      style={{ background: "rgba(255,255,255,0.16)" }}
    >
      {editing ? (
        <Briefcase className="h-7 w-7 text-white" />
      ) : (
        <File className="h-7 w-7 text-white" />
      )}
    </div>

    <div className="flex-1">
      <DialogHeader className="space-y-1">
        <DialogTitle className="text-2xl font-bold text-white">
          {editing ? "Edit Task List" : "Create New Task List"}
        </DialogTitle>

        <p className="text-sm text-white/75">
          {editing
            ? "Update the task list information."
            : "Create a new list to organize your tasks."}
        </p>
      </DialogHeader>
    </div>
  </div>
</div>

<div
  className="px-8 py-6 space-y-6"
  style={{ background: 'hsl(var(--card))' }}
          >

          <div className="space-y-1.5">
           <Label
  htmlFor="listName"
  className="text-sm font-semibold text-foreground"
>
  Name <span className="text-[#f582ae]">*</span>
</Label>
           <Input
  id="listName"
  placeholder="Task list name..."
  autoFocus
  value={name}
  onChange={(e) => onNameChange(e.target.value)}
  onKeyDown={(e) => e.key === "Enter" && onSave()}
  className="h-12 rounded-xl px-4 text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
  style={{
    border: "1px solid hsl(var(--input))",
    background: 'hsl(var(--card))',
    borderRadius: "12px",
  }}
/>
          </div>
        </div>

<DialogFooter
  className="px-8 py-5 border-t-2 flex items-center justify-end gap-3"
  style={{
    borderColor: "hsl(var(--border))",
    background: 'hsl(var(--card))',
  }}
>          <Button
  variant="ghost"
  onClick={() => onOpenChange(false)}
  className="rounded-xl h-11 px-6 font-medium hover:bg-muted"
  style={{ color: 'hsl(var(--foreground))' }}
>
  Cancel
</Button>
         <Button
  onClick={onSave}
  className="rounded-xl h-11 px-8 font-semibold shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg"
  style={{
    background: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
  }}
>
  {editing ? "Save Changes" : "Create List"}
</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}