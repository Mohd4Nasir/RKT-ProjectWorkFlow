import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { addProjectMember, removeProjectMember, updateProjectMemberRole } from '@/store/slices/projectsSlice';
import { projectApiService } from '@/services/projectsApiService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Search, X, LayoutList, LayoutGrid, Users } from 'lucide-react';
import { Crown, Star, UserMinus, Mail, Building2 } from 'lucide-react';

import { UserTable } from '@/pages/Team/UserTabTable';
import { AddMemberDialog } from '@/components/User/AddUserDropdown';
import { RemoveMemberDialog } from '@/components/User/RemoveMemberDialog';
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/UserAvatar';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';

type ViewMode = 'table' | 'cards';

interface Project {
  userId?: string;
  id: string | number; // Both string and number supported
  name: string;
}

interface AddMemberParams {
  projectId: string | number;
  userId: number;
  projectRole: string;
}
export function UsersTab({ project }: { project: Project }) {
  const dispatch = useAppDispatch();
  const users = useAppSelector(s => s.users.items);
  const [roles, setRoles] = useState<string[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const memberUsers = users.filter(u => project.members?.includes(u.id));
  // const availableUsers = users.filter(u => !project.members?.includes(u.id) && u.id !== project.ownerId);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [loadingAvailableUsers, setLoadingAvailableUsers] = useState(false);
   const [ExistingMembers, setExistingMembers] = useState<any[]>([]);

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<any>(null);

  const getRoleBadge = (userId: string) =>
    userId === project.ownerId
      ? { label: 'Owner', icon: Crown, className: 'bg-amber-100 text-amber-700 border-amber-200' }
      : { label: 'Member', icon: Star, className: 'bg-blue-100  text-blue-700  border-blue-200' };


   const fetchExistingMembersInProject = async () => {
    try {
      const response = await projectApiService.getExistingMembersInProject(project.id);
      console.log(response.data)
      setExistingMembers(response.data);
    }  catch (error) {
      toast.error("Failed to load existing project members");
    }
  };



 const fetchMembers = async () => {
    try {
      const response = await projectApiService.getMembersForProject(project.id);
      console.log(response.data)
      setAvailableUsers(response.data);
      // Update the project members in the store if needed
  }  catch (error) { 

      toast.error("Failed to load project members");
    } 
  }
   
   

   
  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);

      const response = await projectApiService.getRoles();
      console.log(response.data)
      setRoles(response.data);
    } catch (error) {
      toast.error("Failed to load roles");
    } finally {
      setLoadingRoles(false);
    }
  };

    useEffect(() => {
    fetchRoles();
    fetchMembers();
    fetchExistingMembersInProject();
  }, []);
  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddMember = async (userId: number | string, role: string) => {
    console.log("Adding member:", userId, "with role:", role);
    if (!userId || !role) {
      toast.error('Please select a user and role');
      return;
    }
    try {
        const projectId = typeof project.id === 'string' 
      ? parseInt(project.id) 
      : project.id;
       await projectApiService.addProjectMember({ projectId, userId, projectRole: role });
      dispatch(addProjectMember({ projectId, userId, role }));
      toast.success('Member added');
      setAddMemberOpen(false);
    } catch { toast.error('Failed to add member'); }
  };

  const handleRemoveMember = (user: any) => {
    if (user.id === project.ownerId) { toast.error('Cannot remove the project owner'); return; }
    setUserToRemove(user);
    setDeleteConfirmOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!userToRemove) return;
    try {
      // TODO: await projectApiService.removeProjectMember({ projectId: project.id, userId: userToRemove.id });
      dispatch(removeProjectMember({ projectId: project.id, userId: userToRemove.id }));
      toast.success(`${userToRemove.name} removed`);
      setDeleteConfirmOpen(false);
      setUserToRemove(null);
    } catch { toast.error('Failed to remove member'); }
  };

  const handleChangeRole = async (userId: string, role: 'member' | 'contributor' | 'viewer') => {
    try {
      // TODO: await projectApiService.updateProjectMemberRole({ projectId: project.id, userId, role });
      dispatch(updateProjectMemberRole({ projectId: project.id, userId, role }));
      toast.success('Role updated');
    } catch { toast.error('Failed to update role'); }
  };

  const visibleMembers = ExistingMembers.filter(u => {
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
          <Button variant="outline"
            onClick={() => setAddMemberOpen(true)} className="bg-primary  text-[#232946]" size="sm">
            <UserPlus className="h-4 w-4 mr-2" /> Add Member
          </Button>
          {viewMode === 'table' && memberUsers.length > 0 && (
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
        </div>
      </div>

      {/* Members */}
      {ExistingMembers.length === 0 ? (
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
          projectOwnerId={project.userId}
          onRoleChange={handleChangeRole}
          onRemove={handleRemoveMember}
          globalFilter={search} 
          onGlobalFilterChange={setSearch}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleMembers.map(user => {
            const role = getRoleBadge(user.id);
            const RoleIcon = role.icon;
            return (
              <Card key={user.id} className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} size="lg" />
                      <div>
                        <CardTitle className="text-base font-semibold">{user.name}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">{user.email}</CardDescription>
                      </div>
                    </div>
                    <Badge className={role.className}>
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
                  <Select
                    onValueChange={(value) => handleChangeRole(user.id, value)}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>

                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(user)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <UserMinus className="h-3.5 w-3.5 mr-1" /> Remove
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <AddMemberDialog open={addMemberOpen} onOpenChange={setAddMemberOpen} roles={roles}
        availableUsers={availableUsers} onAddMember={handleAddMember} />
      <RemoveMemberDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} userToRemove={userToRemove} onConfirmRemove={confirmRemoveMember} />
    </div>
  );
}