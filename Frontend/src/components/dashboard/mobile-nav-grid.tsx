"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Smartphone,
  Zap,
  Package,
  Store,
  Briefcase,
  FileText,
  Mail,
  Globe,
  Camera,
  Send,
  Heart,
  Gift,
  Sun,
  Target,
  Crown,
  Keyboard,
  Calculator,
  Receipt,
  Tag,
  HelpCircle,
  Video,
  Share2,
  Star,
  PlayCircle,
  MousePointer,
  Activity,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
}

// First 12 — shown by default (3 rows × 4 cols)
const primaryNavItems: NavItem[] = [
  { label: "মোবাইল রিচার্জ",    href: "/recharge",            icon: Smartphone,   color: "#06B6D4" },
  { label: "ইজি ড্রাইভ",        href: "/recharge/drive",     icon: Zap,          color: "#3B82F6" },
  { label: "ভেন্ডর",            href: "/vendor",             icon: Sparkles,     color: "#6366F1" },
  { label: "রিসেলিং",           href: "/reseller",            icon: Store,        color: "#F97316" },
  { label: "মাইক্রোজব",         href: "/marketplace",         icon: Briefcase,    color: "#8B5CF6" },
  { label: "জব পোস্ট",          href: "/job-post",            icon: FileText,     color: "#EC4899" },
  { label: "ড্রাইভ প্যাক",      href: "/recharge/drive-pack", icon: Package,      color: "#0EA5E9" },
  { label: "জিমেইল সেল",        href: "/sell/gmail",          icon: Mail,         color: "#EF4444" },
  { label: "ফেসবুক সেল",        href: "/sell/facebook",       icon: Globe,        color: "#2563EB" },
  { label: "ইনস্টাগ্রাম সেল",  href: "/sell/instagram",      icon: Camera,       color: "#DB2777" },
  { label: "টেলিগ্রাম সেল",    href: "/sell/telegram",       icon: Send,         color: "#0EA5E9" },
  { label: "ব্লাড",             href: "/blood",               icon: Heart,        color: "#DC2626" },
  { label: "ওয়েলকাম বোনাস",   href: "/bonus/welcome",       icon: Gift,         color: "#10B981" },
];

// Remaining 14 — shown on "See More"
const secondaryNavItems: NavItem[] = [
  { label: "ডেইলি বোনাস",        href: "/bonus/daily",      icon: Sun,          color: "#F59E0B" },
  { label: "মাসিক টার্গেট",      href: "/target/monthly",   icon: Target,       color: "#14B8A6" },
  { label: "লিডারশীপ",           href: "/leadership",       icon: Crown,        color: "#D97706" },
  { label: "টাইপিং",             href: "/jobs/typing",      icon: Keyboard,     color: "#475569" },
  { label: "অঙ্ক",               href: "/jobs/math",        icon: Calculator,   color: "#7C3AED" },
  { label: "ট্যাক্স",            href: "/tax",              icon: Receipt,      color: "#0D9488" },
  { label: "গিফট কোড",           href: "/gift-code",        icon: Tag,          color: "#F43F5E" },
  { label: "কুইজ",               href: "/quiz",             icon: HelpCircle,   color: "#A855F7" },
  { label: "ভিডিও অ্যাডস",      href: "/ads/video",        icon: Video,        color: "#EA580C" },
  { label: "সোশ্যাল মিডিয়া",   href: "/social-media",     icon: Share2,       color: "#1D4ED8" },
  { label: "পয়েন্ট আর্নিং",    href: "/points",           icon: Star,         color: "#EAB308" },
  { label: "ভিডিও টিউটোরিয়াল", href: "/tutorials",        icon: PlayCircle,   color: "#DC2626" },
  { label: "ক্লিক",              href: "/click-game",       icon: MousePointer, color: "#4F46E5" },
  { label: "পায়ে হাটা",         href: "/walking",          icon: Activity,     color: "#16A34A" },
];

function NavChip({ item }: { item: NavItem }) {
  return (
    <Link
      href={item.href}
      className="flex flex-col items-center gap-1.5 group touch-manipulation active:opacity-75"
    >
      {/* Solid color square chip */}
      <div
        className="w-full aspect-square flex items-center justify-center rounded-2xl transition-transform duration-150 group-hover:scale-105 group-active:scale-95"
        style={{
          background: item.color,
          boxShadow: `0 4px 14px ${item.color}55`,
        }}
      >
        <item.icon className="h-7 w-7 sm:h-8 sm:w-8 text-white" strokeWidth={1.75} />
      </div>

      {/* Bengali label */}
      <span
        className="text-[10px] sm:text-[11px] font-semibold text-center leading-tight line-clamp-2 min-h-[2.4em] w-full"
        style={{ color: "var(--color-text-1)" }}
      >
        {item.label}
      </span>
    </Link>
  );
}

export function MobileNavGrid() {
  const [expanded, setExpanded] = useState(false);

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
        {/* Primary grid — always visible */}
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {primaryNavItems.map((item) => (
            <NavChip key={item.href} item={item} />
          ))}
        </div>

        {/* Secondary grid — toggled */}
        <div
          className="mt-4 pt-4"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          {expanded && (
            <div className="grid grid-cols-4 gap-3 sm:gap-4 mb-4">
              {secondaryNavItems.map((item) => (
                <NavChip key={item.href} item={item} />
              ))}
            </div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-medium py-2 min-h-10 touch-manipulation"
            style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}
          >
            {expanded ? (
              <>কম দেখুন <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} /></>
            ) : (
              <>আরো দেখুন <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
