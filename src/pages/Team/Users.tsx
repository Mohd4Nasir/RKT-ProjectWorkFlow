// components/UserManagement/Users.tsx
import { useMemo, useState } from 'react';
import { useAppSelector } from '@/store';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Search, Mail } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/utils/format';
import { AddUser } from './AddUser';
import { UpdateUser } from './UpdateUser';
import { DeleteUser } from './DeleteUser';

export default function Users() {
  const users = useAppSelector((s) => s.users.items);
  const projects = useAppSelector((s) => s.projects.items);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');

  const filtered = useMemo(() => users.filter((u) => {
    if (q && !u.name.toLowerCase().includes(q.toLowerCase()) && 
        !u.email.toLowerCase().includes(q.toLowerCase())) return false;
    if (role !== 'all' && u.role !== role) return false;
    return true;
  }), [users, q, role]);

  const projectsForUser = (uid: string) => 
    projects.filter((p) => p.members.includes(uid)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Members"
        subtitle="Manage user accounts, roles and permissions."
        actions={<AddUser />}
      />

      {/* Search and Filter */}
      <div className="card-elevated p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="Search by name or email…" 
            className="pl-9 h-10 bg-muted/30 border-transparent" 
          />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-full md:w-40 h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
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
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={u.name} />
                        <div>
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.department || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize bg-primary-soft text-primary-hover">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {projectsForUser(u.id)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                        u.status === 'active' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(u.joinedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <UpdateUser user={u} />
                        <DeleteUser user={u} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}