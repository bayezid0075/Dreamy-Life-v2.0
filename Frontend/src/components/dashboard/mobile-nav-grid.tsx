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
  /** Optional custom image URL */
  imageSrc?: string;
}

const staticNavItems: NavItem[] = [
  { key: "nav.wallet", href: "/wallet", icon: Wallet },
  { key: "nav.recharge", href: "/recharge", icon: Smartphone },
  { key: "nav.driveOffer", href: "/recharge/drive", icon: Car },
  { key: "nav.shop", href: "/reseller", icon: Store },
  { key: "nav.referrals", href: "/referrals", icon: Users },
  { key: "nav.orders", href: "/orders", icon: ShoppingBag },
  { key: "nav.marketplace", href: "/marketplace", icon: Package },
];

const secondaryNavItems: NavItem[] = [
  { key: "nav.memberships", href: "/memberships", icon: Crown },
  { key: "nav.rewards", href: "/rewards", icon: Gift },
  { key: "nav.payment", href: "/payment", icon: CreditCard },
  { key: "nav.settings", href: "/settings", icon: Settings },
  { key: "nav.help", href: "/help", icon: HelpCircle },
];

export function MobileNavGrid() {
  const [expanded, setExpanded] = useState(false);
  const { hasVendor } = useVendor();
  const { t } = useI18n();

  const vendorNavItem: NavItem = hasVendor
    ? { key: "nav.myShop", href: "/vendor", icon: Store }
    : { key: "nav.vendor", href: "/vendor", icon: Sparkles };

  const primaryNavItems: NavItem[] = [...staticNavItems, vendorNavItem];

  /** First 3 rows visible initially (3×3 = 9 items on 3-col grid). Rest after "Show More". */
  const INITIAL_ROWS = 3;
  const COLS_SMALL = 3;
  const initialCount = INITIAL_ROWS * COLS_SMALL; // 9 items = 3 rows when grid-cols-3
  const initialItems = primaryNavItems.slice(0, Math.min(primaryNavItems.length, initialCount));
  const morePrimaryItems = primaryNavItems.slice(initialItems.length);
  const allMoreItems: NavItem[] = [...morePrimaryItems, ...secondaryNavItems];

  const renderNavItem = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      className="flex flex-col items-center justify-center gap-2 group min-w-0 w-full py-1 active:opacity-80 touch-manipulation"
    >
      {/* Icon container */}
      <div
        className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0 rounded-xl sm:rounded-2xl overflow-hidden transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
        style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
      >
        {item.imageSrc ? (
          <img
            src={item.imageSrc}
            alt=""
            className="h-7 w-7 sm:h-8 sm:w-8 object-contain group-hover:scale-110 transition-transform duration-200 z-10"
          />
        ) : (
          <item.icon
            className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 transition-transform duration-200 group-hover:scale-110"
            style={{ color: "var(--color-primary)" }}
            strokeWidth={2}
          />
        )}
      </div>
      {/* Label */}
      <span
        className="text-[10px] sm:text-xs font-medium text-center leading-tight line-clamp-1 w-full min-w-0"
        style={{ color: "var(--color-text-2)", fontFamily: "var(--font-body)" }}
      >
        {t(item.key as any)}
      </span>
    </Link>
  );

  return (
    <div className="md:hidden relative z-10 -mt-2 sm:-mt-4">
      {/* Floating card over gradient hero */}
      <div
        className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 mx-3 sm:mx-4"
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* First 3 rows (initial items) */}
        <div className="grid grid-cols-3 min-[360px]:grid-cols-4 gap-3 sm:gap-4">
          {initialItems.map(renderNavItem)}
        </div>

        {/* Divider line after 3 rows */}
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
                  className="w-full mt-4 sm:mt-5 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium transition-colors py-2 min-h-11 touch-manipulation font-mono tracking-wide"
                  style={{ color: "var(--color-primary)" }}
                >
                  Show Less <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setExpanded(true)}
                className="w-full flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium transition-colors py-2 min-h-11 touch-manipulation font-mono tracking-wide"
                style={{ color: "var(--color-primary)" }}
              >
                See More <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
