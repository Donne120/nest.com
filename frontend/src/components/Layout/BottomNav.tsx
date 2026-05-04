import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Video, UserCircle, LayoutDashboard, MessageSquare, ClipboardList } from 'lucide-react';
import { useAuthStore } from '../../store';
import clsx from 'clsx';

const learnerTabs = [
  { to: '/modules',      icon: BookOpen,       label: 'Learn'       },
  { to: '/assignments',  icon: ClipboardList,  label: 'Assignments' },
  { to: '/meetings',     icon: Video,          label: 'Meetings'    },
  { to: '/profile',      icon: UserCircle,     label: 'Profile'     },
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

  const isActive = (to: string) => {
    if (to === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(to);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch"
      style={{
        background: '#0f1014',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label="Mobile navigation"
    >
      {tabs.map(({ to, icon: Icon, label }) => {
        const active = isActive(to);
        return (
          <Link
            key={to}
            to={to}
            className={clsx('flex-1 flex flex-col items-center justify-center gap-1 transition-colors')}
            style={{
              color: active ? '#e8c97e' : 'rgba(255,255,255,0.4)',
              minHeight: 56,
              paddingTop: 10,
              paddingBottom: 10,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.02em',
              textDecoration: 'none',
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{ lineHeight: 1 }}>{label}</span>
            {active && (
              <span style={{
                position: 'absolute',
                bottom: 0,
                width: 24,
                height: 2,
                background: '#e8c97e',
                borderRadius: 2,
              }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
