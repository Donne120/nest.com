import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Video, UserCircle, LayoutDashboard, MessageSquare, ClipboardList } from 'lucide-react';
import { useAuthStore } from '../../store';
import clsx from 'clsx';

const learnerTabs = [
  { to: '/modules',     icon: BookOpen,      label: 'Learn'       },
  { to: '/assignments', icon: ClipboardList, label: 'Tasks'       },
  { to: '/meetings',    icon: Video,         label: 'Meetings'    },
  { to: '/profile',     icon: UserCircle,    label: 'Profile'     },
];

const managerTabs = [
  { to: '/admin',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/courses',   icon: BookOpen,        label: 'Courses'   },
  { to: '/admin/questions', icon: MessageSquare,   label: 'Questions' },
  { to: '/profile',         icon: UserCircle,      label: 'Profile'   },
];

export default function BottomNav() {
  const { user } = useAuthStore();
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
        /* Solid bar (no backdrop-filter). A blurred fixed bar re-blurs the whole
           page behind it on every scroll frame — the #1 cause of heavy, stuttery
           mobile scrolling. A solid surface looks native and scrolls buttery. */
        .nest-bottomnav {
          background: var(--c-surf);
          border-top: 1px solid var(--c-rule);
          box-shadow: 0 -0.5px 0 color-mix(in srgb, var(--c-ink) 6%, transparent),
                      0 -10px 34px -18px rgba(84,52,180,0.18);
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
