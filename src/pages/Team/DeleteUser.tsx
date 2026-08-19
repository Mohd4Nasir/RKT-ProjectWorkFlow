// components/UserManagement/DeleteUser.tsx
import { useState } from 'react';
import { useAppDispatch } from '@/store';
import { deleteUser } from '@/store/slices/usersSlice';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { User } from '@/types/ProejctsType';
import { toast } from 'sonner';

interface DeleteUserProps {
  user: User;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function DeleteUser({ user, trigger, onSuccess }: DeleteUserProps) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      dispatch(deleteUser(user.id));
      toast.success(`User "${user.name}" removed successfully!`);
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(false);
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
          className="h-8 w-8 text-danger hover:text-danger"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-danger">
              <AlertTriangle className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{user.name}</strong>?
              <br />
              This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="text-sm space-y-1">
                <div><span className="text-muted-foreground">Name:</span> {user.name}</div>
                <div><span className="text-muted-foreground">Email:</span> {user.email}</div>
                <div><span className="text-muted-foreground">Role:</span> {user.role}</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}