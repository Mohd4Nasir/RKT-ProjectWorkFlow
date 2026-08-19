import { useEffect, useState, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { taskService } from '@/services/taskservice';
import { T } from './Taskdetailshared';

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

export function TaskContributors({ taskId }: TaskContributorsProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [loadingAssignable, setLoadingAssignable] = useState(false);

  const [newUserId, setNewUserId] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');
  const [adding, setAdding] = useState(false);

  const [updatingUserId, setUpdatingUserId] = useState<string | number | null>(null);

  // Load current contributors whenever the task changes
  const loadMembers = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoadingMembers(true);
      const res = await taskService.getTaskMembers(taskId);
      setMembers(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Roles are global — fetch once on mount
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoadingRoles(true);
        const res = await taskService.getTaskMemberRoles();
        setRoles(res);
      } catch (err) {
        console.error(err);
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
      // revert on failure
      setMembers((prev) =>
        prev.map((m) => (m.userId === member.userId ? { ...m, userTaskRole: previousRole } : m)),
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden flex flex-col w-full border 1px solid" style={{ border: `1px solid ${T.navy}14` }}>
      <div
        className="px-4 py-3 text-sm font-bold flex items-center justify-between flex-shrink-0"
        style={{
          backgroundColor: `${T.teal}12`,
          borderBottom: `1px solid ${T.navy}14`,
          color: T.navy,
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
          style={{ backgroundColor: `${T.peach}22`, borderBottom: `1px solid ${T.navy}14` }}
        >
          {/* Dropdown 1: user to add, from GET /task/{taskId}/not-assigned-member */}
          <Select value={newUserId} onValueChange={setNewUserId}>
            <SelectTrigger
              className="w-full h-8 rounded-lg px-2 text-xs font-semibold"
              style={{ backgroundColor: T.white, border: `1px solid ${T.navy}22`, color: T.navy }}
            >
              <SelectValue placeholder={loadingAssignable ? 'Loading users…' : 'Select a member to add'} />
            </SelectTrigger>
            <SelectContent
              className="z-[1000]"
              style={{ backgroundColor: T.white, border: `1px solid ${T.navy}22` }}
              position="popper"
              sideOffset={4}
              align="start"
            >
              {assignableUsers.length === 0 ? (
                <div className="px-3 py-2 text-xs" style={{ color: `${T.para}88` }}>
                  {loadingAssignable ? 'Loading…' : 'No users available to add'}
                </div>
              ) : (
                assignableUsers.map((u) => (
                <SelectItem
  key={u.userId}
  value={String(u.userId)}
  className="text-xs"
  style={{ color: T.navy }}
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
              style={{ backgroundColor: T.white, border: `1px solid ${T.navy}22`, color: T.navy }}
            >
              <SelectValue placeholder={loadingRoles ? 'Loading roles…' : 'Select a role'} />
            </SelectTrigger>
            <SelectContent
              className="z-[1000]"
              style={{ backgroundColor: T.white, border: `1px solid ${T.navy}22` }}
              position="popper"
              sideOffset={4}
              align="start"
            >
              {roles.map((r) => (
                <SelectItem key={r} value={r} className="text-xs" style={{ color: T.navy }}>
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

      <div className="p-4 flex-1">
        {loadingMembers && (
          <div className="text-xs" style={{ color: `${T.para}99` }}>Loading...</div>
        )}

        {!loadingMembers && members.length === 0 && (
          <div className="text-xs" style={{ color: `${T.para}99` }}>No contributors assigned.</div>
        )}

        {!loadingMembers && members.length > 0 && (
          // Caps at ~5 rows tall, then scrolls — so it stays usable as the team grows.
          <div
            className="overflow-hidden rounded-lg max-h-[320px] overflow-y-auto"
            style={{ borderColor: `${T.navy}14` }}
          >
            {members.map((member) => (
              <div
                key={member.userId}
                className="group grid grid-cols-[1fr_170px] items-center px-4 py-3 border-b last:border-b-0 transition-colors hover:bg-slate-50"
                style={{ borderColor: `${T.navy}10` }}
              >
                {/* User */}
                <div className="flex items-center gap-3">
                  <InitialsAvatar name={member.name} id={member.userId} />

                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{ color: T.navy }}>
                      {member.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: T.para }}>
                      {member.email}
                    </p>
                  </div>
                </div>

                {/* Role: plain label by default, becomes the editable dropdown on row hover.
                    The Select trigger stays mounted & fully laid out at all times so Radix
                    can measure its position correctly — we just visually cover it with the
                    label overlay and fade the overlay out on hover, instead of toggling
                    display:none (which breaks Radix's popper positioning). */}
                <div className="flex justify-end relative h-9 w-[180px]">
                  <Select
                    value={member.userTaskRole}
                    onValueChange={(role) => handleRoleChange(member, role)}
                  >
                    <SelectTrigger
                      className="w-[180px] h-9 rounded-lg px-3 text-xs font-semibold border-0 shadow-none"
                      style={{
                        backgroundColor: `${T.teal}15`,
                        color: T.navy,
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
                        backgroundColor: T.white,
                        border: `1px solid ${T.navy}22`,
                      }}
                      position="popper"
                      sideOffset={4}
                      align="end"
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
                                    : `${T.navy}33`,
                              }}
                            />
                            <span>{humanizeRole(role)}</span>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>

                  {/* Static label overlay — covers the trigger until the row is hovered,
                      then fades out (and stops blocking clicks) so the real select is usable. */}
                  <div
                    className="absolute inset-0 flex items-center gap-2 px-3 rounded-lg pointer-events-none opacity-100 group-hover:opacity-0 transition-opacity"
                    style={{ backgroundColor: `${T.teal}15`, color: T.navy }}
                  >
                    <span className="text-xs font-semibold truncate">
                      {humanizeRole(member.userTaskRole || '')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}