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
  color: string;
  imageSrc?: string;
}

const staticNavItems: NavItem[] = [
  { key: "nav.wallet",     href: "/wallet",        icon: Wallet,      color: "#F59E0B" },
  { key: "nav.recharge",   href: "/recharge",      icon: Smartphone,  color: "#06B6D4" },
  { key: "nav.driveOffer", href: "/recharge/drive", icon: Car,        color: "#3B82F6" },
  { key: "nav.shop",       href: "/reseller",      icon: Store,       color: "#F97316" },
  { key: "nav.referrals",  href: "/referrals",     icon: Users,       color: "#8B5CF6" },
  { key: "nav.orders",     href: "/orders",        icon: ShoppingBag, color: "#EF4444" },
  { key: "nav.marketplace",href: "/marketplace",   icon: Package,     color: "#6366F1" },
];

const secondaryNavItems: NavItem[] = [
  { key: "nav.memberships", href: "/memberships", icon: Crown,       color: "#D97706" },
  { key: "nav.rewards",     href: "/rewards",     icon: Gift,        color: "#F43F5E" },
  { key: "nav.payment",     href: "/payment",     icon: CreditCard,  color: "#7C3AED" },
  { key: "nav.settings",    href: "/settings",    icon: Settings,    color: "#64748B" },
  { key: "nav.help",        href: "/help",        icon: HelpCircle,  color: "#0EA5E9" },
];

export function MobileNavGrid() {
  const [expanded, setExpanded] = useState(false);
  const { hasVendor } = useVendor();
  const { t } = useI18n();

  const vendorNavItem: NavItem = hasVendor
    ? { key: "nav.myShop",  href: "/vendor", icon: Store,     color: "#EC4899" }
    : { key: "nav.vendor",  href: "/vendor", icon: Sparkles,  color: "#10B981" };

  const primaryNavItems: NavItem[] = [...staticNavItems, vendorNavItem];

  const INITIAL_ROWS = 3;
  const COLS_SMALL = 3;
  const initialCount = INITIAL_ROWS * COLS_SMALL;
  const initialItems = primaryNavItems.slice(0, Math.min(primaryNavItems.length, initialCount));
  const morePrimaryItems = primaryNavItems.slice(initialItems.length);
  const allMoreItems: NavItem[] = [...morePrimaryItems, ...secondaryNavItems];

  const renderNavItem = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      className="flex flex-col items-center gap-2 group touch-manipulation active:opacity-80"
    >
      {/* Colored square chip */}
      <div
        className="w-full aspect-square flex items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
        style={{
          background: item.color,
          boxShadow: `0 4px 12px ${item.color}55`,
        }}
      >
        {item.imageSrc ? (
          <img
            src={item.imageSrc}
            alt=""
            className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
          />
        ) : (
          <item.icon
            className="h-7 w-7 sm:h-8 sm:w-8"
            color="white"
            strokeWidth={1.75}
          />
        )}
      </div>

      {/* Label */}
      <span
        className="text-[10px] sm:text-[11px] font-semibold text-center leading-tight line-clamp-2 min-h-[2.4em] w-full"
        style={{ color: "var(--color-text-1)" }}
      >
        {t(item.key as any)}
      </span>
    </Link>
  );

  return (
    <div className="md:hidden relative z-10 -mt-2 sm:-mt-4">
      <div
        className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 mx-3 sm:mx-4"
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Primary grid */}
        <div className="grid grid-cols-3 min-[360px]:grid-cols-4 gap-3 sm:gap-4">
          {initialItems.map(renderNavItem)}
        </div>

        {/* More items */}
        {allMoreItems.length > 0 && (
          <div
            className="mt-4 sm:mt-5 pt-4 sm:pt-5"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            {expanded ? (
              <>
                <div className="grid grid-cols-3 min-[360px]:grid-cols-4 gap-3 sm:gap-4">
                  {allMoreItems.map(renderNavItem)}
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="w-full mt-4 sm:mt-5 flex items-center justify-center gap-1.5 text-xs font-medium py-2 min-h-11 touch-manipulation font-mono tracking-wide"
                  style={{ color: "var(--color-primary)" }}
                >
                  Show Less <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setExpanded(true)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium py-2 min-h-11 touch-manipulation font-mono tracking-wide"
                style={{ color: "var(--color-primary)" }}
              >
                See More <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
