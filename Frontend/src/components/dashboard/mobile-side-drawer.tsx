"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  LayoutDashboard,
  User,
  Wallet,
  Users,
  Crown,
  ShoppingBag,
  Store,
  Package,
  BarChart3,
  ShoppingCart,
  Sparkles,
  LogOut,
  Moon,
  Sun,
  Phone,
  Copy,
  CheckCircle,
  BadgeCheck,
  X,
  XCircle,
  Settings,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useI18n } from "@/hooks/use-i18n";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { useAuthStore } from "@/store";
import { useVendor } from "@/hooks/use-vendor";

const mainNavItems = [
  {
    key: "nav.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "nav.wallet",
    href: "/wallet",
    icon: Wallet,
  },
  {
    key: "nav.referrals",
    href: "/referrals",
    icon: Users,
  },
  {
    key: "nav.memberships",
    href: "/memberships",
    icon: Crown,
  },
];

const shopNavItems = [
  {
    key: "nav.shop",
    href: "/reseller",
    icon: Store,
  },
  {
    key: "nav.orders",
    href: "/orders",
    icon: ShoppingBag,
  },
];

const vendorSubItems = [
  { key: "nav.dashboard", href: "/vendor", icon: BarChart3 },
  { key: "nav.orders", href: "/vendor/orders", icon: ShoppingCart },
  { key: "nav.marketplace", href: "/vendor/products", icon: Package },
];

const otherNavItems = [
  {
    key: "nav.settings",
    href: "/settings",
    icon: Settings,
  },
  {
    key: "nav.help",
    href: "/help",
    icon: HelpCircle,
  },
];

