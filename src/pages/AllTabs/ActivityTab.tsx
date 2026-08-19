import React, { useEffect } from "react";
import { projectApiService } from "@/services/projectsApiService";
import {
    Activity as ActivityIcon,
    User,
    UserPlus,
    FolderPlus,
    ClipboardList,
    Clock,
    RefreshCw,
    AlertCircle,
    Inbox,
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

const TEXT_HEADING = "text-[hsl(223,100%,17%)]";
const TEXT_PARAGRAPH = "text-[hsl(224,63%,25%)]";
const BORDER_HEADING = "border-[hsl(223,100%,17%,0.12)]";

const ACTIVITY_COLOR_MAP: Record<string, string> = {
    created: "bg-primary-55",
    updated: "bg-accent-55",
    completed: "bg-secondary-55",
    member: "bg-accent-55",
    project: "bg-primary-55",
    default: "bg-paragraph-55",
};

const getActivityColor = (activityType: string) => {
    const key = activityType?.toLowerCase() ?? "";
    if (key.includes("member")) return ACTIVITY_COLOR_MAP.member;
    if (key.includes("project")) return ACTIVITY_COLOR_MAP.project;
    if (key.includes("creat")) return ACTIVITY_COLOR_MAP.created;
    if (key.includes("updat") || key.includes("edit")) return ACTIVITY_COLOR_MAP.updated;
    if (key.includes("complet") || key.includes("done")) return ACTIVITY_COLOR_MAP.completed;
    return ACTIVITY_COLOR_MAP.default;
};

const getActivityIcon = (activityType: string) => {
    const key = activityType?.toLowerCase() ?? "";
    if (key.includes("member")) return UserPlus;
    if (key.includes("project")) return FolderPlus;
    if (key.includes("task")) return ClipboardList;
    return ActivityIcon;
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
    const [activityData, setActivityData] = React.useState<Activity[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);

    const fetchActivityData = async (id: number) => {
        try {
            setLoading(true);
            setError(null);

            const response = await projectApiService.activtiyTracker(id);
            setActivityData(response.data);
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

    return (
        <div className="w-full bg-secondary-55/40 rounded-2xl p-2 sm:p-4">
            <div className={`rounded-2xl border ${BORDER_HEADING} bg-white shadow-sm overflow-hidden`}>
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
                        onClick={() => fetchActivityData(projectId)}
                        disabled={loading}
                        className={`flex items-center justify-center gap-1.5 self-start sm:self-auto rounded-lg bg-white px-3 py-1.5 text-xs font-medium ${TEXT_HEADING} ring-1 ring-[hsl(223,100%,17%,0.15)] hover:bg-gray-50 transition disabled:opacity-50`}
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
                                    <div className="h-8 w-8 rounded-full bg-gray-200 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-1/3 rounded bg-gray-200" />
                                        <div className="h-14 rounded-xl bg-gray-100" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-red-600 ring-1 ring-red-100">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {!loading && !error && activityData.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                            <Inbox className="h-8 w-8 text-gray-300" />
                            <p className={`text-sm ${TEXT_PARAGRAPH}`}>
                                No activity data available.
                            </p>
                        </div>
                    )}

                    {!loading && !error && activityData.length > 0 && (
                        <div
                            className="max-h-[420px] sm:max-h-[520px] overflow-y-auto pr-2 -mr-2
                                       [scrollbar-width:thin] [scrollbar-color:hsl(223,100%,17%,0.2)_transparent]
                                       [&::-webkit-scrollbar]:w-1.5
                                       [&::-webkit-scrollbar-track]:bg-transparent
                                       [&::-webkit-scrollbar-thumb]:bg-[hsl(223,100%,17%,0.2)]
                                       [&::-webkit-scrollbar-thumb]:rounded-full"
                        >
                            <ol className="relative border-l-2 border-gray-200 ml-3">
                                {activityData.map((activity) => {
                                    const colorClass = getActivityColor(activity.activityType);
                                    const Icon = getActivityIcon(activity.activityType);
                                    const { date, time } = formatRelativeOrDate(activity.createdAt);
                                    const content = resolveActivityContent(activity);

                                    return (
                                        <li key={activity.id} className="mb-6 ml-6 last:mb-0">
                                            {/* Chain node */}
                                            <span
                                                className={`absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${colorClass}`}
                                            >
                                                <span className="h-2 w-2 rounded-full bg-white" />
                                            </span>

                                            {/* Card */}
                                            <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 mb-3">
                                                    <span
                                                        className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${colorClass} ${TEXT_HEADING}`}
                                                    >
                                                        <Icon className="h-3 w-3" />
                                                        {activity.activityType.replace(/_/g, " ")}
                                                    </span>

                                                    <span className={`flex items-center gap-1 text-xs ${TEXT_PARAGRAPH} shrink-0`}>
                                                        <Clock className="h-3 w-3" />
                                                        {date} · {time}
                                                    </span>
                                                </div>

                                                <p className={`text-sm font-medium ${TEXT_HEADING} mb-2 break-words`}>
                                                    {content.title}
                                                    {content.subtitle && (
                                                        <span className={`${TEXT_PARAGRAPH} font-normal`}>
                                                            {" "}({content.subtitle})
                                                        </span>
                                                    )}
                                                </p>

                                                <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs ${TEXT_PARAGRAPH}`}>
                                                    <span className="flex items-center gap-1.5">
                                                        <User className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="truncate">{content.actor}</span>
                                                    </span>
                                                    <span className="w-fit rounded-md bg-gray-100 px-2 py-0.5">
                                                        {content.tag}
                                                    </span>
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
                        className={`flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 bg-gray-50 border-t border-gray-200 text-xs ${TEXT_PARAGRAPH}`}
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