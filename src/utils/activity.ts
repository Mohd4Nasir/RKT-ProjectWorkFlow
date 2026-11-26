/**
 * GET /activities/project/{id} and GET /activities/task/{id} rows carry different `metadata` keys per activityType
 * (createdByUserName, addedByUserName, updatedByUserName, performedByUserName ...). Instead of listing every spelling,
 * look for the known ones first and then for any "…by…name" / "user…name" style key, in metadata and on the row itself.
 */

import { format } from 'date-fns';

type Bag = Record<string, unknown>;

const KNOWN = [
  'createdByUserName', 'updatedByUserName', 'addedByUserName', 'assignedByUserName', 'changedByUserName',
  'movedByUserName', 'deletedByUserName', 'removedByUserName', 'modifiedByUserName', 'completedByUserName', 'performedByUserName',
  'createdByName', 'updatedByName', 'addedByName', 'assignedByName', 'changedByName', 'deletedByName', 'removedByName',
  'createdBy', 'updatedBy', 'addedBy', 'assignedBy', 'changedBy', 'deletedBy', 'removedBy', 'performedBy',
  'userName', 'actorName', 'actor', 'user',
];

/** a real display name: non-empty text that is not just an id */
const name = (v: unknown): string => {
  if (typeof v !== 'string') return '';
  const s = v.trim();
  return s && !/^\d+$/.test(s) ? s : '';
};

/** keys that describe somebody *else* in the event (the member that was added, the new assignee, …) */
const OTHER = /^(member|assignee|assignedTo|previousAssignee|unassigned|target|task|project|owner|resource|new|old)/i;
const ACTORISH = /(by|user|actor|author|performer)/i;

export function actorOf(row: { metadata?: Bag | null } & Bag): string {
  const sources: Bag[] = [row.metadata ?? {}, row];
  for (const src of sources) {
    for (const k of KNOWN) {
      const v = name(src[k]);
      if (v) return v;
    }
  }
  for (const src of sources) {
    for (const [k, raw] of Object.entries(src)) {
      if (OTHER.test(k) || !ACTORISH.test(k) || !/name$/i.test(k)) continue;
      const v = name(raw);
      if (v) return v;
    }
  }
  return '';
}

/* ───────── describing a row (all activityTypes of the project + task feeds) ───────── */

export type ActivityCategory = 'TASK' | 'COMMENT' | 'ISSUE' | 'ATTACHMENT' | 'WORKLOG';
export type ActivityTone = 'blue' | 'violet' | 'emerald' | 'amber' | 'teal' | 'rose' | 'slate';
export type ActivityIconKey = 'time' | 'folder' | 'created' | 'updated' | 'done' | 'removed' | 'member' | 'comment' | 'issue' | 'file' | 'move' | 'generic';

