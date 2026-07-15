import { useState, memo } from 'react';
import {
  X, ChevronUp, ChevronDown, MoreHorizontal, MessageSquare,
  Paperclip, Clock, AlertCircle, Copy, Tag, Calendar,
  ChevronRight, ChevronLeft, Edit3,  Zap,
  User,
} from 'lucide-react';
import { Task, Project, Users } from '@/types/ProejctAndTask';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskDetailPanelProps {
  task: Task;
  users: Users[];
  project: Project;
  onClose: () => void;
  onUpdate: (t: Task) => void;
}

type TaskTab = 'comments' | 'subtasks' | 'log-hours' | 'documents' | 'dependency' | 'status-timeline' | 'issues' | 'activity';

const TASK_TABS: { id: TaskTab; label: string }[] = [
  { id: 'comments',        label: 'Comments' },
  { id: 'subtasks',        label: 'Subtasks' },
  { id: 'log-hours',       label: 'Log Hours' },
  { id: 'documents',       label: 'Documents' },
  { id: 'dependency',      label: 'Dependency' },
  { id: 'status-timeline', label: 'Status Timeline' },
  { id: 'issues',          label: 'Issues' },
  { id: 'activity',        label: 'Activity Stream' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'todo':        { label: 'To Do',       color: 'text-muted-foreground', bg: 'bg-muted' },
  'in-progress': { label: 'Open',        color: 'text-white',            bg: 'bg-emerald-500' },
  'done':        { label: 'Completed',   color: 'text-white',            bg: 'bg-violet-500' },
};

const PRIORITY_CONFIG: Record<string, { label: string; dot: string }> = {
  high:   { label: 'High',   dot: 'bg-red-500' },
  medium: { label: 'Medium', dot: 'bg-amber-500' },
  low:    { label: 'Low',    dot: 'bg-green-500' },
};

export const TaskDetailPanel = memo(function TaskDetailPanel({
  task, users, project, onClose, onUpdate,
}: TaskDetailPanelProps) {
  const [tab, setTab] = useState<TaskTab>('comments');
  const [showInfo, setShowInfo] = useState(true);
  const [comment, setComment] = useState('');

  const assignee = users.find((u) => u.id === task.assigneeId);
  const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.todo;
  const priorityCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;

  function taskCode() {
    const n = parseInt(task.id.replace(/\D/g, ''), 10) || 42;
    return `JD1-T${n}`;
  }

  const pct = task.status === 'done' ? 100 : task.status === 'in-progress' ? 50 : 0;

  return (
    <>
      {/* Task panel backdrop */}
      <div 
        className="fixed inset-0 z-[100]" 
        onClick={onClose} 
        style={{ background: 'rgba(0, 0, 0, 0.5)' }}
      />

      {/* Slide-in panel from right - 90% width */}
      <div className="fixed top-2 right-2 bottom-2 z-[101] w-[99%] flex rounded-2xl shadow-2xl overflow-hidden border border-border bg-background animate-slide-in-right">

        {/* Left sidebar */}
        <div className="w-80 flex-shrink-0 bg-[#EEEAF8] border-r border-border overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <span className="text-xs font-semibold text-muted-foreground">General</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          {/* The current task highlighted */}
          <div className="p-3 bg-white border border-primary/20 rounded-lg m-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-muted-foreground">{taskCode()}</span>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-bold', statusCfg.bg, statusCfg.color)}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs font-semibold line-clamp-2 mb-1">{task.title}</p>
            {assignee && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <UserAvatar name={assignee.name} size="sm" />
                {assignee.name}
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card flex-shrink-0">
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] px-2 py-0.5 rounded font-semibold">
              <Tag className="h-3 w-3" /> Task
            </span>
            <span className="text-xs font-mono text-muted-foreground">{taskCode()}</span>
            <div className="flex items-center gap-1 ml-auto">
              <button className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
              <button className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                <User className="h-3.5 w-3.5" />
              </button>
              <button className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                <Zap className="h-3.5 w-3.5" />
              </button>
              <button onClick={onClose} className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Task title */}
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-start gap-2">
                <h2 className="text-xl font-bold flex-1">{task.title}</h2>
                <button className="flex items-center gap-1 text-xs text-muted-foreground border border-border px-2 py-1 rounded hover:bg-muted transition">
                  <Copy className="h-3 w-3" /> Copy to clipboard
                </button>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                By {assignee?.name || 'Unknown'} &nbsp;·&nbsp;
                <span className="inline-flex items-center gap-1"><span className="font-medium">📋</span> {project.name}</span>
              </div>
            </div>

            {/* Current status bar */}
            <div className="mx-5 mb-3 flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/20">
              <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold', statusCfg.bg, statusCfg.color)}>
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                {statusCfg.label}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide ml-1">CURRENT STATUS</span>
              <div className="ml-auto flex items-center gap-2">
                <button className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground">
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground">
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Task Info section */}
            {showInfo && (
              <div className="mx-5 mb-3 rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="w-full flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30 text-sm font-semibold hover:bg-muted/50 transition"
                >
                  <ChevronDown className="h-4 w-4 text-primary" />
                  Task Information
                </button>
                <div className="p-4 grid grid-cols-2 gap-y-4 text-xs">
                  {/* Owner */}
                  <div>
                    <span className="text-muted-foreground block mb-1">Owner</span>
                    {assignee ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar name={assignee.name} size="sm" />
                        <span className="font-medium">{assignee.name}</span>
                        <button className="text-muted-foreground hover:text-foreground ml-auto"><X className="h-3 w-3" /></button>
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
                  </div>
                  {/* Work Hours */}
                  <div>
                    <span className="text-muted-foreground block mb-1">Work Hours</span>
                    <span className="font-mono font-medium">00:00</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground inline ml-1" />
                  </div>
                  {/* Status */}
                  <div>
                    <span className="text-muted-foreground block mb-1">Status</span>
                    <div className="flex items-center gap-1">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold', statusCfg.bg, statusCfg.color)}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />{statusCfg.label}
                      </span>
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  {/* Start Date */}
                  <div>
                    <span className="text-muted-foreground block mb-1">Start Date</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">—</span>
                    </div>
                  </div>
                  {/* Due Date */}
                  <div>
                    <span className="text-muted-foreground block mb-1">Due Date</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{task.dueDate ? format(new Date(task.dueDate), 'dd MMM yyyy') : '—'}</span>
                    </div>
                  </div>
                  {/* Duration */}
                  <div>
                    <span className="text-muted-foreground block mb-1">Duration</span>
                    <span className="font-medium">2 days/hrs</span>
                  </div>
                  {/* Priority */}
                  <div>
                    <span className="text-muted-foreground block mb-1">Priority</span>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', priorityCfg.dot)} />
                      <span className="font-medium">{priorityCfg.label}</span>
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  {/* Completion */}
                  <div>
                    <span className="text-muted-foreground block mb-1">Completion Percentage</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold">{pct}</span>
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                  {/* Tags */}
                  <div className="col-span-2">
                    <span className="text-muted-foreground block mb-1">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {task.priority !== 'low' && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded font-medium">{project.tag}</span>
                      )}
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] rounded">+ Add tag</span>
                    </div>
                  </div>
                  {/* Reminder */}
                  <div>
                    <span className="text-muted-foreground block mb-1">Reminder</span>
                    <span className="text-muted-foreground">None</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground inline ml-1" />
                  </div>
                  {/* Recurrence */}
                  <div>
                    <span className="text-muted-foreground block mb-1">Recurrence</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                  {/* Billing type */}
                  <div>
                    <span className="text-muted-foreground block mb-1">Billing Type</span>
                    <span className="text-muted-foreground">None</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground inline ml-1" />
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mx-5 mb-3 rounded-xl border border-border bg-card overflow-hidden">
              <button className="w-full flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30 text-sm font-semibold hover:bg-muted/50 transition">
                <ChevronDown className="h-4 w-4 text-primary" />
                Description
                <Edit3 className="h-3.5 w-3.5 text-muted-foreground ml-1" />
              </button>
              <div className="p-4 text-xs text-muted-foreground min-h-[60px]">
                {task.description || <span className="italic">No description added yet.</span>}
              </div>
            </div>

            {/* Tabs */}
            <div className="mx-5 mb-5 rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex overflow-x-auto border-b border-border">
                {TASK_TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex-shrink-0',
                      tab === t.id ? 'border-[#E07B39] text-[#E07B39]' : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {tab === 'comments' && (
                  <div>
                    {/* Rich text toolbar */}
                    <div className="border border-border rounded-xl overflow-hidden">
                      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30 flex-wrap">
                        {['B', 'I', 'U', 'S'].map((f) => (
                          <button key={f} className={cn('h-6 w-6 rounded text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition', f === 'B' && 'font-black', f === 'I' && 'italic', f === 'U' && 'underline', f === 'S' && 'line-through')}>
                            {f}
                          </button>
                        ))}
                        <span className="w-px h-4 bg-border mx-1" />
                        <span className="text-xs text-muted-foreground px-2">Puvi</span>
                        <span className="text-xs text-muted-foreground px-1">13</span>
                        {['≡', '•', '↑', '↓'].map((f) => (
                          <button key={f} className="h-6 w-6 rounded text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition">{f}</button>
                        ))}
                      </div>
                      <div className="flex items-start gap-2 p-3">
                        {assignee && <UserAvatar name={assignee.name} size="sm" />}
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Write a comment…"
                          rows={4}
                          className="flex-1 text-xs bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[#E07B39] hover:underline cursor-pointer">To add Task Comment via email ↗</div>

                    {/* Existing comments */}
                    {task.comments.map((c) => {
                      const author = users.find((u) => u.id === c.authorId);
                      return (
                        <div key={c.id} className="flex items-start gap-2 mt-4 p-3 bg-muted/30 rounded-xl">
                          {author && <UserAvatar name={author.name} size="sm" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold">{author?.name}</span>
                              <span className="text-[10px] text-muted-foreground">{format(new Date(c.createdAt), 'dd MMM yyyy')}</span>
                            </div>
                            <p className="text-xs mt-1">{c.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {tab === 'subtasks' && (
                  <div className="space-y-2">
                    {task.subtasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No subtasks yet.</p>
                    ) : task.subtasks.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/30">
                        <input type="checkbox" checked={s.done} readOnly className="rounded" />
                        <span className={cn('text-xs flex-1', s.done && 'line-through text-muted-foreground')}>{s.title}</span>
                      </div>
                    ))}
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mt-2">
                      <span className="h-5 w-5 rounded border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">+</span>
                      Add subtask
                    </button>
                  </div>
                )}

                {(tab !== 'comments' && tab !== 'subtasks') && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground text-xs">
                    No {tab.replace('-', ' ')} content yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});