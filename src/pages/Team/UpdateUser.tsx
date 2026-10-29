// components/UserManagement/UpdateUser.tsx
import { useState, useEffect } from 'react';
import { useAppDispatch } from '@/store';
import { updateUser } from '@/store/slices/usersSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { User, UserRole } from '@/types/ProejctsType';
import { toast } from 'sonner';

interface UpdateUserProps {
  user: User;
  trigger?: React.ReactNode;
}

export function UpdateUser({ user, trigger }: UpdateUserProps) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'user' as UserRole,
    department: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && user) {
      setForm({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || '',
        status: user.status,
      });
    }
  }, [open, user]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      dispatch(updateUser({ 
        ...user, 
        ...form 
      }));
      toast.success('User updated successfully!');
      setOpen(false);
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8"
          onClick={() => setOpen(true)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter full name"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter email address"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={form.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  placeholder="Enter department (optional)"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select 
                    value={form.role} 
                    onValueChange={(v) => handleChange('role', v)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={form.status} 
                    onValueChange={(v) => handleChange('status', v)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-primary"
                disabled={!form.name || !form.email || isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}