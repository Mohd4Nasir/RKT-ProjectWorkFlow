import { useState, memo, useEffect, useCallback } from 'react';
import {
  X, ChevronUp, ChevronDown, MoreHorizontal, Copy, Tag, Calendar,
  Edit3, Zap, User,
} from 'lucide-react';
import { Project, Users } from '@/types/ProejctsType';
import { SubTaskNode, TaskNode } from '@/types/taskTypes';
import { UserAvatar } from '@/components/UserAvatar';
import { format } from 'date-fns';
import { useAppSelector } from '@/store';
import { taskService } from '@/services/taskservice';
import { T, STATUS_CONFIG, PRIORITY_CONFIG, normalizeStatus, FullTreeNode } from './Taskdetailshared';
import { TaskListSidebar } from './Tasklistsidebar';
import { TaskContributors } from './Taskcontributors ';
import { SubtaskTree } from './SubtaskTree';


interface TaskDetailPanelProps {
  task: SubTaskNode | TaskNode;
  users: Users[];
  project: Project;
  onClose: () => void;
  onUpdate: (t: SubTaskNode | TaskNode) => void;
  onSelectTask?: (taskId: string) => void;
}

type TaskTab = 'comments' | 'subtasks' | 'log-hours' | 'documents' | 'dependency' | 'status-timeline' | 'issues' | 'activity';

const TASK_TABS: { id: TaskTab; label: string }[] = [
  { id: 'comments', label: 'Comments' },
  { id: 'subtasks', label: 'Task Tree' },
  { id: 'log-hours', label: 'Log Hours' },
  { id: 'documents', label: 'Documents' },
  { id: 'dependency', label: 'Dependency' },
  { id: 'status-timeline', label: 'Status Timeline' },
  { id: 'issues', label: 'Issues' },
  { id: 'activity', label: 'Activity Stream' },
];


