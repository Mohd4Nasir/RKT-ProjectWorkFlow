import { Calendar, ListTodo, CircleDot, CheckCircle2 } from 'lucide-react';
import { SubTaskNode } from '@/types/taskTypes';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// ── Design tokens ──
export const T = {
  bg: '#fffffff',
  navy: '#001858',
  para: '#172c66',
  pink: '#f582ae',
  peach: '#f3d2c1',
  teal: '#8bd3dd',
  white: '#fffffe',
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'todo': { label: 'To Do', color: T.navy, bg: `${T.peach}` },
  'in-progress': { label: 'Open', color: T.white, bg: T.pink },
  'done': { label: 'Completed', color: T.navy, bg: T.teal },
};

export function normalizeStatus(status?: string): string {
  if (!status) return 'todo';
  const s = status.toUpperCase();
  if (s === 'DONE') return 'done';
  if (s === 'IN_PROGRESS') return 'in-progress';
  return 'todo';
}

export const PRIORITY_CONFIG: Record<string, { label: string; dot: string }> = {
  high: { label: 'High', dot: '#e0577b' },
  medium: { label: 'Medium', dot: T.pink },
  low: { label: 'Low', dot: T.teal },
  critical: { label: 'Critical', dot: '#c23a5e' },
};

// ══════════════════════════════════════════════
// Full-tree response type (GET /task/{taskId}/full-tree)
// ══════════════════════════════════════════════
export interface FullTreeNode {
  taskId: number;
  taskTitle: string;
  taskStatus: string;
  taskSequence: number;
  startDate: string;
  endDate: string;
  parentTaskId: number | null;
  listId: number;
  subTask: FullTreeNode[];
}

export interface FullTreeApiResponse {
  endpoint: string;
  statusCode: number;
  status: string;
  success: boolean;
  message: string;
  data: FullTreeNode;
  timeStamp: string;
}

// ── Flat Task Card ──
export function TaskCardFlat({
  node,
  selectedTaskId,
  onClickTask,
  isSubtask = false,
}: {
  node: SubTaskNode;
  selectedTaskId: number;
  onClickTask: (t: SubTaskNode) => void;
  isSubtask?: boolean;
}) {
  const status = normalizeStatus(node.taskStatus);
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.todo;
  const isSelected = String(selectedTaskId) === String(node.taskId);
  const hasChildren = !!node.subTask?.length;

  return (
    <button
      onClick={() => onClickTask(node)}
      style={{
        backgroundColor: isSubtask ? `${T.peach}55` : `${T.teal}50`,
        borderLeftColor: isSelected ? T.pink : 'transparent',
        boxShadow: isSelected ? `0 0 0 2px ${T.pink}55` : undefined,
      }}
      className={cn(
        'w-full rounded-xl border-l-[3px] text-left transition-all duration-150',
        'hover:-translate-y-[1px] hover:shadow-md',
      )}
    >
      <div className="p-3">
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          {status === 'done' ? (
            <CheckCircle2 className="h-3 w-3 flex-shrink-0" style={{ color: isSubtask ? T.navy : T.navy }} />
          ) : status === 'in-progress' ? (
            <CircleDot className="h-3 w-3 flex-shrink-0" style={{ color: isSubtask ? T.navy : T.navy }} />
          ) : (
            <ListTodo className="h-3 w-3 flex-shrink-0" style={{ color: isSubtask ? T.navy : T.navy }} />
          )}
          <span
            className="text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
          {isSubtask && (
            <span
              className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${T.navy}14`, color: T.navy }}
            >
              Subtask
            </span>
          )}
          {hasChildren && (
            <span
              className="text-[8px] ml-auto font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: T.teal, color: T.navy }}
            >
              {node.subTask!.length}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-1.5">
          <p
            className="text-xs font-semibold line-clamp-1 leading-snug flex-1"
            style={{ color: isSubtask ? T.navy : T.navy }}
          >
            {node.taskTitle}
          </p>
          {node.endDate && (
            <div
              className="flex items-center gap-1 flex-shrink-0 text-[8px] font-medium"
              style={{ color: isSubtask ? T.para : T.para }}
            >
              <Calendar className="h-2.5 w-2.5" />
              <span className="whitespace-nowrap">{format(new Date(node.endDate), 'dd MMM')}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function flattenListTasks(nodes: SubTaskNode[]): SubTaskNode[] {
  const out: SubTaskNode[] = [];
  const walk = (arr: SubTaskNode[]) => {
    arr.forEach((n) => {
      out.push(n);
      if (n.subTask?.length) walk(n.subTask);
    });
  };
  walk(nodes || []);
  return out;
}