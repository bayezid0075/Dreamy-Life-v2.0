"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Wallet,
  Users,
  Crown,
  ShoppingBag,
  Store,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Gift,
  CreditCard,
  Sparkles,
  Package,
  Smartphone,
  Car,
} from "lucide-react";

import { useVendor } from "@/hooks/use-vendor";
import { useI18n } from "@/hooks/use-i18n";

interface NavItem {
  key: string;
  href: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
  /** Optional custom image URL (e.g. for Recharge); when set, shown instead of icon */
  imageSrc?: string;
}

const staticNavItems: NavItem[] = [
  {
    key: "nav.wallet",
    href: "/wallet",
    icon: Wallet,
    gradient: "from-emerald-500 to-teal-500",
    iconColor: "text-emerald-600",
  },
  {
    key: "nav.recharge",
    href: "/recharge",
    icon: Smartphone,
    gradient: "from-violet-500 to-purple-500",
    iconColor: "text-violet-600",
    imageSrc: "/icons/smartphone-recharge.png",
  },
  {
    key: "nav.driveOffer",
    href: "/recharge/drive",
    icon: Car,
    gradient: "from-orange-500 to-amber-500",
    iconColor: "text-orange-600",
  },
  {
    key: "nav.shop",
    href: "/reseller",
    icon: Store,
    gradient: "from-cyan-500 to-blue-500",
    iconColor: "text-cyan-600",
  },
  {
    key: "nav.referrals",
    href: "/referrals",
    icon: Users,
    gradient: "from-blue-500 to-indigo-500",
    iconColor: "text-blue-600",
  },
  {
    key: "nav.orders",
    href: "/orders",
    icon: ShoppingBag,
    gradient: "from-pink-500 to-rose-500",
    iconColor: "text-pink-600",
  },
  {
    key: "nav.marketplace",
    href: "/marketplace",
    icon: Package,
    gradient: "from-indigo-500 to-violet-500",
    iconColor: "text-indigo-600",
  },
];

const secondaryNavItems: NavItem[] = [
  {
    key: "nav.memberships",
    href: "/memberships",
    icon: Crown,
    gradient: "from-amber-500 to-orange-500",
    iconColor: "text-amber-600",
  },
  {
    key: "nav.rewards",
    href: "/rewards",
    icon: Gift,
    gradient: "from-red-500 to-orange-500",
    iconColor: "text-red-600",
  },
  {
    key: "nav.payment",
    href: "/payment",
    icon: CreditCard,
    gradient: "from-indigo-500 to-violet-500",
    iconColor: "text-indigo-600",
  },
  {
    key: "nav.settings",
    href: "/settings",
    icon: Settings,
    gradient: "from-slate-500 to-gray-500",
    iconColor: "text-slate-600",
  },
  {
    key: "nav.help",
    href: "/help",
    icon: HelpCircle,
    gradient: "from-teal-500 to-emerald-500",
    iconColor: "text-teal-600",
  },
];

export function MobileNavGrid() {
  const [expanded, setExpanded] = useState(false);
  const { hasVendor } = useVendor();
  const { t } = useI18n();

  const vendorNavItem: NavItem = hasVendor
    ? {
        key: "nav.myShop",
        href: "/vendor",
        icon: Store,
        gradient: "from-cyan-500 to-blue-500",
        iconColor: "text-cyan-600",
      }
    : {
        key: "nav.vendor",
        href: "/vendor",
        icon: Sparkles,
        gradient: "from-fuchsia-500 to-pink-500",
        iconColor: "text-fuchsia-600",
      };

  const primaryNavItems: NavItem[] = [...staticNavItems, vendorNavItem];

  return (
    <div className="md:hidden relative z-10 -mt-2 sm:-mt-4">
      {/* Primary Grid - Floating card over the gradient */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl shadow-violet-500/20 p-4 sm:p-5 mx-3 sm:mx-4">
        {/* 3 cols on narrow phones, 4 cols from 360px — equal cells, touch-friendly */}
        <div className="grid grid-cols-3 min-[360px]:grid-cols-4 gap-3 sm:gap-4">
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-2 group min-w-0 w-full py-1 active:opacity-90 touch-manipulation"
            >
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0 rounded-xl sm:rounded-2xl overflow-hidden">
                {/* Background with gradient border effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-100 to-fuchsia-50 dark:from-violet-900/30 dark:to-fuchsia-900/20 group-hover:from-violet-200 group-hover:to-fuchsia-100 dark:group-hover:from-violet-800/40 dark:group-hover:to-fuchsia-800/30 transition-all duration-300 group-active:scale-95" />
                {/* Icon or custom image */}
                {item.imageSrc ? (
                  <img
                    src={item.imageSrc}
                    alt=""
                    className="relative h-7 w-7 sm:h-8 sm:w-8 object-contain group-hover:scale-110 transition-transform duration-300 shrink-0 z-10"
                  />
                ) : (
                  <item.icon
                    className={`relative h-6 w-6 sm:h-7 sm:w-7 stroke-[2] ${item.iconColor} dark:text-violet-400 group-hover:scale-110 transition-transform duration-300 shrink-0`}
                    strokeWidth={2}
                  />
                )}
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 text-center leading-tight line-clamp-1 w-full min-w-0">
                {t(item.key as any)}
              </span>
            </Link>
          ))}
        </div>

        {/* Expandable Secondary Grid */}
        {expanded && (
          <div className="grid grid-cols-3 min-[360px]:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-violet-100 dark:border-violet-800/30">
            {secondaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-2 group min-w-0 w-full py-1 active:opacity-90 touch-manipulation"
              >
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0 rounded-xl sm:rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-100 to-fuchsia-50 dark:from-violet-900/30 dark:to-fuchsia-900/20 group-hover:from-violet-200 group-hover:to-fuchsia-100 dark:group-hover:from-violet-800/40 dark:group-hover:to-fuchsia-800/30 transition-all duration-300 group-active:scale-95" />
                  <item.icon
                    className={`relative h-6 w-6 sm:h-7 sm:w-7 stroke-[2] ${item.iconColor} dark:text-violet-400 group-hover:scale-110 transition-transform duration-300 shrink-0`}
                    strokeWidth={2}
                  />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 text-center leading-tight line-clamp-1 w-full min-w-0">
                  {t(item.key as any)}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-4 sm:mt-5 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 active:opacity-80 transition-colors py-2 min-h-[2.75rem] touch-manipulation"
        >
          {expanded ? (
            <>
              Show Less <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2]" strokeWidth={2} />
            </>
          ) : (
            <>
              See More <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2]" strokeWidth={2} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
