import { useState } from 'react';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { toast }    from 'sonner';
import { cn }       from '@/lib/utils';
import { Flag, Plus, Edit, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react';
import { format, isAfter } from 'date-fns';

interface Milestone {
  id: string; title: string; description?: string;
  dueDate: string; status: 'pending' | 'completed' | 'overdue';
}

interface Props { projectId: string; }

export function MilestonesTab({ projectId }: Props) {
  // TODO: Replace with real API fetch
  // useEffect(() => { fetchMilestones(projectId).then(setMilestones); }, [projectId]);
  const milestones: Milestone[] = [];

  const handleCreate = () => {
    // TODO: open create modal, call milestoneApiService.create(...)
    toast.info('Create milestone coming soon');
  };

  const handleEdit = (id: string) => {
    // TODO: open edit modal prefilled, call milestoneApiService.update(...)
    toast.info('Edit coming soon');
  };

  const handleDelete = (id: string) => {
    // TODO: await milestoneApiService.delete(id); then refetch
    toast.info('Delete coming soon');
  };

  const statusMap = {
    completed: { label: 'Completed', icon: CheckCircle2, cls: 'text-success bg-emerald-50 border-emerald-200' },
    overdue:   { label: 'Overdue',   icon: Clock,        cls: 'text-danger    bg-red-50    border-red-200'    },
    pending:   { label: 'Pending',   icon: Circle,       cls: 'text-paragraph  bg-slate-50  border-slate-200'  },
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Milestones</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Track key project checkpoints</p>
        </div>
        <Button onClick={handleCreate} className="bg-brand-cta hover:bg-brand-cta/90 text-white" size="sm">
          <Plus className="h-4 w-4 mr-2" /> Add Milestone
        </Button>
      </div>

      {milestones.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl">
          <Flag className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No milestones yet</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={handleCreate}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add your first milestone
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map(m => {
            const cfg  = statusMap[m.status];
            const Icon = cfg.icon;
            return (
              <div key={m.id} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow group">
                <div className={cn('mt-0.5 p-1.5 rounded-lg border', cfg.cls)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{m.title}</span>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', cfg.cls)}>
                      {cfg.label}
                    </span>
                  </div>
                  {m.description && <p className="text-xs text-muted-foreground mt-1">{m.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    Due: {format(new Date(m.dueDate), 'dd MMM yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(m.id)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-danger hover:bg-red-50" onClick={() => handleDelete(m.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}