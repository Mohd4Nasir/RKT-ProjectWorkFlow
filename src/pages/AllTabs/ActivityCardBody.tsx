import { useState } from "react";
import { ArrowRight, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { actorOf, describeActivity, humanize, metadataFields, type ActivityRow } from "@/utils/activity";

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

interface Props {
    activity: ActivityRow;
    /** colour classes of the activity type badge */
    badgeClass: string;
    /** turns the list / parent task ids of a moved task into names */
    names?: Parameters<typeof describeActivity>[1];
}

/** What happened (sentence), what changed (old → new) and the metadata that came with it. */
const ActivityCardBody = ({ activity, badgeClass, names }: Props) => {
    const [open, setOpen] = useState(false);

    const { verb, details } = describeActivity(activity, names);
    const actor = actorOf(activity as never) || "Unknown user";
    const fields = metadataFields(activity);

    // chips: readable fields that the sentence and the change list don't already say
    const said = verb.toLowerCase();
    const chips = fields.filter(
        (f) =>
            !f.isId &&
            !f.isActor &&
            f.value !== actor &&
            !(f.value.length > 2 && said.includes(f.value.toLowerCase())) &&
            // old / new pairs are already told by the sentence or the change list
            !/^(old|new)[A-Z]/.test(f.key),
    );

    return (
        <div className="flex items-start gap-2.5">
            <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white", avatarColor(actor))}>
                {initials(actor)}
            </span>

            <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5">
                    <p className="min-w-0 flex-1 basis-52 break-words text-[13px] leading-5 text-muted-foreground">
                        <span className="font-semibold text-foreground">{actor}</span> {verb}
                    </p>
                    <span className="flex shrink-0 items-center gap-1 text-[11px] leading-5 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {timeOf(activity.createdAt)}
                    </span>
                </div>

                {/* old → new */}
                {details.length > 0 && (
                    <ul className="space-y-1 rounded-md bg-muted/50 px-2.5 py-2 text-xs">
                        {details.map((d, i) => (
                            <li key={`${d.label}-${i}`} className="flex flex-wrap items-center gap-1.5">
                                <span className="font-semibold text-foreground">{d.label}:</span>
                                {d.from !== undefined && d.to !== undefined ? (
                                    <>
                                        <span className="max-w-full break-words rounded bg-rose-500/10 px-1.5 py-px text-rose-700 line-through decoration-rose-400/60 dark:text-rose-300">
                                            {d.from}
                                        </span>
                                        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                                        <span className="max-w-full break-words rounded bg-emerald-500/10 px-1.5 py-px font-medium text-emerald-700 dark:text-emerald-300">
                                            {d.to}
                                        </span>
                                    </>
                                ) : (
                                    <span className="break-words text-muted-foreground">{d.value}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                <div className="flex flex-wrap items-center gap-1.5">
                    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", badgeClass)}>
                        {(activity.activityType ?? "").replace(/_/g, " ")}
                    </span>

                    {chips.map((f) => (
                        <span key={f.key} title={`${f.label}: ${f.value}`} className="inline-flex max-w-full items-center gap-1 rounded border border-border bg-card px-1.5 py-0.5 text-[11px]">
                            <span className="shrink-0 text-muted-foreground">{f.label}:</span>
                            <span className="max-w-[240px] truncate font-medium text-foreground">{f.value}</span>
                        </span>
                    ))}

                    {fields.length > 0 && (
                        <button
                            type="button"
                            aria-expanded={open}
                            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                            className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/10"
                        >
                            {open ? "Hide details" : "All details"}
                            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
                        </button>
                    )}
                </div>

                {/* everything the server sent; clicks here don't open the row, so text can be selected */}
                {open && (
                    <dl
                        onClick={(e) => e.stopPropagation()}
                        className="grid cursor-auto grid-cols-1 gap-x-4 gap-y-2 rounded-md border border-border bg-muted/30 p-2.5 text-xs sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {[
                            ...fields,
                            { key: "_resource", label: "Resource", value: humanize(activity.resourceType) },
                            { key: "_id", label: "Activity id", value: String(activity.id) },
                        ]
                            .filter((f) => f.value)
                            .map((f) => (
                                <div key={f.key} className="min-w-0">
                                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</dt>
                                    <dd className="break-words text-foreground">{f.value}</dd>
                                </div>
                            ))}
                    </dl>
                )}
            </div>
        </div>
    );
};

export default ActivityCardBody;
