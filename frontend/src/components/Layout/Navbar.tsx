import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, UserCircle, Search, Sparkles } from 'lucide-react';
import { useAuthStore, useNotifStore, useUIStore } from '../../store';
import { useBrandColor } from '../../hooks/useBrandColor';
import { useTheme } from '../../hooks/useTheme';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import type { Notification } from '../../types';
import Avatar from '../UI/Avatar';
import SearchModal from '../Search/SearchModal';
import { useState, useRef, useEffect } from 'react';

// ─── theme tokens ─────────────────────────────────────────────────────────────

function tokens(isDark: boolean) {
  return {
    headerBg:        isDark ? 'rgba(11,12,15,0.92)'      : 'rgba(250,247,242,0.95)',
    headerBorder:    isDark ? 'rgba(255,255,255,0.07)'    : 'rgba(0,0,0,0.09)',
    headerShadow:    isDark ? '0 1px 0 rgba(0,0,0,0.3)'  : '0 1px 0 rgba(0,0,0,0.06)',
    pillBg:          isDark ? '#1c1e27'                   : 'rgba(0,0,0,0.05)',
    pillBorder:      isDark ? 'rgba(255,255,255,0.07)'    : 'rgba(0,0,0,0.09)',
    pillBorderHover: isDark ? 'rgba(255,255,255,0.18)'    : 'rgba(0,0,0,0.18)',
    pillText:        isDark ? '#6b6b78'                   : '#71717a',
    kbdBg:           isDark ? '#0b0c0f'                   : 'rgba(0,0,0,0.05)',
    kbdColor:        isDark ? '#6b6b78'                   : '#71717a',
    iconColor:       isDark ? '#9ca3af'                   : '#6b7280',
    dropdownBg:      isDark ? 'rgba(19,20,26,0.97)'       : 'rgba(252,249,244,0.98)',
    dropdownBorder:  isDark ? 'rgba(255,255,255,0.07)'    : 'rgba(0,0,0,0.09)',
    dropdownDivider: isDark ? 'rgba(255,255,255,0.06)'    : 'rgba(0,0,0,0.06)',
    dropdownItemHov: isDark ? 'rgba(255,255,255,0.05)'    : 'rgba(0,0,0,0.04)',
    textPrimary:     isDark ? '#e8e4dc'                   : '#18181b',
    textSecondary:   isDark ? '#6b6b78'                   : '#71717a',
    separator:       isDark ? 'rgba(255,255,255,0.07)'    : 'rgba(0,0,0,0.09)',
    navActiveBg:     isDark ? '#1c1e27'                   : 'rgba(0,0,0,0.07)',
    navHoverBg:      isDark ? '#1c1e27'                   : 'rgba(0,0,0,0.05)',
    navActiveColor:  isDark ? '#e8e4dc'                   : '#18181b',
    navInactiveColor:isDark ? '#6b6b78'                   : '#52525b',
    orgNameColor:    isDark ? '#c06fd0'                   : '#7b2d8e',
    unreadDot:       '#0b0c0f',
  };
}

// ─── main component ────────────────────────────────────────────────────────────

