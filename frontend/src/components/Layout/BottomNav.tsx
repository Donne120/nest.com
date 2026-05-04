import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Video, UserCircle, LayoutDashboard, MessageSquare, ClipboardList, Sparkles } from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import clsx from 'clsx';

const learnerTabs = [
  { to: '/modules',     icon: BookOpen,      label: 'Learn'       },
  { to: '/assignments', icon: ClipboardList, label: 'Tasks'       },
  { id: 'assistant',    icon: Sparkles,      label: 'Assistant'   },
  { to: '/meetings',    icon: Video,         label: 'Meetings'    },
  { to: '/profile',     icon: UserCircle,    label: 'Profile'     },
];

const managerTabs = [
  { to: '/admin',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/courses',   icon: BookOpen,        label: 'Courses'   },
  { id: 'assistant',        icon: Sparkles,        label: 'Assistant' },
  { to: '/admin/questions', icon: MessageSquare,   label: 'Questions' },
  { to: '/profile',         icon: UserCircle,      label: 'Profile'   },
];

export default function BottomNav() {
  const { user } = useAuthStore();
  const { toggleNestAssistant, nestAssistantOpen } = useUIStore();
  const location = useLocation();

  const isManager = user?.role === 'educator' || user?.role === 'owner';
  const tabs = isManager ? managerTabs : learnerTabs;

  const isActive = (to?: string) => {
    if (!to) return false;
    if (to === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(to);
  };

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50"
        style={{
          background: 'rgba(10,9,8,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -1px 0 rgba(255,255,255,0.04), 0 -8px 32px rgba(0,0,0,0.4)',
        }}
        aria-label="Mobile navigation"
      >
        <div className="flex items-stretch">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            // ── Nest Assistant centre button ──────────────────────────────
            if ('id' in tab && tab.id === 'assistant') {
              const active = nestAssistantOpen;
              return (
                <button
                  key="assistant"
                  onClick={toggleNestAssistant}
                  aria-label="Nest Assistant"
                  className="flex-1 flex flex-col items-center justify-center gap-1 relative"
                  style={{
                    minHeight: 60,
                    paddingTop: 8,
                    paddingBottom: 10,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  {/* Glowing centre pill */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: active
                        ? 'linear-gradient(135deg,#e8c97e,#c97a2c)'
                        : 'linear-gradient(135deg,rgba(232,201,126,0.18),rgba(201,122,44,0.18))',
                      border: active
                        ? '1px solid rgba(232,201,126,0.6)'
                        : '1px solid rgba(232,201,126,0.25)',
                      boxShadow: active
                        ? '0 0 20px rgba(232,201,126,0.45), 0 4px 12px rgba(0,0,0,0.3)'
                        : '0 0 12px rgba(232,201,126,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                      transform: active ? 'scale(1.08)' : 'scale(1)',
                      marginBottom: 2,
                    }}
                  >
                    <Sparkles
                      size={18}
                      style={{
                        color: active ? '#0a0908' : '#e8c97e',
                        transition: 'color 0.2s',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.03em',
                      lineHeight: 1,
                      color: active ? '#e8c97e' : 'rgba(255,255,255,0.35)',
                      transition: 'color 0.2s',
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            }

            // ── Regular nav tab ──────────────────────────────────────────
            const active = isActive(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to!}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative"
                style={{
                  minHeight: 60,
                  paddingTop: 8,
                  paddingBottom: 10,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  textDecoration: 'none',
                  color: active ? '#e8c97e' : 'rgba(255,255,255,0.38)',
                  transition: 'color 0.2s',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 32,
                    borderRadius: 10,
                    background: active ? 'rgba(232,201,126,0.12)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                    marginBottom: 1,
                  }}
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 1.8}
                    style={{ transition: 'all 0.2s' }}
                  />
                </div>
                <span style={{ lineHeight: 1 }}>{tab.label}</span>

                {/* Active dot indicator */}
                {active && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)',
                      width: 4,
                      height: 4,
                      background: '#e8c97e',
                      borderRadius: '50%',
                      boxShadow: '0 0 6px rgba(232,201,126,0.8)',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <style>{`
        @media (max-width: 767px) {
          .bottom-nav-safe { padding-bottom: env(safe-area-inset-bottom, 12px); }
        }
      `}</style>
    </>
  );
}
