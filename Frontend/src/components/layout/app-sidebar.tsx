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
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useI18n } from "@/hooks/use-i18n";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuthStore } from "@/store";
import { useVendor } from "@/hooks/use-vendor";

const mainNavItems = [
  { key: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "nav.dashboard", href: "/profile", icon: User },
  { key: "nav.wallet", href: "/wallet", icon: Wallet },
  { key: "nav.referrals", href: "/referrals", icon: Users },
  { key: "nav.memberships", href: "/memberships", icon: Crown },
];

const marketplaceNavItem = {
  key: "nav.marketplace",
  href: "/marketplace",
  icon: Briefcase,
};

const shopNavItems = [
  { key: "nav.shop", href: "/reseller", icon: Store },
  { key: "nav.orders", href: "/orders", icon: ShoppingBag },
];

const vendorSubItems = [
  { key: "nav.dashboard", href: "/vendor", icon: BarChart3 },
  { key: "nav.orders", href: "/vendor/orders", icon: ShoppingCart },
  { key: "nav.marketplace", href: "/vendor/products", icon: Package },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const { hasVendor, isLoading: vendorLoading } = useVendor();

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

  return (
    <Sidebar
      style={{
        background: "var(--color-surface-1)",
        borderRight: "1px solid var(--color-border)",
      }}
    >
      {/* Header — Logo */}
      <SidebarHeader
        className="p-4"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold text-sm shadow-lg transition-transform group-hover:scale-105"
            style={{
              background: "linear-gradient(135deg, var(--color-primary-d), var(--color-primary))",
            }}
          >
            DL
          </div>
          <span
            className="font-bold text-lg tracking-tight"
            style={{ color: "var(--color-text-1)" }}
          >
            Dreamy Life
          </span>
        </Link>
      </SidebarHeader>

      {/* Profile Card */}
      <div className="p-3">
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: "linear-gradient(135deg, var(--color-primary-d), var(--color-primary) 50%, var(--color-accent))",
          }}
        >
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
          {/* Orb accents */}
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl" style={{ background: "rgba(255,255,255,0.15)" }} />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full blur-xl" style={{ background: "rgba(255,255,255,0.1)" }} />

          <div className="relative p-4 text-white">
            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <Avatar className="h-14 w-14" style={{ boxShadow: "0 0 0 3px rgba(255,255,255,0.25)" }}>
                  <AvatarImage src={user?.profile_picture || undefined} />
                  <AvatarFallback
                    className="text-lg font-bold"
                    style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                  >
                    {user?.user.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {user?.is_verified && (
                  <div
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white"
                    style={{ background: "var(--color-success)" }}
                  >
                    <BadgeCheck className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base truncate text-white">
                  {user?.user.username}
                </h3>
                <div className="mt-0.5">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background:
                        user?.member_status === "user"
                          ? "rgba(255,255,255,0.2)"
                          : "rgba(247,148,29,0.85)",
                    }}
                  >
                    <Crown className="h-3 w-3" />
                    {user?.member_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-2">
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <Phone className="h-4 w-4 opacity-70 shrink-0" />
                <span className="text-sm font-medium truncate">
                  {user?.user.phone_number || "No phone"}
                </span>
              </div>

              <button
                onClick={copyReferralCode}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2 transition-colors cursor-pointer group"
                style={{ background: "rgba(255,255,255,0.12)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
                }
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs opacity-70 shrink-0">Refer Code:</span>
                  <span className="font-mono font-bold text-sm truncate" style={{ color: "#fde68a" }}>
                    {user?.own_refercode}
                  </span>
                </div>
                {copied ? (
                  <CheckCircle className="h-4 w-4 shrink-0" style={{ color: "var(--color-success)" }} />
                ) : (
                  <Copy className="h-4 w-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nav content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel
            style={{ color: "var(--color-text-3)", fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
          >
            {t("nav.mainSection")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.key as any)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel
            style={{ color: "var(--color-text-3)", fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
          >
            {t("nav.marketplace")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={
                    pathname === marketplaceNavItem.href ||
                    pathname?.startsWith("/marketplace")
                  }
                >
                  <Link href={marketplaceNavItem.href}>
                    <marketplaceNavItem.icon className="h-4 w-4" />
                    <span>{t(marketplaceNavItem.key as any)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel
            style={{ color: "var(--color-text-3)", fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
          >
            {t("nav.shopSection")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {shopNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.key as any)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel
            style={{ color: "var(--color-text-3)", fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
          >
            {t("nav.vendorSection")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {vendorLoading ? (
                <SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              ) : hasVendor ? (
                <Collapsible
                  defaultOpen={pathname.startsWith("/vendor")}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={pathname.startsWith("/vendor")}>
                        <Store className="h-4 w-4" />
                        <span>{t("nav.myShop")}</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {vendorSubItems.map((item) => (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === item.href}
                            >
                              <Link href={item.href}>
                                <item.icon className="h-4 w-4" />
                                <span>{t(item.key as any)}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/vendor">
                      <Sparkles className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
                      <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                        {t("nav.becomeVendor")}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter
        className="p-4"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 px-2 rounded-xl transition-colors"
              style={{ color: "var(--color-text-1)" }}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profile_picture || undefined} />
                <AvatarFallback
                  className="font-bold"
                  style={{ background: "var(--color-surface-3)", color: "var(--color-primary)" }}
                >
                  {user?.user.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-sm">
                <span className="font-medium" style={{ color: "var(--color-text-1)" }}>
                  {user?.user.username}
                </span>
                <span
                  className="text-xs font-mono"
                  style={{ color: "var(--color-text-3)" }}
                >
                  {user?.member_status}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              Toggle Theme
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t("nav.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