interface MobileSideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSideDrawer({
  open,
  onOpenChange,
}: MobileSideDrawerProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [vendorExpanded, setVendorExpanded] = useState(
    pathname.startsWith("/vendor")
  );
  const { hasVendor } = useVendor();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const copyReferralCode = async () => {
    if (user?.own_refercode) {
      await navigator.clipboard.writeText(user.own_refercode);
      setCopied(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNavClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-[280px] max-w-[85vw] p-0 bg-white dark:bg-slate-900 border-r-violet-200/50 dark:border-r-violet-800/30 overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="p-3 border-b border-violet-200/50 dark:border-violet-800/30">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 no-underline hover:no-underline"
              onClick={handleNavClick}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 text-white text-sm font-bold shadow-lg shadow-fuchsia-500/25">
                DL
              </div>
              <SheetTitle className="font-bold text-base bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                Dreamy Life
              </SheetTitle>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Profile Card */}
        <div className="p-2.5">
          <div className="relative overflow-hidden rounded-xl">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-cyan-500/20 via-transparent to-amber-500/20"></div>
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:12px_12px]"></div>
            {/* Decorative Orbs */}
            <div className="absolute -top-4 -right-4 w-14 h-14 bg-yellow-400/30 rounded-full blur-xl"></div>
            <div className="absolute -bottom-3 -left-3 w-12 h-12 bg-cyan-400/30 rounded-full blur-xl"></div>

            {/* Content */}
            <div className="relative px-3 pt-[27px] pb-[27px] text-white">
              {/* Profile Picture & Name */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-11 w-11 ring-2 ring-white/30 shadow-lg">
                    <AvatarImage src={user?.profile_picture || undefined} />
                    <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-sm font-bold">
                      {user?.user.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {user?.is_verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white shadow-lg">
                      <BadgeCheck className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl truncate pt-[2px] pb-[2px] text-[rgba(255,247,204,1)]">
                    {user?.user.username}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <div
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        user?.member_status === "user"
                          ? "bg-white/20"
                          : "bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg"
                      }`}
                    >
                      <Crown className="h-2.5 w-2.5 inline mr-0.5" />
                      {user?.member_status}
                    </div>
                    {user?.is_verified ? (
                      <div className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/90 flex items-center gap-0.5">
                        <CheckCircle className="h-2.5 w-2.5" />
                        Verified
                      </div>
                    ) : (
                      <div className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/90 flex items-center gap-0.5">
                        <XCircle className="h-2.5 w-2.5" />
                        Unverified
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Verify Button for unverified users → redirect to membership page */}
              {!user?.is_verified && (
                <Link
                  href="/memberships"
                  onClick={handleNavClick}
                  className="flex items-center justify-center gap-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold text-xs py-1.5 px-3 rounded-lg shadow-lg transition-all mb-2.5 no-underline hover:no-underline"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verify Now
                </Link>
              )}

              {/* Info Items */}
              <div className="space-y-1.5">
                {/* Phone */}
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2.5 py-1.5 backdrop-blur-sm">
                  <Phone className="h-3.5 w-3.5 text-white/70 flex-shrink-0" />
                  <span className="text-xs font-medium truncate">
                    {user?.user.phone_number || "No phone"}
                  </span>
                </div>

                {/* Referral Code */}
                <div
                  className="flex items-center justify-between bg-white/10 rounded-lg px-2.5 py-1.5 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-colors group"
                  onClick={copyReferralCode}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] text-white/70">Refer:</span>
                    <span className="font-mono font-bold text-xs text-yellow-300 truncate">
                      {user?.own_refercode}
                    </span>
                  </div>
                  <button className="p-0.5 hover:bg-white/10 rounded transition-colors flex-shrink-0">
                    {copied ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-white/70 group-hover:text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1.5">
          {/* Main Navigation */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">
              {t("nav.mainSection")}
            </p>
            <nav className="space-y-0.5">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-semibold transition-all no-underline hover:no-underline ${
                      isActive
                        ? "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 stroke-[2.25] ${
                        isActive ? "text-violet-600 dark:text-violet-400" : ""
                      }`}
                    />
                    <span>{t(item.key as any)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Shop Navigation */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">
              {t("nav.shopSection")}
            </p>
            <nav className="space-y-0.5">
              {shopNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-semibold transition-all no-underline hover:no-underline ${
                      isActive
                        ? "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 stroke-[2.25] ${
                        isActive ? "text-violet-600 dark:text-violet-400" : ""
                      }`}
                    />
                    <span>{t(item.key as any)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Vendor Navigation */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">
              {t("nav.vendorSection")}
            </p>
            <nav className="space-y-0.5">
              {hasVendor ? (
                <>
                  <button
                    onClick={() => setVendorExpanded(!vendorExpanded)}
                    className={`flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      pathname.startsWith("/vendor")
                        ? "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Store
                        className={`h-4 w-4 stroke-[2.25] ${
                          pathname.startsWith("/vendor")
                            ? "text-violet-600 dark:text-violet-400"
                            : ""
                        }`}
                      />
                      <span>{t("nav.myShop")}</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 stroke-[2.25] transition-transform duration-200 ${
                        vendorExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {vendorExpanded && (
                    <div className="ml-4 space-y-0.5 border-l-2 border-violet-200 dark:border-violet-800 pl-2.5 mt-0.5">
                      {vendorSubItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleNavClick}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all ${
                              isActive
                                ? "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 font-bold"
                                : "text-slate-500 dark:text-slate-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-slate-700 dark:hover:text-slate-200 font-semibold"
                            }`}
                          >
                            <item.icon className="h-3.5 w-3.5 stroke-[2.25]" />
                            <span>{t(item.key as any)}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/vendor"
                  onClick={handleNavClick}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 hover:from-violet-500/10 hover:to-fuchsia-500/10 transition-all no-underline hover:no-underline"
                >
                  <Sparkles className="h-4 w-4 stroke-[2.25] text-fuchsia-500" />
                  <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent font-medium">
                    {t("nav.becomeVendor")}
                  </span>
                </Link>
              )}
            </nav>
          </div>

          {/* Other Navigation */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">
              {t("nav.otherSection")}
            </p>
            <nav className="space-y-0.5">
              {otherNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-semibold transition-all no-underline hover:no-underline ${
                      isActive
                        ? "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 stroke-[2.25] ${
                        isActive ? "text-violet-600 dark:text-violet-400" : ""
                      }`}
                    />
                    <span>{t(item.key as any)}</span>
                  </Link>
                );
              })}
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 stroke-[2.25]" />
                ) : (
                  <Moon className="h-4 w-4 stroke-[2.25]" />
                )}
                <span>
                  {theme === "dark" ? t("theme.light") : t("theme.dark")}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-violet-200/50 dark:border-violet-800/30">
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-2 py-1.5 rounded-md text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{t("nav.logout")}</span>
          </button>

          {/* Version */}
          <p className="text-[9px] text-center text-slate-400 dark:text-slate-500 mt-1.5">
            v1.0.0
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
