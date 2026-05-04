import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, UserCircle, Search, Sparkles, Sun, Moon, Monitor } from 'lucide-react';
import { useAuthStore, useNotifStore, useUIStore } from '../../store';
import { useBrandColor } from '../../hooks/useBrandColor';
import { useTheme, type Theme } from '../../hooks/useTheme';
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
    orgNameColor:    isDark ? '#e8c97e'                   : '#b8901e',
    unreadDot:       '#0b0c0f',
  };
}

// ─── main component ────────────────────────────────────────────────────────────

export default function Navbar() {
  const { user, organization, clearAuth } = useAuthStore();
  const { lastKnownUnread, setLastKnownUnread } = useNotifStore();
  const { toggleNestAssistant, nestAssistantOpen } = useUIStore();
  useBrandColor();

  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tk = tokens(isDark);

  const navigate = useNavigate();
  const location = useLocation();

  const [notifOpen, setNotifOpen]       = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen]       = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);

  const userMenuRef  = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const queryClient  = useQueryClient();

  // close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  // close theme picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) setThemeOpen(false);
    }
    if (themeOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [themeOpen]);

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
        className="h-14 flex items-center px-5 gap-4 z-40 sticky top-0"
        style={{
          background:    tk.headerBg,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom:  `1px solid ${tk.headerBorder}`,
          boxShadow:     tk.headerShadow,
          transition:    'background 0.2s, border-color 0.2s',
        }}
      >
        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2.5 mr-2 flex-shrink-0" style={{ textDecoration: 'none' }}>
          {organization?.logo_url ? (
            <img src={organization.logo_url} alt={orgName} className="h-7 w-auto object-contain max-w-[100px]" />
          ) : (
            <span style={{ fontFamily: "'Lora', Georgia, serif", fontWeight: 900, fontSize: 20, color: tk.orgNameColor, letterSpacing: '-0.5px', transition: 'color 0.2s' }}>
              {orgName.toLowerCase()}
            </span>
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

        {/* ── Right actions ── */}
        <div className="ml-auto flex items-center gap-1.5">

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

          {/* Search icon — mobile (44px touch target) */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="sm:hidden flex items-center justify-center rounded-full"
            style={{ width: 44, height: 44, color: tk.iconColor, background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <Search size={20} />
          </button>

          {/* ── Nest Assistant ── */}
          <IconButton
            onClick={toggleNestAssistant}
            aria-label="Nest Assistant"
            title="Ask Nest Assistant"
            active={nestAssistantOpen}
            activeStyle={{ background: 'rgba(232,201,126,0.15)', border: '1px solid rgba(232,201,126,0.35)', color: '#e8c97e' }}
            idleStyle={{ background: tk.pillBg, border: `1px solid ${tk.pillBorder}`, color: tk.iconColor }}
            hoverStyle={{ background: 'rgba(232,201,126,0.10)', border: '1px solid rgba(232,201,126,0.25)', color: '#e8c97e' }}
          >
            <Sparkles size={14} />
          </IconButton>

          {/* ── Theme toggle ── */}
          <div className="relative" ref={themeMenuRef}>
            <IconButton
              onClick={() => setThemeOpen(o => !o)}
              aria-label="Switch theme"
              title="Appearance"
              active={themeOpen}
              activeStyle={{ background: tk.navActiveBg, border: `1px solid ${tk.pillBorderHover}`, color: tk.textPrimary }}
              idleStyle={{ background: tk.pillBg, border: `1px solid ${tk.pillBorder}`, color: tk.iconColor }}
              hoverStyle={{ background: tk.navHoverBg, border: `1px solid ${tk.pillBorderHover}`, color: tk.textPrimary }}
            >
              {theme === 'dark'   ? <Moon    size={14} /> :
               theme === 'light'  ? <Sun     size={14} /> :
                                    <Monitor size={14} />}
            </IconButton>

            {themeOpen && (
              <div
                className="absolute right-0 top-10 z-50 animate-scale-in overflow-hidden"
                style={{ width: 168, background: tk.dropdownBg, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: `1px solid ${tk.dropdownBorder}`, borderRadius: 12, boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.55)' : '0 8px 32px rgba(0,0,0,0.12)', padding: '4px' }}
              >
                <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: tk.textSecondary, padding: '8px 10px 4px' }}>Appearance</p>
                {THEME_OPTIONS.map(({ value, Icon, label }) => (
                  <ThemeOption
                    key={value}
                    value={value}
                    Icon={Icon}
                    label={label}
                    selected={theme === value}
                    tk={tk}
                    onClick={() => { setTheme(value); setThemeOpen(false); }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Notifications ── */}
          <div className="relative">
            <IconButton
              onClick={() => { setNotifOpen(!notifOpen); if (unread > 0) markAllRead.mutate(); }}
              aria-label={`Notifications${displayUnread > 0 ? `, ${displayUnread} unread` : ''}`}
              active={notifOpen}
              activeStyle={{ background: tk.navActiveBg, border: `1px solid ${tk.pillBorderHover}`, color: tk.textPrimary }}
              idleStyle={{ background: tk.pillBg, border: `1px solid ${tk.pillBorder}`, color: tk.iconColor }}
              hoverStyle={{ background: tk.navHoverBg, border: `1px solid ${tk.pillBorderHover}`, color: tk.textPrimary }}
              style={{ position: 'relative' }}
            >
              <Bell size={14} />
              {displayUnread > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] rounded-full flex items-center justify-center font-bold animate-pulse"
                  style={{
                    background: '#c45c3c',
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
              <div
                className="notif-dropdown z-50 overflow-hidden animate-scale-in"
                style={{ position: 'absolute', right: 0, top: 44, width: 'min(320px, calc(100vw - 16px))', background: tk.dropdownBg, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: `1px solid ${tk.dropdownBorder}`, borderRadius: 12, boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)' }}
              >
                <div className="px-4 py-3" style={{ borderBottom: `1px solid ${tk.dropdownDivider}` }}>
                  <h3 style={{ fontFamily: "'Lora', Georgia, serif", fontWeight: 700, color: tk.textPrimary, fontSize: 14 }}>Notifications</h3>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: 'min(320px, 60vh)' }}>
                  {notifications.length === 0 ? (
                    <p className="p-6 text-center" style={{ fontSize: 13, color: tk.textSecondary }}>No notifications yet</p>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div
                        key={n.id}
                        className="px-4 py-3 cursor-pointer transition-colors"
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
                        {!n.is_read && <span className="inline-block w-1.5 h-1.5 rounded-full mb-1" style={{ background: '#e8c97e' }} />}
                        <p style={{ fontSize: 13, fontWeight: 500, color: tk.textPrimary, lineHeight: 1.4 }}>{n.title}</p>
                        <p style={{ fontSize: 11.5, color: tk.textSecondary, marginTop: 2, lineHeight: 1.5 }} className="line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
        @media (max-width: 480px) {
          .notif-dropdown {
            position: fixed !important;
            top: 56px !important;
            left: 8px !important;
            right: 8px !important;
            width: auto !important;
          }
        }
      `}</style>
    </>
  );
}

// ─── sub-components ────────────────────────────────────────────────────────────

const THEME_OPTIONS: { value: Theme; Icon: typeof Sun; label: string }[] = [
  { value: 'light',  Icon: Sun,     label: 'Light'  },
  { value: 'system', Icon: Monitor, label: 'System' },
  { value: 'dark',   Icon: Moon,    label: 'Dark'   },
];

function ThemeOption({ value, Icon, label, selected, tk, onClick }: {
  value: Theme; Icon: typeof Sun; label: string;
  selected: boolean; tk: ReturnType<typeof tokens>; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all"
      style={{
        fontSize: 13, fontWeight: selected ? 600 : 400,
        color:      selected ? tk.textPrimary : tk.textSecondary,
        background: selected ? tk.navActiveBg : 'transparent',
        border:     'none', cursor: 'pointer', fontFamily: 'inherit',
        textAlign: 'left',
      }}
      onMouseEnter={e => { if (!selected) { (e.currentTarget as HTMLElement).style.background = tk.dropdownItemHov; (e.currentTarget as HTMLElement).style.color = tk.textPrimary; } }}
      onMouseLeave={e => { if (!selected) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = tk.textSecondary; } }}
    >
      <Icon size={13} />
      {label}
      {selected && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#e8c97e', flexShrink: 0 }} />}
    </button>
  );
}

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
      style={{ ...idleStyle, ...(active ? activeStyle : {}), width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', position: 'relative', ...style }}
      onMouseEnter={e => { if (!active) Object.assign((e.currentTarget as HTMLElement).style, hoverStyle); }}
      onMouseLeave={e => { if (!active) Object.assign((e.currentTarget as HTMLElement).style, idleStyle); }}
    >
      {children}
    </button>
  );
}
