'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  User,
  Wallet,
  ShoppingBag,
} from 'lucide-react';

const navItems = [
  {
    title: 'Home',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Wallet',
    href: '/wallet',
    icon: Wallet,
  },
  {
    title: 'Orders',
    href: '/orders',
    icon: ShoppingBag,
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-violet-200/50 dark:border-violet-800/30 shadow-[0_-4px_20px_-4px_rgba(139,92,246,0.1)]">
      <div
        className="grid grid-cols-4 h-14 sm:h-16 px-1 sm:px-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                isActive ? 'scale-105' : ''
              }`}
            >
              <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 dark:from-violet-500/25 dark:to-fuchsia-500/25 shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}>
                <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                  isActive
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`} />
              </div>
              <span className={`text-[9px] sm:text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