export interface ActivityRow {
  id: number;
  projectId?: number;
  taskId?: number | null;
  resourceType?: string;
  activityType?: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

/** GET /activities/task/{taskId} → data */
export interface TaskActivityPage {
  content: ActivityRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface Described {
  verb: string;
  icon: ActivityIconKey;
  tone: ActivityTone;
  /** `from`/`to` are set when the row is an old → new change */
  details: { label: string; value: string; from?: string; to?: string }[];
}

const s = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '');

/** raw enum → "In progress" */
export const humanize = (v: unknown) => {
  const raw = s(v).replace(/_/g, ' ').toLowerCase();
  const t = raw === 'todo' ? 'to do' : raw;
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
};

/** FieldChange values are always strings and "unset" comes as the string "null" */
const val = (v: unknown) => {
  const t = s(v);
  return !t || t === 'null' ? 'none' : t;
};

const FIELD_LABEL: Record<string, string> = {
  projectTitle: 'Title', projectDescription: 'Description', startDate: 'Start date', endDate: 'End date', projectStatus: 'Status',
  listTitle: 'Name', teamRole: 'Role',
  taskTitle: 'Title', taskDescription: 'Description', taskStartDate: 'Start date', taskEndDate: 'Due date', taskStatus: 'Status', taskPriority: 'Priority',
  taskList: 'List', parentTask: 'Parent task',
  title: 'Title', description: 'Description', type: 'Type', severity: 'Severity',
};
const ENUM_FIELDS = new Set(['projectStatus', 'taskStatus', 'taskPriority', 'teamRole', 'type', 'severity']);

interface Change { fieldName?: string; oldValue?: unknown; newValue?: unknown }
const changesOf = (m: Record<string, unknown>): Change[] => (Array.isArray(m.changes) ? (m.changes as Change[]) : []);

const diff = (label: string, from: string, to: string) => ({ label, value: `${from} → ${to}`, from, to });

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

const fmtChange = (c: Change) => {
  const f = c.fieldName ?? '';
  const show = (v: unknown) => {
    const t = val(v);
    if (t === 'none') return t;
    if (ENUM_FIELDS.has(f)) return humanize(t);
    return ISO_DAY.test(t) ? fmtDay(t) : plainText(t);
  };
  return diff(FIELD_LABEL[f] ?? humanize(f), show(c.oldValue), show(c.newValue));
};

/** which task-feed tab a row belongs to (null = not part of a task feed) */
export function categoryOfActivity(a: Pick<ActivityRow, 'resourceType'>): ActivityCategory | null {
  switch ((a.resourceType ?? '').toUpperCase()) {
    case 'TASK': case 'TASK_CONTRIBUTOR': return 'TASK';
    case 'COMMENT': return 'COMMENT';
    case 'ISSUE': case 'ISSUE_COMMENT': return 'ISSUE';
    case 'ATTACHMENT': return 'ATTACHMENT';
    case 'TASK_WORKLOG': return 'WORKLOG';
    default: return null;
  }
}

interface BoardTask { taskId: number; taskTitle: string; subTask?: BoardTask[] }
interface BoardList { listId: number; listTitle: string; tasks?: unknown[] }

/** TASK_MOVED carries ids: resolve them from the board, then from names stored on other activity rows */
export function moveNames(lists: BoardList[], rows: ActivityRow[] = []) {
  const listName = new Map<string, string>();
  const taskName = new Map<string, string>();
  const put = (map: Map<string, string>, id: unknown, title: unknown) => { if (s(id) && s(title)) map.set(s(id), s(title)); };
  // oldest first, so a later rename wins
  [...rows].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)).forEach(({ metadata: m }) => {
    put(listName, m?.taskListId, m?.taskListTitle);
    put(taskName, m?.taskId, m?.taskName ?? m?.taskTitle);
  });
  const walk = (nodes: BoardTask[] = []) => nodes.forEach((n) => { put(taskName, n.taskId, n.taskTitle); walk(n.subTask); });
  lists.forEach((l) => { put(listName, l.listId, l.listTitle); walk(l.tasks as BoardTask[]); });
  return (kind: 'taskList' | 'parentTask', id: string) => (kind === 'taskList' ? listName : taskName).get(id);
}

/** "2026-11-04" -> "04 Nov 2026" (plain date, no timezone shift) */
const fmtDay = (v: unknown) => {
  const t = s(v);
  const d = t ? new Date(`${t.slice(0, 10)}T00:00:00`) : null;
  return d && !isNaN(+d) ? format(d, 'dd MMM yyyy') : t || 'a day';
};

/** 150 -> "2h 30m" */
const fmtMins = (v: unknown) => {
  const n = Math.max(0, Math.round(Number(v) || 0));
  const h = Math.floor(n / 60);
  const r = n % 60;
  return !h ? `${r}m` : r ? `${h}h ${r}m` : `${h}h`;
};

