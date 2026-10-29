import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '@/store';
import { addProjectMember, removeProjectMember, updateProjectMemberRole } from '@/store/slices/projectsSlice';
import { projectApiService } from '@/services/projectsApiService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Search, X, LayoutList, LayoutGrid, Users } from 'lucide-react';
import { UserMinus, Mail, Building2, Pencil } from 'lucide-react';
import { UserTable, resolveRoleMeta, isProjectOwner, getMemberUserId, sameId } from '@/pages/Team/UserTabTable';
import { AddMemberDialog } from '@/components/User/AddUserDropdown';
import { RemoveMemberDialog } from '@/components/User/RemoveMemberDialog';
import { EditMemberDialog } from '@/components/User/EditMemberDialog';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/UserAvatar';
import { Project } from '@/types/ProejctsType';

type ViewMode = 'table' | 'cards';

/** A member row as returned by `GET /team/{projectId}`. */
interface ProjectMember {
  /** Membership row id — NOT the user id. Use `getMemberUserId`. */
  id?: string | number;
  userId?: string | number;
  name: string;
  email: string;
  department?: string;
  teamRole?: string;
  joinedOn?: string;
}

interface AddMemberParams {
  projectId: string | number;
  userId: number;
  projectRole: string;
}

/**
 * `GET /team/{projectId}` returns the membership row, whose `id` is the
 * membership id, while `userId` is the user. Every write endpoint
 * (`add-member`, `update-member`, `remove-member`) takes the *user* id, so
 * all call sites must go through `getMemberUserId`. Sending `id` was why
 * updates and deletes silently hit the wrong record.
 */
const toProjectId = (value: string | number) =>
  typeof value === 'string' ? parseInt(value, 10) : value;

