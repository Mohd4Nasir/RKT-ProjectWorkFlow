import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/types/ProejctsType';
import { RichTextEditor } from '@/components/richeditor';
import { Briefcase, Calendar, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { projectApiService } from '@/services/projectsApiService';
import { toast } from 'sonner';

const INK = 'hsl(var(--heading))';
const BORDER = 'hsl(var(--secondary))';

const fieldStyle = {
  border: `2px solid ${BORDER}`,
  background: 'hsl(var(--card))',
  color: INK,
  borderRadius: '12px',
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Project | null;
  /** Called after a successful create/update so the parent can refresh its list. */
  onSaved?: () => void | Promise<void>;
}

interface FormState {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: FormState = { name: '', description: '', startDate: '', endDate: '' };

const toDateInput = (v?: string) => v?.slice(0, 10) ?? '';

function DateField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-semibold" style={{ color: INK }}>
        <Calendar className="h-4 w-4" style={{ color: INK }} />
        {label}
      </Label>
      <Input
        type="date"
        value={toDateInput(value)}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 px-4 transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
        style={fieldStyle}
      />
    </div>
  );
}

export function ProjectDialog({ open, onOpenChange, editing, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Reset / prefill the form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            name: editing.projectTitle,
            description: editing.description,
            startDate: toDateInput(editing.startDate),
            endDate: toDateInput(editing.endDate),
          }
        : EMPTY_FORM,
    );
  }, [open, editing]);

  const valid = form.name.trim().length > 1;

  const handleSave = async () => {
    if (!valid || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const base = {
        projectTitle: form.name,
        projectDescription: form.description,
        startDate: toDateInput(form.startDate),
        endDate: toDateInput(form.endDate),
      };

      if (editing) {
        await projectApiService.updateProject({ projectId: editing.projectId, ...base });
        toast.success('Project updated successfully!');
      } else {
        await projectApiService.createProjectTask(base);
        toast.success('Project created successfully!');
      }

      // Refresh the list BEFORE closing so the change shows up right away.
      await onSaved?.();
      onOpenChange(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Save project error:', error);
      toast.error(
        error?.response?.data?.message || error?.message || 'Failed to save project.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const HeaderIcon = editing ? Briefcase : File;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden gap-0 max-h-[92vh] flex flex-col rounded-2xl border-none shadow-2xl">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6" style={{ background: 'hsl(var(--secondary))' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: 'hsl(var(--primary))' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-10" style={{ background: 'hsl(var(--accent))' }} />

          <div className="relative flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: 'hsl(var(--heading) / 0.1)' }}>
              <HeaderIcon className="h-7 w-7" style={{ color: INK }} />
            </div>
            <div className="flex-1">
              <DialogHeader className="space-y-1.5">
                <DialogTitle className="text-2xl font-bold tracking-tight" style={{ color: INK }}>
                  {editing ? 'Edit Project' : 'Create New Project'}
                </DialogTitle>
                <DialogDescription style={{ color: 'hsl(var(--heading) / 0.7)' }}>
                  {editing ? 'Update project information and settings' : 'Fill in the details to get started'}
                </DialogDescription>
              </DialogHeader>
            </div>
            <Badge
              className="px-3 py-1 text-xs font-medium border-0"
              style={{ background: 'hsl(var(--heading) / 0.08)', color: INK }}
            >
              {editing ? 'Edit Mode' : 'New'}
            </Badge>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 bg-card">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="p-name" className="text-sm font-semibold" style={{ color: INK }}>
              Project Name <span style={{ color: 'hsl(var(--primary))' }}>*</span>
            </Label>
            <div className="relative">
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Enter project name..."
                className="h-12 px-4 text-base transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                style={fieldStyle}
              />
              {form.name && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-[10px]" style={{ color: 'hsl(var(--accent-foreground))' }}>✓</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold" style={{ color: INK }}>Description</Label>
            <div className="overflow-hidden" style={fieldStyle}>
              <RichTextEditor
                value={form.description}
                onChange={(v) => set('description', v)}
                placeholder="Describe your project..."
                minHeight={140}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DateField label="Start Date" value={form.startDate} onChange={(v) => set('startDate', v)} />
            <DateField label="End Date" value={form.endDate} onChange={(v) => set('endDate', v)} />
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-8 py-5 border-t-2 flex items-center justify-end gap-3 bg-card"
          style={{ borderColor: BORDER }}
        >
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-xl px-6 font-medium transition-all duration-200 hover:bg-secondary"
            style={{ color: INK }}
          >
            Cancel
          </Button>
          <Button
            className={cn(
              'rounded-xl px-8 py-2.5 font-semibold shadow-md transition-all duration-200',
              valid && !isSubmitting && 'hover:scale-105 hover:shadow-lg',
              (!valid || isSubmitting) && 'opacity-50 cursor-not-allowed',
            )}
            style={{ background: valid ? 'hsl(var(--primary))' : BORDER, color: 'hsl(var(--primary-foreground))' }}
            onClick={handleSave}
            disabled={!valid || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : editing ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}