const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`);

/**
 * "{actor} {verb}" for one row. Unknown types fall back to a generic row, so a new backend type never breaks the renderer.
 * `names` lets the caller turn the ids TASK_MOVED carries (list id / parent task id) into names.
 */
export function describeActivity(
  a: ActivityRow,
  names?: (kind: 'taskList' | 'parentTask', id: string) => string | undefined,
): Described {
  const m = (a.metadata ?? {}) as Record<string, unknown>;
  const type = (a.activityType ?? '').toUpperCase();
  const issue = s(m.issueTitle);
  const quoted = (t: string) => (t ? `“${t.length > 50 ? t.slice(0, 50) + '…' : t}”` : 'an issue');
  const d = (verb: string, icon: ActivityIconKey, tone: ActivityTone, details: Described['details'] = []): Described => ({ verb, icon, tone, details });
  const changes = changesOf(m).map(fmtChange);
  const quoted2 = (t: string) => (t ? `“${t}”` : 'a folder');
  /** exactly one change: "changed status of X" / "set due date of X" */
  const edited = (target: string, fallback: string) => {
    const [c] = changes;
    return changes.length === 1 ? `${c.from === 'none' ? 'set' : 'changed'} ${c.label.toLowerCase()} of ${target}` : fallback;
  };

  switch (type) {
    case 'PROJECT_CREATED': return d(`created project ${s(m.projectTitle)}`.trim(), 'created', 'emerald');
    case 'PROJECT_UPDATED':
      return d(edited(s(m.projectTitle) || 'the project', `updated project ${s(m.projectTitle)}`.trim()), 'updated', 'amber', changes);
    case 'TASKLIST_CREATED': return d(`created list ${s(m.taskListTitle)}`.trim(), 'created', 'emerald');
    case 'TASKLIST_UPDATED': {
      const rename = changesOf(m).find((c) => c.fieldName === 'listTitle');
      if (rename) return d(`renamed list ${val(rename.oldValue)} to ${val(rename.newValue)}`, 'updated', 'amber');
      return d(`updated list ${s(m.taskListTitle)}`.trim(), 'updated', 'amber', changes);
    }
    case 'MEMBER_ADDED': return d(`added ${s(m.memberName) || 'a member'} as ${humanize(m.memberRole) || 'member'}`, 'member', 'violet');
    case 'MEMBER_REMOVED': return d(`removed ${s(m.memberName) || 'a member'} from the project`, 'removed', 'rose');
    case 'MEMBER_ROLE_UPDATED': return d(`changed ${s(m.memberName) || 'a member'}’s role`, 'member', 'violet', changes);

    case 'TASK_CREATED': return d(`created task ${s(m.taskName)}`.trim(), 'created', 'emerald');
    case 'TASK_UPDATED': {
      const st = changesOf(m).find((c) => c.fieldName === 'taskStatus');
      // an issue raised/reopened on a finished task moves it back automatically
      const auto = changes.length === 1 && !!st && ['COMPLETED', 'CLOSED'].includes(s(st.oldValue).toUpperCase()) && s(st.newValue).toUpperCase() === 'IN_PROGRESS';
      const task = s(m.taskName) || 'the task';
      const verb = auto ? `moved ${task} back to In progress because of an open issue` : edited(task, `updated task ${s(m.taskName)}`.trim());
      return d(verb, 'updated', 'amber', changes);
    }
    case 'TASK_MOVED': {
      const rows = changesOf(m).map((c) => {
        const f = c.fieldName === 'parentTask' ? 'parentTask' : 'taskList';
        const nm = (v: unknown) => (val(v) === 'none' ? (f === 'parentTask' ? 'top level' : 'none') : names?.(f, val(v)) ?? `#${val(v)}`);
        return diff(FIELD_LABEL[f], nm(c.oldValue), nm(c.newValue));
      });
      return d(`moved task ${s(m.taskName)}`.trim(), 'move', 'blue', rows);
    }
    case 'TASK_ASSIGNED':
      return d(`added ${s(m.assignedToUserName) || 'someone'} to ${s(m.taskTitle) || 'the task'} as ${humanize(m.assignedTaskRole) || 'assignee'}`, 'member', 'violet');

    case 'COMMENT_ADDED': return d('commented on the task', 'comment', 'blue');
    case 'COMMENT_EDITED': return d('edited a comment', 'comment', 'blue');
    case 'COMMENT_DELETED': return d('deleted a comment', 'removed', 'rose');

    case 'ATTACHMENT_UPLOADED': case 'ATTACHMENT_DELETED': {
      const up = type === 'ATTACHMENT_UPLOADED';
      const owner = humanize(m.ownerType).toLowerCase() || 'item';
      const size = Number(m.fileSize);
      return d(`${up ? 'attached' : 'removed'} ${s(m.filename) || 'a file'}${size > 0 ? ` (${fmtSize(size)})` : ''} ${up ? 'to' : 'from'} the ${owner}`, 'file', up ? 'violet' : 'rose');
    }

    case 'FOLDER_CREATED': return d(`created folder ${quoted2(s(m.name))} in ${s(m.parentFolderName) || 'Documents'}`, 'folder', 'emerald');
    case 'FOLDER_RENAMED': return d(`renamed folder ${quoted2(s(m.oldName))} to ${quoted2(s(m.newName))}`, 'folder', 'amber');
    case 'FOLDER_MOVED': return d(`moved folder ${quoted2(s(m.name))} from ${s(m.fromParentFolderName) || 'Documents'} to ${s(m.toParentFolderName) || 'Documents'}`, 'move', 'blue');
    case 'FOLDER_DELETED': return d(`deleted folder ${quoted2(s(m.name))} from ${s(m.parentFolderName) || 'Documents'}`, 'removed', 'rose');
    case 'FILE_MOVED': return d(`moved ${s(m.filename) || 'a file'} from ${s(m.fromFolderName) || 'Documents'} to ${s(m.toFolderName) || 'Documents'}`, 'move', 'blue');
    case 'FILE_DESCRIPTION_UPDATED': {
      const o = s(m.oldDescription), n = s(m.newDescription);
      const file = s(m.filename) || 'a file';
      const verb = !o && n ? `added a description to ${file}` : o && !n ? `removed the description of ${file}` : `updated the description of ${file}`;
      return d(verb, 'file', 'amber',
        n || o ? [diff('Description', o ? `“${o}”` : 'none', n ? `“${n}”` : 'none')] : []);
    }

    case 'ISSUE_CREATED': {
      const who = s(m.assigneeName);
      const kind = [humanize(m.severity), s(m.issueType) ? humanize(m.issueType).toLowerCase() : 'issue'].filter(Boolean).join(' ');
      return d(`raised a ${kind} ${quoted(issue)}${who ? ` · assigned to ${who}` : ''}`, 'issue', 'rose');
    }
    case 'ISSUE_UPDATED':
      return d(edited(`issue ${quoted(issue)}`, `updated issue ${quoted(issue)}`), 'updated', 'amber', changes);
    case 'ISSUE_STATUS_CHANGED': {
      const to = s(m.newStatus).toUpperCase();
      const word = to === 'CLOSED' ? 'closed' : to === 'REOPENED' ? 'reopened' : `marked ${quoted(issue)} as ${humanize(to)}`;
      const finished = to === 'RESOLVED' || to === 'CLOSED';
      return d(to === 'CLOSED' || to === 'REOPENED' ? `${word} issue ${quoted(issue)}` : word, finished ? 'done' : 'issue', finished ? 'teal' : 'amber',
        s(m.oldStatus) ? [diff('Status', humanize(m.oldStatus), humanize(m.newStatus))] : []);
    }
    case 'ISSUE_ASSIGNED':
      return d(s(m.previousAssigneeId)
        ? `reassigned issue ${quoted(issue)} from ${s(m.previousAssigneeName) || 'someone'} to ${s(m.assigneeName) || 'someone'}`
        : `assigned issue ${quoted(issue)} to ${s(m.assigneeName) || 'someone'}`, 'member', 'violet');
    case 'ISSUE_UNASSIGNED': return d(`removed ${s(m.unassignedUserName) || 'the assignee'} from issue ${quoted(issue)}`, 'member', 'slate');
    case 'ISSUE_DELETED': return d(`deleted issue ${quoted(issue)}`, 'removed', 'rose');
    case 'ISSUE_COMMENT_ADDED': return d('commented on an issue', 'comment', 'blue');
    case 'ISSUE_COMMENT_EDITED': return d('edited an issue comment', 'comment', 'blue');
    case 'ISSUE_COMMENT_DELETED': return d('deleted an issue comment', 'removed', 'rose');

    // the description text is not in the metadata, the work log list has it
    case 'WORKLOG_ADDED': return d(`logged ${fmtMins(m.timeSpentMinutes)} for ${fmtDay(m.workDate)}`, 'time', 'amber');
    case 'WORKLOG_EDITED': {
      const oldD = s(m.oldWorkDate), newD = s(m.newWorkDate);
      const oldT = Number(m.oldTimeSpentMinutes), newT = Number(m.newTimeSpentMinutes);
      const dateChanged = !!oldD && !!newD && oldD !== newD;
      const timeChanged = Number.isFinite(oldT) && Number.isFinite(newT) && oldT !== newT;
      const timeRow = timeChanged ? [diff('Time', fmtMins(oldT), fmtMins(newT))] : [];
      if (dateChanged) return d(`moved a work log from ${fmtDay(oldD)} to ${fmtDay(newD)}`, 'time', 'amber', timeRow);
      if (timeChanged) return d(`changed the work log for ${fmtDay(newD || oldD)} from ${fmtMins(oldT)} to ${fmtMins(newT)}`, 'time', 'amber');
      return d(`edited a work log for ${fmtDay(newD || oldD)}`, 'time', 'amber');
    }
    case 'WORKLOG_DELETED': {
      // an owner/manager can delete somebody else's entry
      const own = s(m.worklogUserId) !== '' && s(m.worklogUserId) === s(m.performedByUserId);
      const owner = s(m.worklogUserName);
      const whose = own || !owner ? 'their' : `${owner}’s`;
      return d(`deleted ${whose} work log of ${fmtMins(m.timeSpentMinutes)} for ${fmtDay(m.workDate)}`, 'removed', 'rose');
    }
    default: return d(humanize(type) || 'did something', 'generic', 'slate');
  }
}

