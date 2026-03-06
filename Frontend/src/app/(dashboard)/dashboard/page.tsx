"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Wallet,
  Users,
  Crown,
  ShoppingBag,
  TrendingUp,
  Copy,
  CheckCircle,
  Store,
  ArrowRight,
  Sparkles,
  Briefcase,
  Smartphone,
  Car,
  History,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuthStore } from "@/store";
import { walletsApi, usersApi, ordersApi } from "@/lib/api";
import {
  MobileHeader,
  MobileNavGrid,
  MobileSideDrawer,
  DashboardBannerSlider,
} from "@/components/dashboard";

/* ── Design-system stat config ── */
const statConfig = [
  {
    key: "wallet",
    title: "Wallet Balance",
    description: "Total earnings",
    icon: Wallet,
    color: "var(--color-primary)",
    colorFaint: "rgba(41,171,226,0.12)",
  },
  {
    key: "referrals",
    title: "Total Referrals",
    description: "Network members",
    icon: Users,
    color: "var(--color-success)",
    colorFaint: "rgba(46,191,110,0.12)",
  },
  {
    key: "status",
    title: "Member Status",
    description: "Current tier",
    icon: Crown,
    color: "var(--color-warning)",
    colorFaint: "rgba(247,148,29,0.12)",
  },
  {
    key: "orders",
    title: "Total Orders",
    description: "All time orders",
    icon: ShoppingBag,
    color: "var(--color-accent)",
    colorFaint: "rgba(232,51,110,0.12)",
  },
];

