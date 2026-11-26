import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, ListChecks, Users, BarChart3, Calendar,
  Bell, Settings, User, FileStack, ChevronsLeft, ChevronsRight, Palette, Check, Sun, Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { useAppDispatch, useAppSelector } from '@/store';
import { setColorTheme, setMobileNav, setTheme, toggleSidebar } from '@/store/slices/uiSlice';
import { COLOR_THEMES } from '@/lib/themes';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserAvatar } from '@/components/UserAvatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';

/* Brand palette pinned here so the sidebar look stays stable */
const PEACH = 'hsl(var(--pill))';
const NAVY = 'hsl(var(--pill-fg))';

interface NavEntry {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  /** small tag next to the label (e.g. unfinished pages) */
  tag?: string;
  /** who can see this item. Omit = everyone. */
  roles?: string[];
}

interface NavSection {
  id: string;
  title: string;
  /** who can see the whole section. Omit = everyone. */
  roles?: string[];
  items: NavEntry[];
}

/**
 * Sidebar menu, grouped by purpose and filtered by role.
 *
 * Roles today come from the token (`admin` / `user`). When the backend starts
 * returning finer roles (manager, member, viewer ...), only the `roles` arrays
 * below need to change - the rendering below doesn't care.
 */
const NAV_SECTIONS: NavSection[] = [
  {
    id: 'workspace',
    title: 'Workspace',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      // admin
      { to: '/projects', icon: FolderKanban, label: 'Projects', roles: ['admin'] },
      { to: '/tasks', icon: ListChecks, label: 'Tasks', roles: ['admin'] },
      // normal user
      { to: '/my-projects', icon: FolderKanban, label: 'Projects', roles: ['user'] },
      // { to: '/my-tasks', icon: ListChecks, label: 'Tasks', roles: ['user'] },
      // admin
      { to: '/users', icon: Users, label: 'Users', roles: ['admin'] },
      { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin'] },
      // everyone
      { to: '/calendar', icon: Calendar, label: 'Calendar' },
      // { to: '/files', icon: FileStack, label: 'Files', tag: 'WIP' },
    ],
  },
  {
    id: 'my-workspace',
    title: 'My Workspace',
    items: [
      { to: '/workspace/projects', icon: FolderKanban, label: 'My Projects', tag: 'Soon' },
      { to: '/workspace/tasks', icon: ListChecks, label: 'My Tasks', tag: 'Soon' },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    items: [
      { to: '/notifications', icon: Bell, label: 'Notifications', tag: 'WIP' },
      { to: '/profile', icon: User, label: 'Profile' },
      { to: '/settings', icon: Settings, label: 'Settings', tag: 'WIP' },
    ],
  },
];

const allowed = (roles: string[] | undefined, role?: string) =>
  !roles || roles.length === 0 || (!!role && roles.includes(role));

/* ───────────────────────── Desktop + mobile shells ───────────────────────── */

export function Sidebar() {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const mobileOpen = useAppSelector((s) => s.ui.mobileNavOpen);
  const { pathname } = useLocation();

  // never reopen the mobile drawer from persisted state
  useEffect(() => {
    dispatch(setMobileNav(false));
  }, [dispatch]);

  // close the drawer after navigating
  useEffect(() => {
    dispatch(setMobileNav(false));
  }, [pathname, dispatch]);

  // Ctrl/Cmd + B collapses the sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        dispatch(toggleSidebar());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          'hidden md:block sticky top-0 h-screen z-30 shrink-0',
          'transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          collapsed ? 'w-[76px]' : 'w-[260px]',
        )}
      >
        <SidebarSurface collapsed={collapsed} />

        {/* Floating collapse handle */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={`${collapsed ? 'Expand' : 'Collapse'} (Ctrl+B)`}
          className="absolute -right-3 top-[72px] z-40 h-6 w-6 rounded-full grid place-items-center
                     bg-card text-foreground border border-border shadow-md
                     hover:scale-110 hover:bg-primary hover:text-primary-foreground hover:border-primary
                     transition-all duration-200"
        >
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={(v) => dispatch(setMobileNav(v))}>
        <SheetContent side="left" className="p-0 w-[280px] border-0 bg-transparent [&>button]:text-white [&>button]:z-50">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
          <SidebarSurface collapsed={false} />
        </SheetContent>
      </Sheet>
    </>
  );
}

/* ───────────────────────── Surface (shared) ───────────────────────── */

