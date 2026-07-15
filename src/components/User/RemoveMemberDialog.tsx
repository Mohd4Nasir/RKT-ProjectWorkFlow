import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { UserMinus, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface RemoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToRemove: User | null;
  onConfirmRemove: () => void;
}

export function RemoveMemberDialog({ open, onOpenChange, userToRemove, onConfirmRemove }: RemoveMemberDialogProps) {
  if (!userToRemove) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Remove Team Member
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {userToRemove.name} from this project?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
            <UserAvatar name={userToRemove.name} size="lg" />
            <div>
              <div className="font-semibold">{userToRemove.name}</div>
              <div className="text-sm text-muted-foreground">{userToRemove.email}</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Warning:</strong> This action cannot be undone. The user will lose access to:
            </p>
            <ul className="text-xs text-amber-700 mt-2 space-y-1 list-disc list-inside">
              <li>All project tasks and documents</li>
              <li>Project discussions and comments</li>
              <li>Project settings and configurations</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirmRemove}>
            <UserMinus className="h-4 w-4 mr-2" />
            Remove Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}