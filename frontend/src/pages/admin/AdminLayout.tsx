import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, TrendingUp, BookOpen, Settings,
  LogOut, Bell, Video, Users, Menu, X, HeartPulse, ArrowUpRight, ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '../../store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import type { Notification } from '../../types';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const navLinks = [
  { to: '/admin', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/courses', end: false, icon: BookOpen, label: 'Courses' },
  { to: '/admin/assignments', end: false, icon: ClipboardList, label: 'Assignments' },
  { to: '/admin/questions', end: false, icon: MessageSquare, label: 'Questions' },
  { to: '/admin/analytics', end: false, icon: TrendingUp, label: 'Analytics' },
  { to: '/admin/people', end: false, icon: HeartPulse, label: 'People' },
  { to: '/admin/meetings', end: false, icon: Video, label: 'Meetings' },
  { to: '/admin/users', end: false, icon: Users, label: 'Users' },
  { to: '/admin/settings', end: false, icon: Settings, label: 'Settings' },
];

const PAGE_TITLES: [string, string][] = [
  ['/admin/courses/new', 'New Module'],
  ['/admin/courses/', 'Edit Module'],
  ['/admin/courses', 'Course Manager'],
  ['/admin/assignments/new', 'New Assignment'],
  ['/admin/assignments/', 'Assignment'],
  ['/admin/assignments', 'Assignments'],
  ['/admin/questions/', 'Question Detail'],
  ['/admin/questions', 'Questions'],
  ['/admin/analytics', 'Analytics'],
  ['/admin/people', 'People'],
  ['/admin/meetings', 'Meetings'],
  ['/admin/users', 'Users'],
  ['/admin/settings', 'Settings'],
  ['/admin', 'Dashboard'],
];

// Design tokens
const INK   = '#1a1714';
const RULE  = '#d4cdc6';
const BG    = '#f2ede8';
const BG2   = '#e8e2db';
const SURF  = '#fffcf8';
const INK2  = '#6b6460';
const INK3  = '#a09990';
const ACC   = '#c94f2c';
const ACC2  = '#2c6bc9';

