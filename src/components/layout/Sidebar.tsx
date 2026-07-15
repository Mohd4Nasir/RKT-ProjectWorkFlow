

import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, ListChecks, Users, BarChart3, Calendar,
  Bell, Settings, User, Sparkles, FileStack,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store';
interface NavItemProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  collapsed: boolean;
  active: boolean;
}
const adminNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: ListChecks, label: 'Tasks' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/files', icon: FileStack, label: 'Files' },
];
const userNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/my-projects', icon: FolderKanban, label: 'My Projects' },
  { to: '/my-tasks', icon: ListChecks, label: 'My Tasks' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/files', icon: FileStack, label: 'Files' },
];
// const bottomNav = [
//   { to: '/notifications', icon: Bell, label: 'Notifications' },
//   { to: '/profile', icon: User, label: 'Profile' },
//   { to: '/settings', icon: Settings, label: 'Settings' },
// ];

export function Sidebar() {
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const role = useAppSelector((s) => s.auth.user?.role);
  const nav = role === 'admin' ? adminNav : userNav;
  const { pathname } = useLocation();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r transition-all duration-300 sticky top-0 h-screen z-30",
        "bg-[#181F39]", // Changed to dark navy blue
        collapsed ? "w-[76px]" : "w-[260px]"
      )}
      style={{
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
      }}
    >
      {/* Optional: Add subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#181F39] to-[#13192E] opacity-50" />

      {/* Diagonal Pattern Overlay - Keep for texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 80px)`
        }}
      />

      {/* Brand Pattern - Decorative Circles */}
      <div className="absolute bottom-40 right-5 w-64 h-64 border-4 border-white/5 rounded-full pointer-events-none" />
      <div className="absolute top-40 left-5 w-32 h-32 border-4 border-white/5 rounded-full pointer-events-none" />

      {/* Content - with relative positioning to stay above background */}
      <div className="relative z-10 flex flex-col h-full">
        <div className={cn('flex items-center gap-3 px-5 h-16 border-b border-white/10', collapsed && 'justify-center px-0')}>
          <div className="h-9 w-9 rounded-xl bg-white/10 ring-1 ring-white/20 grid place-items-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display font-bold text-[15px] text-white">RishiKirti</div>
              <div className="text-[11px] text-white/60">Projects Suite</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          {!collapsed && <div className="text-[10px] uppercase tracking-wider font-semibold text-white/50 px-3 mb-2">Workspace</div>}
          <ul className="space-y-1">
            {nav.map((item) => (
              <NavItem key={item.to} {...item} collapsed={collapsed} active={pathname === item.to || pathname.startsWith(item.to + '/')} />
            ))}
          </ul>

          {/* {!collapsed && <div className="text-[10px] uppercase tracking-wider font-semibold text-white/50 px-3 mt-6 mb-2">Account</div>}
          <ul className="space-y-1 mt-3">
            {bottomNav.map((item) => (
              <NavItem key={item.to} {...item} collapsed={collapsed} active={pathname === item.to} />
            ))}
          </ul> */}
        </nav>
      </div>
    </aside>
  );
}

function NavItem({ to, icon: Icon, label, collapsed, active }: NavItemProps) {
  return (
    <li>
      <NavLink
        to={to}
        className={cn(
          'group relative flex items-center gap-3 h-10 rounded-lg px-3 text-sm font-medium transition-all',
          active
            ? 'bg-white/15 text-white shadow-sm font-semibold'
            : 'text-white/85 hover:bg-white/10 hover:text-white',
          collapsed && 'justify-center px-0'
        )}
        title={collapsed ? label : undefined}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </NavLink>
    </li>
  );
}
