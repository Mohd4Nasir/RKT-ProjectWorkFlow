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
        "hidden md:flex flex-col border-r transition-all duration-300 sticky top-0 h-screen z-30 overflow-hidden",
        "bg-[#201F1D] border-white/10",
        collapsed ? "w-[76px]" : "w-[250px]"
      )}
    >
      {/* Depth gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#181F39] to-[#13192E] opacity-50" />

      {/* Brand signature — connected-node network, matches the login page motif */}
      <NetworkSignature collapsed={collapsed} />

      {/* Content */}
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
          'group relative flex items-center gap-3 h-10 rounded-lg pl-3 pr-3 text-sm font-medium transition-all duration-200',
          active
            ? 'bg-secondary text-foreground font-semibold'
            : 'text-white/85 hover:bg-white/10 hover:text-white',
          collapsed && 'justify-center px-0'
        )}
        title={collapsed ? label : undefined}
      >
        {/* Active indicator — glowing bar on the left edge */}
        <span
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full  transition-all duration-200',
            active ? 'h-6 w-[3px] opacity-100 shadow-[0_0_10px_2px_rgba(238,187,195,0.6)]' : 'h-2 w-[3px] opacity-0'
          )}
        />
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition-colors',
            active ? 'text-foreground' : 'text-white/70 group-hover:text-white'
          )}
        />
        {!collapsed && <span className="truncate">{label}</span>}
      </NavLink>
    </li>
  );
}

/**
 * Brand signature: a faint constellation of connected nodes running the
 * height of the rail, with one node pulsing in the brand highlight color
 * (#eebbc3) to suggest live, ongoing activity — same motif as the login
 * page's left panel. Folder / document / notepad silhouettes sit at a few
 * of the nodes, naming what's actually flowing through the network: the
 * workspace's projects and files.
 */
function NetworkSignature({ collapsed }: { collapsed: boolean }) {
  const nodes = [
    { x: 40, y: 60, r: 2.5 },
    { x: 140, y: 110, r: 2 },
    { x: 70, y: 190, r: 3 },
    { x: 180, y: 250, r: 2 },
    { x: 50, y: 320, r: 2.5 },
    { x: 160, y: 400, r: 2 },
    { x: 90, y: 470, r: 3.5 },
    { x: 30, y: 560, r: 2 },
    { x: 150, y: 620, r: 2.5 },
    { x: 70, y: 700, r: 2 },
  ];
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [2, 4], [5, 7],
  ];
  const pulseIndex = 6;

  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.5] pointer-events-none"
      viewBox="0 0 220 760"
      preserveAspectRatio={collapsed ? 'xMidYMid slice' : 'xMaxYMid slice'}
    >
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="#FFFFFF"
          strokeOpacity="0.12"
          strokeWidth="1"
        />
      ))}
      {nodes.map((n, i) =>
        i === pulseIndex ? null : (
          <circle key={i} cx={n.x} cy={n.y} r={n.r} fill="#FFFFFF" fillOpacity="0.25" />
        )
      )}

      {/* pulsing "live" node in the brand highlight color */}
      <circle cx={nodes[pulseIndex].x} cy={nodes[pulseIndex].y} r={nodes[pulseIndex].r}>
        <animate attributeName="r" values="3.5;8;3.5" dur="2.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0;0.8" dur="2.6s" repeatCount="indefinite" />
      </circle>
      <circle cx={nodes[pulseIndex].x} cy={nodes[pulseIndex].y} r="3" fill="#eebbc3" />

      {/* Folder — sits near node 1 */}
      <g transform="translate(118, 90)" opacity="0.14">
        <path
          d="M0 6 C0 3.8 1.8 2 4 2 H14 L18 6 H36 C38.2 6 40 7.8 40 10 V26 C40 28.2 38.2 30 36 30 H4 C1.8 30 0 28.2 0 26 Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </g>

      {/* Document / file — sits near node 3 */}
      <g transform="translate(155, 220)" opacity="0.13">
        <path
          d="M2 2 H20 L30 12 V38 C30 39.7 28.7 41 27 41 H2 C0.3 41 -1 39.7 -1 38 V4 C-1 2.3 0.3 2 2 2 Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M20 2 V12 H30" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
        <line x1="4" y1="20" x2="24" y2="20" stroke="#FFFFFF" strokeWidth="1.4" />
        <line x1="4" y1="27" x2="24" y2="27" stroke="#FFFFFF" strokeWidth="1.4" />
        <line x1="4" y1="34" x2="17" y2="34" stroke="#FFFFFF" strokeWidth="1.4" />
      </g>

      {/* Notepad — sits near node 6 */}
      <g transform="translate(52, 435)" opacity="0.15">
        <rect x="0" y="4" width="34" height="42" rx="3" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
        <line x1="7" y1="0" x2="7" y2="8" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="17" y1="0" x2="17" y2="8" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="27" y1="0" x2="27" y2="8" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="6" y1="18" x2="28" y2="18" stroke="#FFFFFF" strokeWidth="1.3" />
        <line x1="6" y1="25" x2="28" y2="25" stroke="#FFFFFF" strokeWidth="1.3" />
        <line x1="6" y1="32" x2="21" y2="32" stroke="#FFFFFF" strokeWidth="1.3" />
      </g>

      {/* Folder — sits near node 8, smaller / further */}
      <g transform="translate(135, 645)" opacity="0.12">
        <path
          d="M0 5 C0 3.3 1.3 2 3 2 H11 L14 5 H28 C29.7 5 31 6.3 31 8 V21 C31 22.7 29.7 24 28 24 H3 C1.3 24 0 22.7 0 21 Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}