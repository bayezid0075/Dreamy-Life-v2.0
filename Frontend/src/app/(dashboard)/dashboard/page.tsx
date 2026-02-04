"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  Users,
  Crown,
  ShoppingBag,
  TrendingUp,
  Copy,
  CheckCircle,
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
                            transaction.created_at
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

      {/* Desktop View */}
      <div className="hidden md:block space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 bg-clip-text text-transparent">
            Welcome back, {user?.user.username}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your account
          </p>
        </div>

        {/* Referral Code Card */}
        <Card className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 border-0 shadow-xl shadow-fuchsia-500/20 overflow-hidden relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          <CardContent className="flex items-center justify-between p-6 relative z-10">
            <div className="text-white">
              <p className="text-sm font-medium text-white/80">
                Your Referral Code
              </p>
              <p className="text-3xl font-bold font-mono tracking-wider">
                {user?.own_refercode}
              </p>
              <p className="text-sm text-white/70 mt-1">
                Share this code to earn commissions
              </p>
            </div>
            <Button
              variant="secondary"
              size="lg"
              onClick={copyReferralCode}
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy Code"}
            </Button>
          </CardContent>
        </Card>

        {/* Stats Grid - Modern Glass Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-90`}
              ></div>
              {/* Grid Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30"></div>
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/80">
                  {stat.title}
                </CardTitle>
                <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                {stat.loading ? (
                  <Skeleton className="h-8 w-24 bg-white/20" />
                ) : (
                  <div className="text-3xl font-bold text-white">
                    {stat.value}
                  </div>
                )}
                <p className="text-xs text-white/70 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Membership Status */}
          <Card className="relative overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-xl hover:shadow-2xl transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500"></div>
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                Membership Status
              </CardTitle>
              <CardDescription>Your current membership tier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge
                    className={`text-lg py-1 px-3 ${
                      user?.member_status === "user"
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        : "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
                    }`}
                  >
                    {user?.member_status}
                  </Badge>
                  {user?.is_verified && (
                    <Badge
                      variant="outline"
                      className="ml-2 border-emerald-500 text-emerald-600"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
              {user?.active_membership ? (
                <div className="text-sm text-muted-foreground">
                  <p>
                    Active since:{" "}
                    {new Date(
                      user.active_membership.purchased_at
                    ).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Upgrade your membership to unlock more benefits
                </p>
              )}
            </CardContent>
          </Card>

          {/* Wallet Summary */}
          <Card className="relative overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-xl hover:shadow-2xl transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Wallet Summary
              </CardTitle>
              <CardDescription>Your financial overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {walletLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Income
                    </span>
                    <span className="font-medium text-green-600">
                      +৳{parseFloat(wallet?.income || "0").toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Expense
                    </span>
                    <span className="font-medium text-red-600">
                      -৳{parseFloat(wallet?.expense || "0").toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t flex items-center justify-between">
                    <span className="font-medium">Current Balance</span>
                    <span className="text-xl font-bold">
                      ৳{parseFloat(wallet?.balance || "0").toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="relative overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-xl hover:shadow-2xl transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"></div>
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Recent Transactions
            </CardTitle>
            <CardDescription>Your latest wallet activity</CardDescription>
          </CardHeader>
          <CardContent>
            {walletLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : wallet?.transactions && wallet.transactions.length > 0 ? (
              <div className="space-y-4">
                {wallet.transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg ${
                          transaction.transaction_type === "credit"
                            ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30"
                            : "bg-gradient-to-br from-rose-400 to-red-500 shadow-red-500/30"
                        }`}
                      >
                        <TrendingUp
                          className={`h-5 w-5 text-white ${
                            transaction.transaction_type === "debit"
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {transaction.description || "Transaction"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(
                            transaction.created_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-medium ${
                        transaction.transaction_type === "credit"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.transaction_type === "credit" ? "+" : "-"}৳
                      {parseFloat(transaction.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No transactions yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
