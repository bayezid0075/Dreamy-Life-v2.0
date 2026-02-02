'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  User,
  Wallet,
  Users,
  Crown,
  ShoppingBag,
  Package,
  Store,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Gift,
  CreditCard,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
}

const primaryNavItems: NavItem[] = [
  {
    title: 'Wallet',
    href: '/wallet',
    icon: Wallet,
    gradient: 'from-emerald-500 to-teal-500',
    iconColor: 'text-emerald-600',
  },
  {
    title: 'Referrals',
    href: '/referrals',
    icon: Users,
    gradient: 'from-blue-500 to-indigo-500',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Memberships',
    href: '/memberships',
    icon: Crown,
    gradient: 'from-amber-500 to-orange-500',
    iconColor: 'text-amber-600',
  },
  {
    title: 'Orders',
    href: '/orders',
    icon: ShoppingBag,
    gradient: 'from-pink-500 to-rose-500',
    iconColor: 'text-pink-600',
  },
  {
    title: 'Products',
    href: '/vendor/products',
    icon: Package,
    gradient: 'from-violet-500 to-purple-500',
    iconColor: 'text-violet-600',
  },
  {
    title: 'My Shop',
    href: '/vendor',
    icon: Store,
    gradient: 'from-cyan-500 to-blue-500',
    iconColor: 'text-cyan-600',
  },
  {
    title: 'Rewards',
    href: '/rewards',
    icon: Gift,
    gradient: 'from-red-500 to-orange-500',
    iconColor: 'text-red-600',
  },
];

const secondaryNavItems: NavItem[] = [
  {
    title: 'Payment',
    href: '/payment',
    icon: CreditCard,
    gradient: 'from-indigo-500 to-violet-500',
    iconColor: 'text-indigo-600',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    gradient: 'from-slate-500 to-gray-500',
    iconColor: 'text-slate-600',
  },
  {
    title: 'Help',
    href: '/help',
    icon: HelpCircle,
    gradient: 'from-teal-500 to-emerald-500',
    iconColor: 'text-teal-600',
  },
];

export function MobileNavGrid() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="md:hidden relative z-10 -mt-2 sm:-mt-4">
      {/* Primary Grid - Floating card over the gradient */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl shadow-violet-500/20 p-3 sm:p-4 mx-3 sm:mx-4">
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1.5 sm:gap-2 group"
            >
              <div className="relative w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center">
                {/* Background with gradient border effect */}
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-50 dark:from-violet-900/30 dark:to-fuchsia-900/20 group-hover:from-violet-200 group-hover:to-fuchsia-100 dark:group-hover:from-violet-800/40 dark:group-hover:to-fuchsia-800/30 transition-all duration-300 group-active:scale-95" />
                {/* Icon */}
                <item.icon className={`relative h-5 w-5 sm:h-6 sm:w-6 ${item.iconColor} dark:text-violet-400 group-hover:scale-110 transition-transform duration-300`} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight line-clamp-1">
                {item.title}
              </span>
            </Link>
          ))}
        </div>

        {/* Expandable Secondary Grid */}
        {expanded && (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-violet-100 dark:border-violet-800/30">
            {secondaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1.5 sm:gap-2 group"
              >
                <div className="relative w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-50 dark:from-violet-900/30 dark:to-fuchsia-900/20 group-hover:from-violet-200 group-hover:to-fuchsia-100 dark:group-hover:from-violet-800/40 dark:group-hover:to-fuchsia-800/30 transition-all duration-300 group-active:scale-95" />
                  <item.icon className={`relative h-5 w-5 sm:h-6 sm:w-6 ${item.iconColor} dark:text-violet-400 group-hover:scale-110 transition-transform duration-300`} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight line-clamp-1">
                  {item.title}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 sm:mt-4 flex items-center justify-center gap-1 text-xs sm:text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors py-1"
        >
          {expanded ? (
            <>
              Show Less <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </>
          ) : (
            <>
              See More <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