export default function Navbar() {
  const { user, organization, clearAuth } = useAuthStore();
  const { lastKnownUnread, setLastKnownUnread } = useNotifStore();
  const { toggleNestAssistant, nestAssistantOpen } = useUIStore();
  useBrandColor();

  useTheme(); // keeps the app locked to the single light identity
  const isDark = false;
  const tk = tokens(isDark);

  const navigate = useNavigate();
  const location = useLocation();

  const [notifOpen, setNotifOpen]       = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);

  const userMenuRef  = useRef<HTMLDivElement>(null);
  const notifBellRef = useRef<HTMLDivElement>(null);
  const queryClient  = useQueryClient();

  // close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn:  () => api.get('/analytics/notifications?unread_only=false').then(r => r.data),
    refetchInterval: 60000,
    staleTime: 2 * 60 * 1000,
  });

  const unread = notifications.filter(n => !n.is_read).length;
  useEffect(() => {
    if (notifications.length > 0) setLastKnownUnread(unread);
  }, [unread, notifications.length, setLastKnownUnread]);
  const displayUnread = notifications.length > 0 ? unread : lastKnownUnread;

  // Cmd+K / Ctrl+K opens search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(o => !o); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const markAllRead = useMutation({
    mutationFn: () => api.put('/analytics/notifications/read-all'),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleLogout = () => { clearAuth(); navigate('/login'); };

  const isManager = user?.role === 'educator' || user?.role === 'owner';
  const isActive  = (path: string) => location.pathname.startsWith(path);
  const orgName   = organization?.name ?? 'Nest';

  return (
    <>
      <header
        className="nest-header flex items-center px-5 gap-4 z-40 sticky top-0"
        style={{
          // Sit the action row BELOW the device status bar / notch. Without this
          // the sticky header rendered flush at top:0 and the notch clipped the
          // top of the row — hiding the notification bell on notched phones.
          height: 'calc(56px + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          // Solid background (no backdrop-filter): a persistent sticky blur
          // forces a full re-blur on every scroll frame, which is what makes
          // mobile scrolling stutter and feel heavy. The bg was already 95%
          // opaque so this looks the same but scrolls smoothly.
          background:    'var(--c-surf)',
          borderBottom:  `1px solid ${tk.headerBorder}`,
          boxShadow:     tk.headerShadow,
          transition:    'background 0.2s, border-color 0.2s',
        }}
      >
        {/* ── Logo ── (min-w-0 so a long org name truncates instead of pushing
            the action icons off the right edge) */}
        <Link to="/" className="flex items-center gap-2.5 mr-2 min-w-0" style={{ textDecoration: 'none', overflow: 'hidden' }}>
          {organization?.logo_url ? (
            <img src={organization.logo_url} alt={orgName} className="h-7 w-auto object-contain max-w-[100px]" />
          ) : (
            <img src="/nest-wordmark.png" alt="Nest" className="h-6 w-auto object-contain" style={{ maxWidth: 96 }} />
          )}
        </Link>

        {/* ── Nav links (desktop) ── */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/modules"     active={isActive('/modules') || isActive('/video')} label="Modules"     tk={tk} />
          {!isManager && <NavLink to="/meetings"    active={isActive('/meetings')}    label="Meetings"    tk={tk} />}
          {!isManager && <NavLink to="/assignments" active={isActive('/assignments')} label="Assignments" tk={tk} />}
          {isManager  && <NavLink to="/admin"       active={isActive('/admin')}       label="Admin"       tk={tk} />}
          <NavLink to="/pricing" active={isActive('/pricing')} label="Pricing" tk={tk} />
        </nav>

        {/* ── Right actions ── (never shrink; the org name yields space instead) */}
        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">

          {/* Search pill — desktop */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="hidden sm:flex items-center gap-2 transition-all duration-150"
            style={{ background: tk.pillBg, border: `1px solid ${tk.pillBorder}`, padding: '7px 14px', borderRadius: 100, fontSize: 12.5, color: tk.pillText, cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = tk.pillBorderHover)}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = tk.pillBorder)}
          >
            <Search size={13} />
            <span>Search</span>
            <kbd style={{ fontFamily: 'monospace', background: tk.kbdBg, border: `1px solid ${tk.pillBorder}`, padding: '1px 5px', borderRadius: 3, fontSize: 11, color: tk.kbdColor }}>Ctrl+K</kbd>
          </button>

          {/* Search icon — mobile: same 44px glass circle as theme/bell so the
              three actions read as one consistent set (was a bare transparent icon) */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="sm:hidden nav-icon-btn"
            style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tk.iconColor, background: tk.pillBg, border: `1px solid ${tk.pillBorder}`, cursor: 'pointer' }}
          >
            <Search size={16} />
          </button>

          {/* ── Nest Assistant (desktop only — mobile uses BottomNav) ── */}
          <span className="hidden md:flex">
            <IconButton
              onClick={toggleNestAssistant}
              aria-label="Nest Assistant"
              title="Ask Nest Assistant"
              active={nestAssistantOpen}
              activeStyle={{ background: 'rgba(176,108,198,0.16)', border: '1px solid rgba(176,108,198,0.4)', color: '#b06cc6' }}
              idleStyle={{ background: tk.pillBg, border: `1px solid ${tk.pillBorder}`, color: tk.iconColor }}
              hoverStyle={{ background: 'rgba(176,108,198,0.10)', border: '1px solid rgba(176,108,198,0.28)', color: '#b06cc6' }}
            >
              <Sparkles size={14} />
            </IconButton>
          </span>

          {/* ── Notifications ── */}
          <div className="relative" ref={notifBellRef}>
            <IconButton
              onClick={() => { setNotifOpen(!notifOpen); if (unread > 0) markAllRead.mutate(); }}
              aria-label={`Notifications${displayUnread > 0 ? `, ${displayUnread} unread` : ''}`}
              active={notifOpen}
              activeStyle={{ background: tk.navActiveBg, border: `1px solid ${tk.pillBorderHover}`, color: tk.textPrimary }}
              idleStyle={{ background: tk.pillBg, border: `1px solid ${tk.pillBorder}`, color: tk.iconColor }}
              hoverStyle={{ background: tk.navHoverBg, border: `1px solid ${tk.pillBorderHover}`, color: tk.textPrimary }}
              style={{ position: 'relative' }}
            >
              <Bell size={16} />
              {displayUnread > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] rounded-full flex items-center justify-center font-bold animate-pulse"
                  style={{
                    background: '#7b2d8e',
                    color: '#fff',
                    fontSize: 9,
                    lineHeight: 1,
                    padding: '0 3px',
                    border: `1.5px solid ${isDark ? '#0b0c0f' : '#faf7f2'}`,
                    boxShadow: '0 0 0 2px rgba(196,92,60,0.35)',
                  }}
                >
                  {displayUnread > 9 ? '9+' : displayUnread}
                </span>
              )}
            </IconButton>

            {notifOpen && (
              <>
                {/* Mobile backdrop */}
                <div
                  className="sm:hidden fixed inset-0 z-40"
                  style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
                  onClick={() => setNotifOpen(false)}
                />
                <div
                  className="notif-panel z-50 overflow-hidden animate-scale-in"
                  style={{
                    background: tk.dropdownBg,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${tk.dropdownBorder}`,
                    borderRadius: 16,
                    boxShadow: isDark
                      ? '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)'
                      : '0 12px 48px rgba(0,0,0,0.15)',
                  }}
                >
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${tk.dropdownDivider}` }}>
                    <div className="flex items-center gap-2">
                      <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, color: tk.textPrimary, fontSize: 17 }}>Notifications</h3>
                      {displayUnread > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#7b2d8e', borderRadius: 100, padding: '1px 6px' }}>
                          {displayUnread}
                        </span>
                      )}
                    </div>
                    {displayUnread === 0 && (
                      <span style={{ fontSize: 11, color: '#5a8a3c', background: 'rgba(124,179,66,0.14)', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>All read</span>
                    )}
                  </div>
                  <div className="overflow-y-auto" style={{ maxHeight: 'min(360px, 55vh)' }}>
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <Bell size={22} style={{ color: tk.textSecondary, opacity: 0.4 }} />
                        <p style={{ fontSize: 13, color: tk.textSecondary }}>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div
                          key={n.id}
                          className="px-4 py-3 cursor-pointer transition-colors flex gap-3"
                          style={{ borderBottom: `1px solid ${tk.dropdownDivider}` }}
                          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = tk.dropdownItemHov)}
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
                          <div className="flex-shrink-0 mt-0.5">
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: !n.is_read ? '#e8c97e' : 'transparent', border: `1.5px solid ${!n.is_read ? '#e8c97e' : tk.textSecondary}`, marginTop: 4 }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p style={{ fontSize: 13, fontWeight: 500, color: tk.textPrimary, lineHeight: 1.4 }}>{n.title}</p>
                            <p style={{ fontSize: 11.5, color: tk.textSecondary, marginTop: 2, lineHeight: 1.5 }} className="line-clamp-2">{n.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── User menu ── */}
          <div className="relative pl-2 ml-1" style={{ borderLeft: `1px solid ${tk.separator}` }} ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              aria-label="User menu"
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all"
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = tk.dropdownItemHov)}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <Avatar name={user?.full_name ?? 'U'} url={user?.avatar_url} size="sm" />
              <span className="text-sm font-medium hidden sm:block" style={{ color: tk.textPrimary, transition: 'color 0.2s' }}>{user?.full_name}</span>
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 top-11 z-50 overflow-hidden animate-scale-in"
                style={{ width: 'min(208px, calc(100vw - 16px))', background: tk.dropdownBg, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: `1px solid ${tk.dropdownBorder}`, borderRadius: 12, boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)' }}
              >
                <div className="px-4 py-3" style={{ borderBottom: `1px solid ${tk.dropdownDivider}` }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: tk.textPrimary, letterSpacing: '-0.01em' }} className="truncate">{user?.full_name}</p>
                  <p style={{ fontSize: 11.5, color: tk.textSecondary, marginTop: 2 }} className="truncate">{user?.email}</p>
                </div>
                <div className="py-1.5 px-1.5">
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors"
                    style={{ fontSize: 13, color: tk.textSecondary, textDecoration: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = tk.dropdownItemHov; (e.currentTarget as HTMLElement).style.color = tk.textPrimary; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = tk.textSecondary; }}
                  >
                    <UserCircle size={14} style={{ color: tk.textSecondary }} />
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

      <style>{`
        @keyframes animate-scale-in {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        .animate-scale-in { animation: animate-scale-in 0.15s cubic-bezier(0.16,1,0.3,1) both; }

        /* Tactile press on the mobile header action circles */
        .nav-icon-btn { -webkit-tap-highlight-color: transparent; transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), border-color 0.15s; }
        .nav-icon-btn:active { transform: scale(0.9); }

        /* Narrow phones: tighten padding and icon size so all three action
           circles fit without the bell overflowing off the right edge. */
        @media (max-width: 420px) {
          header.nest-header { padding-left: 12px !important; padding-right: 12px !important; gap: 8px !important; }
          header.nest-header .nav-icon-btn { width: 40px !important; height: 40px !important; }
        }

        /* Desktop: anchored to bell button */
        .notif-panel {
          position: absolute;
          right: 0;
          top: 50px;
          width: 340px;
        }

        /* Mobile: full-width sheet below header (clears the notch too) */
        @media (max-width: 639px) {
          .notif-panel {
            position: fixed !important;
            top: calc(60px + env(safe-area-inset-top, 0px)) !important;
            left: 8px !important;
            right: 8px !important;
            width: auto !important;
            border-radius: 20px !important;
          }
        }
      `}</style>
    </>
  );
}

