import { useState, useMemo } from 'react';
import { Bell, Search, LogOut, Moon, Sun, Settings, User as UserIcon, Menu } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { setTheme, toggleSidebar } from '@/store/slices/uiSlice';
import { markAllRead } from '@/store/slices/notificationsSlice';
import { useNavigate, Link } from 'react-router-dom';
import { UserAvatar } from '@/components/UserAvatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { relativeTime } from '@/utils/format';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { performLogout } from '@/services/keycloakService';

export function Header() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const theme = useAppSelector((s) => s.ui.theme);
  const notifications = useAppSelector((s) => s.notifications.items);
  const projects = useAppSelector((s) => s.projects.items);
  const tasks = useAppSelector((s) => s.tasks.items);
  const users = useAppSelector((s) => s.users.items);
  const [loading, setLoading] = useState(false);


  const [q, setQ] = useState('');

  const results = useMemo(() => {
    if (!q.trim()) return null;
    const t = q.toLowerCase();
    return {
      projects: projects.filter((p) => p.name.toLowerCase().includes(t)).slice(0, 4),
      tasks: tasks.filter((tk) => tk.title.toLowerCase().includes(t)).slice(0, 4),
      users: users.filter((u) => u.name.toLowerCase().includes(t) || u.email.toLowerCase().includes(t)).slice(0, 4),
    };
  }, [q, projects, tasks, users]);

  const unread = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    setLoading(true);

    try {
      // Step 1: Clear Redux state
      dispatch(logout());

      // Step 2: Clear localStorage/sessionStorage (if any)
      localStorage.removeItem('kc_token');
      localStorage.removeItem('kc_refresh_token');
      sessionStorage.clear();

      // Step 3: Keycloak logout - redirect to login page
      await performLogout(`${window.location.origin}/login`);

      // Note: performLogout redirects, so code below may not execute
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect if Keycloak logout fails
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const flipTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    dispatch(setTheme(next));
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center px-4 md:px-6 gap-3">
      <button
        className="h-9 w-9 grid place-items-center rounded-lg hover:bg-muted text-foreground"
        onClick={() => dispatch(toggleSidebar())}
        title="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search projects, tasks, people…"
          className="pl-9 h-10 bg-muted/40 border-transparent focus-visible:bg-card focus-visible:border-primary/30"
        />
        {results && (
          <div className="absolute top-12 left-0 right-0 bg-card border border-border rounded-xl shadow-lifted p-2 max-h-96 overflow-y-auto scrollbar-thin animate-fade-in">
            <SearchSection title="Projects" empty="No projects">
              {results.projects.map((p) => (
                <Link key={p.id} to="/projects" onClick={() => setQ('')} className="block px-3 py-2 rounded-lg hover:bg-muted text-sm">{p.name}</Link>
              ))}
            </SearchSection>
            <SearchSection title="Tasks" empty="No tasks">
              {results.tasks.map((t) => (
                <Link key={t.id} to="/tasks" onClick={() => setQ('')} className="block px-3 py-2 rounded-lg hover:bg-muted text-sm">{t.title}</Link>
              ))}
            </SearchSection>
            <SearchSection title="People" empty="No people">
              {results.users.map((u) => (
                <Link key={u.id} to="/users" onClick={() => setQ('')} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm">
                  <UserAvatar name={u.name} size="sm" /> {u.name}
                </Link>
              ))}
            </SearchSection>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 ml-auto pl-2 border-l border-border/60">
        <Button variant="ghost" size="icon" onClick={flipTheme} className="h-10 w-10">
          {theme === 'light' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <button className="relative h-10 w-10 grid place-items-center rounded-lg hover:bg-muted">
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger ring-2 ring-card" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="font-semibold">Notifications</div>
              <button className="text-xs text-primary hover:text-primary-hover font-semibold" onClick={() => dispatch(markAllRead())}>Mark all read</button>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {notifications.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">You're all caught up</div>}
              {notifications.map((n) => (
                <div key={n.id} className={cn('flex gap-3 p-4 border-b last:border-b-0 hover:bg-muted/40 cursor-pointer', !n.read && 'bg-primary-soft/30')}>
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{n.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{n.description}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{relativeTime(n.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-1 pr-3 h-10 rounded-lg hover:bg-muted ml-1">
              <UserAvatar name={user?.name || 'U'} size="sm" />
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-[13px] font-semibold">{user?.name}</div>
                <div className="text-[10px] text-muted-foreground capitalize">{user?.role}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}><UserIcon className="h-4 w-4 mr-2" />Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}><Settings className="h-4 w-4 mr-2" />Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-danger focus:text-danger"><LogOut className="h-4 w-4 mr-2" />Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SearchSection({ title, empty, children }: any) {
  const arr = Array.isArray(children) ? children : [children];
  return (
    <div className="py-1">
      <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{title}</div>
      {arr.length === 0 ? <div className="px-3 py-2 text-xs text-muted-foreground">{empty}</div> : children}
    </div>
  );
}
