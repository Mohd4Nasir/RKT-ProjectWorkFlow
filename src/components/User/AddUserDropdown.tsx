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
        className="sm:max-w-md p-0 gap-0 border-input max-h-[94dvh] overflow-y-auto" 
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 bg-muted/60">
          <div className="relative flex items-start gap-4">
            <div 
              className="h-12 w-12 rounded-xl flex items-center justify-center bg-primary"
            >
              <UserRoundPlus className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  Add Team Member
                </DialogTitle>
                <DialogDescription className="text-foreground">
                  Add users to collaborate on this project
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 bg-card">
          {/* Search Users */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Search Users
            </Label>
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" 
              />
              <Input
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-2 border-input h-11 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/30 focus-visible:border-primary"
              />
            </div>
          </div>

          {/* User List */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Select User
            </Label>
            <div 
              className="max-h-64 overflow-y-auto space-y-2 rounded-lg p-2 border-2 border-input"
            >
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-sm text-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
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
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent hover:border-primary/40 hover:bg-primary/5'
                      )}
                    >
                      <UserAvatar name={user.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground">
                          {user.name}
                        </div>
                        <div className="text-xs text-foreground">
                          {user.email}
                        </div>
                        {user.department && (
                          <div className="text-xs text-foreground">
                            {user.department}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-primary-foreground" />
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
            <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Role
            </Label>
            <Select
              value={memberRole}
              onValueChange={setMemberRole}
            >
              <SelectTrigger
                className="border-2 border-input focus:ring-primary/30 focus:ring-offset-0 h-11 text-foreground"
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="border-input">
                {roles.map((role) => (
                  <SelectItem 
                    key={role} 
                    value={role}
                    className="hover:bg-muted focus:bg-muted text-foreground"
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
          className="px-6 py-4 border-t border-input bg-muted/60"
        >
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="border-2 border-input hover:bg-muted hover:text-foreground h-10 text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddMember}
            disabled={!selectedUserId}
            className="bg-primary text-primary-foreground hover:bg-primary-hover transition-all duration-200 h-10"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}