/* ───────── every metadata key as a readable label + value ───────── */

export interface MetaField {
  key: string;
  label: string;
  value: string;
  /** technical id: only worth showing in the full details */
  isId: boolean;
  /** says who did it (already shown as the actor) */
  isActor: boolean;
}

/** descriptions / comments may arrive as rich text */
function plainText(t: string) {
  if (!/<\/?[a-z][^>]*>/i.test(t)) return t;
  const spaced = t.replace(/<(br|\/p|\/div|\/li)[^>]*>/gi, ' $&');
  return (new DOMParser().parseFromString(spaced, 'text/html').body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** "assignedToUserName" -> "Assigned to", "timeSpentMinutes" -> "Time spent" */
const labelOf = (key: string) => {
  if (FIELD_LABEL[key]) return FIELD_LABEL[key];
  if (/^file_?name$/i.test(key)) return 'File';
  const short = key.replace(/(?<=.)(UserName|Name|Minutes)$/, '');
  return humanize(short.replace(/([a-z0-9])([A-Z])/g, '$1 $2'));
};

const metaValue = (key: string, v: unknown): string => {
  if (v === null || v === undefined || v === '' || v === 'null') return '';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) return v.map((x) => metaValue(key, x)).filter(Boolean).join(', ');
  if (typeof v === 'object') {
    return Object.entries(v as Bag)
      .map(([k, x]) => [labelOf(k), metaValue(k, x)])
      .filter(([, x]) => x)
      .map(([k, x]) => `${k}: ${x}`)
      .join(' · ');
  }
  const t = String(v).trim();
  if (/minutes$/i.test(key) && Number.isFinite(Number(t))) return fmtMins(t);
  if (/size$/i.test(key) && /file/i.test(key) && Number.isFinite(Number(t))) return fmtSize(Number(t));
  if (ISO_DAY.test(t)) return fmtDay(t);
  if (/^\d{4}-\d{2}-\d{2}T/.test(t) && !isNaN(+new Date(t))) return format(new Date(t), 'dd MMM yyyy, hh:mm a');
  // enums: IN_PROGRESS, or HIGH on a status / priority / role / type key
  if (/^[A-Z]+(_[A-Z]+)*$/.test(t) && (t.includes('_') || /(status|priority|severity|role|type)$/i.test(key))) return humanize(t);
  return plainText(t);
};

/** all filled metadata keys of a row; `changes` is left to describeActivity().details */
export function metadataFields(a: Pick<ActivityRow, 'metadata' | 'activityType'>): MetaField[] {
  const comment = /^COMMENT_/i.test(a.activityType ?? '');
  return Object.entries((a.metadata ?? {}) as Bag)
    .filter(([key]) => key !== 'changes' && !(comment && key === 'content'))
    .map(([key, raw]) => ({
      key,
      label: labelOf(key),
      value: metaValue(key, raw),
      isId: /(^id|Id|Ids|ID)$/.test(key),
      isActor: KNOWN.includes(key) || /By(User)?(Name|Id)?$/.test(key),
    }))
    .filter((f) => f.value);
}

/* ───────── where a click on an activity row should lead ───────── */

export type PanelKey = 'comments' | 'hours' | 'documents' | 'issues' | 'activity';

export interface ActivityTarget {
  /** project tab to show */
  tab: 'dashboard' | 'tasks' | 'documents' | 'users';
  /** task whose side panel should open */
  task?: number;
  /** tab inside that panel */
  panel?: PanelKey;
  /** issue whose detail should open (inside the Issues tab) */
  issue?: number;
  /** documents folder to open (uuid) */
  folder?: string;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** null = nothing sensible to open */
export function activityTarget(a: ActivityRow): ActivityTarget | null {
  const m = (a.metadata ?? {}) as Record<string, unknown>;
  const type = (a.activityType ?? '').toUpperCase();
  const task = num(a.taskId ?? m.taskId);

  if (type.startsWith('PROJECT_')) return { tab: 'dashboard' };
  if (type.startsWith('TASKLIST_')) return { tab: 'tasks' };
  if (type.startsWith('MEMBER_')) return { tab: 'users' };

  // deleted issues / folders no longer exist: nothing to link to
  if (type === 'ISSUE_DELETED' || type === 'FOLDER_DELETED') return null;
  if (type.startsWith('ISSUE_')) return task ? { tab: 'tasks', task, panel: 'issues', issue: num(m.issueId) } : null;
  if (type.startsWith('COMMENT_')) return task ? { tab: 'tasks', task, panel: 'comments' } : null;
  if (type.startsWith('WORKLOG_')) return task ? { tab: 'tasks', task, panel: 'hours' } : null;

  if (type.startsWith('FOLDER_')) return { tab: 'documents', folder: s(m.folderId) || undefined };
  if (type === 'FILE_MOVED') return { tab: 'documents', folder: s(m.toFolderId) || undefined };
  if (type === 'FILE_DESCRIPTION_UPDATED') {
    const owner = s(m.ownerType).toUpperCase();
    if (owner === 'ISSUE') return task ? { tab: 'tasks', task, panel: 'issues', issue: num(m.ownerId) } : null;
    if (owner === 'TASK') return task ? { tab: 'tasks', task, panel: 'documents' } : null;
    return { tab: 'documents' };
  }

  if (type.startsWith('ATTACHMENT_')) {
    const owner = s(m.ownerType).toUpperCase();
    if (owner === 'PROJECT') return { tab: 'documents' };
    if (owner === 'ISSUE') return task ? { tab: 'tasks', task, panel: 'issues', issue: num(m.ownerId) } : null;
    return task ? { tab: 'tasks', task, panel: 'documents' } : null;
  }

  if (type.startsWith('TASK_')) return task ? { tab: 'tasks', task } : { tab: 'tasks' };
  return task ? { tab: 'tasks', task } : null;
}

/** query string understood by ProjectDetails (?tab=), TasksTab (?task=) and the task panel (?panel=&issue=) */
export const targetToParams = (t: ActivityTarget): URLSearchParams => {
  const p = new URLSearchParams({ tab: t.tab });
  if (t.task) p.set('task', String(t.task));
  if (t.panel) p.set('panel', t.panel);
  if (t.issue) p.set('issue', String(t.issue));
  if (t.folder) p.set('folder', t.folder);
  return p;
};
