"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ChevronLeft,
  Send,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { walletsApi, withdrawalsApi } from "@/lib/api";
import type { WithdrawalRequest } from "@/types";

function parseAmount(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

export default function WithdrawPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawMethod, setWithdrawMethod] = useState<"bkash">("bkash");
  const [withdrawPhone, setWithdrawPhone] = useState<string>("");

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: walletsApi.getWallet,
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["withdrawals-history"],
    queryFn: withdrawalsApi.getMyWithdrawals,
  });

  const amountNumber = useMemo(() => {
    const n = Number(withdrawAmount);
    return Number.isFinite(n) ? n : 0;
  }, [withdrawAmount]);

  const withdrawableBalance = useMemo(
    () => parseAmount(wallet?.balance),
    [wallet?.balance],
  );

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
      if (totalDebit > withdrawableBalance) {
        throw new Error(
          `You can only withdraw up to ৳${withdrawableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (available balance)`,
        );
      }
      return withdrawalsApi.createWithdrawal({
        amount: amountNumber,
        method: withdrawMethod,
        receiver_phone: withdrawPhone.trim(),
      });
    },
    onSuccess: () => {
      toast.success("Withdrawal request submitted");
      setWithdrawAmount("");
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

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 md:px-0 md:py-0 space-y-6 sm:space-y-8 pb-4 md:pb-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center h-9 w-9 rounded-xl bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-800/50 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all active:scale-95"
        >
          <ChevronLeft className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Withdraw
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            From wallet · Min ৳300 · 5% charge
          </p>
        </div>
      </div>

      {/* Balance — Binance-style panel */}
      <Card className="relative border border-violet-200/60 dark:border-violet-800/50 bg-slate-50/80 dark:bg-slate-800/50 overflow-hidden rounded-lg shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
        <CardContent className="p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Wallet balance
          </p>
          {walletLoading ? (
            <Skeleton className="h-9 w-32" />
          ) : (
            <p className="text-2xl sm:text-3xl font-bold text-violet-700 dark:text-violet-300 tabular-nums">
              ৳
              {parseAmount(wallet?.balance).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Charge</span>
              <span className="font-semibold text-slate-900 dark:text-white tabular-nums">5%</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Minimum</span>
              <span className="font-semibold text-slate-900 dark:text-white tabular-nums">৳300</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request form — Binance-style form panel */}
      <Card className="relative border border-violet-200/60 dark:border-violet-800/50 bg-slate-50/80 dark:bg-slate-800/50 overflow-hidden rounded-lg shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Request withdrawal
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Status: pending → accepted/rejected → finished
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Amount (৳)
            </label>
            <Input
              type="number"
              inputMode="decimal"
              min={300}
              max={withdrawableBalance}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.00"
              className="h-11 rounded-lg border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900 font-semibold tabular-nums text-base"
            />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Fee (5%): <span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">৳{fee.toFixed(2)}</span></span>
              <span>Total: <span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">৳{totalDebit.toFixed(2)}</span></span>
              {withdrawableBalance > 0 && (
                <span>Max: <span className="font-medium text-violet-600 dark:text-violet-400 tabular-nums">৳{withdrawableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
              )}
            </div>
            {totalDebit > withdrawableBalance && withdrawableBalance > 0 && (
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                Amount exceeds available balance.
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Method
              </label>
              <Select
                value={withdrawMethod}
                onValueChange={(v) => setWithdrawMethod(v as "bkash")}
              >
                <SelectTrigger className="h-11 rounded-lg border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bkash">Bkash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Receive phone
              </label>
              <Input
                value={withdrawPhone}
                onChange={(e) => setWithdrawPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="h-11 rounded-lg border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900"
              />
            </div>
          </div>
          <Button
            onClick={() => createWithdrawal.mutate()}
            disabled={
              createWithdrawal.isPending ||
              amountNumber < 300 ||
              totalDebit > withdrawableBalance ||
              !withdrawPhone.trim()
            }
            className="w-full h-11 rounded-lg font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 shadow-md"
          >
            <Send className="h-4 w-4 mr-2" />
            {createWithdrawal.isPending ? "Submitting…" : "Withdraw"}
          </Button>
        </CardContent>
      </Card>

      {/* History — Binance-style list */}
      <Card className="relative border border-violet-200/60 dark:border-violet-800/50 bg-slate-50/80 dark:bg-slate-800/50 overflow-hidden rounded-lg shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500/80 to-fuchsia-500/80" />
        <CardContent className="p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Withdrawal history
          </p>
          {withdrawalsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-violet-200/50 dark:border-violet-800/40 last:border-0"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded" />
                </div>
              ))}
            </div>
          ) : withdrawals && withdrawals.length > 0 ? (
            <div className="divide-y divide-violet-200/50 dark:divide-violet-800/40">
              {withdrawals.slice(0, 10).map((w: WithdrawalRequest) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                      ৳{parseAmount(w.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">
                        + ৳{parseAmount(w.fee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} fee
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <Phone className="h-3 w-3" />
                      {w.receiver_phone}
                      <span className="text-slate-400 dark:text-slate-500">·</span>
                      <span className="uppercase">{w.method}</span>
                      <span className="text-slate-400 dark:text-slate-500">·</span>
                      <span>{new Date(w.created_at).toLocaleString()}</span>
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                      w.status === "pending"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        : w.status === "accepted"
                          ? "bg-violet-500/15 text-violet-700 dark:text-violet-400"
                          : w.status === "rejected"
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-violet-200 dark:border-violet-800/50 p-6 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No withdrawal requests yet.
              </p>
              <Link
                href="/wallet"
                className="inline-block mt-2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
              >
                Back to Wallet
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Link
          href="/wallet"
          className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Wallet
        </Link>
      </div>
    </div>
  );
}