// ─── sub-components ────────────────────────────────────────────────────────────

function NavLink({ to, active, label, tk }: { to: string; active: boolean; label: string; tk: ReturnType<typeof tokens> }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
      style={{ color: active ? tk.navActiveColor : tk.navInactiveColor, background: active ? tk.navActiveBg : 'transparent', textDecoration: 'none', letterSpacing: '0.02em' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = tk.navActiveColor; (e.currentTarget as HTMLElement).style.background = tk.navHoverBg; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = active ? tk.navActiveColor : tk.navInactiveColor; (e.currentTarget as HTMLElement).style.background = active ? tk.navActiveBg : 'transparent'; }}
    >
      {label}
    </Link>
  );
}

type IconButtonProps = {
  onClick: () => void;
  'aria-label': string;
  title?: string;
  active: boolean;
  activeStyle: React.CSSProperties;
  idleStyle: React.CSSProperties;
  hoverStyle: React.CSSProperties;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

function IconButton({ onClick, 'aria-label': ariaLabel, title, active, activeStyle, idleStyle, hoverStyle, style, children }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      className="nav-icon-btn"
      style={{ ...idleStyle, ...(active ? activeStyle : {}), width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', ...style }}
      onMouseEnter={e => { if (!active) Object.assign((e.currentTarget as HTMLElement).style, hoverStyle); }}
      onMouseLeave={e => { if (!active) Object.assign((e.currentTarget as HTMLElement).style, idleStyle); }}
    >
      {children}
    </button>
  );
}
