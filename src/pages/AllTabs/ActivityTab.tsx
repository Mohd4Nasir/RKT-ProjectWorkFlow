import React, { useEffect } from "react";
import { projectApiService } from "@/services/projectsApiService";
import {
    Activity as ActivityIcon,
    User,
    UserPlus,
    UserMinus,
    FolderPlus,
    FolderPen,
    ClipboardList,
    ClipboardCheck,
    RefreshCw,
    AlertCircle,
    Inbox,
    ArrowRight,
} from "lucide-react";

// Metadata varies by activityType, so keep it loose and read fields defensively
interface ActivityMetadata {
    // TASK_*
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

    // PROJECT_*
    projectId?: number;
    projectTitle?: string;

    // PROJECT_UPDATED
    updatedByUserId?: number;
    updatedByUserName?: string;
    changes?: Array<Record<string, unknown>>;

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
    projectId: number | string;
}

const TEXT_HEADING = "text-heading";
const TEXT_PARAGRAPH = "text-paragraph";
const BORDER_HEADING = "border-border";

interface ActivityStyle {
    label: string;
    icon: React.ElementType;
    dot: string;  // timeline dot
    chip: string; // label badge
    card: string; // row background + left border
}

const ACTIVITY_STYLES: Record<string, ActivityStyle> = {
    PROJECT_CREATED: {
        label: "Project Created", icon: FolderPlus,
        dot: "bg-success", chip: "bg-success/15 text-success",
        card: "bg-success/10 border-l-success",
    },
    PROJECT_UPDATED: {
        label: "Project Updated", icon: FolderPen,
        dot: "bg-info", chip: "bg-info/15 text-info",
        card: "bg-info/10 border-l-info",
    },
    MEMBER_ADDED: {
        label: "Member Added", icon: UserPlus,
        dot: "bg-primary", chip: "bg-primary/15 text-primary",
        card: "bg-primary/10 border-l-primary",
    },
    MEMBER_REMOVED: {
        label: "Member Removed", icon: UserMinus,
        dot: "bg-danger", chip: "bg-danger/15 text-danger",
        card: "bg-danger/10 border-l-danger",
    },
    TASK_CREATED: {
        label: "Task Created", icon: ClipboardList,
        dot: "bg-warning", chip: "bg-warning/15 text-warning",
        card: "bg-warning/10 border-l-warning",
    },
    TASK_UPDATED: {
        label: "Task Updated", icon: ClipboardList,
        dot: "bg-brand-cta", chip: "bg-brand-cta/15 text-brand-cta",
        card: "bg-brand-cta/10 border-l-brand-cta",
    },
    TASK_COMPLETED: {
        label: "Task Completed", icon: ClipboardCheck,
        dot: "bg-accent", chip: "bg-accent/15 text-accent",
        card: "bg-accent/10 border-l-accent",
    },
};

const DEFAULT_STYLE: ActivityStyle = {
    label: "Activity", icon: ActivityIcon,
    dot: "bg-muted-foreground", chip: "bg-muted text-heading",
    card: "bg-muted/60 border-l-border",
};

const prettify = (s: string) =>
    s.toLowerCase().split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const getActivityStyle = (activityType: string): ActivityStyle => {
    const key = activityType?.toUpperCase() ?? "";
    if (ACTIVITY_STYLES[key]) return ACTIVITY_STYLES[key];
    // Unknown type: fall back by keyword, label from the type itself
    const base =
        key.includes("MEMBER") ? ACTIVITY_STYLES.MEMBER_ADDED
            : key.includes("PROJECT") ? ACTIVITY_STYLES.PROJECT_UPDATED
                : key.includes("TASK") ? ACTIVITY_STYLES.TASK_CREATED
                    : DEFAULT_STYLE;
    return { ...base, label: key ? prettify(key) : base.label };
};

