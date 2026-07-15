import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Badge } from '@/components/ui/badge';
import { Project, Users } from '@/types/ProejctAndTask';
import { useAppSelector } from '@/store';
import { UserAvatar } from '@/components/UserAvatar';
import { RichTextEditor } from '@/components/richeditor';
import { Briefcase, Calendar, Globe2, Lock, Sparkles, Tag, Users2, Building2, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Project | null;
  onSave: (form: FormState) => void;
}

type Access = 'public' | 'private';

interface FormState {
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  // tag: string;
  // ownerId: string;
  // access: Access;
  // company: string;
}

const STATUSES = [
  { value: 'active', label: 'Active', dot: 'bg-emerald-500' },
  { value: 'in-progress', label: 'In Progress', dot: 'bg-blue-500' },
  { value: 'on-hold', label: 'On Hold', dot: 'bg-amber-500' },
  { value: 'delayed', label: 'Delayed', dot: 'bg-red-500' },
  { value: 'completed', label: 'Completed', dot: 'bg-zinc-500' },
];

const COMPANIES = [
  'RishiKirti Technologies',
  'Atlas Financial Group',
  'Helios Solutions',
  'Orbit Mobility',
  'Nimbus Cloud Inc.',
  'Lumen Media',
  'Vector Data Labs',
];

const TAG_SUGGESTIONS = ['Fintech', 'SaaS', 'Mobile', 'DevOps', 'Web', 'Data', 'AI/ML'];

const empty = (ownerId: string): FormState => ({
  name: '', description: '', status: 'active', startDate: '', endDate: '',
  // tag: '', ownerId, access: 'private', company: COMPANIES[0],
});

