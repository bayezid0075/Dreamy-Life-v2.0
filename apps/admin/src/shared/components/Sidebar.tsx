'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Users', href: '/dashboard/users', icon: 'group' },
  { label: 'Referrals', href: '/dashboard/referrals', icon: 'account_tree' },
  { label: 'Moderation', href: '/dashboard/moderation', icon: 'shield' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest border-r border-outline/10 flex flex-col z-50">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-outline/10">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            spa
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-on-surface truncate">Dreamy Life</h1>
          <p className="text-xs text-on-surface-variant truncate">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-primary-container text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span
                className="material-symbols-outlined text-xl flex-shrink-0"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="text-sm truncate flex-1">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-2 border-t border-outline/10">
        <div className="flex items-center gap-3 px-3 py-2.5 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-lg">logout</span>
          <span>Sign Out</span>
        </div>
      </div>
    </aside>
  );
}