// Reads one entry of metadata.changes defensively (key names may differ)
const describeChange = (c: Record<string, unknown>) => {
    const field = String(c.field ?? c.fieldName ?? c.name ?? c.key ?? "field");
    const from = c.oldValue ?? c.old ?? c.from ?? c.previousValue ?? c.before;
    const to = c.newValue ?? c.new ?? c.to ?? c.currentValue ?? c.after;
    const clean = (v: unknown) =>
        v === undefined || v === null || v === ""
            ? "—"
            : String(v).replace(/<[^>]*>/g, "").slice(0, 60);
    return {
        field: prettify(field.replace(/([a-z])([A-Z])/g, "$1_$2")),
        from: clean(from),
        to: clean(to),
    };
};

const formatRelativeOrDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
        date: date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
        time: date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    };
};

// Normalizes different activityType shapes into one display model
const resolveActivityContent = (activity: Activity) => {
    const { activityType, metadata, resourceType } = activity;
    const type = activityType?.toUpperCase() ?? "";

    // Metadata mein jo key mile, uske hisaab se label + naam
    const pickActor = (): { label: string; name: string } => {
        if (metadata.updatedByUserName) return { label: "Updated by", name: String(metadata.updatedByUserName) };
        if (metadata.addedByUserName) return { label: "Added by", name: String(metadata.addedByUserName) };
        if (metadata.createdByUserName) return { label: "Created by", name: String(metadata.createdByUserName) };
        return { label: "By", name: "Unknown user" };
    };
    const actor = pickActor();

    if (type.includes("MEMBER")) {
        return {
            title: metadata.memberName ?? "Unknown member",
            subtitle: metadata.memberRole ? `Role: ${metadata.memberRole}` : undefined,
            actor: actor.name,
            actorLabel: actor.label,
            tag: resourceType,
        };
    }

    if (type.includes("PROJECT")) {
        return {
            title: metadata.projectTitle ?? "Untitled project",
            subtitle: metadata.projectId ? `Project #${metadata.projectId}` : undefined,
            actor: actor.name,
            actorLabel: actor.label,
            tag: resourceType,
        };
    }
    if (type.includes("TASKLIST")) {
        return {
            title: metadata.taskListTitle ?? "Untitled list",
            subtitle: metadata.taskListId ? `List #${metadata.taskListId}` : undefined,
            actor: actor.name,
            actorLabel: actor.label,
            tag: resourceType,
        };
    }
    if (type.includes("TASK")) {
        return {
            title: metadata.taskName ?? "Untitled task",
            subtitle: metadata.taskId ? `Task #${metadata.taskId}` : undefined,
            actor: actor.name,
            actorLabel: actor.label,
            tag: resourceType,
        };
    }

    return {
        title: activityType.replace(/_/g, " "),
        subtitle: undefined,
        actor: actor.name,
        actorLabel: actor.label,
        tag: resourceType,
    };
};

