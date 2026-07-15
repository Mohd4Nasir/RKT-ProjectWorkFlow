import { useState } from 'react';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { toast }    from 'sonner';
import { cn }       from '@/lib/utils';
import { AlertCircle, Plus, Edit, Trash2, Search, X } from 'lucide-react';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';

interface Issue {
  id: string; title: string; description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  reportedBy: string; createdAt: string;
}

interface Props { projectId: string; }

const priorityConfig = {
  low:      { label: 'Low',      cls: 'bg-slate-100  text-slate-600  border-slate-200' },
  medium:   { label: 'Medium',   cls: 'bg-amber-100  text-amber-700  border-amber-200' },
  high:     { label: 'High',     cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  critical: { label: 'Critical', cls: 'bg-red-100    text-red-700    border-red-200'   },
};

const statusConfig = {
  open:        { label: 'Open',        cls: 'bg-blue-100    text-blue-700    border-blue-200'    },
  'in-progress':{ label: 'In Progress', cls: 'bg-amber-100  text-amber-700  border-amber-200'  },
  resolved:    { label: 'Resolved',    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  closed:      { label: 'Closed',      cls: 'bg-slate-100   text-slate-600   border-slate-200'   },
};

export function IssuesTab({ projectId }: Props) {
  const [search,         setSearch]         = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter,   setStatusFilter]   = useState('all');

  // TODO: Replace with real API fetch
  // useEffect(() => { fetchIssues(projectId).then(setIssues); }, [projectId]);
  const issues: Issue[] = [];

  const handleCreate = () => {
    // TODO: open create modal, call issueApiService.create(...)
    toast.info('Create issue coming soon');
  };

  const handleEdit = (id: string) => {
    // TODO: open edit modal, call issueApiService.update(...)
    toast.info('Edit coming soon');
  };

  const handleDelete = (id: string) => {
    // TODO: await issueApiService.delete(id); then refetch
    toast.info('Delete coming soon');
  };

  const filtered = issues.filter(issue => {
    const matchSearch   = !search         || issue.title.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === 'all' || issue.priority === priorityFilter;
    const matchStatus   = statusFilter   === 'all' || issue.status   === statusFilter;
    return matchSearch && matchPriority && matchStatus;
  });

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Issues</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Track bugs and blockers</p>
        </div>
        <Button onClick={handleCreate} className="bg-[#E07B39] hover:bg-[#E07B39]/90 text-white" size="sm">
          <Plus className="h-4 w-4 mr-2" /> Report Issue
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search issues..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Issues list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            {issues.length === 0 ? 'No issues reported yet' : 'No issues match your filters'}
          </p>
          {issues.length === 0 && (
            <Button variant="outline" size="sm" className="mt-3" onClick={handleCreate}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Report first issue
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(issue => {
            const p = priorityConfig[issue.priority];
            const s = statusConfig[issue.status];
            return (
              <div key={issue.id} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow group">
                <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{issue.title}</span>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', p.cls)}>
                      {p.label}
                    </span>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', s.cls)}>
                      {s.label}
                    </span>
                  </div>
                  {issue.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{issue.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Reported by {issue.reportedBy} · {format(new Date(issue.createdAt), 'dd MMM yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(issue.id)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => handleDelete(issue.id)}>
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