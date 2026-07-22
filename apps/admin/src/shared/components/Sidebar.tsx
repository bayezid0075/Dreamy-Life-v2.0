'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  filled?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard', filled: true },
  { label: 'Users', href: '/dashboard/users', icon: 'group' },
  { label: 'Membership', href: '/dashboard/membership', icon: 'workspace_premium' },
  { label: 'Recharge', href: '/dashboard/recharge', icon: 'phone_iphone' },
  { label: 'Drive Pack', href: '/dashboard/drive-pack', icon: 'local_offer' },
  { label: 'Withdraw', href: '/dashboard/withdraw', icon: 'account_balance_wallet' },
  { label: 'Funds', href: '/dashboard/funds', icon: 'account_balance' },
  { label: 'Marketplace', href: '/dashboard/marketplace', icon: 'storefront' },
  { label: 'Messages', href: '/dashboard/messages', icon: 'chat' },
  { label: 'Notifications', href: '/dashboard/notifications', icon: 'notifications' },
  { label: 'Creator Studio', href: '/dashboard/creator-studio', icon: 'movie' },
  { label: 'Moderation', href: '/dashboard/moderation', icon: 'shield' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: 'monitoring' },
  { label: 'Settings', href: '/dashboard/settings', icon: 'settings' },
];

const bottomItems: NavItem[] = [
  { label: 'Support', href: '/dashboard/support', icon: 'help' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}
    localStorage.removeItem('accessToken');
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/login';
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <nav className="hidden md:flex flex-col h-screen py-md glass-panel text-primary font-body-lg text-body-lg fixed left-0 top-0 w-sidebar-width border-r border-outline-variant z-20">
      <div className="px-md mb-xl">
        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Dreamy Life</h1>
        <p className="text-on-surface-variant font-body-sm text-body-sm mt-xs">Admin Console</p>
      </div>

      <div className="flex-1 flex flex-col gap-xs px-sm overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-sm px-sm py-sm rounded-lg transition-colors group ${
                active
                  ? 'text-on-surface border-l-2 border-primary bg-primary-container/10 hover:bg-surface-variant/50'
                  : 'text-on-surface-variant hover:bg-surface-variant/50'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: active || item.filled ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-xs px-sm border-t border-outline-variant pt-md">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-variant/50 transition-colors text-error w-full"
        >
          <span className="material-symbols-outlined">{loggingOut ? 'progress_activity' : 'logout'}</span>
          <span>{loggingOut ? 'Signing out...' : 'Logout'}</span>
        </button>
      </div>
    </nav>
  );
}
