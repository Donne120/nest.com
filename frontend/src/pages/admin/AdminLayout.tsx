import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, TrendingUp, BookOpen, Settings,
  LogOut, Bell, ArrowUpRight, ChevronRight, Video, Users, Menu, X,
  Sun, Moon, Monitor
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../store';
import Avatar from '../../components/UI/Avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import type { Notification } from '../../types';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

const navLinks = [
  { to: '/admin', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/courses', end: false, icon: BookOpen, label: 'Courses' },
  { to: '/admin/questions', end: false, icon: MessageSquare, label: 'Questions' },
  { to: '/admin/analytics', end: false, icon: TrendingUp, label: 'Analytics' },
  { to: '/admin/meetings', end: false, icon: Video, label: 'Meetings' },
  { to: '/admin/users', end: false, icon: Users, label: 'Users' },
  { to: '/admin/settings', end: false, icon: Settings, label: 'Settings' },
];

const PAGE_TITLES: [string, string][] = [
  ['/admin/courses/new', 'New Module'],
  ['/admin/courses/', 'Edit Module'],
  ['/admin/courses', 'Course Manager'],
  ['/admin/questions/', 'Question Detail'],
  ['/admin/questions', 'Questions'],
  ['/admin/analytics', 'Analytics'],
  ['/admin/meetings', 'Meetings'],
  ['/admin/users', 'Users'],
  ['/admin/settings', 'Settings'],
  ['/admin', 'Dashboard'],
];

const THEME_CYCLE = { light: 'dark', dark: 'system', system: 'light' } as const;
const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor };

export default function AdminLayout() {
  const { user, clearAuth } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const ThemeIcon = THEME_ICONS[theme];

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/analytics/notifications?unread_only=false').then(r => r.data),
    refetchInterval: 30000,
  });

  const unread = notifications.filter(n => !n.is_read).length;

  const markAllRead = useMutation({
    mutationFn: () => api.put('/analytics/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const pageTitle = PAGE_TITLES.find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
      || location.pathname.startsWith(path)
  )?.[1] ?? 'Admin';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans antialiased">

      {/* ─── Mobile backdrop ─────────────────────────── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─────────────────────────────────── */}
      <aside className={clsx(
        'w-[220px] flex-shrink-0 bg-slate-900 flex flex-col',
        'fixed inset-y-0 left-0 z-50 transition-transform duration-200',
        'lg:static lg:translate-x-0',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>

        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-white/5 flex-shrink-0">
          <Link to="/admin" className="flex items-center gap-3 flex-1" onClick={() => setMobileSidebarOpen(false)}>
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm tracking-tight">N</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">Nest</p>
              <p className="text-slate-500 text-[11px] mt-0.5 font-medium">Admin Console</p>
            </div>
          </Link>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-5 pb-2 overflow-y-auto">
          <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
            Main Menu
          </p>
          <ul className="space-y-0.5">
            {navLinks.map(({ to, end, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150',
                      isActive
                        ? 'bg-brand-600 text-white shadow-sm shadow-brand-900/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={15} className={isActive ? 'opacity-90' : 'opacity-50'} />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="border-t border-white/[0.06] mt-5 pt-5">
            <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
              Workspace
            </p>
            <Link
              to="/modules"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-all"
            >
              <ArrowUpRight size={15} className="opacity-50" />
              <span>Employee View</span>
            </Link>
          </div>
        </nav>

        {/* User profile at bottom */}
        <div className="border-t border-white/[0.06] p-3 flex-shrink-0 space-y-1">
          {/* Theme cycle */}
          <button
            onClick={() => setTheme(THEME_CYCLE[theme])}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-all text-[12px] font-medium"
            title={`Theme: ${theme} — click to cycle`}
          >
            <ThemeIcon size={13} className="opacity-60" />
            <span className="capitalize">{theme} theme</span>
          </button>

          <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.06] transition-colors group cursor-default">
            <Avatar name={user?.full_name ?? ''} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-slate-200 truncate leading-none mb-0.5">
                {user?.full_name}
              </p>
              <p className="text-[11px] text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 text-slate-600 hover:text-red-400 rounded-md transition-colors opacity-0 group-hover:opacity-100"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main area ───────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200/80 dark:border-slate-700 flex items-center px-4 sm:px-6 gap-3 flex-shrink-0 z-10">
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors lg:hidden flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          {/* Page breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 dark:text-slate-500 font-medium">Admin</span>
            <ChevronRight size={14} className="text-gray-300 dark:text-slate-600" />
            <span className="text-gray-800 dark:text-slate-200 font-semibold">{pageTitle}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen(o => !o);
                  if (unread > 0) markAllRead.mutate();
                }}
                className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell size={17} />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] max-w-xs sm:w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-modal z-50 overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm">Notifications</h3>
                    {unread === 0 && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full font-medium">
                        All read
                      </span>
                    )}
                  </div>
                  <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-slate-500 p-6 text-center">No notifications yet</p>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className={clsx(
                            'px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors',
                            !n.is_read && 'bg-blue-50/40 dark:bg-blue-900/20'
                          )}
                          onClick={() => {
                            setNotifOpen(false);
                            if (n.reference_id) navigate(`/admin/questions/${n.reference_id}`);
                          }}
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{n.title}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-gray-200 dark:border-slate-700">
              <Avatar name={user?.full_name ?? ''} url={user?.avatar_url} size="sm" />
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200 hidden sm:block">{user?.full_name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
