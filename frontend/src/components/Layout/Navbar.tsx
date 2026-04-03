import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, BookOpen, LayoutDashboard, Video, UserCircle, Search, Sparkles } from 'lucide-react';
import { useAuthStore, useNotifStore, useUIStore } from '../../store';
import { useBrandColor } from '../../hooks/useBrandColor';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import type { Notification } from '../../types';
import Avatar from '../UI/Avatar';
import SearchModal from '../Search/SearchModal';
import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

export default function Navbar() {
  const { user, organization, clearAuth } = useAuthStore();
  const { lastKnownUnread, setLastKnownUnread } = useNotifStore();
  const { toggleNestAssistant, nestAssistantOpen } = useUIStore();
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

  const isManager = user?.role === 'educator' || user?.role === 'owner';
  const isActive = (path: string) => location.pathname.startsWith(path);

  const orgName = organization?.name ?? 'Nest';

  return (
    <>
      <header
        className="h-14 flex items-center px-5 gap-4 z-40 relative"
        style={{
          background: 'rgba(11,12,15,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 1px 0 rgba(0,0,0,0.3)',
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 mr-2 flex-shrink-0 group" style={{ textDecoration: 'none' }}>
          {organization?.logo_url ? (
            <img src={organization.logo_url} alt={orgName} className="h-7 w-auto object-contain max-w-[100px]" />
          ) : (
            <span
              style={{
                fontFamily: "'Lora', Georgia, serif",
                fontWeight: 900,
                fontSize: 20,
                color: '#e8c97e',
                letterSpacing: '-0.5px',
              }}
            >
              {orgName.toLowerCase()}
            </span>
          )}
        </Link>

        {/* Nav links — hidden on mobile (BottomNav handles it) */}
        <nav className="hidden md:flex items-center gap-1">
          <DarkNavLink
            to="/modules"
            active={isActive('/modules') || isActive('/video')}
            label="Modules"
          />
          {!isManager && (
            <DarkNavLink to="/meetings" active={isActive('/meetings')} label="Meetings" />
          )}
          {!isManager && (
            <DarkNavLink to="/assignments" active={isActive('/assignments')} label="Assignments" />
          )}
          {isManager && (
            <DarkNavLink to="/admin" active={isActive('/admin')} label="Admin" />
          )}
          <DarkNavLink to="/pricing" active={isActive('/pricing')} label="Pricing" />
        </nav>

        <div className="ml-auto flex items-center gap-1.5">

          {/* Search pill */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search (Ctrl+K)"
            className="hidden sm:flex items-center gap-2 transition-all duration-150"
            style={{
              background: '#1c1e27',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '7px 14px',
              borderRadius: 100,
              fontSize: 12.5,
              color: '#6b6b78',
              cursor: 'pointer',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)')}
          >
            <Search size={13} />
            <span>Search</span>
            <kbd style={{
              fontFamily: 'monospace',
              background: '#0b0c0f',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '1px 5px',
              borderRadius: 3,
              fontSize: 11,
              color: '#6b6b78',
            }}>⌘K</kbd>
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="sm:hidden p-2 rounded-xl transition-colors"
            style={{ color: '#6b6b78' }}
          >
            <Search size={17} />
          </button>

          {/* Nest Assistant */}
          <button
            onClick={toggleNestAssistant}
            aria-label="Nest Assistant"
            title="Ask Nest Assistant"
            style={{
              background: nestAssistantOpen ? 'rgba(232,201,126,0.15)' : '#1c1e27',
              border: nestAssistantOpen ? '1px solid rgba(232,201,126,0.35)' : '1px solid rgba(255,255,255,0.07)',
              color: nestAssistantOpen ? '#e8c97e' : '#9ca3af',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!nestAssistantOpen) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(232,201,126,0.1)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,201,126,0.25)';
                (e.currentTarget as HTMLElement).style.color = '#e8c97e';
              }
            }}
            onMouseLeave={e => {
              if (!nestAssistantOpen) {
                (e.currentTarget as HTMLElement).style.background = '#1c1e27';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLElement).style.color = '#9ca3af';
              }
            }}
          >
            <Sparkles size={14} />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); if (unread > 0) markAllRead.mutate(); }}
              className="relative p-2 rounded-full transition-all"
              style={{
                background: '#1c1e27',
                border: '1px solid rgba(255,255,255,0.07)',
                color: '#9ca3af',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={`Notifications${displayUnread > 0 ? `, ${displayUnread} unread` : ''}`}
            >
              🔔
              {displayUnread > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full"
                  style={{ background: '#c45c3c', border: '2px solid #0b0c0f' }}
                />
              )}
            </button>

            {notifOpen && (
              <div
                className="absolute right-0 top-11 z-50 overflow-hidden animate-scale-in"
                style={{
                  width: 'min(320px, calc(100vw - 24px))',
                  background: 'rgba(19,20,26,0.97)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ fontFamily: "'Lora', Georgia, serif", fontWeight: 700, color: '#e8e4dc', fontSize: 14 }}>Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-6 text-center" style={{ fontSize: 13, color: '#6b6b78' }}>No notifications yet</p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className="px-4 py-3 cursor-pointer transition-colors"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                        onClick={() => {
                          setNotifOpen(false);
                          if (n.type === 'meeting_confirmed' || n.type === 'meeting_declined' || n.type === 'meeting_request') {
                            navigate(isManager ? '/admin/meetings' : '/meetings');
                          } else if (n.reference_id) {
                            navigate(isManager ? `/admin/questions/${n.reference_id}` : '/modules');
                          }
                        }}
                      >
                        {!n.is_read && <span className="inline-block w-1.5 h-1.5 rounded-full mb-1" style={{ background: '#e8c97e' }} />}
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#e8e4dc', lineHeight: 1.4 }}>{n.title}</p>
                        <p style={{ fontSize: 11.5, color: '#6b6b78', marginTop: 2, lineHeight: 1.5 }} className="line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative pl-2 ml-1" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }} ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              aria-label="User menu"
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all"
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <Avatar name={user?.full_name ?? 'U'} url={user?.avatar_url} size="sm" />
              <span className="text-sm font-medium hidden sm:block" style={{ color: '#e8e4dc' }}>{user?.full_name}</span>
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 top-11 z-50 overflow-hidden animate-scale-in"
                style={{
                  width: 'min(208px, calc(100vw - 16px))',
                  background: 'rgba(19,20,26,0.97)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#e8e4dc', letterSpacing: '-0.01em' }} className="truncate">{user?.full_name}</p>
                  <p style={{ fontSize: 11.5, color: '#6b6b78', marginTop: 2 }} className="truncate">{user?.email}</p>
                </div>
                <div className="py-1.5 px-1.5">
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors"
                    style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <UserCircle size={14} style={{ color: '#6b6b78' }} />
                    Profile &amp; Appearance
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors"
                    style={{ fontSize: 13, color: '#c45c3c', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(196,92,60,0.1)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <LogOut size={14} />
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

function DarkNavLink({ to, active, label }: { to: string; active: boolean; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
      style={{
        color: active ? '#e8e4dc' : '#6b6b78',
        background: active ? '#1c1e27' : 'transparent',
        textDecoration: 'none',
        letterSpacing: '0.02em',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#e8e4dc'; (e.currentTarget as HTMLElement).style.background = '#1c1e27'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = active ? '#e8e4dc' : '#6b6b78'; (e.currentTarget as HTMLElement).style.background = active ? '#1c1e27' : 'transparent'; }}
    >
      {label}
    </Link>
  );
}
