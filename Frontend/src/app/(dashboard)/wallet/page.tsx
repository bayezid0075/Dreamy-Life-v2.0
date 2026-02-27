"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Star,
  LayoutGrid,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  Send,
  Phone,
  Percent,
  History,
} from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { walletsApi, withdrawalsApi } from "@/lib/api";
import type { Transaction, WithdrawalRequest } from "@/types";

/** Parse amount safely; returns 0 for invalid/empty values. */
function parseAmount(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

function TransactionList({
  transactions,
  isLoading,
}: {
  transactions?: Transaction[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2 sm:space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 sm:gap-4 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-violet-50/50 dark:bg-violet-900/10"
          >
            <Skeleton className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-3 sm:h-4 w-3/4 sm:w-1/2 mb-1.5 sm:mb-2" />
              <Skeleton className="h-2.5 sm:h-3 w-1/2 sm:w-1/4" />
            </div>
            <Skeleton className="h-5 sm:h-6 w-16 sm:w-24 flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-10 sm:py-16">
        <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 flex items-center justify-center">
          <Wallet className="h-7 w-7 sm:h-10 sm:w-10 text-violet-400" />
        </div>
        <p className="text-sm sm:text-base text-muted-foreground font-medium">
          No transactions found
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
          Your transactions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="group flex items-center gap-2.5 sm:gap-4 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800/50 border border-violet-100 dark:border-violet-900/30 hover:shadow-md sm:hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-0.5"
        >
          {/* Icon */}
          <div
            className={`flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg transition-transform group-hover:scale-110 flex-shrink-0 ${
              transaction.transaction_type === "credit"
                ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30"
                : "bg-gradient-to-br from-rose-400 to-red-500 shadow-red-500/30"
            }`}
          >
            {transaction.transaction_type === "credit" ? (
              <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            ) : (
              <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
              <span className="font-semibold text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                {transaction.description || "Transaction"}
              </span>
              <Badge
                className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 ${
                  transaction.transaction_type === "credit"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                }`}
              >
                {transaction.transaction_type}
              </Badge>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {new Date(transaction.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Amount */}
          <div
            className={`text-right font-bold text-sm sm:text-lg flex-shrink-0 ${
              transaction.transaction_type === "credit"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {transaction.transaction_type === "credit" ? "+" : "-"}৳
            {parseAmount(transaction.amount).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WalletPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawMethod, setWithdrawMethod] = useState<"bkash">("bkash");
  const [withdrawPhone, setWithdrawPhone] = useState<string>("");

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: walletsApi.getWallet,
  });

  const { data: funds, isLoading: fundsLoading } = useQuery({
    queryKey: ["funds"],
    queryFn: walletsApi.getFunds,
  });

  const { data: points, isLoading: pointsLoading } = useQuery({
    queryKey: ["points"],
    queryFn: walletsApi.getPoints,
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["withdrawals-history"],
    queryFn: withdrawalsApi.getMyWithdrawals,
  });

  const amountNumber = useMemo(() => {
    const n = Number(withdrawAmount);
    return Number.isFinite(n) ? n : 0;
  }, [withdrawAmount]);

  const fee = useMemo(() => amountNumber * 0.05, [amountNumber]);
  const totalDebit = useMemo(() => amountNumber + fee, [amountNumber, fee]);

  const createWithdrawal = useMutation({
    mutationFn: async () => {
      if (!withdrawPhone.trim()) {
        throw new Error("Phone number is required");
      }
      if (amountNumber < 300) {
        throw new Error("Minimum withdrawal amount is ৳300");
      }
      return withdrawalsApi.createWithdrawal({
        amount: amountNumber,
        method: withdrawMethod,
        receiver_phone: withdrawPhone.trim(),
      });
    },
    onSuccess: () => {
      toast.success("Withdrawal request submitted");
      setWithdrawOpen(false);
      setWithdrawAmount("");
      // refresh wallet + history
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals-history"] });
    },
    onError: (err: unknown) => {
      const e = err as {
        message?: string;
        response?: { data?: { detail?: string } };
      };
      toast.error(
        e.response?.data?.detail || e.message || "Failed to request withdrawal",
      );
    },
  });

  // Combine all transactions for "All" tab
  const allTransactions = [
    ...(wallet?.transactions || []),
    ...(funds?.transactions || []),
    ...(points?.transactions || []),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const accounts = [
    {
      id: "wallet",
      title: "Wallet",
      description:
        parseAmount(wallet?.reserved_balance) > 0
          ? `Commission & referral · ৳${parseAmount(wallet?.reserved_balance).toLocaleString()} reserved`
          : "Commission & referral earnings",
      icon: Wallet,
      balance: wallet?.balance || "0",
      income: wallet?.income || "0",
      expense: wallet?.expense || "0",
      transactions: wallet?.transactions || [],
      loading: walletLoading,
      gradient: "from-violet-500 via-fuchsia-500 to-pink-500",
      shadowColor: "shadow-fuchsia-500/30",
      iconBg: "from-violet-400 to-fuchsia-500",
    },
    {
      id: "funds",
      title: "Funds",
      description: "Funds account balance",
      icon: Coins,
      balance: funds?.balance || "0",
      income: funds?.income || "0",
      expense: funds?.expense || "0",
      transactions: funds?.transactions || [],
      loading: fundsLoading,
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      shadowColor: "shadow-teal-500/30",
      iconBg: "from-emerald-400 to-teal-500",
    },
    {
      id: "points",
      title: "Points",
      description: "Reward points balance",
      icon: Star,
      balance: points?.balance || "0",
      income: points?.income || "0",
      expense: points?.expense || "0",
      transactions: points?.transactions || [],
      loading: pointsLoading,
      gradient: "from-amber-500 via-orange-500 to-red-500",
      shadowColor: "shadow-orange-500/30",
      iconBg: "from-amber-400 to-orange-500",
    },
  ];

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + parseAmount(acc.balance),
    0,
  );

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 md:px-0 md:py-0 space-y-3 sm:space-y-4 md:space-y-6 pb-4 md:pb-0">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-800/50 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all active:scale-95"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 bg-clip-text text-transparent">
            Wallet
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-0.5">
            Manage your financial accounts
          </p>
        </div>
      </div>

      {/* Total Balance Card */}
      <Card className="relative overflow-hidden border-0 shadow-xl md:shadow-2xl">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-cyan-500/20 via-transparent to-amber-500/20"></div>
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:16px_16px] md:bg-[size:24px_24px]"></div>
        {/* Decorative Orbs */}
        <div className="absolute -top-8 -right-8 w-24 h-24 md:-top-12 md:-right-12 md:w-48 md:h-48 bg-yellow-400/30 rounded-full blur-2xl md:blur-3xl"></div>
        <div className="absolute -bottom-8 -left-8 w-24 h-24 md:-bottom-12 md:-left-12 md:w-48 md:h-48 bg-cyan-400/30 rounded-full blur-2xl md:blur-3xl"></div>

        <CardContent className="relative p-4 sm:p-6 md:p-8 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="text-center md:text-left">
              <p className="text-xs sm:text-sm font-medium text-white/70 mb-1 md:mb-2">
                Total Balance
              </p>
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-1 md:mb-2">
                ৳{totalBalance.toLocaleString()}
              </div>
              <p className="text-xs sm:text-sm text-white/60">
                Across all accounts
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:flex md:gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 border border-white/20">
                <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-emerald-300" />
                  <span className="text-[10px] sm:text-xs text-white/70">
                    Income
                  </span>
                </div>
                <div className="text-sm sm:text-base md:text-xl font-bold text-emerald-300">
                  +৳
                  {accounts
                    .reduce((sum, acc) => sum + parseAmount(acc.income), 0)
                    .toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 border border-white/20">
                <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                  <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-rose-300" />
                  <span className="text-[10px] sm:text-xs text-white/70">
                    Expense
                  </span>
                </div>
                <div className="text-sm sm:text-base md:text-xl font-bold text-rose-300">
                  -৳
                  {accounts
                    .reduce((sum, acc) => sum + parseAmount(acc.expense), 0)
                    .toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Balance Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-5">
        {accounts.map((account) => (
          <Card
            key={account.id}
            className="group relative overflow-hidden border-0 shadow-lg md:shadow-xl hover:shadow-xl md:hover:shadow-2xl transition-all duration-300 md:duration-500 hover:-translate-y-1 md:hover:-translate-y-2 px-4 py-5 sm:px-5 sm:py-5 md:px-6 md:py-6"
          >
            {/* Gradient Background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${account.gradient} opacity-90`}
            ></div>
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:16px_16px] md:bg-[size:20px_20px] opacity-30"></div>
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 p-0 pb-3 sm:pb-4 md:pb-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-white/80">
                {account.title}
              </CardTitle>
              <div className="p-1.5 sm:p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform">
                <account.icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative p-0 pt-0 space-y-2 sm:space-y-3">
              {account.loading ? (
                <Skeleton className="h-6 w-24 sm:h-8 sm:w-32 bg-white/20" />
              ) : (
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  ৳
                  {parseAmount(account.balance).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )}
              <p className="text-[10px] sm:text-xs text-white/60">
                {account.description}
              </p>
              {!account.loading && (
                <div className="flex gap-3 sm:gap-4 pt-1 text-xs sm:text-sm">
                  <span className="flex items-center gap-1 text-emerald-200">
                    <ArrowDownRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />৳
                    {parseAmount(account.income).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="flex items-center gap-1 text-rose-200">
                    <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />৳
                    {parseAmount(account.expense).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
              <div className="relative mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2">
                <Link
                  href={`/wallet/history/${account.id}`}
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-medium bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  History
                </Link>
                {account.id === "funds" && (
                  <Link
                    href="/wallet/funds/add"
                    className="inline-flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-medium bg-white/25 hover:bg-white/40 text-white backdrop-blur-sm border border-white/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Add Funds
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Withdraw (Wallet Balance) */}
      <Card className="relative overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-md sm:shadow-lg md:shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
        <CardHeader className="px-3 py-3 sm:p-4 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm sm:text-base md:text-lg bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Withdraw from Wallet
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-1">
                Minimum ৳300 + 5% charge. Status: pending → accepted/rejected →
                finished.
              </CardDescription>
            </div>
            <Button
              onClick={() => setWithdrawOpen(true)}
              className="h-9 sm:h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20"
            >
              <Send className="h-4 w-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
              <p className="text-xs text-muted-foreground">
                Available wallet balance
              </p>
              <p className="text-lg font-bold mt-1">
                ৳
                {Math.max(
                  0,
                  wallet?.available_balance != null
                    ? parseAmount(wallet.available_balance)
                    : parseAmount(wallet?.balance) -
                        parseAmount(wallet?.reserved_balance),
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Percent className="h-3.5 w-3.5" /> Charge
              </p>
              <p className="text-lg font-bold mt-1">5%</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
              <p className="text-xs text-muted-foreground">
                Minimum withdrawal
              </p>
              <p className="text-lg font-bold mt-1">৳300</p>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Withdrawal history
            </h3>
            {withdrawalsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-3"
                  >
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                ))}
              </div>
            ) : withdrawals && withdrawals.length > 0 ? (
              <div className="space-y-2">
                {withdrawals.slice(0, 10).map((w: WithdrawalRequest) => (
                  <div
                    key={w.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        ৳
                        {parseAmount(w.amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        withdraw
                        <span className="text-xs text-muted-foreground font-normal">
                          {" "}
                          (+৳
                          {parseAmount(w.fee).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          fee)
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {w.receiver_phone}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="uppercase">{w.method}</span>
                        <span className="text-slate-400">•</span>
                        <span>{new Date(w.created_at).toLocaleString()}</span>
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-lg ${
                        w.status === "pending"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : w.status === "accepted"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : w.status === "rejected"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-sm text-muted-foreground">
                No withdrawal requests yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request withdrawal</DialogTitle>
            <DialogDescription>
              Minimum ৳300. A 5% charge will be added and deducted from your
              wallet immediately. Status will be pending until approved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (৳)</label>
              <Input
                type="number"
                inputMode="decimal"
                min={300}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="300"
              />
              <div className="text-xs text-muted-foreground">
                Fee (5%): <span className="font-medium">৳{fee.toFixed(2)}</span>{" "}
                • Total debit:{" "}
                <span className="font-medium">৳{totalDebit.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment method</label>
                <Select
                  value={withdrawMethod}
                  onValueChange={(v) => setWithdrawMethod(v as "bkash")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bkash">Bkash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Receive phone number
                </label>
                <Input
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createWithdrawal.mutate()}
              disabled={createWithdrawal.isPending}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              {createWithdrawal.isPending ? "Submitting..." : "Withdraw"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Tabs */}
      <Card className="relative overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-md sm:shadow-lg md:shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500"></div>
        <CardHeader className="px-3 py-2.5 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Transactions
          </CardTitle>
          <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-0.5">
            View your transaction history
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6">
          <Tabs defaultValue="all">
            <TabsList className="mb-3 sm:mb-4 md:mb-6 bg-violet-100/50 dark:bg-violet-900/20 p-0.5 sm:p-1 rounded-lg sm:rounded-xl md:rounded-2xl w-full grid grid-cols-4 h-auto gap-0.5 sm:gap-1">
              <TabsTrigger
                value="all"
                className="rounded-md sm:rounded-lg md:rounded-xl px-1.5 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[10px] sm:text-xs md:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5"
              >
                <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>All</span>
              </TabsTrigger>
              <TabsTrigger
                value="wallet"
                className="rounded-md sm:rounded-lg md:rounded-xl px-1.5 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[10px] sm:text-xs md:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5"
              >
                <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Wallet</span>
              </TabsTrigger>
              <TabsTrigger
                value="funds"
                className="rounded-md sm:rounded-lg md:rounded-xl px-1.5 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[10px] sm:text-xs md:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5"
              >
                <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Funds</span>
              </TabsTrigger>
              <TabsTrigger
                value="points"
                className="rounded-md sm:rounded-lg md:rounded-xl px-1.5 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[10px] sm:text-xs md:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5"
              >
                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Points</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <TransactionList
                transactions={allTransactions}
                isLoading={walletLoading || fundsLoading || pointsLoading}
              />
            </TabsContent>

            <TabsContent value="wallet">
              <TransactionList
                transactions={wallet?.transactions}
                isLoading={walletLoading}
              />
            </TabsContent>

            <TabsContent value="funds">
              <TransactionList
                transactions={funds?.transactions}
                isLoading={fundsLoading}
              />
            </TabsContent>

            <TabsContent value="points">
              <TransactionList
                transactions={points?.transactions}
                isLoading={pointsLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