function SidebarSurface({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useAppSelector((s) => s.auth.user);
  const unread = useAppSelector((s) => s.notifications.items.filter((n) => !n.read).length);
  const sections = NAV_SECTIONS
    .filter((sec) => allowed(sec.roles, user?.role))
    .map((sec) => ({
      ...sec,
      items: sec.items
        .filter((i) => allowed(i.roles, user?.role))
        .map((i) => (i.to === '/notifications' ? { ...i, badge: unread } : i)),
    }))
    .filter((sec) => sec.items.length > 0);
  const flatItems = sections.flatMap((sec) => sec.items);

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + '/');

  /* Sliding active indicator */
  const wrapRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const [ind, setInd] = useState<{ top: number; height: number } | null>(null);

  const measure = () => {
    const active = flatItems.find((i) => isActive(i.to));
    const el = active ? itemRefs.current[active.to] : null;
    setInd(el ? { top: el.offsetTop, height: el.offsetHeight } : null);
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, collapsed, user?.role]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, collapsed, user?.role]);

  let idx = 0;

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden border-r border-white/5"
      style={{ background: 'linear-gradient(to bottom, hsl(var(--sidebar-from)), hsl(var(--sidebar-via)), hsl(var(--sidebar-to)))' }}
    >
      {/* Aurora blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-[hsl(var(--pill)/0.2)] blur-3xl animate-aurora" />
      <div aria-hidden className="pointer-events-none absolute bottom-10 -right-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl animate-aurora [animation-delay:-7s]" />

      <NetworkSignature collapsed={collapsed} />

      <div className="relative z-10 flex h-full flex-col">
        {/* Brand */}
        <button
          onClick={() => navigate('/dashboard')}
          className={cn(
            'group flex items-center gap-3 h-16 px-5 border-b border-white/10 text-left shrink-0',
            collapsed && 'justify-center px-0',
          )}
        >
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/25 shadow-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
            <Logo className="h-9 w-9" />
            <span aria-hidden className="absolute inset-y-0 -left-full w-1/2 bg-white/30 blur-sm animate-shine" />
          </div>
          <div
            className={cn(
              'leading-tight overflow-hidden whitespace-nowrap transition-all duration-300',
              collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
            )}
          >
            <div className="font-display font-bold text-[15px] text-white">WorkSphere</div>
            <div className="text-[11px] text-white/60">by RishiKirti</div>
          </div>
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-thin">
          <div ref={wrapRef} className="relative">
            {/* gliding highlight */}
            <span
              aria-hidden
              className={cn(
                'absolute left-0 right-0 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                ind ? 'opacity-100' : 'opacity-0',
              )}
              style={{
                top: ind?.top ?? 0,
                height: ind?.height ?? 40,
                background: PEACH,
                boxShadow: '0 6px 20px -6px hsl(var(--pill) / 0.55)',
              }}
            />
            {/* glow bar at the edge of the highlight */}
            <span
              aria-hidden
              className={cn(
                'absolute -left-3 w-[3px] rounded-r-full bg-[hsl(var(--pill))] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                ind ? 'opacity-100' : 'opacity-0',
              )}
              style={{
                top: (ind?.top ?? 0) + (ind?.height ?? 40) / 2 - 12,
                height: 24,
                boxShadow: '0 0 12px 2px hsl(var(--pill) / 0.7)',
              }}
            />

            {sections.map((sec, si) => (
              <Section key={sec.id} title={sec.title} collapsed={collapsed} className={si > 0 ? 'mt-5' : ''}>
                {sec.items.map((item) => (
                  <NavItem
                    key={item.to}
                    item={item}
                    collapsed={collapsed}
                    active={isActive(item.to)}
                    delay={idx++ * 40}
                    liRef={(el) => (itemRefs.current[item.to] = el)}
                  />
                ))}
              </Section>
            ))}
          </div>
        </nav>

        <ThemePicker collapsed={collapsed} />

        {/* User card */}
        {user && (
          <div className="p-3 border-t border-white/10 shrink-0">
            <button
              onClick={() => navigate('/profile')}
              title={collapsed ? user.name : undefined}
              className={cn(
                'group w-full flex items-center gap-3 rounded-xl p-2.5 text-left',
                'bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors',
                collapsed && 'justify-center p-2',
              )}
            >
              <span className="relative shrink-0">
                <UserAvatar name={user.name || 'U'} size="sm" className="ring-0" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[hsl(var(--sidebar-via))]" />
              </span>
              {!collapsed && (
                <span className="min-w-0 leading-tight">
                  <span className="block text-[13px] font-semibold text-white truncate">{user.name}</span>
                  <span className="block text-[11px] text-white/55 capitalize truncate">{user.role}</span>
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Pieces ───────────────────────── */

function Section({
  title, collapsed, className, children,
}: { title: string; collapsed: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <div
        className={cn(
          'px-3 overflow-hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45 transition-all duration-300',
          collapsed ? 'h-px mb-3 mt-1 bg-white/10 text-transparent' : 'h-4 mb-2',
        )}
      >
        {!collapsed && title}
      </div>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function NavItem({
  item, collapsed, active, delay, liRef,
}: {
  item: NavEntry;
  collapsed: boolean;
  active: boolean;
  delay: number;
  liRef: (el: HTMLLIElement | null) => void;
}) {
  const { to, icon: Icon, label, badge, tag } = item;

  const link = (
    <NavLink
      to={to}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative z-10 flex items-center gap-3 h-10 rounded-lg px-3 text-[13.5px] font-medium',
        'transition-colors duration-200',
        collapsed && 'justify-center px-0',
        active ? 'font-semibold' : 'text-white/80 hover:text-white hover:bg-white/[0.07]',
      )}
      style={active ? { color: NAVY } : undefined}
    >
      <Icon
        className={cn(
          'h-[18px] w-[18px] shrink-0 transition-all duration-200',
          !active && 'text-white/65 group-hover:text-white group-hover:scale-110 group-hover:-rotate-3',
        )}
      />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}

      {!collapsed && tag && (
        <span className={cn(
          'rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
          active ? 'bg-[hsl(var(--pill-fg))] text-white' : 'bg-white/15 text-white/80',
        )}>
          {tag}
        </span>
      )}
      {!collapsed && !!badge && (
        <span
          className={cn(
            'min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold grid place-items-center',
            active ? 'bg-[hsl(var(--pill-fg))] text-white' : 'bg-[hsl(var(--pill))] text-[hsl(var(--pill-fg))]',
          )}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {collapsed && !!badge && (
        <span className="absolute top-1.5 right-3 h-2 w-2 rounded-full bg-[hsl(var(--pill))] ring-2 ring-[hsl(var(--sidebar-via))]" />
      )}
    </NavLink>
  );

  return (
    <li
      ref={liRef}
      className="animate-fade-in [animation-fill-mode:both]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {collapsed ? (
        <Tooltip delayDuration={80}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={14} className="bg-sidebar text-white border-white/10 text-xs font-medium">
            {label}
            {!!badge && <span className="ml-2 text-[hsl(var(--pill))]">{badge}</span>}
          </TooltipContent>
        </Tooltip>
      ) : (
        link
      )}
    </li>
  );
}

/**
 * Brand signature: faint constellation of connected nodes with one pulsing
 * node in the highlight colour — same motif as the login page.
 */
function NetworkSignature({ collapsed }: { collapsed: boolean }) {
  const nodes = [
    { x: 40, y: 60, r: 2.5 }, { x: 140, y: 110, r: 2 }, { x: 70, y: 190, r: 3 },
    { x: 180, y: 250, r: 2 }, { x: 50, y: 320, r: 2.5 }, { x: 160, y: 400, r: 2 },
    { x: 90, y: 470, r: 3.5 }, { x: 30, y: 560, r: 2 }, { x: 150, y: 620, r: 2.5 },
    { x: 70, y: 700, r: 2 },
  ];
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [2, 4], [5, 7],
  ];
  const pulseIndex = 6;

  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.45] pointer-events-none"
      viewBox="0 0 220 760"
      preserveAspectRatio={collapsed ? 'xMidYMid slice' : 'xMaxYMid slice'}
    >
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
          stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="1" />
      ))}
      {nodes.map((n, i) =>
        i === pulseIndex ? null : <circle key={i} cx={n.x} cy={n.y} r={n.r} fill="#FFFFFF" fillOpacity="0.25" />,
      )}
      <circle cx={nodes[pulseIndex].x} cy={nodes[pulseIndex].y} r={nodes[pulseIndex].r} style={{ fill: 'hsl(var(--pill))' }}>
        <animate attributeName="r" values="3.5;9;3.5" dur="2.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0;0.8" dur="2.6s" repeatCount="indefinite" />
      </circle>
      <circle cx={nodes[pulseIndex].x} cy={nodes[pulseIndex].y} r="3" style={{ fill: 'hsl(var(--pill))' }} />

      <g transform="translate(118, 90)" opacity="0.14">
        <path d="M0 6 C0 3.8 1.8 2 4 2 H14 L18 6 H36 C38.2 6 40 7.8 40 10 V26 C40 28.2 38.2 30 36 30 H4 C1.8 30 0 28.2 0 26 Z"
          fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
      </g>
      <g transform="translate(155, 220)" opacity="0.13">
        <path d="M2 2 H20 L30 12 V38 C30 39.7 28.7 41 27 41 H2 C0.3 41 -1 39.7 -1 38 V4 C-1 2.3 0.3 2 2 2 Z"
          fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M20 2 V12 H30" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
        <line x1="4" y1="20" x2="24" y2="20" stroke="#FFFFFF" strokeWidth="1.4" />
        <line x1="4" y1="27" x2="24" y2="27" stroke="#FFFFFF" strokeWidth="1.4" />
        <line x1="4" y1="34" x2="17" y2="34" stroke="#FFFFFF" strokeWidth="1.4" />
      </g>
      <g transform="translate(52, 435)" opacity="0.15">
        <rect x="0" y="4" width="34" height="42" rx="3" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
        <line x1="7" y1="0" x2="7" y2="8" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="17" y1="0" x2="17" y2="8" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="27" y1="0" x2="27" y2="8" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="6" y1="18" x2="28" y2="18" stroke="#FFFFFF" strokeWidth="1.3" />
        <line x1="6" y1="25" x2="28" y2="25" stroke="#FFFFFF" strokeWidth="1.3" />
        <line x1="6" y1="32" x2="21" y2="32" stroke="#FFFFFF" strokeWidth="1.3" />
      </g>
    </svg>
  );
}


