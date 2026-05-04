import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, TrendingUp, BookOpen, Settings,
  LogOut, Bell, Video, Menu, X, HeartPulse, ArrowUpRight, ClipboardList, Banknote,
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
  { to: '/admin/payments', end: false, icon: Banknote, label: 'Payments' },
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
  ['/admin/payments', 'Payments'],
  ['/admin/settings', 'Settings'],
  ['/admin', 'Dashboard'],
];

// Design tokens
import { BG, BG2, SURF, RULE, INK, INK2, INK3, ACC, ACC2 } from '../../lib/colors';

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
      <div className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{
          height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px 0 8px',
          borderBottom: `1px solid ${RULE}`,
          background: SURF,
          position: 'sticky', top: 0, zIndex: 40,
          flexShrink: 0,
          gap: 8,
        }}>
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: BG2, border: `1px solid ${RULE}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: INK2, cursor: 'pointer', flexShrink: 0,
              transition: 'border-color 0.2s',
            }}
            className="lg-menu-btn"
            aria-label="Open menu"
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = INK3)}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = RULE)}
          >
            <Menu size={16} />
          </button>

          {/* Page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: INK, flex: 1, minWidth: 0 }}>
            <span style={{ color: INK2, fontWeight: 400, flexShrink: 0, fontSize: 12 }} className="live-pill-text">Admin</span>
            <span style={{ opacity: 0.3, fontSize: 10, flexShrink: 0 }} className="live-pill-text">›</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pageTitle}</span>
          </div>

          {/* Right — desktop shows live pill + user chip; mobile shows notif only */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Live pill — desktop only */}
            <div className="live-pill" style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: BG2, border: `1px solid ${RULE}`,
              borderRadius: 100, padding: '5px 13px',
              fontFamily: "'Inconsolata', monospace",
              fontSize: 11, fontWeight: 500, color: INK2,
              letterSpacing: '0.04em',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2a7a4b', animation: 'notif-blink 2s ease infinite', display: 'inline-block' }} />
              Live
            </div>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setNotifOpen(o => !o); if (unread > 0) markAllRead.mutate(); }}
                style={{
                  width: 36, height: 36, borderRadius: 8,
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
                    position: 'absolute', top: -4, right: -4,
                    minWidth: 16, height: 16, borderRadius: 8,
                    background: ACC, color: '#fff',
                    border: `2px solid ${SURF}`,
                    fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px', lineHeight: 1,
                    boxShadow: `0 0 0 2px ${ACC}44`,
                    animation: 'notif-blink 2s ease infinite',
                  }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  {/* Mobile backdrop */}
                  <div
                    className="admin-notif-backdrop"
                    style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
                    onClick={() => setNotifOpen(false)}
                  />
                  <div
                    className="admin-notif-panel"
                    style={{
                      zIndex: 50,
                      background: SURF, border: `1px solid ${RULE}`,
                      borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
                      overflow: 'hidden',
                      animation: 'slideDown 0.18s cubic-bezier(0.16,1,0.3,1) both',
                    }}>
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${RULE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>Notifications</span>
                        {unread > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: ACC, borderRadius: 100, padding: '1px 6px' }}>{unread}</span>
                        )}
                      </div>
                      {unread === 0 && <span style={{ fontSize: 11, color: '#2a7a4b', background: 'rgba(42,122,75,0.08)', padding: '2px 8px', borderRadius: 100 }}>All read</span>}
                    </div>
                    <div style={{ maxHeight: 'min(340px, 55vh)', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                          <Bell size={20} style={{ color: INK3, opacity: 0.4, margin: '0 auto 8px' }} />
                          <p style={{ fontSize: 12.5, color: INK3 }}>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 10).map(n => (
                          <div
                            key={n.id}
                            onClick={() => { setNotifOpen(false); if (n.reference_id) navigate(`/admin/questions/${n.reference_id}`); }}
                            style={{
                              padding: '12px 18px', borderBottom: `1px solid rgba(212,205,198,0.4)`,
                              cursor: 'pointer', transition: 'background 0.15s',
                              background: !n.is_read ? 'rgba(44,107,201,0.03)' : 'transparent',
                              display: 'flex', gap: 10, alignItems: 'flex-start',
                            }}
                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = BG2)}
                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = !n.is_read ? 'rgba(44,107,201,0.03)' : 'transparent')}
                          >
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: !n.is_read ? ACC2 : 'transparent', border: `1.5px solid ${!n.is_read ? ACC2 : RULE}`, flexShrink: 0, marginTop: 4 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 500, color: INK, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                              <p style={{ fontSize: 11.5, color: INK3, lineHeight: 1.4 }}>{n.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User chip — desktop only */}
            <div
              className="admin-user-chip"
              style={{
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
        @keyframes notif-blink { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes slideDown {
          from { opacity:0; transform: translateY(-6px) scale(0.98); }
          to   { opacity:1; transform: translateY(0)   scale(1);    }
        }

        /* ── Sidebar ── */
        .lg-sidebar { }
        @media (max-width: 1023px) {
          .lg-sidebar { transform: translateX(-100%); }
          .admin-main { margin-left: 0 !important; }
          .live-pill  { display: none !important; }
          .lg-hidden  { display: block; }
          .lg-menu-btn { display: flex !important; }
          .admin-user-chip { display: none !important; }
          .live-pill-text { display: none; }
        }
        @media (min-width: 1024px) {
          .admin-main  { margin-left: 196px; }
          .lg-menu-btn { display: none !important; }
          .lg-hidden   { display: none; }
        }

        /* ── Notification panel ── */
        /* Desktop: anchored dropdown */
        .admin-notif-panel {
          position: absolute;
          right: 0;
          top: 44px;
          width: 320px;
        }
        .admin-notif-backdrop { display: none; }

        /* Mobile: full-width sheet */
        @media (max-width: 639px) {
          .admin-notif-panel {
            position: fixed !important;
            top: 60px !important;
            left: 8px !important;
            right: 8px !important;
            width: auto !important;
            border-radius: 16px !important;
          }
          .admin-notif-backdrop { display: block !important; }
        }

        /* ── Page content scroll clearance for mobile ── */
        @media (max-width: 767px) {
          .admin-page-content {
            padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px) !important;
          }
        }
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
