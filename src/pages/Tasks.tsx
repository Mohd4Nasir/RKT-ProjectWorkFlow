// import { useEffect, useMemo, useState } from 'react';
// import { useSearchParams } from 'react-router-dom';
// import { useAppDispatch, useAppSelector } from '@/store';
// import { addTask, deleteTask, moveTask, updateTask } from '@/store/slices/tasksSlice';
// import { PageHeader } from '@/components/PageHeader';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Plus, Search, MoreHorizontal, MessageSquare, Paperclip, ListChecks, LayoutGrid, List as ListIcon, Trash2, Edit2 } from 'lucide-react';
// import { StatusBadge } from '@/components/StatusBadge';
// import { UserAvatar } from '@/components/UserAvatar';
// import { formatDate, userById } from '@/utils/format';
// import {
//   Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
// } from '@/components/ui/select';
// import {
//   Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
// } from '@/components/ui/dialog';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import {
//   DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Task, TaskStatus, Priority } from '@/types';
// import { toast } from 'sonner';
// import { cn } from '@/lib/utils';

// const columns: { key: TaskStatus; title: string; tone: string }[] = [
//   { key: 'todo', title: 'To Do', tone: 'bg-muted-foreground' },
//   { key: 'in-progress', title: 'In Progress', tone: 'bg-primary' },
//   { key: 'done', title: 'Done', tone: 'bg-success' },
// ];

// interface Props { mine?: boolean; }

// export default function Tasks({ mine }: Props) {
//   const dispatch = useAppDispatch();
//   const all = useAppSelector((s) => s.tasks.items);
//   const projects = useAppSelector((s) => s.projects.items);
//   const users = useAppSelector((s) => s.users.items);
//   const me = useAppSelector((s) => s.auth.user!);

//   const tasks = mine ? all.filter((t) => t.assigneeId === me.id) : all;

//   const [searchParams] = useSearchParams();
//   const projectParam = searchParams.get('project');

