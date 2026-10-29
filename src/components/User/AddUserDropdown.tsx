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
  onAddMember: (userId: string, role: string) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function AddMemberDialog({ 
  open, 
  onOpenChange, 
  roles, 
  availableUsers, 
  onAddMember,
  isSubmitting = false,
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
    if (!selectedUserId || isSubmitting) return;
    
    onAddMember(selectedUserId, memberRole);
    resetForm();
  }, [selectedUserId, memberRole, onAddMember, resetForm, isSubmitting]);

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
        className="sm:max-w-md p-0 overflow-hidden gap-0 border-brand-line" 
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 bg-brand-surface">
          <div className="relative flex items-start gap-4">
            <div 
              className="h-12 w-12 rounded-xl flex items-center justify-center bg-brand-accent"
            >
              <UserRoundPlus className="h-6 w-6 text-heading" />
            </div>
            <div className="flex-1">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight text-heading">
                  Add Team Member
                </DialogTitle>
                <DialogDescription className="text-heading">
                  Add users to collaborate on this project
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 bg-background">
          {/* Search Users */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-heading">
              Search Users
            </Label>
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-heading" 
              />
              <Input
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-2 border-brand-line h-11 text-heading placeholder:text-brand-line focus-visible:ring-brand-accent focus-visible:border-brand-accent"
              />
            </div>
          </div>

          {/* User List */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-heading">
              Select User
            </Label>
            <div 
              className="max-h-64 overflow-y-auto space-y-2 rounded-lg p-2 border-2 border-brand-line"
            >
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-sm text-heading">
                  <Users className="h-8 w-8 mx-auto mb-2 text-brand-line" />
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
                          ? 'border-brand-accent bg-brand-accent/20'
                          : 'border-transparent hover:border-brand-accent/50 hover:bg-brand-accent/5'
                      )}
                    >
                      <UserAvatar name={user.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-heading">
                          {user.name}
                        </div>
                        <div className="text-xs text-heading">
                          {user.email}
                        </div>
                        {user.department && (
                          <div className="text-xs text-heading">
                            {user.department}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-brand-accent flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-heading" />
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
            <Label className="text-xs font-semibold uppercase tracking-wider text-heading">
              Role
            </Label>
            <Select
              value={memberRole}
              onValueChange={setMemberRole}
            >
              <SelectTrigger
                className="border-2 border-brand-line focus:ring-brand-accent focus:ring-offset-0 h-11 text-heading"
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="border-brand-line">
                {roles.map((role) => (
                  <SelectItem 
                    key={role} 
                    value={role}
                    className="hover:bg-brand-accent/10 focus:bg-brand-accent/10 text-heading"
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
          className="px-6 py-4 border-t border-brand-line bg-brand-surface"
        >
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-2 border-brand-line hover:bg-brand-accent/10 hover:text-heading h-10 text-heading"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddMember}
            disabled={!selectedUserId || isSubmitting}
            className="bg-brand-accent text-heading hover:bg-brand-accent-strong transition-all duration-200 h-10"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}