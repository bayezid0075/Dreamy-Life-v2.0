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
  Smartphone,
  Car,
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
  { key: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "nav.wallet", href: "/wallet", icon: Wallet },
  { key: "nav.recharge", href: "/recharge", icon: Smartphone },
  { key: "nav.driveOffer", href: "/recharge/drive", icon: Car },
  { key: "nav.referrals", href: "/referrals", icon: Users },
  { key: "nav.memberships", href: "/memberships", icon: Crown },
];

const shopNavItems = [
  { key: "nav.shop", href: "/reseller", icon: Store },
  { key: "nav.orders", href: "/orders", icon: ShoppingBag },
];

const vendorSubItems = [
  { key: "nav.dashboard", href: "/vendor", icon: BarChart3 },
  { key: "nav.orders", href: "/vendor/orders", icon: ShoppingCart },
  { key: "nav.marketplace", href: "/vendor/products", icon: Package },
];

const otherNavItems = [
  { key: "nav.settings", href: "/settings", icon: Settings },
  { key: "nav.help", href: "/help", icon: HelpCircle },
];

interface MobileSideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSideDrawer({ open, onOpenChange }: MobileSideDrawerProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [vendorExpanded, setVendorExpanded] = useState(pathname.startsWith("/vendor"));
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

  const handleNavClick = () => onOpenChange(false);

  /* ── Reusable nav link ── */
  const NavLink = ({
    href,
    icon: Icon,
    label,
    isActive,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
    isActive: boolean;
  }) => (
    <Link
      href={href}
      onClick={handleNavClick}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors no-underline hover:no-underline"
      style={{
        background: isActive ? "var(--color-surface-2)" : "transparent",
        color: isActive ? "var(--color-primary)" : "var(--color-text-2)",
        borderLeft: isActive ? `2px solid var(--color-primary)` : "2px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "var(--color-surface-2)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span>{label}</span>
    </Link>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-[280px] max-w-[85vw] p-0 overflow-hidden flex flex-col"
        style={{
          background: "var(--color-surface-1)",
          borderRight: "1px solid var(--color-border)",
        }}
      >
        {/* ── Header ── */}
        <SheetHeader
          className="p-3 shrink-0"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 no-underline hover:no-underline"
              onClick={handleNavClick}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-sm font-bold shadow-md"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary-d), var(--color-primary))",
                }}
              >
                DL
              </div>
              <SheetTitle
                className="font-bold text-base"
                style={{ color: "var(--color-text-1)" }}
              >
                Dreamy Life
              </SheetTitle>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 shrink-0 rounded-lg"
              style={{ color: "var(--color-text-3)" }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* ── Profile Card ── */}
        <div className="p-2.5 shrink-0">
          <div
            className="relative overflow-hidden rounded-xl"
            style={{
              background: "linear-gradient(135deg, var(--color-primary-d), var(--color-primary) 55%, var(--color-accent))",
            }}
          >
            {/* Grid overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
                backgroundSize: "12px 12px",
              }}
            />
            {/* Orbs */}
            <div
              className="absolute -top-4 -right-4 w-14 h-14 rounded-full blur-xl"
              style={{ background: "rgba(255,255,255,0.15)" }}
            />
            <div
              className="absolute -bottom-3 -left-3 w-12 h-12 rounded-full blur-xl"
              style={{ background: "rgba(255,255,255,0.1)" }}
            />

            {/* Content */}
            <div className="relative px-3 py-4 text-white">
              {/* Avatar + name */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="relative shrink-0">
                  <Avatar
                    className="h-11 w-11"
                    style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.3)" }}
                  >
                    <AvatarImage src={user?.profile_picture || undefined} />
                    <AvatarFallback
                      className="text-sm font-bold"
                      style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                    >
                      {user?.user.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {user?.is_verified && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white"
                      style={{ background: "var(--color-success)" }}
                    >
                      <BadgeCheck className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate" style={{ color: "#fef9c3" }}>
                    {user?.user.username}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <span
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{
                        background:
                          user?.member_status === "user"
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(247,148,29,0.85)",
                      }}
                    >
                      <Crown className="h-2.5 w-2.5" />
                      {user?.member_status}
                    </span>
                    {user?.is_verified ? (
                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: "rgba(46,191,110,0.8)" }}
                      >
                        <CheckCircle className="h-2.5 w-2.5" />
                        Verified
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: "rgba(232,58,58,0.8)" }}
                      >
                        <XCircle className="h-2.5 w-2.5" />
                        Unverified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Verify now button */}
              {!user?.is_verified && (
                <Link
                  href="/memberships"
                  onClick={handleNavClick}
                  className="flex items-center justify-center gap-1.5 w-full text-white font-semibold text-xs py-1.5 px-3 rounded-lg mb-2.5 no-underline hover:no-underline transition-opacity hover:opacity-90"
                  style={{ background: "var(--color-success)" }}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verify Now
                </Link>
              )}

              {/* Info rows */}
              <div className="space-y-1.5">
                <div
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                  style={{ background: "rgba(255,255,255,0.12)" }}
                >
                  <Phone className="h-3.5 w-3.5 opacity-70 shrink-0" />
                  <span className="text-xs font-medium truncate">
                    {user?.user.phone_number || "No phone"}
                  </span>
                </div>

                <button
                  onClick={copyReferralCode}
                  className="flex items-center justify-between w-full rounded-lg px-2.5 py-1.5 cursor-pointer group transition-colors"
                  style={{ background: "rgba(255,255,255,0.12)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
                  }
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] opacity-70 shrink-0">Refer:</span>
                    <span className="font-mono font-bold text-xs truncate" style={{ color: "#fde68a" }}>
                      {user?.own_refercode}
                    </span>
                  </div>
                  {copied ? (
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-success)" }} />
                  ) : (
                    <Copy className="h-3.5 w-3.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1.5">

          {/* Main nav */}
          <div className="mb-4">
            <p
              className="text-[9px] font-mono tracking-widest uppercase px-2.5 mb-1.5"
              style={{ color: "var(--color-text-3)" }}
            >
              {t("nav.mainSection")}
            </p>
            <nav className="space-y-0.5">
              {mainNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={t(item.key as any)}
                  isActive={pathname === item.href}
                />
              ))}
            </nav>
          </div>

          {/* Shop nav */}
          <div className="mb-4">
            <p
              className="text-[9px] font-mono tracking-widest uppercase px-2.5 mb-1.5"
              style={{ color: "var(--color-text-3)" }}
            >
              {t("nav.shopSection")}
            </p>
            <nav className="space-y-0.5">
              {shopNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={t(item.key as any)}
                  isActive={pathname === item.href}
                />
              ))}
            </nav>
          </div>

          {/* Vendor nav */}
          <div className="mb-4">
            <p
              className="text-[9px] font-mono tracking-widest uppercase px-2.5 mb-1.5"
              style={{ color: "var(--color-text-3)" }}
            >
              {t("nav.vendorSection")}
            </p>
            <nav className="space-y-0.5">
              {hasVendor ? (
                <>
                  <button
                    onClick={() => setVendorExpanded(!vendorExpanded)}
                    className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: pathname.startsWith("/vendor")
                        ? "var(--color-surface-2)"
                        : "transparent",
                      color: pathname.startsWith("/vendor")
                        ? "var(--color-primary)"
                        : "var(--color-text-2)",
                      borderLeft: pathname.startsWith("/vendor")
                        ? "2px solid var(--color-primary)"
                        : "2px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!pathname.startsWith("/vendor"))
                        e.currentTarget.style.background = "var(--color-surface-2)";
                    }}
                    onMouseLeave={(e) => {
                      if (!pathname.startsWith("/vendor"))
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Store className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span>{t("nav.myShop")}</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${vendorExpanded ? "rotate-180" : ""}`}
                      strokeWidth={2}
                    />
                  </button>

                  {vendorExpanded && (
                    <div
                      className="ml-4 pl-2.5 mt-0.5 space-y-0.5"
                      style={{ borderLeft: "2px solid var(--color-border)" }}
                    >
                      {vendorSubItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleNavClick}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors no-underline hover:no-underline"
                            style={{
                              color: isActive ? "var(--color-primary)" : "var(--color-text-2)",
                              background: isActive ? "var(--color-surface-2)" : "transparent",
                              fontWeight: isActive ? 600 : 400,
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive) e.currentTarget.style.background = "var(--color-surface-2)";
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <item.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
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
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors no-underline hover:no-underline"
                  style={{
                    background: "rgba(41,171,226,0.06)",
                    color: "var(--color-primary)",
                    border: "1px solid rgba(41,171,226,0.2)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(41,171,226,0.12)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(41,171,226,0.06)")
                  }
                >
                  <Sparkles className="h-4 w-4 shrink-0" style={{ color: "var(--color-accent)" }} strokeWidth={2} />
                  <span>{t("nav.becomeVendor")}</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Other nav */}
          <div className="mb-3">
            <p
              className="text-[9px] font-mono tracking-widest uppercase px-2.5 mb-1.5"
              style={{ color: "var(--color-text-3)" }}
            >
              {t("nav.otherSection")}
            </p>
            <nav className="space-y-0.5">
              {otherNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={t(item.key as any)}
                  isActive={pathname === item.href}
                />
              ))}

              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: "var(--color-text-2)", borderLeft: "2px solid transparent" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--color-surface-2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 shrink-0" strokeWidth={2} />
                ) : (
                  <Moon className="h-4 w-4 shrink-0" strokeWidth={2} />
                )}
                <span>{theme === "dark" ? t("theme.light") : t("theme.dark")}</span>
              </button>
            </nav>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="p-2.5 shrink-0"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              color: "var(--color-error)",
              background: "rgba(232,58,58,0.08)",
              border: "1px solid rgba(232,58,58,0.2)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(232,58,58,0.14)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(232,58,58,0.08)")
            }
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
            <span>{t("nav.logout")}</span>
          </button>

          <p
            className="text-[9px] text-center mt-1.5 font-mono"
            style={{ color: "var(--color-text-3)" }}
          >
            v1.0.0
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
