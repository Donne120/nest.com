import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, BookOpen, LayoutDashboard, Video, UserCircle, Search } from 'lucide-react';
import { useAuthStore, useNotifStore } from '../../store';
import { useBrandColor } from '../../hooks/useBrandColor';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import type { Notification } from '../../types';
import Avatar from '../UI/Avatar';
import NestLogo from '../UI/NestLogo';
import SearchModal from '../Search/SearchModal';
import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

export default function Navbar() {
  const { user, organization, clearAuth } = useAuthStore();
  const { lastKnownUnread, setLastKnownUnread } = useNotifStore();
  useBrandColor();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/analytics/notifications?unread_only=false').then(r => r.data),
    refetchInterval: 30000,
  });

  const unread = notifications.filter(n => !n.is_read).length;

  // Persist unread count so the badge shows instantly on page load
  useEffect(() => {
    if (notifications.length > 0) setLastKnownUnread(unread);
  }, [unread, notifications.length, setLastKnownUnread]);

  const displayUnread = notifications.length > 0 ? unread : lastKnownUnread;

  // Cmd+K / Ctrl+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const markAllRead = useMutation({
    mutationFn: () => api.put('/analytics/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 z-40 relative">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mr-2 sm:mr-4 flex-shrink-0">
        {organization?.logo_url ? (
          <img
            src={organization.logo_url}
            alt={organization.name}
            className="h-7 w-auto object-contain max-w-[120px]"
          />
        ) : (
          <NestLogo
            size={28}
            showText={false}
          />
        )}
        <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm hidden sm:block">
          {organization?.name ?? 'Nest Fledge'}
        </span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-0.5 sm:gap-1">
        <Link
          to="/modules"
          className={clsx(
            'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            isActive('/modules') || isActive('/video')
              ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          )}
        >
          <BookOpen size={15} />
          <span className="hidden xs:inline sm:inline">Modules</span>
        </Link>
        {!isManager && (
          <Link
            to="/meetings"
            className={clsx(
              'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              isActive('/meetings')
                ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            )}
          >
            <Video size={15} />
            <span className="hidden sm:inline">Meetings</span>
          </Link>
        )}
        {isManager && (
          <Link
            to="/admin"
            className={clsx(
              'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              isActive('/admin')
                ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            )}
          >
            <LayoutDashboard size={15} />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Search (Ctrl+K)"
          className="hidden sm:flex items-center gap-2 text-sm text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
        >
          <Search size={13} />
          <span className="text-xs">Search</span>
          <kbd className="text-[10px] font-mono bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded px-1">⌘K</kbd>
        </button>
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
          className="sm:hidden p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Search size={18} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); if (unread > 0) markAllRead.mutate(); }}
            onKeyDown={(e) => { if (e.key === 'Escape') setNotifOpen(false); }}
            className="relative p-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
            aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
            aria-expanded={notifOpen}
          >
            <Bell size={18} />
            {displayUnread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {displayUnread > 9 ? '9+' : displayUnread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-10 w-[calc(100vw-1rem)] max-w-xs sm:w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-modal z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400 p-4 text-center">No notifications</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={clsx(
                        'px-4 py-3 border-b border-gray-50 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors',
                        !n.is_read && 'bg-blue-50/40 dark:bg-blue-900/20'
                      )}
                      onClick={() => {
                        setNotifOpen(false);
                        if (n.type === 'meeting_confirmed' || n.type === 'meeting_declined' || n.type === 'meeting_request') {
                          navigate(isManager ? '/admin/meetings' : '/meetings');
                        } else if (n.reference_id) {
                          navigate(isManager ? `/admin/questions/${n.reference_id}` : '/modules');
                        }
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

        {/* User menu */}
        <div className="relative pl-2 border-l border-gray-200 dark:border-slate-700" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(o => !o)}
            onKeyDown={(e) => { if (e.key === 'Escape') setUserMenuOpen(false); if (e.key === 'ArrowDown') setUserMenuOpen(true); }}
            aria-label="User menu"
            aria-expanded={userMenuOpen}
            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg px-2 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
          >
            <Avatar name={user?.full_name ?? 'U'} url={user?.avatar_url} size="sm" />
            <span className="text-sm font-medium text-gray-700 dark:text-slate-200 hidden sm:block">{user?.full_name}</span>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-10 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <UserCircle size={15} className="text-gray-400 dark:text-slate-500" />
                  Profile & Appearance
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
  </>
  );
}
