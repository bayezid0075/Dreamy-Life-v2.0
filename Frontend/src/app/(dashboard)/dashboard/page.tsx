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
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuthStore } from "@/store";
import { walletsApi, usersApi, ordersApi } from "@/lib/api";
import {
  MobileHeader,
  MobileNavGrid,
  MobileSideDrawer,
} from "@/components/dashboard";

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

  const stats = [
    {
      title: "Wallet Balance",
      value: wallet ? `৳${parseFloat(wallet.balance).toLocaleString()}` : "৳0",
      description: "Total earnings",
      icon: Wallet,
      loading: walletLoading,
      gradient: "from-emerald-500 to-teal-500",
      bgGradient:
        "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
      iconBg:
        "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Referrals",
      value: downlines?.downlines?.length || 0,
      description: "Network members",
      icon: Users,
      loading: downlinesLoading,
      gradient: "from-blue-500 to-indigo-500",
      bgGradient:
        "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
      iconBg:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Member Status",
      value: user?.member_status || "User",
      description: "Current tier",
      icon: Crown,
      loading: false,
      gradient: "from-amber-500 to-orange-500",
      bgGradient:
        "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
      iconBg:
        "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    },
    {
      title: "Total Orders",
      value: orders?.length || 0,
      description: "All time orders",
      icon: ShoppingBag,
      loading: ordersLoading,
      gradient: "from-pink-500 to-rose-500",
      bgGradient:
        "from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30",
      iconBg:
        "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
    },
  ];

  return (
    <>
      {/* Mobile Side Drawer */}
      <MobileSideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      {/* Mobile View */}
      <div className="md:hidden">
        <MobileHeader onMenuClick={() => setDrawerOpen(true)} />

        {/* Mobile Navigation Grid - overlaps the gradient */}
        <MobileNavGrid />

        {/* Mobile Quick Stats */}
        <div className="px-3 sm:px-4 mt-4 sm:mt-6">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">
            Quick Stats
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {stats.slice(0, 4).map((stat) => (
              <div
                key={stat.title}
                className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg shadow-violet-500/5"
              >
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <div
                    className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${stat.iconBg}`}
                  >
                    <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </div>
                {stat.loading ? (
                  <Skeleton className="h-5 sm:h-6 w-14 sm:w-16 mb-1" />
                ) : (
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                    {stat.value}
                  </p>
                )}
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                  {stat.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Recent Transactions */}
        <div className="px-3 sm:px-4 mt-4 sm:mt-6 pb-4">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">
            Recent Transactions
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg shadow-violet-500/5">
            {walletLoading ? (
              <div className="space-y-2.5 sm:space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 sm:gap-3">
                    <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl" />
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-3.5 sm:h-4 w-20 sm:w-24 mb-1" />
                      <Skeleton className="h-2.5 sm:h-3 w-14 sm:w-16" />
                    </div>
                    <Skeleton className="h-3.5 sm:h-4 w-14 sm:w-16" />
                  </div>
                ))}
              </div>
            ) : wallet?.transactions && wallet.transactions.length > 0 ? (
              <div className="space-y-2.5 sm:space-y-3">
                {wallet.transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div
                        className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${
                          transaction.transaction_type === "credit"
                            ? "bg-emerald-100 dark:bg-emerald-900/30"
                            : "bg-rose-100 dark:bg-rose-900/30"
                        }`}
                      >
                        <TrendingUp
                          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                            transaction.transaction_type === "credit"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400 rotate-180"
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {transaction.description || "Transaction"}
                        </p>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                          {new Date(
                            transaction.created_at,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-semibold text-xs sm:text-sm shrink-0 ${
                        transaction.transaction_type === "credit"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {transaction.transaction_type === "credit" ? "+" : "-"}৳
                      {parseFloat(transaction.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center py-3 sm:py-4">
                No transactions yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Desktop View - same elements as mobile: welcome, nav grid, quick stats, recent transactions + sidebar */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
          {/* Page header - same as mobile welcome */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Welcome back, {user?.user.username}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Here&apos;s your account overview
              </p>
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Quick access grid - same links as mobile nav */}
          <section aria-label="Quick access">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Quick access</h2>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <Link
                  href="/wallet"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-sm">Wallet</span>
                </Link>
                <Link
                  href="/reseller"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
                    <Store className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-sm">Shop</span>
                </Link>
                <Link
                  href="/referrals"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-sm">Referrals</span>
                </Link>
                <Link
                  href="/orders"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-sm">Orders</span>
                </Link>
                <Link
                  href="/memberships"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                    <Crown className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-sm">Memberships</span>
                </Link>
                <Link
                  href="/marketplace"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-sm">Marketplace</span>
                </Link>
                <Link
                  href="/vendor"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-sm">Vendor</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Key metrics - same as mobile Quick Stats */}
          <section aria-label="Key metrics">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Quick stats</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.title}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.iconBg}`}
                    >
                      <stat.icon className="h-5 w-5" />
                    </div>
                    {stat.loading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <span className="text-xl font-semibold tabular-nums text-foreground truncate">
                        {stat.value}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground mt-3">
                    {stat.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Referral + Quick actions */}
          <section
            className="space-y-4"
            aria-label="Referral and quick actions"
          >
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 dark:from-violet-500/5 dark:via-fuchsia-500/5 dark:to-pink-500/5 border-b border-border lg:border-b-0 lg:border-r border-border">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Your referral code
                  </p>
                  <p className="text-2xl font-bold font-mono tracking-wider text-foreground mt-1">
                    {user?.own_refercode}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Share to earn commissions
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="default"
                  onClick={copyReferralCode}
                  className="gap-2 shrink-0 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/50"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy code"}
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <Link
                  href="/reseller"
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground">
                      Reseller Shop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Browse & earn
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                </Link>
                <Link
                  href="/wallet"
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground">
                      Wallet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Balance & history
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                </Link>
                <Link
                  href="/orders"
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground">
                      My Orders
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Track orders
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                </Link>
              </div>
            </div>
          </section>

          {/* Recent transactions + sidebar - same as mobile */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main: Recent Transactions */}
            <section
              className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm"
              aria-label="Recent transactions"
            >
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Recent transactions
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
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
                    {wallet.transactions.slice(0, 5).map((transaction) => (
                      <li
                        key={transaction.id}
                        className="flex items-center justify-between gap-4 py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                              transaction.transaction_type === "credit"
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            <TrendingUp
                              className={`h-5 w-5 ${
                                transaction.transaction_type === "debit"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">
                              {transaction.description || "Transaction"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                transaction.created_at,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-medium tabular-nums shrink-0 ${
                            transaction.transaction_type === "credit"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {transaction.transaction_type === "credit"
                            ? "+"
                            : "-"}
                          ৳{parseFloat(transaction.amount).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-sm text-muted-foreground">
                      No transactions yet
                    </p>
                    <Link href="/wallet">
                      <Button variant="outline" size="sm" className="mt-2">
                        Go to Wallet
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* Sidebar: Membership + Wallet summary */}
            <aside className="space-y-6" aria-label="Account summary">
              <Card className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    Membership
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Current tier
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={
                        user?.member_status === "user"
                          ? "bg-muted text-muted-foreground"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border-0"
                      }
                    >
                      {user?.member_status}
                    </Badge>
                    {user?.is_verified && (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/50 text-emerald-600 dark:text-emerald-400 text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  {user?.active_membership ? (
                    <p className="text-xs text-muted-foreground">
                      Active since{" "}
                      {new Date(
                        user.active_membership.purchased_at,
                      ).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Upgrade for more benefits
                    </p>
                  )}
                  <Link href="/memberships">
                    <Button variant="outline" size="sm" className="w-full">
                      View plans
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    Wallet summary
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Financial overview
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {walletLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-6 w-1/2 mt-2" />
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Income</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +৳{parseFloat(wallet?.income || "0").toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Expense</span>
                        <span className="font-medium text-rose-600 dark:text-rose-400 tabular-nums">
                          -৳
                          {parseFloat(wallet?.expense || "0").toLocaleString()}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-border flex justify-between items-baseline">
                        <span className="text-xs font-medium text-foreground">
                          Balance
                        </span>
                        <span className="text-lg font-semibold tabular-nums text-foreground">
                          ৳{parseFloat(wallet?.balance || "0").toLocaleString()}
                        </span>
                      </div>
                      <Link href="/wallet">
                        <Button variant="outline" size="sm" className="w-full">
                          Open wallet
                        </Button>
                      </Link>
                    </>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