//   const [view, setView] = useState<'kanban' | 'list'>(projectParam ? 'list' : 'kanban');
//   const [q, setQ] = useState('');
//   const [project, setProject] = useState(projectParam || 'all');
//   const [priority, setPriority] = useState('all');
//   const [open, setOpen] = useState(false);
//   const [editing, setEditing] = useState<Task | null>(null);
//   const [drag, setDrag] = useState<string | null>(null);
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   useEffect(() => {
//     if (projectParam) { setProject(projectParam); setView('list'); setPage(1); }
//   }, [projectParam]);

//   const filtered = useMemo(() => tasks.filter((t) => {
//     if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
//     if (project !== 'all' && t.projectId !== project) return false;
//     if (priority !== 'all' && t.priority !== priority) return false;
//     return true;
//   }), [tasks, q, project, priority]);

//   const onSave = (form: any) => {
//     if (editing) {
//       dispatch(updateTask({ ...editing, ...form }));
//       toast.success('Task updated');
//     } else {
//       dispatch(addTask({
//         id: 't' + Date.now(), createdAt: new Date().toISOString(),
//         subtasks: [], comments: [], attachments: [], sla: 'on-track',
//         ...form,
//       }));
//       toast.success('Task created');
//     }
//     setOpen(false); setEditing(null);
//   };

//   return (
//     <div className="space-y-6">
//       <PageHeader
//         title={mine ? 'My Tasks' : 'Tasks'}
//         subtitle="Track your work across projects with kanban or list view."
//         actions={
//           <>
//             <div className="flex bg-muted rounded-lg p-1">
//               <button onClick={() => setView('kanban')} className={cn('px-3 h-8 rounded-md inline-flex items-center gap-1.5 text-xs font-semibold', view === 'kanban' && 'bg-card shadow-soft text-primary')}>
//                 <LayoutGrid className="h-3.5 w-3.5" /> Board
//               </button>
//               <button onClick={() => setView('list')} className={cn('px-3 h-8 rounded-md inline-flex items-center gap-1.5 text-xs font-semibold', view === 'list' && 'bg-card shadow-soft text-primary')}>
//                 <ListIcon className="h-3.5 w-3.5" /> List
//               </button>
//             </div>
//             <Button className="bg-gradient-primary hover:opacity-95 shadow-glow" onClick={() => { setEditing(null); setOpen(true); }}>
//               <Plus className="h-4 w-4 mr-1" /> New Task
//             </Button>
//           </>
//         }
//       />

//       <div className="card-elevated p-4 flex flex-col md:flex-row gap-3 md:items-center">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…" className="pl-9 h-10 bg-muted/30 border-transparent" />
//         </div>
//         <Select value={project} onValueChange={setProject}>
//           <SelectTrigger className="w-full md:w-52 h-10"><SelectValue placeholder="Project" /></SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All projects</SelectItem>
//             {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
//           </SelectContent>
//         </Select>
//         <Select value={priority} onValueChange={setPriority}>
//           <SelectTrigger className="w-full md:w-40 h-10"><SelectValue placeholder="Priority" /></SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All priorities</SelectItem>
//             <SelectItem value="high">High</SelectItem>
//             <SelectItem value="medium">Medium</SelectItem>
//             <SelectItem value="low">Low</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       {view === 'kanban' ? (
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {columns.map((col) => {
//             const items = filtered.filter((t) => t.status === col.key);
//             return (
//               <div
//                 key={col.key}
//                 onDragOver={(e) => e.preventDefault()}
//                 onDrop={() => { if (drag) { dispatch(moveTask({ id: drag, status: col.key })); setDrag(null); } }}
//                 className="card-elevated p-3 min-h-[400px]"
//               >
//                 <div className="flex items-center justify-between px-2 pb-3">
//                   <div className="flex items-center gap-2">
//                     <span className={cn('h-2 w-2 rounded-full', col.tone)} />
//                     <h3 className="font-semibold text-sm">{col.title}</h3>
//                     <span className="text-[11px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">{items.length}</span>
//                   </div>
//                   <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(null); setOpen(true); }}>
//                     <Plus className="h-4 w-4" />
//                   </Button>
//                 </div>
//                 <div className="space-y-2">
//                   {items.map((t) => {
//                     const u = userById(users, t.assigneeId);
//                     const proj = projects.find((p) => p.id === t.projectId);
//                     return (
//                       <div
//                         key={t.id}
//                         draggable
//                         onDragStart={() => setDrag(t.id)}
//                         className="bg-card border border-border rounded-xl p-3 hover:shadow-card hover:border-primary/30 cursor-grab active:cursor-grabbing transition group"
//                       >
//                         <div className="flex items-start justify-between gap-2 mb-2">
//                           <div className="text-[10px] font-semibold text-primary uppercase tracking-wide">{proj?.tag || 'Task'}</div>
//                           <DropdownMenu>
//                             <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
//                             <DropdownMenuContent align="end">
//                               <DropdownMenuItem onClick={() => { setEditing(t); setOpen(true); }}><Edit2 className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
//                               <DropdownMenuItem className="text-danger" onClick={() => { dispatch(deleteTask(t.id)); toast.success('Task deleted'); }}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
//                             </DropdownMenuContent>
//                           </DropdownMenu>
//                         </div>
//                         <h4 className="font-semibold text-sm leading-snug mb-2">{t.title}</h4>
//                         <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{t.description}</p>
//                         <div className="flex items-center gap-2 mb-3">
//                           <StatusBadge value={t.priority} />
//                           <StatusBadge value={t.sla} />
//                         </div>
//                         {t.subtasks.length > 0 && (
//                           <div className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
//                             <ListChecks className="h-3 w-3" /> {t.subtasks.filter(s => s.done).length}/{t.subtasks.length}
//                           </div>
//                         )}
//                         <div className="flex items-center justify-between pt-2 border-t border-border">
//                           <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
//                             {t.comments.length > 0 && <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" />{t.comments.length}</span>}
//                             {t.attachments.length > 0 && <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" />{t.attachments.length}</span>}
//                             <span>{formatDate(t.dueDate)}</span>
//                           </div>
//                           {u && <UserAvatar name={u.name} size="sm" />}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       ) : (() => {
//         const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
//         const safePage = Math.min(page, totalPages);
//         const start = (safePage - 1) * pageSize;
//         const pageItems = filtered.slice(start, start + pageSize);
//         return (
//         <div className="card-elevated overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead className="bg-muted/40">
//                 <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
//                   <th className="px-4 py-3 font-semibold">Task</th>
//                   <th className="px-4 py-3 font-semibold">Project</th>
//                   <th className="px-4 py-3 font-semibold">Status</th>
//                   <th className="px-4 py-3 font-semibold">Priority</th>
//                   <th className="px-4 py-3 font-semibold">SLA</th>
//                   <th className="px-4 py-3 font-semibold">Assignee</th>
//                   <th className="px-4 py-3 font-semibold">Due</th>
//                   <th></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {pageItems.map((t) => {
//                   const proj = projects.find((p) => p.id === t.projectId);
//                   const u = userById(users, t.assigneeId);
//                   return (
//                     <tr key={t.id} className="border-t border-border hover:bg-muted/20">
//                       <td className="px-4 py-3 font-semibold">{t.title}</td>
//                       <td className="px-4 py-3 text-muted-foreground">{proj?.name}</td>
//                       <td className="px-4 py-3">
//                         <Select value={t.status} onValueChange={(v: TaskStatus) => dispatch(updateTask({ ...t, status: v }))}>
//                           <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="todo">To do</SelectItem>
//                             <SelectItem value="in-progress">In progress</SelectItem>
//                             <SelectItem value="done">Done</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </td>
//                       <td className="px-4 py-3">
//                         <Select value={t.priority} onValueChange={(v: Priority) => dispatch(updateTask({ ...t, priority: v }))}>
//                           <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="high">High</SelectItem>
//                             <SelectItem value="medium">Medium</SelectItem>
//                             <SelectItem value="low">Low</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </td>
//                       <td className="px-4 py-3"><StatusBadge value={t.sla} /></td>
//                       <td className="px-4 py-3">
//                         <Select value={t.assigneeId} onValueChange={(v) => dispatch(updateTask({ ...t, assigneeId: v }))}>
//                           <SelectTrigger className="h-8 w-[170px] text-xs">
//                             {u ? (
//                               <div className="flex items-center gap-2">
//                                 <UserAvatar name={u.name} size="sm" />
//                                 <span className="text-xs truncate">{u.name}</span>
//                               </div>
//                             ) : <span className="text-muted-foreground">Unassigned</span>}
//                           </SelectTrigger>
//                           <SelectContent>
//                             {users.map((usr) => (
//                               <SelectItem key={usr.id} value={usr.id}>
//                                 <div className="flex items-center gap-2">
//                                   <UserAvatar name={usr.name} size="sm" />
//                                   <span className="text-xs">{usr.name}</span>
//                                 </div>
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       </td>
//                       <td className="px-4 py-3 text-xs">
//                         <Input
//                           type="date"
//                           value={t.dueDate?.slice(0,10) || ''}
//                           onChange={(e) => dispatch(updateTask({ ...t, dueDate: e.target.value }))}
//                           className="h-8 w-[140px] text-xs"
//                         />
//                       </td>
//                       <td className="px-4 py-3 text-right">
//                         <DropdownMenu>
//                           <DropdownMenuTrigger><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
//                           <DropdownMenuContent align="end">
//                             <DropdownMenuItem onClick={() => { setEditing(t); setOpen(true); }}><Edit2 className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
//                             <DropdownMenuItem className="text-danger" onClick={() => dispatch(deleteTask(t.id))}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
//                           </DropdownMenuContent>
//                         </DropdownMenu>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>

//           {/* Pagination footer */}
//           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-border text-xs text-muted-foreground">
//             <div className="flex items-center gap-2">
//               <span>Rows per page:</span>
//               <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
//                 <SelectTrigger className="h-8 w-[80px]"><SelectValue /></SelectTrigger>
//                 <SelectContent>
//                   {[5, 10, 20, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
//                 </SelectContent>
//               </Select>
//               <span className="ml-3">
//                 {filtered.length === 0 ? 0 : start + 1}–{Math.min(start + pageSize, filtered.length)} of {filtered.length}
//               </span>
//             </div>
//             <div className="flex items-center gap-1">
//               <Button variant="outline" size="sm" className="h-8" disabled={safePage <= 1} onClick={() => setPage(1)}>« First</Button>
//               <Button variant="outline" size="sm" className="h-8" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>‹ Prev</Button>
//               <span className="px-3 font-medium text-foreground">Page {safePage} / {totalPages}</span>
//               <Button variant="outline" size="sm" className="h-8" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Next ›</Button>
//               <Button variant="outline" size="sm" className="h-8" disabled={safePage >= totalPages} onClick={() => setPage(totalPages)}>Last »</Button>
//             </div>
//           </div>
//         </div>
//         );
//       })()}

//       <TaskDialog open={open} onOpenChange={setOpen} editing={editing} onSave={onSave} />
//     </div>
//   );
// }

// function TaskDialog({ open, onOpenChange, editing, onSave }: any) {
//   const projects = useAppSelector((s) => s.projects.items);
//   const users = useAppSelector((s) => s.users.items);
//   const me = useAppSelector((s) => s.auth.user!);
//   const [form, setForm] = useState<any>({ title: '', description: '', status: 'todo', priority: 'medium', projectId: projects[0]?.id, assigneeId: me.id, dueDate: '' });

//   const handleOpen = (o: boolean) => {
//     if (o) setForm(editing ? { ...editing } : { title: '', description: '', status: 'todo', priority: 'medium', projectId: projects[0]?.id, assigneeId: me.id, dueDate: '' });
//     onOpenChange(o);
//   };

//   return (
//     <Dialog open={open} onOpenChange={handleOpen}>
//       <DialogContent className="max-w-lg">
//         <DialogHeader><DialogTitle>{editing ? 'Edit task' : 'Create new task'}</DialogTitle></DialogHeader>
//         <div className="space-y-4">
//           <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
//           <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
//           <div className="grid grid-cols-2 gap-3">
//             <div className="space-y-2">
//               <Label>Project</Label>
//               <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
//                 <SelectTrigger><SelectValue /></SelectTrigger>
//                 <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label>Assignee</Label>
//               <Select value={form.assigneeId} onValueChange={(v) => setForm({ ...form, assigneeId: v })}>
//                 <SelectTrigger><SelectValue /></SelectTrigger>
//                 <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label>Status</Label>
//               <Select value={form.status} onValueChange={(v: TaskStatus) => setForm({ ...form, status: v })}>
//                 <SelectTrigger><SelectValue /></SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="todo">To do</SelectItem>
//                   <SelectItem value="in-progress">In progress</SelectItem>
//                   <SelectItem value="done">Done</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label>Priority</Label>
//               <Select value={form.priority} onValueChange={(v: Priority) => setForm({ ...form, priority: v })}>
//                 <SelectTrigger><SelectValue /></SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="high">High</SelectItem>
//                   <SelectItem value="medium">Medium</SelectItem>
//                   <SelectItem value="low">Low</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2 col-span-2">
//               <Label>Due date</Label>
//               <Input type="date" value={form.dueDate?.slice(0,10) || ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
//             </div>
//           </div>
//         </div>
//         <DialogFooter>
//           <Button variant="outline" onClick={() => handleOpen(false)}>Cancel</Button>
//           <Button className="bg-gradient-primary" onClick={() => onSave(form)} disabled={!form.title}>
//             {editing ? 'Save changes' : 'Create task'}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }


import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { addTask, deleteTask, moveTask, updateTask } from '@/store/slices/tasksSlice';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus, Search, MoreHorizontal, MessageSquare, Paperclip, ListChecks,
  LayoutGrid, List as ListIcon, Trash2, Edit2,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { UserAvatar } from '@/components/UserAvatar';
import { formatDate, userById } from '@/utils/format';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Task, TaskStatus, Priority } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// New table system
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/table/DataTable';
import { EditableCell } from '@/components/table/EditableCell';
import { OwnerSelect } from '@/components/table/OwnerSelect';
import { DatePickerCell } from '@/components/table/DatePickerCell';

const columns: { key: TaskStatus; title: string; tone: string }[] = [
  { key: 'todo',        title: 'To Do',       tone: 'bg-muted-foreground' },
  { key: 'in-progress', title: 'In Progress', tone: 'bg-primary' },
  { key: 'done',        title: 'Done',        tone: 'bg-success' },
];

interface Props { mine?: boolean; }

// Status badge for task status
function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, { label: string; cls: string }> = {
    'todo':        { label: 'To Do',       cls: 'bg-muted text-muted-foreground border border-border' },
    'in-progress': { label: 'In Progress', cls: 'bg-blue-100 text-blue-700 border border-blue-300' },
    'done':        { label: 'Done',        cls: 'bg-emerald-100 text-emerald-700 border border-emerald-300' },
  };
  const s = map[status] ?? map.todo;
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap', s.cls)}>{s.label}</span>;
}

function makeTaskColumns(opts: {
  users: any[];
  projects: any[];
  dispatch: any;
  onEdit: (t: Task) => void;
}): ColumnDef<Task, any>[] {
  const { users, projects, dispatch, onEdit } = opts;
  return [
    {
      id: 'title',
      accessorKey: 'title',
      header: 'Task',
      size: 260,
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div>
            <EditableCell value={t.title} onSave={(v) => dispatch(updateTask({ ...t, title: v }))} className="font-semibold" />
            {t.description && <p className="text-[11px] text-muted-foreground truncate max-w-[240px] pl-0.5 mt-0.5">{t.description}</p>}
          </div>
        );
      },
    },
    {
      id: 'project',
      header: 'Project',
      size: 160,
      accessorFn: (t) => projects.find((p) => p.id === t.projectId)?.name ?? '',
      cell: ({ row }) => {
        const proj = projects.find((p) => p.id === row.original.projectId);
        return <span className="text-xs text-muted-foreground font-medium truncate">{proj?.name ?? '—'}</span>;
      },
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      size: 140,
      cell: ({ row }) => {
        const t = row.original;
        return (
          <Select value={t.status} onValueChange={(v: TaskStatus) => dispatch(updateTask({ ...t, status: v }))}>
            <SelectTrigger className="h-8 w-[130px] text-xs border-transparent hover:border-border bg-transparent">
              <TaskStatusBadge status={t.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo"><TaskStatusBadge status="todo" /></SelectItem>
              <SelectItem value="in-progress"><TaskStatusBadge status="in-progress" /></SelectItem>
              <SelectItem value="done"><TaskStatusBadge status="done" /></SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      id: 'priority',
      accessorKey: 'priority',
      header: 'Priority',
      size: 120,
      cell: ({ row }) => {
        const t = row.original;
        return (
          <Select value={t.priority} onValueChange={(v: Priority) => dispatch(updateTask({ ...t, priority: v }))}>
            <SelectTrigger className="h-8 w-[110px] text-xs border-transparent hover:border-border bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">🔴 High</SelectItem>
              <SelectItem value="medium">🟡 Medium</SelectItem>
              <SelectItem value="low">🟢 Low</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      id: 'sla',
      header: 'SLA',
      size: 110,
      accessorKey: 'sla',
      cell: ({ row }) => <StatusBadge value={row.original.sla} />,
    },
    {
      id: 'assignee',
      header: 'Assignee',
      size: 180,
      accessorFn: (t) => userById(users, t.assigneeId)?.name ?? '',
      cell: ({ row }) => {
        const t = row.original;
        return <OwnerSelect users={users} value={t.assigneeId} onChange={(v) => dispatch(updateTask({ ...t, assigneeId: v }))} />;
      },
    },
    {
      id: 'dueDate',
      accessorKey: 'dueDate',
      header: 'Due Date',
      size: 140,
      cell: ({ row }) => {
        const t = row.original;
        return (
          <DatePickerCell
            value={t.dueDate}
            onChange={(v) => dispatch(updateTask({ ...t, dueDate: v }))}
            highlightOverdue={new Date(t.dueDate).getTime() < Date.now() && t.status !== 'done'}
          />
        );
      },
    },
    {
      id: 'actions',
      header: '',
      size: 48,
      enableSorting: false,
      cell: ({ row }) => {
        const t = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(t)}><Edit2 className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-danger" onClick={() => dispatch(deleteTask(t.id))}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

export default function Tasks({ mine }: Props) {
  const dispatch = useAppDispatch();
  const all = useAppSelector((s) => s.tasks.items);
  const projects = useAppSelector((s) => s.projects.items);
  const users = useAppSelector((s) => s.users.items);
  const me = useAppSelector((s) => s.auth.user!);

  const tasks = mine ? all.filter((t) => t.assigneeId === me.id) : all;

  const [searchParams] = useSearchParams();
  const projectParam = searchParams.get('project');

  const [view, setView] = useState<'kanban' | 'list'>(projectParam ? 'list' : 'kanban');
  const [q, setQ] = useState('');
  const [project, setProject] = useState(projectParam || 'all');
  const [priority, setPriority] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [drag, setDrag] = useState<string | null>(null);

  useEffect(() => {
    if (projectParam) { setProject(projectParam); setView('list'); }
  }, [projectParam]);

  const filtered = useMemo(() => tasks.filter((t) => {
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (project !== 'all' && t.projectId !== project) return false;
    if (priority !== 'all' && t.priority !== priority) return false;
    return true;
  }), [tasks, q, project, priority]);

  const onSave = (form: any) => {
    if (editing) {
      dispatch(updateTask({ ...editing, ...form })); toast.success('Task updated');
    } else {
      dispatch(addTask({ id: 't' + Date.now(), createdAt: new Date().toISOString(), subtasks: [], comments: [], attachments: [], sla: 'on-track', ...form }));
      toast.success('Task created');
    }
    setOpen(false); setEditing(null);
  };

  const handleEdit = useCallback((t: Task) => { setEditing(t); setOpen(true); }, []);

  const taskColumns = useMemo(() => makeTaskColumns({ users, projects, dispatch, onEdit: handleEdit }), [users, projects, dispatch, handleEdit]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={mine ? 'My Tasks' : 'Tasks'}
        subtitle="Track your work across projects with kanban or list view."
        actions={
          <>
            <div className="flex bg-muted rounded-lg p-1">
              <button onClick={() => setView('kanban')} className={cn('px-3 h-8 rounded-md inline-flex items-center gap-1.5 text-xs font-semibold', view === 'kanban' && 'bg-card shadow-soft text-primary')}>
                <LayoutGrid className="h-3.5 w-3.5" /> Board
              </button>
              <button onClick={() => setView('list')} className={cn('px-3 h-8 rounded-md inline-flex items-center gap-1.5 text-xs font-semibold', view === 'list' && 'bg-card shadow-soft text-primary')}>
                <ListIcon className="h-3.5 w-3.5" /> List
              </button>
            </div>
            <Button className="bg-gradient-primary hover:opacity-95 shadow-glow" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> New Task
            </Button>
          </>
        }
      />

      <div className="card-elevated p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…" className="pl-9 h-10 bg-muted/30 border-transparent" />
        </div>
        <Select value={project} onValueChange={setProject}>
          <SelectTrigger className="w-full md:w-52 h-10"><SelectValue placeholder="Project" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-full md:w-40 h-10"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => {
            const items = filtered.filter((t) => t.status === col.key);
            return (
              <div key={col.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (drag) { dispatch(moveTask({ id: drag, status: col.key })); setDrag(null); } }}
                className="card-elevated p-3 min-h-[400px]"
              >
                <div className="flex items-center justify-between px-2 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', col.tone)} />
                    <h3 className="font-semibold text-sm">{col.title}</h3>
                    <span className="text-[11px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">{items.length}</span>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(null); setOpen(true); }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {items.map((t) => {
                    const u = userById(users, t.assigneeId);
                    const proj = projects.find((p) => p.id === t.projectId);
                    return (
                      <div key={t.id} draggable onDragStart={() => setDrag(t.id)}
                        className="bg-card border border-border rounded-xl p-3 hover:shadow-card hover:border-primary/30 cursor-grab active:cursor-grabbing transition group">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="text-[10px] font-semibold text-primary uppercase tracking-wide">{proj?.tag || 'Task'}</div>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditing(t); setOpen(true); }}><Edit2 className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-danger" onClick={() => { dispatch(deleteTask(t.id)); toast.success('Task deleted'); }}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <h4 className="font-semibold text-sm leading-snug mb-2">{t.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{t.description}</p>
                        <div className="flex items-center gap-2 mb-3">
                          <StatusBadge value={t.priority} />
                          <StatusBadge value={t.sla} />
                        </div>
                        {t.subtasks.length > 0 && (
                          <div className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
                            <ListChecks className="h-3 w-3" /> {t.subtasks.filter(s => s.done).length}/{t.subtasks.length}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            {t.comments.length > 0 && <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" />{t.comments.length}</span>}
                            {t.attachments.length > 0 && <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" />{t.attachments.length}</span>}
                            <span>{formatDate(t.dueDate)}</span>
                          </div>
                          {u && <UserAvatar name={u.name} size="sm" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── TanStack DataTable replaces manual <table> ── */
        <DataTable
          data={filtered}
          columns={taskColumns}
          getRowId={(t) => t.id}
        />
      )}

      <TaskDialog open={open} onOpenChange={setOpen} editing={editing} onSave={onSave} />
    </div>
  );
}

function TaskDialog({ open, onOpenChange, editing, onSave }: any) {
  const projects = useAppSelector((s) => s.projects.items);
  const users = useAppSelector((s) => s.users.items);
  const me = useAppSelector((s) => s.auth.user!);
  const [form, setForm] = useState<any>({ title: '', description: '', status: 'todo', priority: 'medium', projectId: projects[0]?.id, assigneeId: me.id, dueDate: '' });

  const handleOpen = (o: boolean) => {
    if (o) setForm(editing ? { ...editing } : { title: '', description: '', status: 'todo', priority: 'medium', projectId: projects[0]?.id, assigneeId: me.id, dueDate: '' });
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing ? 'Edit task' : 'Create new task'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={form.assigneeId} onValueChange={(v) => setForm({ ...form, assigneeId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: TaskStatus) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To do</SelectItem>
                  <SelectItem value="in-progress">In progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v: Priority) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Due date</Label>
              <Input type="date" value={form.dueDate?.slice(0, 10) || ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpen(false)}>Cancel</Button>
          <Button className="bg-gradient-primary" onClick={() => onSave(form)} disabled={!form.title}>{editing ? 'Save changes' : 'Create task'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
