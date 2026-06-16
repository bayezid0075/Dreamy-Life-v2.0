'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileNavItem {
  label: string;
  href: string;
  icon: string;
}

const mobileNavItems: MobileNavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Users', href: '/dashboard/users', icon: 'group' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: 'monitoring' },
  { label: 'Settings', href: '/dashboard/settings', icon: 'settings' },
  { label: 'Support', href: '/dashboard/support', icon: 'help' },
];

export default function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
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

  return (
    <>
      <header className="flex justify-between items-center px-md w-full h-16 glass-panel text-primary font-body-sm text-body-sm border-b border-outline-variant z-10 sticky top-0">
        <div className="flex items-center gap-md flex-1">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
          <div className="hidden md:block font-title-md text-title-md font-bold text-on-surface">Dreamy Life Admin</div>
          <div className="relative w-64 ml-lg hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              className="w-full bg-surface-container-high/50 border border-outline-variant rounded-full py-2 pl-10 pr-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="Search..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-md">
          <button className="text-on-surface-variant hover:text-primary transition-opacity">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-opacity hidden sm:block">
            <span className="material-symbols-outlined">light_mode</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-primary-container overflow-hidden border border-outline-variant">
            <span className="material-symbols-outlined text-on-primary text-sm flex items-center justify-center h-full">person</span>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <nav className="absolute left-0 top-0 h-full w-72 glass-panel border-r border-outline-variant p-md flex flex-col gap-sm">
            <div className="flex justify-between items-center mb-md">
              <div>
                <h1 className="font-headline-md text-headline-md text-primary font-bold">Dreamy Life</h1>
                <p className="text-on-surface-variant font-body-sm text-body-sm">Admin Console</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-xs">
              {mobileNavItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-sm px-sm py-sm rounded-lg transition-colors ${
                      active
                        ? 'text-on-surface border-l-2 border-primary bg-primary-container/10'
                        : 'text-on-surface-variant hover:bg-surface-variant/50'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-sm px-sm py-sm rounded-lg text-error hover:bg-error/10 transition-colors mt-auto"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