export function TeamTab({ project }: { project: Project }) {
  const dispatch = useAppDispatch();
  const [roles, setRoles] = useState<string[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<ProjectMember | null>(null);
  const [savingMember, setSavingMember] = useState(false);
  const [userToRemove, setUserToRemove] = useState<ProjectMember | null>(null);
  const [removingMember, setRemovingMember] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  /** Authoritative owner list — the member payload reports OWNER on every row. */
  const ownerIds = useMemo(
    () =>
      (project.owners?.length ? project.owners : undefined)?.map(o => o.ownerId) ??
      (project.ownerId != null ? [project.ownerId] : []),
    [project.owners, project.ownerId]
  );

  const isOwner = useCallback(
    (member: ProjectMember) => isProjectOwner(member, ownerIds),
    []
  );

  /**
   * Members and available users are two views of the same team, so they are
   * always reloaded together. Called after every add/update/delete so the UI
   * reflects the server immediately instead of waiting for a remount.
   */
  const loadTeam = useCallback(
    async (options: { silent?: boolean } = {}) => {
      setLoadingMembers(true);
      try {
        const [membersRes, availableRes] = await Promise.all([
          projectApiService.getExistingMembersInProject(project.projectId),
          projectApiService.getMembersForProject(project.projectId),
        ]);
        setMembers(membersRes.data ?? []);
        setAvailableUsers(availableRes.data ?? []);
      } catch (error) {
        // A refresh failure after a successful mutation shouldn't be reported
        // as a mutation failure, so mutations pass silent: true.
        if (!options.silent) toast.error('Failed to load project members');
      } finally {
        setLoadingMembers(false);
      }
    },
    [project.projectId]
  );

  const fetchRoles = useCallback(async () => {
    try {
      setLoadingRoles(true);
      const response = await projectApiService.getRoles();
      setRoles(response.data ?? []);
    } catch (error) {
      toast.error('Failed to load roles');
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    loadTeam();
  }, [fetchRoles, loadTeam]);
  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddMember = async (userId: number | string, role: string) => {
    if (!userId || !role) {
      toast.error('Please select a user and role');
      return;
    }
    setAddingMember(true);
    try {
      const projectId = toProjectId(project.projectId);
      await projectApiService.addProjectMember({ projectId, userId, projectRole: role });
      dispatch(addProjectMember({ projectId, userId, role }));
      // Refresh both lists: the new member must appear, and must disappear
      // from the "available users" picker.
      await loadTeam({ silent: true });
      toast.success('Member added');
      setAddMemberOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = (user: ProjectMember) => {
    if (isOwner(user)) {
      toast.error('Cannot remove the project owner');
      return;
    }
      console.log('handleRemoveMember called', user);
    setUserToRemove(user);
    setDeleteConfirmOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!userToRemove || removingMember) return;
    const userId = getMemberUserId(userToRemove);
    if (userId == null) {
      toast.error('Could not resolve the member to remove');
      return;
    }
    setRemovingMember(true);
    try {
      const projectId = toProjectId(project.projectId);
      await projectApiService.removeProjectMember({ projectId, userId });
      dispatch(removeProjectMember({ projectId, userId }));
      // Optimistic removal keeps the row from lingering under the dialog,
      // then the refetch reconciles with the server.
      setMembers(prev => prev.filter(m => !sameId(getMemberUserId(m), userId)));
      await loadTeam({ silent: true });
      toast.success(`${userToRemove.name} removed`);
      setDeleteConfirmOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    } finally {
      setRemovingMember(false);
    }
  };

  const handleChangeRole = async (userId: string | number, role: string) => {
    try {
      const projectId = toProjectId(project.projectId);
      await projectApiService.updateProjectMember({ projectId, userId, projectRole: role });
      dispatch(updateProjectMemberRole({ projectId, userId, role }));
      await loadTeam({ silent: true });
      toast.success('Role updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    }
  };

  const handleEditMember = (user: ProjectMember) => {
    setMemberToEdit(user);
    setEditOpen(true);
  };

  const confirmEditMember = async (userId: string | number, role: string) => {
    if (savingMember) return;
    setSavingMember(true);
    try {
      const projectId = toProjectId(project.projectId);
      await projectApiService.updateProjectMember({ projectId, userId, projectRole: role });
      dispatch(updateProjectMemberRole({ projectId, userId, role }));
      // Optimistic patch so the row updates in the same frame; the refetch
      // below replaces it with the server's canonical role casing.
      setMembers(prev =>
        prev.map((m) => (sameId(getMemberUserId(m), userId) ? { ...m, teamRole: role.toUpperCase() } : m))
      );
      await loadTeam({ silent: true });
      setEditOpen(false);
      setMemberToEdit(null);
      toast.success('Member updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update member');
      throw error;
    } finally {
      setSavingMember(false);
    }
  };

  const visibleMembers = members.filter(u => {
    if (!search) return true;
    return (
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Project Team</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Manage team members and their roles</p>
        </div>
        <div className="flex items-center gap-3">
          
          {viewMode === 'table' && visibleMembers.length > 0 && (
            <div className="relative w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-1 border rounded-lg p-0.5">
            <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('table')} className="h-7 px-2">
              <LayoutList className="h-3.5 w-3.5" />
            </Button>
            <Button variant={viewMode === 'cards' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('cards')} className="h-7 px-2">
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            onClick={() => setAddMemberOpen(true)} size="sm">
            <UserPlus className="h-4 w-4 mr-2" /> Add Member
          </Button>
          
        </div>
      </div>

      {/* Members */}
      {loadingMembers && members.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading members...</div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No team members yet</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setAddMemberOpen(true)}>
            <UserPlus className="h-3 w-3 mr-1" /> Add your first member
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        <UserTable
          data={visibleMembers}
          projectOwnerId={project.owners?.[0]?.ownerId}
          onRoleChange={handleChangeRole}
          onRemove={handleRemoveMember}
          onEdit={handleEditMember}
          globalFilter={search}
          onGlobalFilterChange={setSearch}
          ownerIds={ownerIds}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleMembers.map(user => {
            const role = resolveRoleMeta(user, ownerIds);
            const RoleIcon = role.Icon;
            return (
              <Card key={getMemberUserId(user) ?? user.name} className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} size="lg" />
                      <div>
                        <CardTitle className="text-base font-semibold">{user.name}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">{user.email}</CardDescription>
                      </div>
                    </div>
                    <Badge className={`border-0 font-medium ${role.badgeClassName}`}>
                      <RoleIcon className="h-3 w-3 mr-1" />{role.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3 space-y-2">
                  {user.department && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" /><span>{user.department}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" /><span>{user.email}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex items-center justify-between">
                  {role.editable ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditMember(user)}
                      disabled={savingMember}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit role
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Full Access</span>
                  )}
                  {role.editable && (
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(user)} className="text-danger hover:text-danger hover:bg-danger/10">
                      <UserMinus className="h-3.5 w-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <AddMemberDialog open={addMemberOpen}
        onOpenChange={setAddMemberOpen} 
        roles={roles}
        availableUsers={availableUsers} 
        onAddMember={handleAddMember}
        isSubmitting={addingMember} />

      <RemoveMemberDialog
       open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
         userToRemove={userToRemove}
          onConfirmRemove={confirmRemoveMember}
           isRemoving={removingMember} />
      <EditMemberDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        member={memberToEdit}
        roles={roles}
        isOwner={memberToEdit ? isOwner(memberToEdit) : false}
        onSave={confirmEditMember}
      />
    </div>
  );
}