import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateProfile } from '@/store/slices/authSlice';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/UserAvatar';
import { Camera, Lock, Mail, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user!);
  const [form, setForm] = useState({ name: user.name, email: user.email, department: user.department || '', bio: 'Building delightful product experiences at RishiKirti.' });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" subtitle="Update your personal information and preferences." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-elevated p-6 text-center">
          <div className="relative inline-block">
            <UserAvatar name={user.name} size="lg" className="!h-24 !w-24 !text-2xl" />
            <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-glow">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <h3 className="font-display font-bold text-lg mt-4">{user.name}</h3>
          <p className="text-sm text-muted-foreground capitalize">{user.role} · {user.department}</p>
          <div className="mt-4 space-y-2 text-left text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" />{user.email}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-4 w-4" />RishiKirti Inc.</div>
          </div>
        </div>

        <div className="card-elevated p-6 lg:col-span-2 space-y-5">
          <h3 className="font-display font-bold text-lg">Personal information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div className="space-y-2"><Label>Role</Label><Input value={user.role} disabled /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Bio</Label><Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          </div>
          <div className="flex justify-end">
            <Button className="bg-gradient-primary shadow-glow" onClick={() => { dispatch(updateProfile({ name: form.name, email: form.email, department: form.department })); toast.success('Profile updated'); }}>Save changes</Button>
          </div>
        </div>
      </div>

      <div className="card-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-primary" />
          <h3 className="font-display font-bold text-lg">Change password</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Current</Label><Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
          <div className="space-y-2"><Label>New</Label><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
          <div className="space-y-2"><Label>Confirm new</Label><Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => { setPw({ current: '', next: '', confirm: '' }); toast.success('Password updated'); }} disabled={!pw.current || pw.next !== pw.confirm || !pw.next}>Update password</Button>
        </div>
      </div>
    </div>
  );
}
