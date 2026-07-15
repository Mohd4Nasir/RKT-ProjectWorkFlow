import { useEffect, useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, UserPlus, UserRoundPlus, Check } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';

interface User {
  userId: string;
  id?: string; // For backward compatibility
  name: string;
  email: string;
  department?: string;
}

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableUsers: User[];
  roles: string[];
  onAddMember: (userId: string, role: string) => void;
}

export function AddMemberDialog({ 
  open, 
  onOpenChange, 
  roles, 
  availableUsers, 
  onAddMember 
}: AddMemberDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [memberRole, setMemberRole] = useState<string>('');

  // Set default role when roles change
  useEffect(() => {
    if (roles.length && !memberRole) {
      setMemberRole(roles[0]);
    }
  }, [roles, memberRole]);

  // Filter users based on search term - memoized for performance
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return availableUsers;
    
    const searchLower = searchTerm.toLowerCase();
    return availableUsers.filter((user) =>
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.department?.toLowerCase().includes(searchLower)
    );
  }, [availableUsers, searchTerm]);

  // Reset form state
  const resetForm = useCallback(() => {
    setSelectedUserId(null);
    setSearchTerm('');
    setMemberRole(roles[0] || '');
  }, [roles]);

  // Handle add member
  const handleAddMember = useCallback(() => {
    if (!selectedUserId) return;
    
    onAddMember(selectedUserId, memberRole);
    resetForm();
  }, [selectedUserId, memberRole, onAddMember, resetForm]);

  // Handle close with reset
  const handleClose = useCallback(() => {
    onOpenChange(false);
    setTimeout(resetForm, 200);
  }, [onOpenChange, resetForm]);

  // Get user ID consistently
  const getUserId = (user: User) => user.userId || user.id || '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-md p-0 overflow-hidden gap-0 border-[#b8c1ec]" 
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 bg-[#efecf5]">
          <div className="relative flex items-start gap-4">
            <div 
              className="h-12 w-12 rounded-xl flex items-center justify-center bg-[#eebbc3]"
            >
              <UserRoundPlus className="h-6 w-6 text-[#232946]" />
            </div>
            <div className="flex-1">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight text-[#232946]">
                  Add Team Member
                </DialogTitle>
                <DialogDescription className="text-[#232946]">
                  Add users to collaborate on this project
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 bg-[#fffffe]">
          {/* Search Users */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#232946]">
              Search Users
            </Label>
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#232946]" 
              />
              <Input
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-2 border-[#b8c1ec] h-11 text-[#232946] placeholder:text-[#b8c1ec] focus-visible:ring-[#eebbc3] focus-visible:border-[#eebbc3]"
              />
            </div>
          </div>

          {/* User List */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#232946]">
              Select User
            </Label>
            <div 
              className="max-h-64 overflow-y-auto space-y-2 rounded-lg p-2 border-2 border-[#b8c1ec]"
            >
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-sm text-[#232946]">
                  <Users className="h-8 w-8 mx-auto mb-2 text-[#b8c1ec]" />
                  {searchTerm ? 'No users match your search' : 'No users available to add'}
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const userId = getUserId(user);
                  const isSelected = selectedUserId === userId;
                  
                  return (
                    <div
                      key={userId}
                      onClick={() => setSelectedUserId(userId)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2',
                        isSelected
                          ? 'border-[#eebbc3] bg-[#eebbc3]/20'
                          : 'border-transparent hover:border-[#eebbc3]/50 hover:bg-[#eebbc3]/5'
                      )}
                    >
                      <UserAvatar name={user.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-[#232946]">
                          {user.name}
                        </div>
                        <div className="text-xs text-[#232946]">
                          {user.email}
                        </div>
                        {user.department && (
                          <div className="text-xs text-[#232946]">
                            {user.department}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-[#eebbc3] flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-[#232946]" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#232946]">
              Role
            </Label>
            <Select
              value={memberRole}
              onValueChange={setMemberRole}
            >
              <SelectTrigger
                className="border-2 border-[#b8c1ec] focus:ring-[#eebbc3] focus:ring-offset-0 h-11 text-[#232946]"
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="border-[#b8c1ec]">
                {roles.map((role) => (
                  <SelectItem 
                    key={role} 
                    value={role}
                    className="hover:bg-[#eebbc3]/10 focus:bg-[#eebbc3]/10 text-[#232946]"
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter 
          className="px-6 py-4 border-t border-[#b8c1ec] bg-[#efecf5]"
        >
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="border-2 border-[#b8c1ec] hover:bg-[#eebbc3]/10 hover:text-[#232946] h-10 text-[#232946]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddMember}
            disabled={!selectedUserId}
            className="bg-[#eebbc3] text-[#232946] hover:bg-[#dbaab2] transition-all duration-200 h-10"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}