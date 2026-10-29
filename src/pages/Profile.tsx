import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateProfile } from '@/store/slices/authSlice';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/UserAvatar';
import {
  Building2, CalendarDays, Camera, Check, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, User as UserIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Wip } from '@/components/Wip';

type Tab = 'personal' | 'security';

/** staggered entrance: each block fades up a little after the previous one */
const enter = (i: number) => ({ animationDelay: `${i * 90}ms` });
const ENTER = 'animate-fade-in [animation-fill-mode:both]';

const fmtJoined = (iso?: string) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d.getTime()) ? d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—';
};

function strength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: 'Too weak', bar: 'bg-rose-500', text: 'text-rose-600' },
    { label: 'Weak', bar: 'bg-orange-500', text: 'text-orange-600' },
    { label: 'Fair', bar: 'bg-amber-500', text: 'text-amber-600' },
    { label: 'Good', bar: 'bg-lime-500', text: 'text-lime-600' },
    { label: 'Strong', bar: 'bg-emerald-500', text: 'text-emerald-600' },
  ];
  return { score, ...levels[pw ? score : 0] };
}

function PasswordField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} className="pr-10" />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function Profile() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user!);
  const initial = { name: user.name, email: user.email, department: user.department || '', bio: 'Building delightful product experiences with WorkSphere.' };
  const [form, setForm] = useState(initial);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [tab, setTab] = useState<Tab>('personal');

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const st = useMemo(() => strength(pw.next), [pw.next]);
  const mismatch = !!pw.confirm && pw.next !== pw.confirm;
  const canUpdatePw = !!pw.current && !!pw.next && pw.next === pw.confirm;

  const facts = [
    { icon: ShieldCheck, label: 'Role', value: user.role, cls: 'from-violet-500/15 to-violet-500/5 text-violet-700 dark:text-violet-300 border-violet-500/25' },
    { icon: Check, label: 'Status', value: user.status, cls: 'from-emerald-500/15 to-emerald-500/5 text-emerald-700 dark:text-emerald-300 border-emerald-500/25' },
    { icon: CalendarDays, label: 'Member since', value: fmtJoined(user.joinedAt), cls: 'from-blue-500/15 to-blue-500/5 text-blue-700 dark:text-blue-300 border-blue-500/25' },
    { icon: Building2, label: 'Department', value: user.department || '—', cls: 'from-amber-500/15 to-amber-500/5 text-amber-700 dark:text-amber-300 border-amber-500/25' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" subtitle="Update your personal information and preferences." />

      {/* ── Hero ── */}
      <section className={cn('card-elevated overflow-hidden', ENTER)} style={enter(0)}>
        <div className="relative h-32 sm:h-36 bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 overflow-hidden">
          <div aria-hidden className="absolute -top-16 -left-10 h-48 w-48 rounded-full bg-white/20 blur-3xl animate-aurora" />
          <div aria-hidden className="absolute -bottom-20 right-10 h-56 w-56 rounded-full bg-cyan-300/25 blur-3xl animate-aurora [animation-delay:-6s]" />
          <span aria-hidden className="absolute inset-y-0 -left-full w-1/3 bg-white/20 blur-md animate-shine" />
          <Sparkles aria-hidden className="absolute right-6 top-5 h-5 w-5 text-white/60" />
        </div>

        <div className="px-5 sm:px-8 pb-6">
          <div className="-mt-12 sm:-mt-14 flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="relative w-fit group">
              <span aria-hidden className="absolute inset-0 rounded-full animate-pulse-ring" />
              <UserAvatar
                name={user.name}
                size="lg"
                className="!h-24 !w-24 sm:!h-28 sm:!w-28 !text-3xl !ring-4 !ring-card shadow-lg transition-transform duration-300 group-hover:scale-105"
              />
              <button
                onClick={() => toast.info('Photo upload coming soon')}
                className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-glow ring-2 ring-card transition-transform hover:scale-110"
                aria-label="Change photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <Wip hint="Photo upload is not available yet" className="absolute -top-1 -right-2 shadow-sm" />
            </div>

            <div className="min-w-0 sm:pb-1">
              <h2 className="font-display font-bold text-xl sm:text-2xl truncate">{user.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" />{user.email}</span>
                <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" />RishiKirti Inc.<Wip hint="Company is a placeholder" /></span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {facts.map((f, i) => (
              <div
                key={f.label}
                style={enter(i + 2)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border bg-gradient-to-br px-3.5 py-3 transition-all hover:-translate-y-0.5 hover:shadow-md',
                  f.cls, ENTER,
                )}
              >
                <f.icon className="h-5 w-5 shrink-0" />
                <span className="min-w-0 leading-tight">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider opacity-70">{f.label}</span>
                  <span className="block text-sm font-bold capitalize truncate">{f.value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tabs ── */}
      <div className={cn('inline-flex rounded-xl bg-muted p-1', ENTER)} style={enter(5)} role="tablist">
        {([['personal', 'Personal info', UserIcon], ['security', 'Security', Lock]] as const).map(([k, label, Icon]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition-all',
              tab === k ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Personal ── */}
      {tab === 'personal' && (
        <section key="personal" className="card-elevated p-6 space-y-5 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-violet-500" />
            <h3 className="font-display font-bold text-lg">Personal information</h3>
            <Wip hint="Changes are kept in this session only — not saved to the server yet" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div className="space-y-2"><Label>Role</Label><Input value={user.role} disabled className="capitalize" /></div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="inline-flex items-center gap-2">Bio <Wip hint="Bio is not saved yet" /></Label>
              <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            {dirty && (
              <>
                <span className="text-xs text-amber-600 dark:text-amber-400 animate-fade-in">Unsaved changes</span>
                <Button variant="ghost" onClick={() => setForm(initial)}>Reset</Button>
              </>
            )}
            <Button
              className="bg-gradient-primary shadow-glow"
              disabled={!dirty}
              onClick={() => {
                dispatch(updateProfile({ name: form.name, email: form.email, department: form.department }));
                toast.success('Profile updated');
              }}
            >
              Save changes
            </Button>
          </div>
        </section>
      )}

      {/* ── Security ── */}
      {tab === 'security' && (
        <section key="security" className="card-elevated p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-8 w-1 rounded-full bg-gradient-to-b from-rose-500 to-amber-500" />
            <Lock className="h-4 w-4 text-primary" />
            <h3 className="font-display font-bold text-lg">Change password</h3>
            <Wip hint="Password change is not connected to the server yet" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <PasswordField label="Current" value={pw.current} onChange={(v) => setPw({ ...pw, current: v })} />
            <PasswordField label="New" value={pw.next} onChange={(v) => setPw({ ...pw, next: v })} />
            <PasswordField label="Confirm new" value={pw.confirm} onChange={(v) => setPw({ ...pw, confirm: v })} />
          </div>

          {pw.next && (
            <div className="mt-4 max-w-sm animate-fade-in">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn('h-1.5 flex-1 rounded-full transition-colors duration-300', i < st.score ? st.bar : 'bg-muted')}
                  />
                ))}
              </div>
              <p className={cn('mt-1 text-xs font-semibold', st.text)}>{st.label}</p>
            </div>
          )}
          {mismatch && <p className="mt-2 text-xs font-medium text-destructive animate-fade-in">Passwords don’t match.</p>}

          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              disabled={!canUpdatePw}
              onClick={() => { setPw({ current: '', next: '', confirm: '' }); toast.success('Password updated'); }}
            >
              Update password
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
