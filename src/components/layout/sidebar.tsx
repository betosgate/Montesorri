'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useProfile } from '@/lib/hooks/use-profile';
import type { UserRole } from '@/lib/types/database';

interface NavItem {
  label: string;
  href: string;
}

const navByRole: Record<UserRole, NavItem[]> = {
  parent: [
    { label: 'Home', href: '/dashboard' },
    { label: 'Calendar', href: '/dashboard/calendar' },
    { label: 'My Students', href: '/dashboard/students' },
    { label: 'Progress', href: '/dashboard/progress' },
    { label: 'Classes', href: '/dashboard/classes' },
    { label: 'Community', href: '/dashboard/community' },
    { label: 'Account', href: '/dashboard/account' },
  ],
  teacher: [
    { label: 'Home', href: '/dashboard' },
    { label: 'My Schedule', href: '/dashboard/schedule' },
    { label: 'My Classes', href: '/dashboard/classes' },
    { label: 'Students', href: '/dashboard/students' },
    { label: 'Profile', href: '/dashboard/profile' },
  ],
  admin: [
    { label: 'Home', href: '/dashboard' },
    { label: 'Teachers', href: '/dashboard/teachers' },
    { label: 'Classes', href: '/dashboard/classes' },
    { label: 'Students', href: '/dashboard/students' },
    { label: 'Curriculum', href: '/dashboard/curriculum' },
    { label: 'Analytics', href: '/dashboard/analytics' },
    { label: 'Settings', href: '/dashboard/settings' },
  ],
  student: [
    { label: 'Home', href: '/dashboard' },
  ],
};

const roleLabels: Record<UserRole, string> = {
  parent: 'Parent Dashboard',
  teacher: 'Teacher Dashboard',
  admin: 'Admin Dashboard',
  student: 'Student Dashboard',
};

export function Sidebar() {
  const pathname = usePathname();
  const { profile, loading } = useProfile();

  const role = profile?.role ?? 'parent';
  const links = navByRole[role];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-stone-200 bg-white">
      {/* Logo area */}
      <div className="border-b border-stone-200 px-6 py-5">
        <h1 className="text-lg font-semibold text-stone-800">
          Montessori Home
        </h1>
        {loading ? (
          <p className="mt-1 text-xs text-stone-400">Loading...</p>
        ) : (
          <p className="mt-1 text-xs text-stone-500">
            {roleLabels[role]}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {links.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-green-50 text-green-800'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
