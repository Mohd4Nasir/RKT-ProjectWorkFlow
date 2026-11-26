import React, { useEffect, useMemo, useState } from "react";
import { projectApiService } from "@/services/projectsApiService";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { activityTarget, moveNames, targetToParams, type ActivityRow } from "@/utils/activity";
import ActivityCardBody from "./ActivityCardBody";
import {
    Activity as ActivityIcon,
    AlertCircle,
    ClipboardList,
    Clock,
    FileText,
    FolderPlus,
    Inbox,
    MessageSquare,
    RefreshCw,
    UserPlus,
} from "lucide-react";
import { getErrorMessage, showError } from '@/lib/errorAlert';

interface ActivityTabProps {
    projectId: number;
}

/* ───────────────────────── Category colours ─────────────────────────
 * One colour family per kind of activity. Class names are written out in full
 * so Tailwind can see them, each with a dark-mode pair.
 */
type CategoryKey = "project" | "task" | "member" | "comment" | "issue" | "document" | "worklog" | "other";

interface Category {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    /** filled node on the timeline */
    node: string;
    /** icon tile + type pill */
    soft: string;
    /** left accent bar on the card */
    bar: string;
    /** summary tile / active filter chip */
    tile: string;
    dot: string;
}

const CATEGORIES: Record<CategoryKey, Category> = {
    project: {
        label: "Project", icon: FolderPlus,
        node: "bg-emerald-500", bar: "border-l-emerald-500", dot: "bg-emerald-500",
        soft: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
        tile: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    },
    task: {
        label: "Tasks", icon: ClipboardList,
        node: "bg-blue-500", bar: "border-l-blue-500", dot: "bg-blue-500",
        soft: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
        tile: "from-blue-500/15 to-blue-500/5 border-blue-500/30 text-blue-700 dark:text-blue-300",
    },
    member: {
        label: "Members", icon: UserPlus,
        node: "bg-violet-500", bar: "border-l-violet-500", dot: "bg-violet-500",
        soft: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
        tile: "from-violet-500/15 to-violet-500/5 border-violet-500/30 text-violet-700 dark:text-violet-300",
    },
    comment: {
        label: "Comments", icon: MessageSquare,
        node: "bg-cyan-500", bar: "border-l-cyan-500", dot: "bg-cyan-500",
        soft: "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-200",
        tile: "from-cyan-500/15 to-cyan-500/5 border-cyan-500/30 text-cyan-700 dark:text-cyan-300",
    },
    issue: {
        label: "Issues", icon: AlertCircle,
        node: "bg-orange-500", bar: "border-l-orange-500", dot: "bg-orange-500",
        soft: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200",
        tile: "from-orange-500/15 to-orange-500/5 border-orange-500/30 text-orange-700 dark:text-orange-300",
    },
    document: {
        label: "Documents", icon: FileText,
        node: "bg-amber-500", bar: "border-l-amber-500", dot: "bg-amber-500",
        soft: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
        tile: "from-amber-500/15 to-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-300",
    },
    worklog: {
        label: "Work logs", icon: Clock,
        node: "bg-fuchsia-500", bar: "border-l-fuchsia-500", dot: "bg-fuchsia-500",
        soft: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/20 dark:text-fuchsia-200",
        tile: "from-fuchsia-500/15 to-fuchsia-500/5 border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300",
    },
    other: {
        label: "Other", icon: ActivityIcon,
        node: "bg-slate-500", bar: "border-l-slate-400", dot: "bg-slate-500",
        soft: "bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-200",
        tile: "from-slate-500/15 to-slate-500/5 border-slate-500/30 text-slate-700 dark:text-slate-300",
    },
};

/** by what the activity is about; unknown types land in "Other" */
const CATEGORY_PREFIX: [RegExp, CategoryKey][] = [
    [/^PROJECT_/, "project"],
    [/^(TASK_|TASKLIST_)/, "task"],
    [/^MEMBER_/, "member"],
    [/^COMMENT_/, "comment"],
    [/^ISSUE_/, "issue"],
    [/^(ATTACHMENT_|FOLDER_|FILE_)/, "document"],
    [/^WORKLOG_/, "worklog"],
];

const categoryOf = (activityType: string): CategoryKey =>
    CATEGORY_PREFIX.find(([re]) => re.test(activityType.toUpperCase()))?.[1] ?? "other";

const dayKey = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "unknown" : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const dayLabel = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Unknown date";
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    if (dayKey(iso) === dayKey(today.toISOString())) return "Today";
    if (dayKey(iso) === dayKey(yest.toISOString())) return "Yesterday";
    return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

const ActivityTab = ({ projectId }: ActivityTabProps) => {
    const [activityData, setActivityData] = useState<ActivityRow[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<CategoryKey | "all">("all");
    const [, setSearchParams] = useSearchParams();

    // click a row -> jump to what it is about (task panel / comments / issue / documents / members ...)
    const openActivity = (a: ActivityRow) => {
        const target = activityTarget(a);
        if (target) setSearchParams(targetToParams(target));
    };

    const fetchActivityData = async (id: number) => {
        try {
            setLoading(true);
            setError(null);

            const response = await projectApiService.activtiyTracker(id);
            setActivityData(Array.isArray(response?.data) ? response.data : []);
        } catch (err) {
            console.error("Error fetching activity data:", err);
            setError(getErrorMessage(err, "Failed to load activity data."));
            showError(err, "Failed to load activity");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchActivityData(projectId);
        }
    }, [projectId]);

    // TASK_MOVED only carries list / parent task ids: load the board to show their names
    const hasMoves = activityData.some((a) => a.activityType === "TASK_MOVED");
    const [lists, setLists] = useState<Parameters<typeof moveNames>[0]>([]);
    useEffect(() => {
        if (!hasMoves) return;
        let live = true;
        projectApiService
            .getProjectById(String(projectId))
            .then((res) => { if (live) setLists(res?.data?.lists ?? []); })
            .catch((err) => console.error("Error fetching list names:", err)); // ids are shown instead
        return () => { live = false; };
    }, [projectId, hasMoves, activityData]);
    const names = useMemo(() => moveNames(lists, activityData), [lists, activityData]);

    // newest first, tagged with its category
    const items = useMemo(
        () =>
            [...activityData]
                .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
                .map((a) => ({ activity: a, cat: categoryOf(a.activityType ?? "") })),
        [activityData],
    );

    const counts = useMemo(() => {
        const c: Partial<Record<CategoryKey, number>> = {};
        items.forEach(({ cat }) => (c[cat] = (c[cat] ?? 0) + 1));
        return c;
    }, [items]);

    const visible = filter === "all" ? items : items.filter((i) => i.cat === filter);

    // group by day, keeping order
    const groups = useMemo(() => {
        const out: { key: string; label: string; rows: typeof visible }[] = [];
        visible.forEach((row) => {
            const key = dayKey(row.activity.createdAt);
            const last = out[out.length - 1];
            if (last && last.key === key) last.rows.push(row);
            else out.push({ key, label: dayLabel(row.activity.createdAt), rows: [row] });
        });
        return out;
    }, [visible]);

    const presentCats = (Object.keys(CATEGORIES) as CategoryKey[]).filter((k) => counts[k]);

    return (
        <div className="w-full rounded-2xl bg-gradient-to-br from-primary/[0.06] via-transparent to-violet-500/[0.06] p-2 sm:p-4">
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                {/* Header */}
                <div className="relative flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-5 border-b border-border bg-gradient-to-r from-primary/15 via-violet-500/10 to-emerald-500/10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500 text-white shadow-md">
                            <ActivityIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">Activity Tracker</h2>
                            <p className="text-xs text-muted-foreground truncate">Recent updates on this project</p>
                        </div>
                    </div>

                    <button
                        onClick={() => fetchActivityData(projectId)}
                        disabled={loading}
                        className="flex items-center justify-center gap-1.5 self-start sm:self-auto rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border hover:bg-muted transition disabled:opacity-50"
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                        Refresh
                    </button>
                </div>

                {/* Summary tiles + filters */}
                {!loading && !error && items.length > 0 && (
                    <div className="px-4 pt-4 sm:px-6 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                            {presentCats.map((k) => {
                                const c = CATEGORIES[k];
                                const Icon = c.icon;
                                return (
                                    <button
                                        key={k}
                                        onClick={() => setFilter(filter === k ? "all" : k)}
                                        title={c.label}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg border bg-gradient-to-br px-2.5 py-1.5 text-left transition-all hover:shadow-sm",
                                            c.tile,
                                            filter === k && "ring-1 ring-current",
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5 shrink-0" />
                                        <span className="text-sm font-bold tabular-nums">{counts[k]}</span>
                                        <span className="text-[11px] font-medium opacity-80 truncate">{c.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            <button
                                onClick={() => setFilter("all")}
                                className={cn(
                                    "rounded-full px-3 py-1 text-xs font-semibold border transition-colors",
                                    filter === "all"
                                        ? "bg-foreground text-background border-foreground"
                                        : "bg-card text-muted-foreground border-border hover:text-foreground",
                                )}
                            >
                                All <span className="ml-1 tabular-nums opacity-70">{items.length}</span>
                            </button>
                            {presentCats.map((k) => (
                                <button
                                    key={k}
                                    onClick={() => setFilter(filter === k ? "all" : k)}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-colors",
                                        filter === k
                                            ? cn(CATEGORIES[k].soft, "border-current")
                                            : "bg-card text-muted-foreground border-border hover:text-foreground",
                                    )}
                                >
                                    <span className={cn("h-2 w-2 rounded-full", CATEGORIES[k].dot)} />
                                    {CATEGORIES[k].label}
                                    <span className="tabular-nums opacity-70">{counts[k]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="px-4 py-4 sm:px-6 sm:py-5">
                    {loading && (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-4 animate-pulse">
                                    <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-1/3 rounded bg-muted" />
                                        <div className="h-14 rounded-xl bg-muted" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-red-600 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {!loading && !error && items.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                            <Inbox className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">No activity data available.</p>
                        </div>
                    )}

                    {!loading && !error && items.length > 0 && visible.length === 0 && (
                        <p className="py-8 text-center text-sm text-muted-foreground">No activity for this filter.</p>
                    )}

                    {!loading && !error && groups.length > 0 && (
                        <div
                            className="max-h-[480px] sm:max-h-[600px] overflow-y-auto pr-2 -mr-2
                                       [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]
                                       [&::-webkit-scrollbar]:w-1.5
                                       [&::-webkit-scrollbar-track]:bg-transparent
                                       [&::-webkit-scrollbar-thumb]:bg-border
                                       [&::-webkit-scrollbar-thumb]:rounded-full"
                        >
                            {groups.map((g) => (
                                <section key={g.key} className="mb-4 last:mb-0">
                                    <div className="sticky top-0 z-10 -mx-1 mb-2 px-1 py-1 bg-card/95 backdrop-blur">
                                        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            {g.label}
                                            <span className="rounded-full bg-card px-1.5 tabular-nums text-foreground">{g.rows.length}</span>
                                        </span>
                                    </div>

                                    <ol className="relative border-l-2 border-border ml-3">
                                        {g.rows.map(({ activity, cat }) => {
                                            const c = CATEGORIES[cat];
                                            const Icon = c.icon;
                                            const canOpen = !!activityTarget(activity);

                                            return (
                                                <li key={activity.id} className="relative mb-2 ml-6 last:mb-0">
                                                    {/* Timeline node */}
                                                    <span
                                                        className={cn(
                                                            "absolute -left-[35px] top-4 flex h-5 w-5 items-center justify-center rounded-full text-white ring-4 ring-card",
                                                            c.node,
                                                        )}
                                                    >
                                                        <Icon className="h-2.5 w-2.5" />
                                                    </span>

                                                    {/* Row */}
                                                    <div
                                                        role={canOpen ? "link" : undefined}
                                                        tabIndex={canOpen ? 0 : undefined}
                                                        title={canOpen ? "Open" : undefined}
                                                        onClick={canOpen ? () => openActivity(activity) : undefined}
                                                        onKeyDown={canOpen ? (e) => { if (e.key === "Enter" && e.target === e.currentTarget) openActivity(activity); } : undefined}
                                                        className={cn(
                                                            "rounded-lg border border-border border-l-[3px] bg-card px-3 py-2.5 transition-colors hover:bg-muted/40",
                                                            canOpen && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                                                            c.bar,
                                                        )}
                                                    >
                                                        <ActivityCardBody activity={activity} badgeClass={c.soft} names={names} />
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </section>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!loading && !error && (
                    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 bg-muted/50 border-t border-border text-xs text-muted-foreground">
                        <span>
                            {filter === "all" ? items.length : visible.length}{" "}
                            {(filter === "all" ? items.length : visible.length) === 1 ? "activity" : "activities"}
                            {filter !== "all" && ` · ${CATEGORIES[filter].label}`}
                        </span>
                        <span>Project #{projectId}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityTab;
