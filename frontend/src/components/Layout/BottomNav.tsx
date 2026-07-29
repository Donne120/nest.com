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
        className="md:hidden fixed bottom-0 inset-x-0 z-50 nest-bottomnav"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        aria-label="Mobile navigation"
      >
        <div className="flex items-stretch nest-bottomnav-row">
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
                  className="nest-tab flex-1 flex flex-col items-center justify-center gap-1 relative"
                  style={{
                    minHeight: 58,
                    paddingTop: 8,
                    paddingBottom: 8,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  {/* Glowing centre pill — Nest AI orchid */}
                  <div
                    className="nest-tab-cap"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: active
                        ? 'linear-gradient(135deg,#b06cc6,#7b2d8e)'
                        : 'linear-gradient(135deg,rgba(176,108,198,0.20),rgba(123,45,142,0.20))',
                      border: active
                        ? '1px solid rgba(176,108,198,0.6)'
                        : '1px solid rgba(176,108,198,0.28)',
                      boxShadow: active
                        ? '0 0 20px rgba(176,108,198,0.45), 0 4px 12px rgba(0,0,0,0.3)'
                        : '0 0 12px rgba(176,108,198,0.15)',
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
                        color: active ? '#fff' : '#b06cc6',
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
                      color: active ? '#c06fd0' : 'rgba(255,255,255,0.35)',
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
                className="nest-tab flex-1 flex flex-col items-center justify-center gap-1 relative"
                aria-current={active ? 'page' : undefined}
                style={{
                  minHeight: 58,
                  paddingTop: 8,
                  paddingBottom: 8,
                  fontSize: 10,
                  fontWeight: active ? 700 : 600,
                  letterSpacing: '0.02em',
                  textDecoration: 'none',
                  color: active ? 'var(--c-acc)' : 'var(--c-ink3)',
                  transition: 'color 0.2s',
                }}
              >
                <div
                  className="nest-tab-cap"
                  style={{
                    width: 46,
                    height: 30,
                    borderRadius: 12,
                    background: active ? 'color-mix(in srgb, var(--c-acc) 15%, transparent)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 3,
                  }}
                >
                  <Icon
                    size={21}
                    strokeWidth={active ? 2.4 : 1.9}
                    style={{ transition: 'all 0.2s' }}
                  />
                </div>
                <span style={{ lineHeight: 1 }}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <style>{`
        /* Theme-aware floating glass bar — reads native in both light & dark. */
        .nest-bottomnav {
          background: color-mix(in srgb, var(--c-surf) 82%, transparent);
          backdrop-filter: blur(24px) saturate(1.4);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          border-top: 1px solid var(--c-rule);
          box-shadow: 0 -0.5px 0 color-mix(in srgb, var(--c-ink) 6%, transparent),
                      0 -10px 34px -18px rgba(0,0,0,0.55);
        }
        .nest-tab { -webkit-tap-highlight-color: transparent; }
        /* Icon capsule springs on press for a tactile, app-native feel. */
        .nest-tab-cap { transition: background 0.2s ease, transform 0.28s cubic-bezier(0.34,1.56,0.64,1); }
        .nest-tab:active .nest-tab-cap { transform: scale(0.86); }
        @media (prefers-reduced-motion: reduce) {
          .nest-tab-cap { transition: none; }
          .nest-tab:active .nest-tab-cap { transform: none; }
        }
      `}</style>
    </>
  );
}