/* ───────────────────────── Theme picker ───────────────────────── */

function ThemePicker({ collapsed }: { collapsed: boolean }) {
  const dispatch = useAppDispatch();
  const colorTheme = useAppSelector((st) => st.ui.colorTheme) || 'classic';
  const mode = useAppSelector((st) => st.ui.theme);
  const current = COLOR_THEMES.find((t) => t.id === colorTheme) ?? COLOR_THEMES[0];

  return (
    <div className="px-3 pb-2 shrink-0">
      <Popover>
        <PopoverTrigger asChild>
          <button
            title={collapsed ? 'Theme' : undefined}
            className={cn(
              'group w-full flex items-center gap-3 h-10 rounded-lg px-3 text-[13.5px] font-medium',
              'text-white/80 hover:text-white hover:bg-white/[0.07] transition-colors',
              collapsed && 'justify-center px-0',
            )}
          >
            <Palette className="h-[18px] w-[18px] shrink-0 text-white/65 group-hover:text-white group-hover:rotate-12 transition-all" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Theme</span>
                <span className="flex items-center gap-1.5 text-[11px] text-white/60">
                  <span
                    className="h-3 w-3 rounded-full ring-1 ring-white/30"
                    style={{ background: `hsl(${current.primary})` }}
                  />
                  {current.label}
                </span>
              </>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent side={collapsed ? 'right' : 'top'} align="start" sideOffset={10} className="w-[280px] p-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Appearance</div>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 mb-4">
            {([['light', 'Light', Sun], ['dark', 'Dark', Moon]] as const).map(([k, label, Icon]) => (
              <button
                key={k}
                onClick={() => {
                  dispatch(setTheme(k));
                  document.documentElement.classList.toggle('dark', k === 'dark');
                }}
                className={cn(
                  'h-8 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors',
                  mode === k ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Colour theme</div>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_THEMES.map((t) => {
              const active = t.id === colorTheme;
              return (
                <button
                  key={t.id}
                  onClick={() => dispatch(setColorTheme(t.id))}
                  title={t.label}
                  className={cn(
                    'group relative rounded-lg border p-1.5 text-center transition-all hover:-translate-y-0.5',
                    active ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50',
                  )}
                >
                  {/* mini preview: sidebar | page | accent */}
                  <span
                    className="flex h-10 w-full overflow-hidden rounded-md border border-black/5"
                    style={{ background: `hsl(${t.canvas})` }}
                  >
                    <span className="w-1/3" style={{ background: `hsl(${t.sidebar})` }} />
                    <span className="flex-1 flex items-end justify-end p-1">
                      <span className="h-3 w-5 rounded-sm" style={{ background: `hsl(${t.primary})` }} />
                    </span>
                  </span>
                  <span className="mt-1 block text-[11px] font-semibold">{t.label}</span>
                  {active && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground grid place-items-center">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