const ActivityTab = ({ projectId }: ActivityTabProps) => {
    const [activityData, setActivityData] = React.useState<Activity[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);

    const fetchActivityData = async (id: number) => {
        try {
            setLoading(true);
            setError(null);

            const response = await projectApiService.activtiyTracker(id);
            setActivityData(response.data ?? []);
        } catch (err) {
            console.error("Error fetching activity data:", err);
            setError("Failed to load activity data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchActivityData(Number(projectId));
        }
    }, [projectId]);

    return (
        <div className="w-full rounded-2xl p-2 sm:p-4">
            <div className={`rounded-2xl border ${BORDER_HEADING} bg-card shadow-sm overflow-hidden`}>
                {/* Header */}
                <div
                    className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-5 bg-secondary-55 border-b ${BORDER_HEADING}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-primary-55">
                            <ActivityIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${TEXT_HEADING}`} />
                        </div>
                        <div className="min-w-0">
                            <h2 className={`text-base sm:text-lg font-semibold ${TEXT_HEADING} truncate`}>
                                Activity Tracker
                            </h2>
                            <p className={`text-xs ${TEXT_PARAGRAPH} truncate`}>
                                Recent updates on this project
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => fetchActivityData(Number(projectId))}
                        disabled={loading}
                        className={`flex items-center justify-center gap-1.5 self-start sm:self-auto rounded-lg bg-card px-3 py-1.5 text-xs font-medium ${TEXT_HEADING} ring-1 ring-border hover:bg-muted transition disabled:opacity-50`}
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>

                {/* Body — scrollable */}
                <div className="px-4 py-4 sm:px-6 sm:py-6">
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
                        <div className="flex items-center gap-3 rounded-xl bg-danger/10 px-4 py-3 text-danger">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {!loading && !error && activityData.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                            <Inbox className="h-8 w-8 text-muted-foreground" />
                            <p className={`text-sm ${TEXT_PARAGRAPH}`}>
                                No activity data available.
                            </p>
                        </div>
                    )}

                    {!loading && !error && activityData.length > 0 && (
                        <div
                            className="max-h-[420px] sm:max-h-[520px] overflow-y-auto pr-2 -mr-2 scrollbar-thin"
                        >
                            <ol className="relative ml-3">
                                {activityData.map((activity, idx) => {
                                    const style = getActivityStyle(activity.activityType);
                                    const Icon = style.icon;
                                    const { date, time } = formatRelativeOrDate(activity.createdAt);
                                    const content = resolveActivityContent(activity);
                                    const changes = Array.isArray(activity.metadata?.changes)
                                        ? activity.metadata.changes
                                        : [];
                                    const isLast = idx === activityData.length - 1;

                                    return (
                                        <li key={activity.id} className="relative pb-4 pl-7 last:pb-0">
                                            {!isLast && (
                                                <span
                                                    className="absolute left-[7px] top-4 bottom-0 w-px bg-border"
                                                    aria-hidden
                                                />
                                            )}

                                            {/* Coloured node with icon */}
                                            <span
                                                className={`absolute left-0 top-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-card ${style.dot}`}
                                                aria-hidden
                                            >
                                                <Icon className="h-2.5 w-2.5 text-white" />
                                            </span>

                                            <div className={`rounded-xl border border-l-4 border-border px-3 py-2.5 ${style.card}`}>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                            <span
                                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.chip}`}
                                                            >
                                                                <Icon className="h-3 w-3" />
                                                                {style.label}
                                                            </span>
                                                            <span className={`text-[10px] font-medium ${TEXT_PARAGRAPH}`}>
                                                                {date} · {time}
                                                            </span>
                                                        </div>

                                                        <p className={`text-sm font-medium ${TEXT_HEADING} break-words`}>
                                                            {content.title}
                                                            {content.subtitle && (
                                                                <span className={`${TEXT_PARAGRAPH} font-normal`}>
                                                                    {" "}({content.subtitle})
                                                                </span>
                                                            )}
                                                        </p>

                                                        {/* PROJECT_UPDATED changes */}
                                                        {changes.length > 0 && (
                                                            <ul className="mt-1.5 space-y-1">
                                                                {changes.map((c, i) => {
                                                                    const d = describeChange(c);
                                                                    return (
                                                                        <li
                                                                            key={i}
                                                                            className="flex flex-wrap items-center gap-1.5 text-[11px]"
                                                                        >
                                                                            <span className={`font-semibold ${TEXT_HEADING}`}>
                                                                                {d.field}:
                                                                            </span>
                                                                                <span className="rounded bg-danger/15 px-1.5 py-0.5 text-danger truncate">
                                                                                    {d.from}
                                                                                </span>
                                                                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                                                <span className="rounded bg-success/15 px-1.5 py-0.5 text-success">
                                                                                {d.to}
                                                                            </span>
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        )}
                                                    </div>

                                                    {/* Who changed it */}
                                                    <div className="shrink-0 text-right">
                                                        <div className={`text-[10px] font-medium uppercase tracking-wide ${TEXT_PARAGRAPH} opacity-70`}>
                                                            {content.actorLabel}
                                                        </div>
                                                        <div className="mt-0.5 flex items-center justify-end gap-1">
                                                            <User className={`h-3 w-3 ${TEXT_PARAGRAPH}`} />
                                                            <span className={`text-xs font-semibold ${TEXT_HEADING}`}>{content.actor}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!loading && !error && (
                    <div
                        className={`flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 bg-muted/50 border-t border-border text-xs ${TEXT_PARAGRAPH}`}
                    >
                        <span>
                            {activityData.length} {activityData.length === 1 ? "activity" : "activities"} total
                        </span>
                        <span>Project #{projectId}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityTab;