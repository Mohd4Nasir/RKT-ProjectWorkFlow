import React, { useEffect, useMemo, useState } from "react";
import { projectApiService } from "@/services/projectsApiService";
import { cn } from "@/lib/utils";
import {
    Activity as ActivityIcon,
    AlertCircle,
    CheckCircle2,
    ClipboardList,
    Clock,
    FolderPlus,
    Inbox,
    Pencil,
    RefreshCw,
    Trash2,
    UserPlus,
} from "lucide-react";

// Metadata varies by activityType, so keep it loose and read fields defensively
interface ActivityMetadata {
    // TASK_CREATED / TASK_*
    createdByUserId?: number;
    createdByUserName?: string;
    taskId?: number;
    taskName?: string;

    // MEMBER_ADDED
    addedByUserId?: number;
    addedByUserName?: string;
    memberId?: number;
    memberName?: string;
    memberRole?: string;

    // PROJECT_CREATED
    projectId?: number;
    projectTitle?: string;

    [key: string]: unknown;
}

interface Activity {
    id: number;
    projectId: number;
    activityType: string;
    resourceType: string;
    createdAt: string;
    metadata: ActivityMetadata;
}

interface ActivityTabProps {
    projectId: number;
}

/* ───────────────────────── Category colours ─────────────────────────
 * One colour family per kind of activity. Class names are written out in full
 * so Tailwind can see them, each with a dark-mode pair.
 */
type CategoryKey = "task" | "member" | "project" | "update" | "done" | "delete" | "other";

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
    project: {
        label: "Project", icon: FolderPlus,
        node: "bg-emerald-500", bar: "border-l-emerald-500", dot: "bg-emerald-500",
        soft: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
        tile: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    },
    update: {
        label: "Updates", icon: Pencil,
        node: "bg-amber-500", bar: "border-l-amber-500", dot: "bg-amber-500",
        soft: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
        tile: "from-amber-500/15 to-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-300",
    },
    done: {
        label: "Completed", icon: CheckCircle2,
        node: "bg-teal-500", bar: "border-l-teal-500", dot: "bg-teal-500",
        soft: "bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200",
        tile: "from-teal-500/15 to-teal-500/5 border-teal-500/30 text-teal-700 dark:text-teal-300",
    },
    delete: {
        label: "Removed", icon: Trash2,
        node: "bg-rose-500", bar: "border-l-rose-500", dot: "bg-rose-500",
        soft: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
        tile: "from-rose-500/15 to-rose-500/5 border-rose-500/30 text-rose-700 dark:text-rose-300",
    },
    other: {
        label: "Other", icon: ActivityIcon,
        node: "bg-slate-500", bar: "border-l-slate-400", dot: "bg-slate-500",
        soft: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200",
        tile: "from-slate-500/15 to-slate-500/5 border-slate-500/30 text-slate-700 dark:text-slate-300",
    },
};

const categoryOf = (activityType: string): CategoryKey => {
    const k = activityType?.toLowerCase() ?? "";
    if (k.includes("delet") || k.includes("remov")) return "delete";
    if (k.includes("complet") || k.includes("done") || k.includes("closed")) return "done";
    if (k.includes("member")) return "member";
    if (k.includes("updat") || k.includes("edit") || k.includes("status") || k.includes("chang")) return "update";
    if (k.includes("task")) return "task";
    if (k.includes("project")) return "project";
    return "other";
};

const initials = (name: string) =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "?";

/** stable colour per person so the same actor always looks the same */
const AVATAR_COLORS = [
    "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
    "bg-rose-500", "bg-teal-500", "bg-indigo-500", "bg-fuchsia-500",
];
const avatarColor = (name: string) => {
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const timeOf = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

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

// Normalizes different activityType shapes into one display model
const resolveActivityContent = (activity: Activity) => {
    const { activityType, metadata, resourceType } = activity;
    const type = activityType?.toUpperCase() ?? "";

    if (type.includes("MEMBER")) {
        return {
            title: metadata.memberName ?? "Unknown member",
            subtitle: metadata.memberRole ? `Role: ${metadata.memberRole}` : undefined,
            actor: metadata.addedByUserName ?? "Unknown user",
            tag: resourceType,
        };
    }

    if (type.includes("PROJECT")) {
        return {
            title: metadata.projectTitle ?? "Untitled project",
            subtitle: metadata.projectId ? `Project #${metadata.projectId}` : undefined,
            actor: metadata.createdByUserName ?? "Unknown user",
            tag: resourceType,
        };
    }

    if (type.includes("TASK")) {
        return {
            title: metadata.taskName ?? "Untitled task",
            subtitle: metadata.taskId ? `Task #${metadata.taskId}` : undefined,
            actor: metadata.createdByUserName ?? "Unknown user",
            tag: resourceType,
        };
    }

    // Fallback for any activityType not explicitly handled
    return {
        title: activityType.replace(/_/g, " "),
        subtitle: undefined,
        actor:
            (metadata.createdByUserName as string) ||
            (metadata.addedByUserName as string) ||
            "Unknown user",
        tag: resourceType,
    };
};

const ActivityTab = ({ projectId }: ActivityTabProps) => {
    const [activityData, setActivityData] = useState<Activity[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<CategoryKey | "all">("all");

    const fetchActivityData = async (id: number) => {
        try {
            setLoading(true);
            setError(null);

            const response = await projectApiService.activtiyTracker(id);
            setActivityData(Array.isArray(response?.data) ? response.data : []);
        } catch (err) {
            console.error("Error fetching activity data:", err);
            setError("Failed to load activity data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchActivityData(projectId);
        }
    }, [projectId]);

    // newest first, tagged with its category
    const items = useMemo(
        () =>
            [...activityData]
                .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
                .map((a) => ({ activity: a, cat: categoryOf(a.activityType) })),
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
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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
                                            const content = resolveActivityContent(activity);

                                            return (
                                                <li key={activity.id} className="relative mb-2 ml-6 last:mb-0">
                                                    {/* Timeline node */}
                                                    <span
                                                        className={cn(
                                                            "absolute -left-[33px] top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-white ring-4 ring-card",
                                                            c.node,
                                                        )}
                                                    >
                                                        <Icon className="h-2.5 w-2.5" />
                                                    </span>

                                                    {/* Row */}
                                                    <div
                                                        className={cn(
                                                            "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border border-l-[3px] bg-card px-3 py-2 transition-colors hover:bg-muted/40",
                                                            c.bar,
                                                        )}
                                                    >
                                                        <span className={cn("inline-flex shrink-0 items-center rounded px-1.5 py-px text-[10px] font-bold uppercase tracking-wide", c.soft)}>
                                                            {activity.activityType.replace(/_/g, " ")}
                                                        </span>

                                                        <p className="min-w-0 flex-1 basis-40 truncate text-[13px] font-semibold text-foreground" title={content.title}>
                                                            {content.title}
                                                            {content.subtitle && (
                                                                <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                                                                    {content.subtitle}
                                                                </span>
                                                            )}
                                                        </p>

                                                        <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                                                            <span
                                                                className={cn(
                                                                    "grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold text-white",
                                                                    avatarColor(content.actor),
                                                                )}
                                                            >
                                                                {initials(content.actor)}
                                                            </span>
                                                            <span className="max-w-[110px] truncate font-medium text-foreground/80">{content.actor}</span>
                                                            <span aria-hidden>·</span>
                                                            <Clock className="h-3 w-3" />
                                                            {timeOf(activity.createdAt)}
                                                        </span>
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
