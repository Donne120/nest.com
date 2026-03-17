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

  useEffect(() => {
    if (notifications.length > 0) setLastKnownUnread(unread);
  }, [unread, notifications.length, setLastKnownUnread]);

  const displayUnread = notifications.length > 0 ? unread : lastKnownUnread;

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
    <header className={clsx(
      'h-14 flex items-center px-3 sm:px-5 gap-2 sm:gap-4 z-40 relative',
      'bg-[#FFFCF8] dark:bg-slate-900',
      'border-b border-[#E8DDD0] dark:border-slate-700/60',
      'shadow-[0_1px_0_rgba(80,40,10,0.06)]'
    )}>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mr-1 sm:mr-3 flex-shrink-0 group">
        {organization?.logo_url ? (
          <img
            src={organization.logo_url}
            alt={organization.name}
            className="h-7 w-auto object-contain max-w-[120px]"
          />
        ) : (
          <NestLogo size={28} showText={false} />
        )}
        <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm hidden sm:block tracking-tight">
          {organization?.name ?? 'Nest Fledge'}
        </span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-0.5">
        <NavLink
          to="/modules"
          active={isActive('/modules') || isActive('/video')}
          icon={<BookOpen size={14} />}
          label="Modules"
        />
        {!isManager && (
          <NavLink
            to="/meetings"
            active={isActive('/meetings')}
            icon={<Video size={14} />}
            label="Meetings"
          />
        )}
        {isManager && (
          <NavLink
            to="/admin"
            active={isActive('/admin')}
            icon={<LayoutDashboard size={14} />}
            label="Admin"
          />
        )}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Search (Ctrl+K)"
          className={clsx(
            'hidden sm:flex items-center gap-2 text-sm',
            'text-[#9C8B7A] dark:text-slate-500',
            'bg-[#F5EFE7] dark:bg-slate-800/80',
            'hover:bg-[#EDE4D9] dark:hover:bg-slate-700',
            'border border-[#DDD4C8] dark:border-slate-700',
            'rounded-xl px-3 py-1.5 transition-all duration-150',
            'hover:border-[#C8B9AA] dark:hover:border-slate-600'
          )}
        >
          <Search size={13} className="text-gray-400" />
          <span className="text-xs text-gray-400">Search</span>
          <kbd className="text-[10px] font-mono bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md px-1.5 py-0.5 text-gray-400">⌘K</kbd>
        </button>
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
          className="sm:hidden p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <Search size={17} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); if (unread > 0) markAllRead.mutate(); }}
            onKeyDown={(e) => { if (e.key === 'Escape') setNotifOpen(false); }}
            className={clsx(
              'relative p-2 rounded-xl transition-all duration-150',
              'text-gray-500 dark:text-slate-400',
              'hover:text-gray-700 dark:hover:text-slate-200',
              'hover:bg-gray-100 dark:hover:bg-slate-800',
              'focus:outline-none focus:ring-2 focus:ring-brand-500/50'
            )}
            aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
            aria-expanded={notifOpen}
          >
            <Bell size={17} />
            {displayUnread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {displayUnread > 9 ? '9+' : displayUnread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className={clsx(
              'absolute right-0 top-11 z-50 overflow-hidden animate-scale-in',
              'w-[calc(100vw-1rem)] max-w-xs sm:w-80',
              'bg-white/95 dark:bg-slate-800/95 backdrop-blur-md',
              'border border-gray-200/80 dark:border-slate-700/60',
              'rounded-2xl shadow-modal'
            )}>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700/60">
                <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm tracking-tight">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-slate-500 p-6 text-center">No notifications yet</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={clsx(
                        'px-4 py-3 border-b border-gray-50 dark:border-slate-700/40 last:border-0',
                        'hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors',
                        !n.is_read && 'bg-brand-50/60 dark:bg-brand-900/15'
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
                      {!n.is_read && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-500 mb-1" />
                      )}
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100 leading-snug">{n.title}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative pl-1.5 border-l border-gray-200/80 dark:border-slate-700/60 ml-0.5" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(o => !o)}
            onKeyDown={(e) => { if (e.key === 'Escape') setUserMenuOpen(false); if (e.key === 'ArrowDown') setUserMenuOpen(true); }}
            aria-label="User menu"
            aria-expanded={userMenuOpen}
            className={clsx(
              'flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-150',
              'hover:bg-gray-100 dark:hover:bg-slate-800',
              'focus:outline-none focus:ring-2 focus:ring-brand-500/50'
            )}
          >
            <Avatar name={user?.full_name ?? 'U'} url={user?.avatar_url} size="sm" />
            <span className="text-sm font-medium text-gray-700 dark:text-slate-200 hidden sm:block">{user?.full_name}</span>
          </button>

          {userMenuOpen && (
            <div className={clsx(
              'absolute right-0 top-11 w-52 z-50 overflow-hidden animate-scale-in',
              'bg-white/95 dark:bg-slate-800/95 backdrop-blur-md',
              'border border-gray-200/80 dark:border-slate-700/60',
              'rounded-2xl shadow-modal'
            )}>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700/60">
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate tracking-tight">{user?.full_name}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="py-1.5 px-1.5">
                <Link
                  to="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className={clsx(
                    'flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-slate-300',
                    'hover:bg-gray-50 dark:hover:bg-slate-700/60 rounded-xl transition-colors'
                  )}
                >
                  <UserCircle size={15} className="text-gray-400 dark:text-slate-500" />
                  Profile & Appearance
                </Link>
                <button
                  onClick={handleLogout}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400',
                    'hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors'
                  )}
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

function NavLink({ to, active, icon, label }: { to: string; active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className={clsx(
        'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150',
        active
          ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]'
          : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800'
      )}
    >
      {icon}
      <span className="hidden xs:inline sm:inline">{label}</span>
    </Link>
  );
}