/* ── Quick-access nav items ── */
const quickItems = [
  { href: "/wallet", icon: Wallet, label: "Wallet", color: "var(--color-primary)" },
  { href: "/reseller", icon: Store, label: "Shop", color: "var(--color-success)" },
  { href: "/referrals", icon: Users, label: "Referrals", color: "var(--color-info)" },
  { href: "/orders", icon: ShoppingBag, label: "Orders", color: "var(--color-accent)" },
  { href: "/memberships", icon: Crown, label: "Memberships", color: "var(--color-warning)" },
  { href: "/marketplace", icon: Briefcase, label: "Marketplace", color: "var(--color-primary)" },
  { href: "/recharge", icon: Smartphone, label: "Recharge", color: "var(--color-success)" },
  { href: "/recharge/drive", icon: Car, label: "Drive Offer", color: "var(--color-warning)" },
  { href: "/recharge/history", icon: History, label: "Rch. History", color: "var(--color-info)" },
  { href: "/vendor", icon: Sparkles, label: "Vendor", color: "var(--color-accent)" },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: walletsApi.getWallet,
  });

  const { data: downlines, isLoading: downlinesLoading } = useQuery({
    queryKey: ["downlines"],
    queryFn: usersApi.getDownlines,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: ordersApi.getOrders,
  });

  const copyReferralCode = async () => {
    if (user?.own_refercode) {
      await navigator.clipboard.writeText(user.own_refercode);
      setCopied(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statValues: Record<string, { value: string | number; loading: boolean }> = {
    wallet: { value: wallet ? `৳${parseFloat(wallet.balance).toLocaleString()}` : "৳0", loading: walletLoading },
    referrals: { value: downlines?.downlines?.length || 0, loading: downlinesLoading },
    status: { value: user?.member_status || "User", loading: false },
    orders: { value: orders?.length || 0, loading: ordersLoading },
  };

  return (
    <>
      {/* Mobile Side Drawer */}
      <MobileSideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      {/* ── MOBILE ── */}
      <div className="md:hidden">
        <MobileHeader onMenuClick={() => setDrawerOpen(true)} />
        <MobileNavGrid />
        <DashboardBannerSlider />
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--color-text-1)" }}>
                Welcome back,{" "}
                <span style={{ color: "var(--color-primary)" }}>{user?.user.username}</span>
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-text-2)" }}>
                Here&apos;s your account overview
              </p>
            </div>
            <p className="text-xs tabular-nums font-mono" style={{ color: "var(--color-text-3)" }}>
              {new Date().toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Quick access grid */}
          <section aria-label="Quick access">
            <p
              className="text-xs font-mono tracking-widest uppercase mb-3"
              style={{ color: "var(--color-text-3)" }}
            >
              Quick Access
            </p>
            <div
              className="rounded-2xl p-4"
              style={{
                background: "var(--color-surface-1)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {quickItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-xl transition-colors group"
                    style={{ border: "1px solid var(--color-border)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--color-surface-2)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "")
                    }
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${item.color}18` }}
                    >
                      <item.icon className="h-4 w-4" style={{ color: item.color }} />
                    </div>
                    <span className="font-medium text-sm truncate" style={{ color: "var(--color-text-1)" }}>
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Key metrics */}
          <section aria-label="Key metrics">
            <p
              className="text-xs font-mono tracking-widest uppercase mb-3"
              style={{ color: "var(--color-text-3)" }}
            >
              Quick Stats
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statConfig.map((s) => {
                const { value, loading } = statValues[s.key];
                return (
                  <div
                    key={s.key}
                    className="rounded-2xl p-5 transition-shadow"
                    style={{
                      background: "var(--color-surface-1)",
                      border: "1px solid var(--color-border)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: s.colorFaint }}
                      >
                        <s.icon className="h-5 w-5" style={{ color: s.color }} />
                      </div>
                      {loading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <span className="text-xl font-semibold tabular-nums truncate" style={{ color: "var(--color-text-1)" }}>
                          {value}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-3" style={{ color: "var(--color-text-1)" }}>
                      {s.title}
                    </p>
                    <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--color-text-3)" }}>
                      {s.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Referral + quick actions */}
          <section aria-label="Referral and quick actions">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-surface-1)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {/* Referral code banner */}
              <div
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5"
                style={{
                  background: "linear-gradient(135deg, rgba(41,171,226,0.08), rgba(232,51,110,0.06))",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div className="min-w-0">
                  <p
                    className="text-xs font-mono tracking-widest uppercase mb-1"
                    style={{ color: "var(--color-text-3)" }}
                  >
                    Your Referral Code
                  </p>
                  <p
                    className="text-2xl font-bold font-mono tracking-wider"
                    style={{ color: "var(--color-text-1)" }}
                  >
                    {user?.own_refercode}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-2)" }}>
                    Share to earn commissions
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="default"
                  onClick={copyReferralCode}
                  className="gap-2 shrink-0 rounded-xl font-medium"
                  style={{
                    borderColor: "var(--color-primary)",
                    color: "var(--color-primary)",
                    background: "rgba(41,171,226,0.06)",
                  }}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4" style={{ color: "var(--color-success)" }} />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy Code"}
                </Button>
              </div>

              {/* Quick nav links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x"
                style={{ "--tw-divide-opacity": 1, borderColor: "var(--color-border)" } as React.CSSProperties}
              >
                {[
                  { href: "/reseller", icon: Store, label: "Reseller Shop", sub: "Browse & earn", color: "var(--color-success)" },
                  { href: "/wallet", icon: Wallet, label: "Wallet", sub: "Balance & history", color: "var(--color-primary)" },
                  { href: "/recharge", icon: Smartphone, label: "Mobile Recharge", sub: "Recharge from wallet", color: "var(--color-info)" },
                  { href: "/recharge/drive", icon: Car, label: "Drive Offer", sub: "Pack offers by operator", color: "var(--color-warning)" },
                  { href: "/recharge/history", icon: History, label: "Recharge History", sub: "View all recharges", color: "var(--color-success)" },
                  { href: "/orders", icon: ShoppingBag, label: "My Orders", sub: "Track orders", color: "var(--color-accent)" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 p-4 transition-colors group"
                    style={{ borderColor: "var(--color-border)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--color-surface-2)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "")
                    }
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `${link.color}18` }}
                    >
                      <link.icon className="h-5 w-5" style={{ color: link.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm" style={{ color: "var(--color-text-1)" }}>
                        {link.label}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-3)" }}>
                        {link.sub}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto shrink-0" style={{ color: "var(--color-text-3)" }} />
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Recent transactions + sidebar */}
          <div className="grid gap-6 lg:grid-cols-3">

            {/* Transactions */}
            <section
              className="lg:col-span-2 rounded-2xl overflow-hidden"
              style={{
                background: "var(--color-surface-1)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-sm)",
              }}
              aria-label="Recent transactions"
            >
              <div
                className="px-5 py-4"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
                  Recent Transactions
                </h2>
                <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--color-text-3)" }}>
                  Latest wallet activity
                </p>
              </div>
              <div className="p-5">
                {walletLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : wallet?.transactions && wallet.transactions.length > 0 ? (
                  <ul className="space-y-1" role="list">
                    {wallet.transactions.slice(0, 5).map((tx) => (
                      <li
                        key={tx.id}
                        className="flex items-center justify-between gap-4 py-3 px-3 rounded-xl transition-colors"
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "var(--color-surface-2)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "")
                        }
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                            style={{
                              background:
                                tx.transaction_type === "credit"
                                  ? "rgba(46,191,110,0.12)"
                                  : "rgba(232,51,110,0.12)",
                            }}
                          >
                            <TrendingUp
                              className={`h-5 w-5 ${tx.transaction_type === "debit" ? "rotate-180" : ""}`}
                              style={{
                                color:
                                  tx.transaction_type === "credit"
                                    ? "var(--color-success)"
                                    : "var(--color-error)",
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate" style={{ color: "var(--color-text-1)" }}>
                              {tx.description || "Transaction"}
                            </p>
                            <p className="text-xs font-mono" style={{ color: "var(--color-text-3)" }}>
                              {new Date(tx.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className="text-sm font-medium tabular-nums shrink-0"
                          style={{
                            color:
                              tx.transaction_type === "credit"
                                ? "var(--color-success)"
                                : "var(--color-error)",
                          }}
                        >
                          {tx.transaction_type === "credit" ? "+" : "-"}৳
                          {parseFloat(tx.amount).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-sm" style={{ color: "var(--color-text-3)" }}>
                      No transactions yet
                    </p>
                    <Link href="/wallet">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 rounded-xl"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
                      >
                        Go to Wallet
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* Sidebar cards */}
            <aside className="space-y-4" aria-label="Account summary">

              {/* Membership card */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "var(--color-surface-1)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {/* Accent top bar */}
                <div
                  className="h-1"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
                  }}
                />
                <div className="p-5">
                  <p
                    className="text-xs font-mono tracking-widest uppercase mb-1"
                    style={{ color: "var(--color-text-3)" }}
                  >
                    Membership
                  </p>
                  <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-1)" }}>
                    Current Tier
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono tracking-wide"
                      style={{
                        background:
                          user?.member_status === "user"
                            ? "var(--color-surface-3)"
                            : "rgba(247,148,29,0.15)",
                        color:
                          user?.member_status === "user"
                            ? "var(--color-text-2)"
                            : "var(--color-warning)",
                        border: `1px solid ${
                          user?.member_status === "user"
                            ? "var(--color-border)"
                            : "rgba(247,148,29,0.3)"
                        }`,
                      }}
                    >
                      <Crown className="h-3 w-3" />
                      {user?.member_status}
                    </span>
                    {user?.is_verified && (
                      <span
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold font-mono"
                        style={{
                          background: "rgba(46,191,110,0.12)",
                          color: "var(--color-success)",
                          border: "1px solid rgba(46,191,110,0.3)",
                        }}
                      >
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  {user?.active_membership ? (
                    <p className="text-xs mb-3 font-mono" style={{ color: "var(--color-text-3)" }}>
                      Active since{" "}
                      {new Date(user.active_membership.purchased_at).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-xs mb-3" style={{ color: "var(--color-text-3)" }}>
                      Upgrade for more benefits
                    </p>
                  )}
                  <Link href="/memberships">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl font-medium"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
                    >
                      View Plans
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Wallet summary card */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "var(--color-surface-1)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  className="h-1"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--color-success), var(--color-primary))",
                  }}
                />
                <div className="p-5">
                  <p
                    className="text-xs font-mono tracking-widest uppercase mb-1"
                    style={{ color: "var(--color-text-3)" }}
                  >
                    Wallet
                  </p>
                  <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-1)" }}>
                    Financial Overview
                  </p>
                  {walletLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-6 w-1/2 mt-2" />
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs mb-2">
                        <span style={{ color: "var(--color-text-2)" }}>Income</span>
                        <span className="font-medium tabular-nums" style={{ color: "var(--color-success)" }}>
                          +৳{parseFloat(wallet?.income || "0").toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs mb-3">
                        <span style={{ color: "var(--color-text-2)" }}>Expense</span>
                        <span className="font-medium tabular-nums" style={{ color: "var(--color-error)" }}>
                          -৳{parseFloat(wallet?.expense || "0").toLocaleString()}
                        </span>
                      </div>
                      <div
                        className="flex justify-between items-baseline pt-3 mb-4"
                        style={{ borderTop: "1px solid var(--color-border)" }}
                      >
                        <span className="text-xs font-medium" style={{ color: "var(--color-text-2)" }}>
                          Balance
                        </span>
                        <span className="text-lg font-semibold tabular-nums" style={{ color: "var(--color-text-1)" }}>
                          ৳{parseFloat(wallet?.balance || "0").toLocaleString()}
                        </span>
                      </div>
                      <Link href="/wallet">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-xl font-medium"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
                        >
                          Open Wallet
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
