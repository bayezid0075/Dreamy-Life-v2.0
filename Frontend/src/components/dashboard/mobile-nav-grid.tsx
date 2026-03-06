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
  FileText,
  Mail,
  Share2,
  Camera,
  Send,
  Droplet,
  Calendar,
  Target,
  Trophy,
  Type,
  Calculator,
  Video,
  Globe,
  Coins,
  PlayCircle,
  MousePointerClick,
  Footprints,
  Briefcase,
} from "lucide-react";

import { useVendor } from "@/hooks/use-vendor";
import { useI18n } from "@/hooks/use-i18n";

interface NavItem {
  key: string;
  href: string;
  icon: React.ElementType;
  imageSrc?: string;
  /** If set, shown as label instead of t(key) */
  label?: string;
}

const staticNavItems: NavItem[] = [
  { key: "nav.wallet", href: "/wallet", icon: Wallet },
  { key: "nav.recharge", href: "/recharge", icon: Smartphone, imageSrc: "/icons/smartphone-recharge.png" },
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

/** App grid items (Bengali labels) – shown when expanded */
const extraAppItems: NavItem[] = [
  { key: "app.mobileRecharge", href: "/recharge", icon: Smartphone, label: "মোবাইল রিচাস" },
  { key: "app.easyDrive", href: "/recharge/drive", icon: Car, label: "ইজি ড্রাইভ" },
  { key: "app.drivePack", href: "/recharge/drive", icon: Package, label: "ড্রাইভ প্যাক" },
  { key: "app.reselling", href: "/reseller", icon: Store, label: "রিসেলিং" },
  { key: "app.mycojob", href: "/vendor", icon: Briefcase, label: "মাইকোজব" },
  { key: "app.jobPost", href: "/marketplace", icon: FileText, label: "জব পোস্ট" },
  { key: "app.gmailSell", href: "#", icon: Mail, label: "জিমেল সেল" },
  { key: "app.fbSell", href: "#", icon: Share2, label: "ফেসবুক সেল" },
  { key: "app.igSell", href: "#", icon: Camera, label: "ইনস্টগ্রাম সেল" },
  { key: "app.telegramSell", href: "#", icon: Send, label: "টেলিগ্রাম সেল" },
  { key: "app.blood", href: "#", icon: Droplet, label: "ব্লাড" },
  { key: "app.welcomeBonus", href: "/rewards", icon: Gift, label: "ওয়েলকাম বোনাস" },
  { key: "app.dailyBonus", href: "/rewards", icon: Calendar, label: "ডেলি বোনাস" },
  { key: "app.monthlyTarget", href: "#", icon: Target, label: "মাসিক টাগেট" },
  { key: "app.leadership", href: "#", icon: Trophy, label: "লিডারশীপ" },
  { key: "app.typing", href: "#", icon: Type, label: "টাইপিং" },
  { key: "app.math", href: "#", icon: Calculator, label: "অঙ্ক" },
  { key: "app.tax", href: "#", icon: FileText, label: "ট্যাক্স" },
  { key: "app.giftCode", href: "/rewards", icon: Gift, label: "গিফট কোড" },
  { key: "app.quiz", href: "#", icon: HelpCircle, label: "কুইজ" },
  { key: "app.videoAds", href: "#", icon: Video, label: "ভিডিও এডস" },
  { key: "app.socialMedia", href: "#", icon: Globe, label: "স্যোশাল মিডিয়া" },
  { key: "app.pointEarning", href: "/rewards", icon: Coins, label: "পয়েন্ট আনিং" },
  { key: "app.videoTutorial", href: "#", icon: PlayCircle, label: "ভিডিও টিউটোরিয়াল" },
  { key: "app.click", href: "#", icon: MousePointerClick, label: "ক্লিক" },
  { key: "app.walking", href: "#", icon: Footprints, label: "পায়ে হাটা" },
];

export function MobileNavGrid() {
  const [expanded, setExpanded] = useState(false);
  const { hasVendor } = useVendor();
  const { t } = useI18n();

  const vendorNavItem: NavItem = hasVendor
    ? { key: "nav.myShop", href: "/vendor", icon: Store }
    : { key: "nav.vendor", href: "/vendor", icon: Sparkles };

  const primaryNavItems: NavItem[] = [...staticNavItems, vendorNavItem];

  const renderNavItem = (item: NavItem) => (
    <Link
      key={item.key}
      href={item.href}
      className="flex flex-col items-center justify-center gap-2 group min-w-0 w-full py-1 active:opacity-80 touch-manipulation"
    >
      {/* Icon container - same color for all chips */}
      <div
        className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0 rounded-xl sm:rounded-2xl overflow-hidden transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
        style={{ background: "var(--color-primary)" }}
      >
        {item.imageSrc ? (
          <img
            src={item.imageSrc}
            alt=""
            className="h-7 w-7 sm:h-8 sm:w-8 object-contain group-hover:scale-110 transition-transform duration-200 z-10"
          />
        ) : (
          <item.icon
            className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 transition-transform duration-200 group-hover:scale-110 text-white"
            fill="none"
            strokeWidth={2}
            stroke="currentColor"
          />
        )}
      </div>
      {/* Label */}
      <span
        className="text-[10px] sm:text-xs font-medium text-center leading-tight line-clamp-1 w-full min-w-0"
        style={{ color: "var(--color-text-2)", fontFamily: "var(--font-body)" }}
      >
        {item.label ?? t(item.key as any)}
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
        {/* Primary grid */}
        <div className="grid grid-cols-3 min-[360px]:grid-cols-4 gap-3 sm:gap-4">
          {primaryNavItems.map(renderNavItem)}
        </div>

        {/* First half: secondary + first 10 extra (visible by default) */}
        <div
          className="grid grid-cols-3 min-[360px]:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-5 pt-4 sm:pt-5"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          {secondaryNavItems.map(renderNavItem)}
          {extraAppItems.slice(0, 10).map(renderNavItem)}
        </div>

        {/* Second half: rest of extra (visible after See More) */}
        {expanded && (
          <div className="grid grid-cols-3 min-[360px]:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-5">
            {extraAppItems.slice(10).map(renderNavItem)}
          </div>
        )}

        {/* Expand / collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-4 sm:mt-5 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium transition-colors py-2 min-h-11 touch-manipulation font-mono tracking-wide"
          style={{ color: "var(--color-primary)" }}
        >
          {expanded ? (
            <>
              Show Less <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
            </>
          ) : (
            <>
              See More <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
