import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { addUser, deleteUser, updateUser } from '@/store/slices/usersSlice';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, Edit2, Trash2, Mail } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { User } from '@/types';
import { toast } from 'sonner';
import { formatDate } from '@/utils/format';

export default function Users() {
  const dispatch = useAppDispatch();
  const users = useAppSelector((s) => s.users.items);
  const projects = useAppSelector((s) => s.projects.items);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const filtered = useMemo(() => users.filter((u) => {
    if (q && !u.name.toLowerCase().includes(q.toLowerCase()) && !u.email.toLowerCase().includes(q.toLowerCase())) return false;
    if (role !== 'all' && u.role !== role) return false;
    return true;
  }), [users, q, role]);

  const projectsForUser = (uid: string) => projects.filter((p) => p.members.includes(uid)).length;

  const onSave = (form: any) => {
    if (editing) { dispatch(updateUser({ ...editing, ...form })); toast.success('User updated'); }
    else { dispatch(addUser({ id: 'u' + Date.now(), joinedAt: new Date().toISOString(), status: 'active', ...form })); toast.success('User created'); }
    setOpen(false); setEditing(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Members"
        subtitle="Manage user accounts, roles and permissions."
        actions={<Button className="bg-gradient-primary shadow-glow" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />Add User</Button>}
      />

      <div className="card-elevated p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email…" className="pl-9 h-10 bg-muted/30 border-transparent" />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-full md:w-40 h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Projects</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={u.name} />
                      <div>
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1"><Mail className="h-3 w-3" />{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.department}</td>
                  <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize bg-primary-soft text-primary-hover">{u.role}</span></td>
                  <td className="px-4 py-3 font-semibold">{projectsForUser(u.id)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${u.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(u.joinedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(u); setOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-danger hover:text-danger" onClick={() => { dispatch(deleteUser(u.id)); toast.success('User removed'); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserDialog open={open} onOpenChange={setOpen} editing={editing} onSave={onSave} />
    </div>
  );
}

function UserDialog({ open, onOpenChange, editing, onSave }: any) {
  const [form, setForm] = useState<any>({ name: '', email: '', role: 'user', department: '', status: 'active' });
  const handleOpen = (o: boolean) => {
    if (o) setForm(editing ? { ...editing } : { name: '', email: '', role: 'user', department: '', status: 'active' });
    onOpenChange(o);
  };
  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editing ? 'Edit user' : 'Add new user'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpen(false)}>Cancel</Button>
          <Button className="bg-gradient-primary" onClick={() => onSave(form)} disabled={!form.name || !form.email}>{editing ? 'Save changes' : 'Create user'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
