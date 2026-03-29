import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Video, UserCircle, LayoutDashboard, MessageSquare, ClipboardList } from 'lucide-react';
import { useAuthStore } from '../../store';
import clsx from 'clsx';

const learnerTabs = [
  { to: '/modules',      icon: BookOpen,       label: 'Learn'       },
  { to: '/meetings',     icon: Video,          label: 'Meetings'    },
  { to: '/assignments',  icon: ClipboardList,  label: 'Assignments' },
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
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 flex items-stretch safe-area-bottom"
      aria-label="Mobile navigation"
    >
      {tabs.map(({ to, icon: Icon, label }) => {
        const active = isActive(to);
        return (
          <Link
            key={to}
            to={to}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold tracking-wide transition-colors',
              active
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