export default function AdminLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

  const handleLogout = () => { clearAuth(); navigate('/login'); };

  const pageTitle = PAGE_TITLES.find(([path]) =>
    location.pathname === path
      || location.pathname.startsWith(path + '/')
      || location.pathname.startsWith(path)
  )?.[1] ?? 'Admin';

  const firstName = user?.full_name?.split(' ')[0] ?? 'Admin';
  const initials = (user?.full_name ?? 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: BG, fontFamily: "'Syne', 'Inter', sans-serif" }}>

      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════ */}
      <aside
        style={{
          width: 196,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: INK,
          borderRight: `2px solid #0a0906`,
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 50,
          transition: 'transform 0.2s',
          transform: mobileSidebarOpen ? 'translateX(0)' : undefined,
          // Subtle noise texture via pseudo-element isn't possible here, but the dark bg + border creates depth
        }}
        className="lg-sidebar"
      >
        {/* Brand */}
        <div style={{ padding: '20px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Link to="/admin" style={{ textDecoration: 'none' }} onClick={() => setMobileSidebarOpen(false)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, background: ACC, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0,
                boxShadow: `0 0 0 1px rgba(201,79,44,0.4), 0 4px 12px rgba(201,79,44,0.35)`,
              }}>
                N
              </div>
              <span style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800, fontSize: 22,
                letterSpacing: '-0.03em', color: '#f2ede8', lineHeight: 1,
              }}>
                Nest
              </span>
            </div>
            <div style={{
              fontFamily: "'Inconsolata', monospace",
              fontSize: 10, color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.14em', textTransform: 'uppercase',
              marginTop: 6, paddingLeft: 38,
            }}>
              Admin Console
            </div>
          </Link>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4 }}
            className="lg-hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', paddingTop: 20 }}>
          <NavSection label="Main Menu">
            {navLinks.map(({ to, end, icon: Icon, label }) => (
              <NavItem key={to} to={to} end={end} icon={Icon} label={label} onClick={() => setMobileSidebarOpen(false)} />
            ))}
          </NavSection>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '10px 20px' }} />

          <NavSection label="Workspace">
            <NavItem to="/modules" end={false} icon={ArrowUpRight} label="Learner View" onClick={() => setMobileSidebarOpen(false)} />
          </NavSection>
        </nav>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: ACC,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#f2ede8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name ?? firstName}
            </div>
            <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {user?.role ?? 'Admin'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 3, transition: 'color 0.2s', flexShrink: 0 }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#c45c3c')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.25)')}
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', marginLeft: 196 }}>

        {/* Topbar */}
        <header style={{
          height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px',
          borderBottom: `1px solid ${RULE}`,
          background: SURF,
          position: 'sticky', top: 0, zIndex: 40,
          flexShrink: 0,
        }}>
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: INK2, cursor: 'pointer', padding: 4, marginRight: 12 }}
            className="lg-menu-btn"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: INK2 }}>
            <span>Admin</span>
            <span style={{ opacity: 0.35, fontSize: 11 }}>›</span>
            <span style={{ color: INK, fontWeight: 700 }}>{pageTitle}</span>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto' }}>
            {/* Live pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: BG2, border: `1px solid ${RULE}`,
              borderRadius: 100, padding: '5px 13px',
              fontFamily: "'Inconsolata', monospace",
              fontSize: 11, fontWeight: 500, color: INK2,
              letterSpacing: '0.04em',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2a7a4b', animation: 'notif-blink 2s ease infinite', display: 'inline-block' }} />
              Live dashboard
            </div>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setNotifOpen(o => !o); if (unread > 0) markAllRead.mutate(); }}
                style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: BG2, border: `1px solid ${RULE}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative',
                  transition: 'border-color 0.2s',
                  color: INK2,
                }}
                aria-label="Notifications"
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = INK3)}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = RULE)}
              >
                <Bell size={15} />
                {unread > 0 && (
                  <span style={{
                    position: 'absolute', top: 5, right: 5,
                    width: 6, height: 6, borderRadius: '50%',
                    background: ACC, border: `1.5px solid ${SURF}`,
                  }} />
                )}
              </button>

              {notifOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 42,
                  width: 300, zIndex: 50,
                  background: SURF, border: `1px solid ${RULE}`,
                  borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '14px 18px', borderBottom: `1px solid ${RULE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>Notifications</span>
                    {unread === 0 && <span style={{ fontSize: 11, color: '#2a7a4b', background: 'rgba(42,122,75,0.08)', padding: '2px 8px', borderRadius: 100 }}>All read</span>}
                  </div>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <p style={{ padding: '20px', textAlign: 'center', fontSize: 12.5, color: INK3 }}>No notifications yet</p>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div
                          key={n.id}
                          onClick={() => { setNotifOpen(false); if (n.reference_id) navigate(`/admin/questions/${n.reference_id}`); }}
                          style={{ padding: '12px 18px', borderBottom: `1px solid rgba(212,205,198,0.5)`, cursor: 'pointer', transition: 'background 0.15s', background: !n.is_read ? 'rgba(44,107,201,0.04)' : 'transparent' }}
                          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = BG2)}
                          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = !n.is_read ? 'rgba(44,107,201,0.04)' : 'transparent')}
                        >
                          <p style={{ fontSize: 13, fontWeight: 500, color: INK, marginBottom: 2 }}>{n.title}</p>
                          <p style={{ fontSize: 11.5, color: INK3, lineHeight: 1.4 }}>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User chip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: BG2, border: `1px solid ${RULE}`,
              padding: '5px 12px 5px 5px', borderRadius: 100,
              cursor: 'pointer', transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = INK3)}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = RULE)}
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: ACC,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#fff',
              }}>
                {initials}
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: INK }}>{firstName}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', background: BG }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @keyframes notif-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .lg-sidebar { }
        @media (max-width: 1023px) {
          .lg-sidebar { transform: translateX(-100%); }
        }
        .lg-hidden { display: none; }
        @media (max-width: 1023px) { .lg-hidden { display: block; } .lg-menu-btn { display: block; } }
        @media (min-width: 1024px) { .lg-menu-btn { display: none; } }
      `}</style>
    </div>
  );
}

// ── NavSection ──────────────────────────────────────────────────────────────
function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ paddingBottom: 4 }}>
      <div style={{
        fontFamily: "'Inconsolata', monospace",
        fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.22)',
        padding: '0 20px', marginBottom: 6,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

// ── NavItem ─────────────────────────────────────────────────────────────────
function NavItem({
  to, end, icon: Icon, label, onClick,
}: { to: string; end: boolean; icon: React.ElementType; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 20px',
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "'Syne', 'Inter', sans-serif",
        color: isActive ? '#f2ede8' : 'rgba(255,255,255,0.5)',
        background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
        textDecoration: 'none',
        transition: 'color 0.15s, background 0.15s',
        letterSpacing: '0.01em',
        position: 'relative',
        borderLeft: isActive ? `2px solid ${ACC}` : '2px solid transparent',
      })}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = 'rgba(255,255,255,0.9)';
        el.style.background = 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        const active = el.getAttribute('aria-current') === 'page';
        el.style.color = active ? '#f2ede8' : 'rgba(255,255,255,0.5)';
        el.style.background = active ? 'rgba(255,255,255,0.07)' : 'transparent';
      }}
    >
      {({ isActive }) => (
        <>
          <Icon size={16} style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
