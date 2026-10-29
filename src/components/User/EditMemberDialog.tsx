import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserAvatar } from '@/components/UserAvatar';
import { Pencil, Building2, Mail, IdCard } from 'lucide-react';

export interface EditableMember {
  id?: string | number;
  userId?: string | number;
  name: string;
  email: string;
  department?: string;
  teamRole?: string;
}

const ROLE_OPTIONS = [
  { value: 'MEMBER', label: 'Member' },
  { value: 'CONTRIBUTOR', label: 'Contributor' },
  { value: 'VIEWER', label: 'Viewer' },
] as const;

const DEFAULT_ROLE = 'MEMBER';

/** Maps an API role value to one of the options above, case-insensitively. */
function normaliseRole(role?: string | null, roles?: string[]): string {
  if (!role) return roles?.[0]?.toUpperCase() ?? DEFAULT_ROLE;
  const upper = role.toUpperCase();
  if (roles?.some(r => r.toUpperCase() === upper)) return upper;
  const match = ROLE_OPTIONS.find(r => r.value === upper);
  return match ? match.value : (roles?.[0]?.toUpperCase() ?? DEFAULT_ROLE);
}

function labelForRole(role?: string | null, roles?: string[]): string {
  const normalised = normaliseRole(role, roles);
  return ROLE_OPTIONS.find(r => r.value === normalised)?.label ?? normalised.charAt(0) + normalised.slice(1).toLowerCase();
}

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: EditableMember | null;
  isOwner?: boolean;
  onSave: (userId: string | number, role: string) => void | Promise<void>;
  roles?: string[];
}

export function EditMemberDialog({
  open, onOpenChange, member, isOwner = false, onSave, roles,
}: EditMemberDialogProps) {
  const [role, setRole] = useState('MEMBER');
  const [saving, setSaving] = useState(false);

  // Re-seed the form each time the dialog opens on a (possibly new) member.
  useEffect(() => {
    if (open && member) setRole(normaliseRole(member.teamRole, roles));
  }, [open, member, roles]);

  const memberUserId = member?.userId ?? member?.id;

  const handleSave = async () => {
    if (saving || memberUserId == null) return;
    setSaving(true);
    try {
      await onSave(memberUserId, role);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!member) return null;

  // Prefer the roles the backend reports for this project; fall back to the
  // built-in list if they haven't loaded yet.
  const selectableRoles = roles?.length
    ? roles.map((value) => {
        const upper = value.toUpperCase();
        return {
          value: upper,
          label:
            ROLE_OPTIONS.find((r) => r.value === upper)?.label ??
            upper.charAt(0) + upper.slice(1).toLowerCase(),
        };
      })
    : ROLE_OPTIONS.map((r) => ({ value: r.value, label: r.label }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-55">
              <Pencil className="h-4 w-4 text-primary" />
            </span>
            Edit Team Member
          </DialogTitle>
          <DialogDescription>
            Update this member&apos;s project access for <strong>{member.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
            <UserAvatar name={member.name} size="lg" />
            <div className="min-w-0">
              <div className="truncate font-semibold text-heading">{member.name}</div>
              <div className="truncate text-sm text-muted-foreground">{member.email}</div>
            </div>
          </div>

          {/* Identity fields live on the user, not the project membership, so
              they are shown for context but not editable here. */}
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <IdCard className="h-3.5 w-3.5" /> User ID
              </dt>
              <dd className="font-medium text-paragraph">{member.userId ?? member.id}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> Email
              </dt>
              <dd className="truncate font-medium text-paragraph">{member.email}</dd>
            </div>
            {member.department && (
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" /> Department
                </dt>
                <dd className="truncate font-medium text-paragraph">{member.department}</dd>
              </div>
            )}
          </dl>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-heading">Project role</label>
            <Select value={role} onValueChange={setRole} disabled={isOwner}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectableRoles.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {isOwner
                ? 'The project owner always has full access and cannot be changed.'
                : `Currently ${labelForRole(member.teamRole, roles)}.`}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || isOwner}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}