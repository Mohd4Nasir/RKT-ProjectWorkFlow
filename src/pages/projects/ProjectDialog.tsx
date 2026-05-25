import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Project } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Project | null;
  onSave: (form: any) => void;
}

export function ProjectDialog({ open, onOpenChange, editing, onSave }: Props) {
  const [form, setForm] = useState({ name: '', description: '', status: 'active', startDate: '', endDate: '', tag: '' });

  useEffect(() => {
    if (open) {
      setForm(editing
        ? { name: editing.name, description: editing.description, status: editing.status, startDate: editing.startDate, endDate: editing.endDate, tag: editing.tag }
        : { name: '', description: '', status: 'active', startDate: '', endDate: '', tag: '' });
    }
  }, [open, editing]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing ? 'Edit project' : 'Create new project'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Atlas Banking Portal" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this project about?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tag</Label>
              <Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="Fintech" />
            </div>
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input type="date" value={form.startDate?.slice(0, 10) || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input type="date" value={form.endDate?.slice(0, 10) || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-primary hover:bg-primary-hover text-primary-foreground" onClick={() => onSave(form)} disabled={!form.name}>
            {editing ? 'Save changes' : 'Create project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