export const TaskDetailPanel = memo(function TaskDetailPanel({
  task, users, project, onClose, onUpdate, onSelectTask,
}: TaskDetailPanelProps) {
    console.log('PANEL RENDER', task?.taskId, project);
  const [tab, setTab] = useState<TaskTab>('comments');
  const [showInfo, setShowInfo] = useState(true);
  const [comment, setComment] = useState('');

  const lists = useAppSelector(state => state.tasks.lists);

  const [selectedListId, setSelectedListId] = useState<string>(
    String((task as any).listId || (task as any).taskListId || lists[0]?.listId || '')
  );

  useEffect(() => {
    const listIdForTask = String((task as any).listId ?? (task as any).taskListId ?? '');
    if (listIdForTask) setSelectedListId(listIdForTask);
  }, [task]);

  const assignee = users.find((u) => u.id === task.assigneeId);
  const normalizedStatus = normalizeStatus(task.taskStatus);
  const statusCfg = STATUS_CONFIG[normalizedStatus] ?? STATUS_CONFIG.todo;
  const priorityCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;

  function taskCode() {
    const n = parseInt(String(task.parentTaskId).replace(/\D/g, ''), 10) || 42;
    return `PRI-${n}`;
  }

  const pct = normalizedStatus === 'done' ? 100 : normalizedStatus === 'in-progress' ? 50 : 0;

  const handleTaskCardClick = (t: SubTaskNode) => {
    onSelectTask?.(String(t.taskId));
  };

  // ══════════════════════════════════════════════
  // Tab-wise lazy API call system
  // ══════════════════════════════════════════════
  const [tabData, setTabData] = useState<Record<string, { taskId: string | number; data: any }>>({});
  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({});
  const [tabError, setTabError] = useState<Record<string, string | null>>({});

  const TAB_APIS: Partial<Record<TaskTab, (taskId: string | number) => Promise<any>>> = {
    subtasks: async (taskId) => {
      const res = await taskService.getSubtaskInTaskDeatils(taskId);
      return res;
    },
    comments: async (taskId) => {
      // const res = await axiosInstance.get(`/task/${taskId}/comments`);
      // return res.data.data;
    },
    documents: async (taskId) => {
      // const res = await axiosInstance.get(`/task/${taskId}/documents`);
      // return res.data.data;
    },
    dependency: async (taskId) => {
      // const res = await axiosInstance.get(`/task/${taskId}/dependency`);
      // return res.data.data;
    },
    'status-timeline': async (taskId) => {
      // const res = await axiosInstance.get(`/task/${taskId}/status-timeline`);
      // return res.data.data;
    },
    issues: async (taskId) => {
      // const res = await axiosInstance.get(`/task/${taskId}/issues`);
      // return res.data.data;
    },
    activity: async (taskId) => {
      // const res = await axiosInstance.get(`/task/${taskId}/activity`);
      // return res.data.data;
    },
  };

  useEffect(() => {
    const fetcher = TAB_APIS[tab];
    if (!fetcher) return;
    if (tabData[tab]?.taskId === task.taskId) return;

    let cancelled = false;
    setTabLoading((prev) => ({ ...prev, [tab]: true }));
    setTabError((prev) => ({ ...prev, [tab]: null }));

    fetcher(task.taskId)
      .then((data) => {
        if (cancelled) return;
        setTabData((prev) => ({ ...prev, [tab]: { taskId: task.taskId, data } }));
      })
      .catch((err) => {
        if (cancelled) return;
        setTabError((prev) => ({
          ...prev,
          [tab]: err?.response?.data?.message || err?.message || 'Failed to load',
        }));
      })
      .finally(() => {
        if (cancelled) return;
        setTabLoading((prev) => ({ ...prev, [tab]: false }));
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, task.taskId]);

  const handleSubtaskToggle = useCallback((subtaskId: number, currentStatus: string) => {
    console.log('toggle', subtaskId, currentStatus);
  }, []);
const subtaskRoot: FullTreeNode | null = (() => {

    const raw = tabData.subtasks?.data;

    if (!raw) return null;

    if (Array.isArray(raw)) return raw[0] ?? null;

    if (raw.taskId) return raw as FullTreeNode;

    if (raw.data?.taskId) return raw.data as FullTreeNode;

    return null;

  })();
  return (
    <>
      <div
        className="fixed inset-0 z-[100]"
        onClick={onClose}
      />

      <div
        className="fixed top-2 right-2 bottom-2 z-[101] w-[99%] flex rounded-2xl shadow-2xl overflow-hidden border animate-slide-in-right background "
        style={{ borderColor: `${T.navy}1a` }}
      >
        {/* ══════════ LEFT SIDEBAR (extracted) ══════════ */}
        <TaskListSidebar
          lists={lists}
          selectedListId={selectedListId}
          onSelectListId={setSelectedListId}
          selectedTaskId={task.taskId}
          onSelectTask={handleTaskCardClick}
        />

        {/* ══════════ MAIN CONTENT ══════════ */}
        <div className="flex-1 flex flex-col overflow-hidden bg-brand-surface">
          {/* Top bar */}
          <div
            className="flex items-center gap-2 px-4 bg-secondary-55 border-b-2 py-2.5 flex-shrink-0"
          >
            <span
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-bold"
              style={{ backgroundColor: `${T.pink}1f`, color: T.pink }}
            >
              <Tag className="h-3 w-3" /> Task
            </span>
            <span className="text-xs font-mono font-medium" style={{ color: `${T.para}99` }}>{taskCode()}</span>
            <div className="flex items-center gap-1 ml-auto">
             
              <button
                onClick={onClose}
                className="h-7 w-7 rounded flex items-center justify-center transition-colors"
                style={{ color: `${T.para}99` }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fde2e8'; e.currentTarget.style.color = 'hsl(var(--danger))'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = `${T.para}99`; }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Task title */}
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-start gap-2">
                <h2 className="text-xl font-bold flex-1" style={{ color: T.navy }}>{task.taskTitle}</h2>

              </div>
              <div className="text-xs mt-1" style={{ color: `${T.para}bb` }}>
                By {task.createdBy || 'Unknown'}
                <span className="inline-flex items-center gap-1">📋 {project.projectTitle}</span>
              </div>
            </div>

            {/* Current status bar */}
            <div
              className="mx-5 mb-3 flex items-center bg-secondary-55  border-2 gap-2 p-3 rounded-xl"
            >
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold"
                style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                {statusCfg.label}
              </span>
              {/* <ChevronDown className="h-3.5 w-3.5" style={{ color: `${T.para}88` }} /> */}
              <span className="text-[10px] uppercase tracking-wide ml-1 font-semibold" style={{ color: `${T.para}88` }}>
                Current Status
              </span>
              
            </div>

            {/* ── Task Info section ── */}
            <div className="mx-5 mb-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left - Task Information */}
              <div
                className="rounded-xl overflow-hidden flex flex-col"
                style={{ border: `1px solid ${T.navy}14` }}
              >
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold flex-shrink-0"
                  style={{
                    backgroundColor: `${T.pink}0f`,
                    borderBottom: showInfo ? `1px solid ${T.navy}14` : "none",
                    color: T.navy,
                  }}
                >
                  <ChevronDown
                    className="h-4 w-4 transition-transform duration-200"
                    style={{
                      color: T.pink,
                      transform: showInfo ? "rotate(0deg)" : "rotate(-90deg)",
                    }}
                  />
                  Task Information
                </button>

                {showInfo && (
                  <div className="p-4 grid grid-cols-2 gap-y-4 text-xs flex-1">
                    <div>
                      <span className="block mb-1 font-medium" style={{ color: `${T.para}88` }}>Owner</span>
                      {assignee ? (
                        <div className="flex items-center gap-2">
                          <UserAvatar name={assignee.name} size="sm" />
                          <span className="font-semibold" style={{ color: T.navy }}>{assignee.name}</span>
                        </div>
                      ) : <span style={{ color: `${T.para}66` }}>—</span>}
                    </div>
                    <div>
                      <span className="block mb-1 font-medium" style={{ color: `${T.para}88` }}>Work Hours</span>
                      <span className="font-mono font-bold" style={{ color: T.navy }}>00:00</span>
                    </div>
                    <div>
                      <span className="block mb-1 font-medium" style={{ color: `${T.para}88` }}>Status</span>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold"
                        style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />{statusCfg.label}
                      </span>
                    </div>
                    <div>
                      <span className="block mb-1 font-medium" style={{ color: `${T.para}88` }}>Start Date</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" style={{ color: `${T.para}77` }} />
                        <span style={{ color: `${T.para}bb` }}>
                          {task.startDate ? format(new Date(task.startDate), 'dd MMM yyyy') : '—'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="block mb-1 font-medium" style={{ color: `${T.para}88` }}>Due Date</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" style={{ color: `${T.para}77` }} />
                        <span className="font-semibold" style={{ color: T.navy }}>
                          {task.endDate ? format(new Date(task.endDate), 'dd MMM yyyy') : '—'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="block mb-1 font-medium" style={{ color: `${T.para}88` }}>Priority</span>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: priorityCfg.dot }} />
                        <span className="font-semibold" style={{ color: T.navy }}>{priorityCfg.label}</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="block mb-1 font-medium" style={{ color: `${T.para}88` }}>Completion</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${T.navy}0f` }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: pct === 100 ? T.teal : pct > 0 ? T.pink : `${T.navy}22` }}
                          />
                        </div>
                        <span className="font-mono font-bold" style={{ color: T.navy }}>{pct}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right - Contributors */}
              <div className="flex">
                <TaskContributors taskId={task.taskId} />
              </div>
            </div>

            {/* Description */}
            <div className="mx-5 mb-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${T.navy}14` }}>
              <button
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors"
                style={{ backgroundColor: `${T.pink}0f`, borderBottom: `1px solid ${T.navy}14`, color: T.navy }}
              >
                <ChevronDown className="h-4 w-4" style={{ color: T.pink }} />
                Description
                <Edit3 className="h-3.5 w-3.5 ml-1" style={{ color: `${T.para}77` }} />
              </button>
              <div className="p-4 text-xs min-h-[60px]" style={{ color: `${T.para}bb` }}>
                {task.taskDescription || <span className="italic">No description added yet.</span>}
              </div>
            </div>

            {/* Tabs */}
            <div className="mx-5 mb-5 rounded-xl overflow-hidden" style={{ border: `1px solid ${T.navy}14` }}>
              <div className="flex overflow-x-auto" style={{ borderBottom: `1px solid ${T.navy}14` }}>
                {TASK_TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className="px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors flex-shrink-0"
                    style={{
                      borderColor: tab === t.id ? T.pink : 'transparent',
                      color: tab === t.id ? T.pink : `${T.para}88`,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {/* ── COMMENTS TAB ── */}
                {tab === 'comments' && (
                  <div>
                    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${T.navy}14` }}>
                      <div className="flex items-start gap-2 p-3">
                        {assignee && <UserAvatar name={assignee.name} size="sm" />}
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Write a comment…"
                          rows={4}
                          className="flex-1 text-xs bg-transparent border-none outline-none resize-none"
                          style={{ color: T.navy }}
                        />
                      </div>
                    </div>

                    {tabLoading.comments ? (
                      <p className="text-xs text-center py-4" style={{ color: `${T.para}77` }}>Loading comments…</p>
                    ) : tabError.comments ? (
                      <p className="text-xs text-center py-4" style={{ color: 'hsl(var(--danger))' }}>{tabError.comments}</p>
                    ) : ((tabData.comments?.data || [])).length === 0 ? (
                      <p className="text-xs text-center py-4" style={{ color: `${T.para}77` }}>No comments yet.</p>
                    ) : (
                      (tabData.comments?.data || []).map((c: any) => {
                        const author = users.find((u) => u.id === c.authorId);
                        return (
                          <div
                            key={c.id}
                            className="flex items-start gap-2 mt-4 p-3 rounded-xl"
                            style={{ backgroundColor: `${T.peach}40` }}
                          >
                            {author && <UserAvatar name={author.name} size="sm" />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold" style={{ color: T.navy }}>{author?.name}</span>
                                <span className="text-[10px]" style={{ color: `${T.para}77` }}>
                                  {format(new Date(c.createdAt), 'dd MMM yyyy')}
                                </span>
                              </div>
                              <p className="text-xs mt-1" style={{ color: T.para }}>{c.text}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* ── SUBTASKS TAB — GET /task/{taskId}/full-tree ── */}
                {/* ── SUBTASKS TAB — root (dddd) + poori nested chain ── */}
                {tab === 'subtasks' && (
                  <div className="space-y-2">
                    {tabLoading.subtasks ? (
                      <p className="text-xs text-center py-4" style={{ color: `${T.para}77` }}>Loading subtasks…</p>
                    ) : tabError.subtasks ? (
                      <p className="text-xs text-center py-4" style={{ color: 'hsl(var(--danger))' }}>{tabError.subtasks}</p>
                    ) : !subtaskRoot ? (
                      <p className="text-xs text-center py-4" style={{ color: `${T.para}77` }}>No subtasks yet.</p>
                    ) : (
                      <SubtaskTree task={subtaskRoot} onToggle={handleSubtaskToggle} />
                    )}
                  </div>
                )}

                {/* ── OTHER TABS (future: log-hours, documents, dependency, status-timeline, issues, activity) ── */}
                {(tab !== 'comments' && tab !== 'subtasks') && (
                  <div>
                    {tabLoading[tab] ? (
                      <div className="flex items-center justify-center py-8 text-xs" style={{ color: `${T.para}66` }}>
                        Loading {tab.replace('-', ' ')}…
                      </div>
                    ) : tabError[tab] ? (
                      <div className="flex items-center justify-center py-8 text-xs" style={{ color: 'hsl(var(--danger))' }}>
                        {tabError[tab]}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8 text-xs" style={{ color: `${T.para}66` }}>
                        No {tab.replace('-', ' ')} content yet.
                      </div>
                    )}
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