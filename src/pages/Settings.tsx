import { useAppDispatch, useAppSelector } from '@/store';
import { setSetting, setTheme } from '@/store/slices/uiSlice';
import { PageHeader } from '@/components/PageHeader';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Bell, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const dispatch = useAppDispatch();
  const ui = useAppSelector((s) => s.ui);

  const setKey = (k: any, v: any) => dispatch(setSetting({ key: k, value: v }));
  const flip = () => {
    const next = ui.theme === 'light' ? 'dark' : 'light';
    dispatch(setTheme(next));
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage organization preferences, theme and notifications." />

      <div className="card-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          {ui.theme === 'light' ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4 text-primary" />}
          <h3 className="font-display font-bold text-lg">Appearance</h3>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
          <div>
            <div className="font-semibold text-sm">Theme</div>
            <div className="text-xs text-muted-foreground">Switch between light and dark mode</div>
          </div>
          <Switch checked={ui.theme === 'dark'} onCheckedChange={flip} />
        </div>
      </div>

      <div className="card-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="font-display font-bold text-lg">Notifications</h3>
        </div>
        <div className="space-y-3">
          <Row title="Email notifications" desc="Receive task assignments and reminders by email" checked={ui.notifyEmail} onChange={(v) => setKey('notifyEmail', v)} />
          <Row title="Push notifications" desc="Browser push for real-time updates" checked={ui.notifyPush} onChange={(v) => setKey('notifyPush', v)} />
        </div>
      </div>

      <div className="card-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="font-display font-bold text-lg">Organization</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Organization name</Label><Input value={ui.orgName} onChange={(e) => setKey('orgName', e.target.value)} /></div>
          <div className="space-y-2"><Label>Time zone</Label><Input defaultValue="Asia/Kolkata (UTC+5:30)" /></div>
        </div>
        <div className="flex justify-end mt-4"><Button className="bg-gradient-primary" onClick={() => toast.success('Settings saved')}>Save</Button></div>
      </div>
    </div>
  );
}

function Row({ title, desc, checked, onChange }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
