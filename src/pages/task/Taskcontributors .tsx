import { useEffect, useRef, useState, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { taskService } from '@/services/taskservice';
import { T } from './Taskdetailshared';
import { showError } from '@/lib/errorAlert';

/**
 * Uses these taskService methods (see taskservice.ts):
 *
 *   getTaskMembers(taskId)                             -> GET  /task/{taskId}/task-member
 *   getTaskMemberRoles()                                -> GET  /task/roles
 *   getNotAssignedMembers(taskId)                       -> GET  /task/{taskId}/not-assigned-member
 *   assignTaskMember({ userId, taskId, taskMemberRole }) -> POST /task/assign-task
 *
 * Roles are GLOBAL enum values (e.g. "PRIMARY_ASSIGNEE"), not per-task ids — fetched once.
 * The same assign-task call is used both to add a brand-new contributor and to change an
 * existing contributor's role, since it's an upsert keyed by (userId, taskId).
 *
 * NOTE: no normalization layer here — roles and assignable users are used exactly as the
 * API returns them. That means:
 *   - getTaskMemberRoles() must return objects shaped like { value, label }
 *   - getNotAssignedMembers() must return objects shaped like { userId, name }
 * If the API ever returns plain strings or differently-named fields, this will need
 * a normalize step again (or the API contract needs to match these shapes).
 */

// API returns roles as plain enum strings, e.g. ["PRIMARY_ASSIGNEE", "ASSIGNEE", ...]
type Role = string;

interface Member {
  userTaskRole: string;
  email: string;
  userId: string | number;
  name: string;
  assignedBy?: string;
  assignedOn?: string;
  taskId?: string | number;
}

interface AssignableUser {
  userId: string | number;
  name: string;
}

interface TaskContributorsProps {
  taskId: string | number;
}

function humanizeRole(raw: string): string {
  return raw
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ---- Colored initials avatar -------------------------------------------------
// Palette picked to stay legible on white with T.navy text, cycling by a hash of
// the person's name/id so the same person always gets the same color.
const AVATAR_PALETTE = [
  '#FDE2E4', // blush
  '#DDEDEA', // mint
  '#FFF1D6', // sand
  '#E1E8FF', // periwinkle
  '#F6E2FF', // lilac
  '#D9F2E6', // seafoam
  '#FFE3D1', // peach
  '#DCEFFB', // sky
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function InitialsAvatar({ name, id }: { name: string; id: string | number }) {
  const color = AVATAR_PALETTE[hashString(String(id) + name) % AVATAR_PALETTE.length];
  return (
    <div
      className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
      style={{ backgroundColor: color, color: T.navy }}
    >
      {getInitials(name)}
    </div>
  );
}
// -------------------------------------------------------------------------------

let rolesCache: Role[] | null = null; // roles are global — fetch once per session

export function TaskContributors({ taskId }: TaskContributorsProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [roles, setRoles] = useState<Role[]>(rolesCache ?? []);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [loadingAssignable, setLoadingAssignable] = useState(false);

  const [newUserId, setNewUserId] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');
  const [adding, setAdding] = useState(false);

  const [updatingUserId, setUpdatingUserId] = useState<string | number | null>(null);

  // Load current contributors whenever the task changes
  const latestTask = useRef(taskId);
  latestTask.current = taskId;
  const loadMembers = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoadingMembers(true);
      const res = await taskService.getTaskMembers(taskId);
      if (latestTask.current === taskId) setMembers(res);
    } catch (err) {
      console.error(err);
      showError(err, 'Failed to load contributors');
    } finally {
      setLoadingMembers(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Roles are global — fetch once on mount
  useEffect(() => {
    if (rolesCache) return;
    const loadRoles = async () => {
      try {
        setLoadingRoles(true);
        const res = await taskService.getTaskMemberRoles();
        rolesCache = res;
        setRoles(res);
      } catch (err) {
        console.error(err);
        showError(err, 'Failed to load roles');
      } finally {
        setLoadingRoles(false);
      }
    };
    loadRoles();
  }, []);

  // Open the "add contributor" form -> fetch users not yet on this task
  const handleOpenAddForm = async () => {
    setShowAddForm(true);
    setNewUserId('');
    setNewRole('');
    try {
      setLoadingAssignable(true);
      const res = await taskService.getNotAssignedMembers(taskId);
      setAssignableUsers(res);
    } catch (err) {
      console.error(err);
      showError(err, 'Failed to load available users');
    } finally {
      setLoadingAssignable(false);
    }
  };

  const handleAddMember = async () => {
    if (!newUserId || !newRole) return;
    try {
      setAdding(true);
      await taskService.assignTaskMember({ userId: newUserId, taskId, taskMemberRole: newRole });
      await loadMembers();
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      showError(err, 'Failed to add contributor');
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (member: Member, userTaskRole: string) => {
    const previousRole = member.userTaskRole;
    // optimistic update
    setMembers((prev) =>
      prev.map((m) => (m.userId === member.userId ? { ...m, userTaskRole } : m)),
    );
    try {
      setUpdatingUserId(member.userId);
      await taskService.assignTaskMember({ userId: member.userId, taskId, taskMemberRole: userTaskRole });
    } catch (err) {
      console.error(err);
      showError(err, 'Failed to update role');
      // revert on failure
      setMembers((prev) =>
        prev.map((m) => (m.userId === member.userId ? { ...m, userTaskRole: previousRole } : m)),
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden flex flex-col w-full border 1px solid" style={{ border: `1px solid hsl(var(--border))` }}>
      <div
        className="px-4 py-3 text-sm font-bold flex items-center justify-between flex-shrink-0"
        style={{
          backgroundColor: `hsl(var(--info) / 0.12)`,
          borderBottom: `1px solid hsl(var(--border))`,
          color: 'hsl(var(--foreground))',
        }}
      >
        Task Contributors
        <button
          onClick={() => (showAddForm ? setShowAddForm(false) : handleOpenAddForm())}
          className="h-6 w-6 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
          style={{ backgroundColor: showAddForm ? `${T.pink}22` : T.pink, color: showAddForm ? T.pink : T.white }}
          title={showAddForm ? 'Cancel' : 'Add contributor'}
        >
          {showAddForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </button>
      </div>

      {showAddForm && (
        <div
          className="p-3 space-y-2 flex-shrink-0"
          style={{ backgroundColor: `hsl(var(--muted))`, borderBottom: `1px solid hsl(var(--border))` }}
        >
          {/* Dropdown 1: user to add, from GET /task/{taskId}/not-assigned-member */}
          <Select value={newUserId} onValueChange={setNewUserId}>
            <SelectTrigger
              className="w-full h-8 rounded-lg px-2 text-xs font-semibold"
              style={{ backgroundColor: 'hsl(var(--popover))', border: `1px solid hsl(var(--border))`, color: 'hsl(var(--foreground))' }}
            >
              <SelectValue placeholder={loadingAssignable ? 'Loading users…' : 'Select a member to add'} />
            </SelectTrigger>
            <SelectContent
              className="z-[1000]"
              style={{ backgroundColor: 'hsl(var(--popover))', border: `1px solid hsl(var(--border))` }}
              position="popper"
              sideOffset={4}
              align="start"
            >
              {assignableUsers.length === 0 ? (
                <div className="px-3 py-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {loadingAssignable ? 'Loading…' : 'No users available to add'}
                </div>
              ) : (
                assignableUsers.map((u) => (
                <SelectItem
  key={u.userId}
  value={String(u.userId)}
  className="text-xs"
  style={{ color: 'hsl(var(--foreground))' }}
>
  <div className="flex items-center gap-2 w-full">
    <InitialsAvatar name={u.name} id={u.userId} />
    <span>{u.name}</span>
  </div>
</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* Dropdown 2: role for the new member, from GET /task/roles */}
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger
              className="w-full h-8 rounded-lg px-2 text-xs font-semibold"
              style={{ backgroundColor: 'hsl(var(--popover))', border: `1px solid hsl(var(--border))`, color: 'hsl(var(--foreground))' }}
            >
              <SelectValue placeholder={loadingRoles ? 'Loading roles…' : 'Select a role'} />
            </SelectTrigger>
            <SelectContent
              className="z-[1000]"
              style={{ backgroundColor: 'hsl(var(--popover))', border: `1px solid hsl(var(--border))` }}
              position="popper"
              sideOffset={4}
              align="start"
            >
              {roles.map((r) => (
                <SelectItem key={r} value={r} className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>
                  {humanizeRole(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={handleAddMember}
            disabled={!newUserId || !newRole || adding}
            className="w-full h-8 rounded-lg text-xs font-bold transition-opacity disabled:opacity-50"
            style={{ backgroundColor: T.pink, color: T.white }}
          >
            {adding ? 'Adding…' : 'Add Contributor'}
          </button>
        </div>
      )}

      <div className="p-2 flex-1">
        {loadingMembers && (
          <div className="p-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
        )}

        {!loadingMembers && members.length === 0 && (
          <div className="p-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No contributors assigned.</div>
        )}

        {!loadingMembers && members.length > 0 && (
          // Caps at ~5 rows tall, then scrolls — so it stays usable as the team grows.
          <div className="max-h-[360px] overflow-y-auto">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex items-start gap-3 rounded-lg px-2 py-2.5 border-b last:border-b-0 transition-colors hover:bg-muted/50"
                style={{ borderColor: `hsl(var(--border))` }}
              >
                <InitialsAvatar name={member.name} id={member.userId} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold leading-5" style={{ color: 'hsl(var(--foreground))' }} title={member.name}>
                    {member.name}
                  </p>
                  <p className="truncate text-xs" style={{ color: 'hsl(var(--muted-foreground))' }} title={member.email}>
                    {member.email}
                  </p>

                  {/* Role: compact dropdown, always visible */}
                  <Select
                    value={member.userTaskRole}
                    onValueChange={(role) => handleRoleChange(member, role)}
                    disabled={updatingUserId === member.userId}
                  >
                    <SelectTrigger
                      aria-label={`Role of ${member.name}`}
                      className="mt-1.5 h-7 w-auto max-w-full justify-start gap-1.5 rounded-full border-0 py-0 pl-2.5 pr-2 text-[11px] font-semibold shadow-none ring-offset-0 focus:ring-1 focus:ring-offset-0 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0"
                      style={{
                        backgroundColor: `hsl(var(--info) / 0.14)`,
                        color: 'hsl(var(--foreground))',
                      }}
                    >
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>

                    <SelectContent
                      className="z-[1000] rounded-lg shadow-xl
               min-w-[var(--radix-select-trigger-width)]
               max-h-[220px]
               overflow-y-auto"
                      style={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: `1px solid hsl(var(--border))`,
                      }}
                      position="popper"
                      sideOffset={4}
                      align="start"
                    >
                      <div className="py-1">
                        {roles.map((role) => (
                          <SelectItem
                            key={role}
                            value={role}
                            className="
            text-xs
            font-semibold
            pl-3
            pr-8
            py-2.5
            cursor-pointer
            transition-colors
            flex
            items-center
            gap-2
            [&>span:first-child]:hidden
          "
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{
                                backgroundColor:
                                  role === member.userTaskRole
                                    ? T.pink
                                    : `hsl(var(--muted-foreground) / 0.4)`,
                              }}
                            />
                            <span>{humanizeRole(role)}</span>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}