export function ProjectDialog({ open, onOpenChange, editing, onSave }: Props) {
  const users = useAppSelector((s) => s.users.items);
  const me = useAppSelector((s) => s.auth.user!);

  const [form, setForm] = useState<FormState>(empty(me.id));
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.projectTitle,
        description: editing.description,
        status: editing.projectStatus,
        startDate: editing.startDate,
        endDate: editing.endDate,
        // tag: editing.tag,
        // ownerId: editing.ownerId,
        // access: (editing as any).access ?? 'private',
        // company: (editing as any).company ?? COMPANIES[0],
      });
    } else {
      setForm(empty(me.id));
    }
  }, [open, editing, me.id]);

  // const owner = users.find((u) => u.id === form.ownerId);
  const valid = form.name.trim().length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden gap-0 max-h-[92vh] flex flex-col rounded-2xl border-none shadow-2xl">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6" style={{ background: '#F9CBBF' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: '#f582ae' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-10" style={{ background: '#8bd3dd' }} />

          <div className="relative flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0, 24, 88, 0.1)' }}>
              {editing ? (
                <Briefcase className="h-7 w-7" style={{ color: '#001858' }} />
              ) : (
                <File className="h-7 w-7" style={{ color: '#001858' }} />
              )}
            </div>
            <div className="flex-1">
              <DialogHeader className="space-y-1.5">
                <DialogTitle className="text-2xl font-bold tracking-tight" style={{ color: '#001858' }}>
                  {editing ? 'Edit Project' : 'Create New Project'}
                </DialogTitle>
                <DialogDescription style={{ color: 'rgba(0, 24, 88, 0.7)' }}>
                  {editing ? 'Update project information and settings' : 'Fill in the details to get started'}
                </DialogDescription>
              </DialogHeader>
            </div>
            <Badge
              className="px-3 py-1 text-xs font-medium border-0"
              style={{ background: 'rgba(0, 24, 88, 0.08)', color: '#001858' }}
            >
              {editing ? 'Edit Mode' : 'New'}
            </Badge>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8" style={{ background: '#ffffff' }}>
          {/* Project Name */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold" style={{ color: '#001858' }}>
              Project Name <span style={{ color: '#f582ae' }}>*</span>
            </Label>
            <div className="relative">
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Enter project name..."
                className="h-12 px-4 text-base transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{
                  border: '2px solid #f3d2c1',
                  background: '#ffffff',
                  color: '#001858',
                  borderRadius: '12px'
                }}
              />
              {form.name && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#8bd3dd] flex items-center justify-center">
                  <span className="text-[10px] text-[#001858]">✓</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold" style={{ color: '#001858' }}>Description</Label>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: '#001858' }}>
                Rich Text
              </span>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: '2px solid #f3d2c1', borderRadius: '12px' }}>
              <RichTextEditor
                value={form.description}
                onChange={(v) => set('description', v)}
                placeholder="Describe your project..."
                minHeight={140}
              />
            </div>
          </div>

          {/* Two Column Grid */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
            {/* Owner */}
            {/* <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#001858' }}>
                <Users2 className="h-4 w-4" style={{ color: '#001858' }} />
                Project Owner
              </Label>
              <Select value={form.ownerId} onValueChange={(v) => set('ownerId', v)}>
                <SelectTrigger
                  className="h-12 rounded-xl px-4 transition-all duration-200 focus:ring-0"
                  style={{
                    border: '2px solid #f3d2c1',
                    background: '#ffffff',
                    color: '#001858'
                  }}
                >
                  <SelectValue>
                    {owner ? (
                      <div className="flex items-center gap-3">
                        <UserAvatar name={owner.name} size="sm" />
                        <span className="font-medium" style={{ color: '#001858' }}>{owner.name}</span>
                      </div>
                    ) : (
                      <span style={{ color: '#001858' }}>Select owner</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent style={{ background: '#ffffff' }}>
                  {users.map((u: Users) => (
                    <SelectItem
                      key={u.id}
                      value={u.id}
                      className="hover:bg-[#f3d2c1] focus:bg-[#f3d2c1] transition-colors"
                      style={{ color: '#001858' }}
                    >
                      <div className="flex items-center gap-3 py-1">
                        <UserAvatar name={u.name} size="sm" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium" style={{ color: '#001858' }}>{u.name}</span>
                          <span className="text-xs" style={{ color: '#001858' }}>{u.department}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            {/* Company */}
            {/* <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#001858' }}>
                <Building2 className="h-4 w-4" style={{ color: '#001858' }} />
                Company
              </Label>
              <Select value={form.company} onValueChange={(v) => set('company', v)}>
                <SelectTrigger
                  className="h-12 rounded-xl px-4 transition-all duration-200 focus:ring-0"
                  style={{
                    border: '2px solid #f3d2c1',
                    background: '#ffffff',
                    color: '#001858'
                  }}
                >
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent style={{ background: '#ffffff' }}>
                  {COMPANIES.map((c) => (
                    <SelectItem
                      key={c}
                      value={c}
                      className="hover:bg-[#f3d2c1] focus:bg-[#f3d2c1] transition-colors"
                      style={{ color: '#001858' }}
                    >
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}
          {/* </div> */}

          {/* Status, Tag & Timeline */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
            {/* Status */}
            {/* <div className="space-y-2">
              <Label className="text-sm font-semibold" style={{ color: '#001858' }}>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger
                  className="h-12 rounded-xl px-4 transition-all duration-200 focus:ring-0"
                  style={{
                    border: '2px solid #f3d2c1',
                    background: '#ffffff',
                    color: '#001858'
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: '#ffffff' }}>
                  {STATUSES.map((s) => (
                    <SelectItem
                      key={s.value}
                      value={s.value}
                      className="hover:bg-[#f3d2c1] focus:bg-[#f3d2c1] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn('h-2.5 w-2.5 rounded-full', s.dot)} />
                        <span style={{ color: '#001858' }}>{s.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            {/* Tag */}
            {/* <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#001858' }}>
                <Tag className="h-4 w-4" style={{ color: '#001858' }} />
                Tag
              </Label>
              <Input
                value={form.tag}
                onChange={(e) => set('tag', e.target.value)}
                placeholder="Add a tag..."
                className="h-12 rounded-xl px-4 transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{
                  border: '2px solid #f3d2c1',
                  background: '#ffffff',
                  color: '#001858'
                }}
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {TAG_SUGGESTIONS.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => set('tag', t)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full transition-all duration-200 font-medium',
                      form.tag === t ? 'shadow-sm' : 'hover:shadow-sm'
                    )}
                    style={{
                      background: form.tag === t ? '#001858' : '#f3d2c1',
                      color: form.tag === t ? '#ffffff' : '#001858',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div> */}
          {/* </div> */}

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#001858' }}>
                <Calendar className="h-4 w-4" style={{ color: '#001858' }} />
                Start Date
              </Label>
              <Input
                type="date"
                value={form.startDate?.slice(0, 10) || ''}
                onChange={(e) => set('startDate', e.target.value)}
                className="h-12 rounded-xl px-4 transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{
                  border: '2px solid #f3d2c1',
                  background: '#ffffff',
                  color: '#001858'
                }}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#001858' }}>
                <Calendar className="h-4 w-4" style={{ color: '#001858' }} />
                End Date
              </Label>
              <Input
                type="date"
                value={form.endDate?.slice(0, 10) || ''}
                onChange={(e) => set('endDate', e.target.value)}
                className="h-12 rounded-xl px-4 transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{
                  border: '2px solid #f3d2c1',
                  background: '#ffffff',
                  color: '#001858'
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t-2 flex items-center justify-between" style={{
          borderColor: '#f3d2c1',
          background: '#ffffff'
        }}>
          <div className="flex items-center gap-3">
            {/* {owner && (
              <span className="text-xs" style={{ color: '#001858' }}>
                Owned by <span className="font-semibold" style={{ color: '#001858' }}>{owner.name}</span>
              </span>
            )} */}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl px-6 font-medium transition-all duration-200 hover:bg-[#f3d2c1]"
              style={{ color: '#001858' }}
            >
              Cancel
            </Button>
            <Button
              className={cn(
                "rounded-xl px-8 py-2.5 font-semibold shadow-md transition-all duration-200",
                valid && "hover:bg-primary-hover hover:scale-105 hover:shadow-lg",
                !valid && "opacity-50 cursor-not-allowed"
              )}
              style={{
                background: valid ? '#EEBBC3' : '#f3d2c1',
                color: '#001858'
              }}
              onClick={() => onSave(form)}
              disabled={!valid}
            >
              {editing ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


