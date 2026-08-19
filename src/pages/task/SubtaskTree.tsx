import { format, isValid, parseISO } from "date-fns";
import { T } from "./Taskdetailshared";

export interface FullTreeNode {
    taskId: number;
    taskTitle: string;
    taskStatus: string;
    startDate?: string | null;
    endDate?: string | null;
    listId?: number;
    parentTaskId?: number | null;
    taskSequence?: number;
    subTask?: FullTreeNode[];
}

const fmtDate = (d?: string | null) => {
    if (!d) return '';
    const p = parseISO(d);
    return isValid(p) ? format(p, 'dd MMM') : '';

};

const dateRange = (n: FullTreeNode) =>
    [fmtDate(n.startDate), fmtDate(n.endDate)].filter(Boolean).join(' – ');

function SubtaskTreeItem({
    node,
    depth = 0,
    isRoot = false,
    onToggle,
}: {
    node: FullTreeNode;
    depth?: number;
    isRoot?: boolean;
    onToggle?: (taskId: number, status: string) => void;
}) {
    const isDone = node.taskStatus === 'DONE';
    const children = node.subTask ?? [];
    const hasChildren = children.length > 0;
    const dateText = dateRange(node);

    return (
        <div>
            {/* ── Row ── */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => onToggle?.(node.taskId, node.taskStatus)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggle?.(node.taskId, node.taskStatus);
                    }
                }}
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors"
                style={{
                    border: `1px solid ${T.navy}14`,
                    backgroundColor: isRoot ? `${T.teal}1f` : depth > 0 ? `${T.peach}22` : `${T.teal}12`,
                }}
            >
                {/* checkbox ki jagah status dot */}
                <span
                    className="shrink-0 rounded-full"
                    style={{
                        width: isRoot ? 9 : 7,
                        height: isRoot ? 9 : 7,
                        backgroundColor: isDone ? T.teal : `${T.navy}44`,
                    }}
                />

                <span
                    className="flex-1 truncate"
                    title={node.taskTitle}
                    style={{
                        fontSize: isRoot ? 13 : 12,
                        color: isDone ? `${T.para}66` : T.navy,
                        textDecoration: isDone ? 'line-through' : 'none',
                        fontWeight: isRoot ? 700 : depth === 0 ? 600 : 500,
                    }}
                >
                    {node.taskTitle}
                </span>



                {dateText && (
                    <span
                        className="text-[10px] whitespace-nowrap shrink-0"
                        style={{ color: `${T.para}77` }}
                    >
                        {dateText}
                    </span>
                )}
            </div>

            {/* ── Children: guide line ke sath nest ── */}
            {hasChildren && (
                <div
                    className="mt-2 pl-4 ml-2 space-y-2"
                    style={{ borderLeft: `1px dashed ${T.navy}33` }}
                >
                    {children.map((child) => (
                        <SubtaskTreeItem
                            key={child.taskId}
                            node={child}
                            depth={depth + 1}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Entry point — root node pass karo, poori tree render ho jayegi
export function SubtaskTree({
    task,
    onToggle,
}: {
    task?: FullTreeNode | null;
    onToggle?: (taskId: number, status: string) => void;
}) {
    if (!task) return null;
    return <SubtaskTreeItem node={task} depth={0} isRoot onToggle={onToggle} />;
}