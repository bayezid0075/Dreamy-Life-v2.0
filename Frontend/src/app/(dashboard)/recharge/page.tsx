"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Smartphone,
  Wallet,
  ArrowLeft,
  Loader2,
  History,
  Zap,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Signal,
  Radio,
  Phone,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { walletsApi, rechargeApi } from "@/lib/api";
import type { MobileRecharge } from "@/lib/api/recharge";

// Backend accepts 3,4,5,6,7,8,9 (GP 3/7, BL 4/9). One entry per brand for Select.
const OPERATORS: {
  value: string;
  label: string;
  short: string;
  icon: LucideIcon;
  iconClass: string;
  bgClass: string;
}[] = [
  { value: "7", label: "Grameenphone", short: "GP", icon: Signal, iconClass: "text-emerald-600 dark:text-emerald-400", bgClass: "bg-emerald-500/15" },
  { value: "9", label: "Banglalink", short: "BL", icon: Radio, iconClass: "text-blue-600 dark:text-blue-400", bgClass: "bg-blue-500/15" },
  { value: "8", label: "Robi", short: "Robi", icon: Wifi, iconClass: "text-rose-600 dark:text-rose-400", bgClass: "bg-rose-500/15" },
  { value: "6", label: "Airtel", short: "Airtel", icon: Smartphone, iconClass: "text-red-600 dark:text-red-400", bgClass: "bg-red-500/15" },
  { value: "5", label: "TeleTalk", short: "TT", icon: Phone, iconClass: "text-violet-600 dark:text-violet-400", bgClass: "bg-violet-500/15" },
];

const ALLOWED_OPERATOR_IDS = ["3", "4", "5", "6", "7", "8", "9"];

const NUMBER_TYPES = [
  { value: "1", label: "Prepaid" },
  { value: "2", label: "Postpaid" },
  { value: "3", label: "Skitto" },
  { value: "4", label: "PowerLoad / G.Store / Amar Offer" },
];

const QUICK_AMOUNTS = [20, 50, 100, 200, 500, 1000];

function StatusBadge({ status }: { status: string }) {
  if (status === "received" || status === "success")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        {status}
      </Badge>
    );
  if (status === "refunded")
    return (
      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1">
        <RefreshCw className="h-3 w-3" />
        {status}
      </Badge>
    );
  if (status === "failed")
    return (
      <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 gap-1">
        <XCircle className="h-3 w-3" />
        {status}
      </Badge>
    );
  return (
    <Badge variant="secondary" className="gap-1">
      {status}
    </Badge>
  );
}

export default function RechargePage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [operator, setOperator] = useState("");
  const [numberType, setNumberType] = useState("1");
  const [mobileNumber, setMobileNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [fromOffer, setFromOffer] = useState(false);

  // Pre-fill and lock operator + amount when coming from Drive offer (URL params)
  useEffect(() => {
    const op = searchParams.get("operator")?.trim();
    const amt = searchParams.get("amount")?.trim();
    if (op && amt) {
      const amtNum = parseFloat(amt);
      if (!Number.isNaN(amtNum) && amtNum >= 1 && ALLOWED_OPERATOR_IDS.includes(op)) {
        // Normalize GP 3->7, BL 4->9 so Select displays correctly (one per brand)
        const normalizedOp = op === "3" ? "7" : op === "4" ? "9" : op;
        setOperator(normalizedOp);
        setAmount(String(Math.round(amtNum)));
        setFromOffer(true);
      }
    }
  }, [searchParams]);

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: walletsApi.getWallet,
  });

  const { data: recharges, isLoading: rechargesLoading } = useQuery({
    queryKey: ["recharge-list"],
    queryFn: rechargeApi.list,
  });

  const createMutation = useMutation({
    mutationFn: rechargeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recharge-list"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      if (!fromOffer) setAmount("");
      toast.success("Recharge request submitted successfully.");
    },
    onError: (err: { response?: { data?: { detail?: string } }; detail?: string }) => {
      const msg =
        err?.response?.data?.detail ?? (err as { detail?: string }).detail ?? "Recharge failed.";
      toast.error(msg);
    },
  });

  const availableBalance = wallet
    ? Math.max(0, parseFloat(wallet.balance) - parseFloat(wallet.reserved_balance || "0"))
    : 0;
  const amountNum = parseFloat(amount) || 0;
  const canSubmit =
    operator &&
    numberType &&
    mobileNumber.replace(/\s/g, "").length >= 10 &&
    amountNum >= 1 &&
    amountNum <= availableBalance &&
    !createMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const num = mobileNumber.replace(/\s/g, "");
    if (num.length < 10 || num.length > 11) {
      toast.error("Enter a valid 11-digit mobile number.");
      return;
    }
    createMutation.mutate({
      operator,
      number_type: numberType,
      mobile_number: num,
      amount: amountNum,
    });
  };

  const setQuickAmount = (v: number) => {
    if (v <= availableBalance) setAmount(String(v));
    else toast.error(`Max available: ৳${availableBalance.toLocaleString()}`);
  };

  return (
    <div className="min-h-[60vh] px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6 rounded-full px-3 py-1.5 hover:bg-primary/5"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      {/* Hero strip */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/15 via-primary/10 to-accent/10 dark:from-primary/20 dark:via-primary/15 dark:to-accent/15 border border-primary/20 dark:border-primary/30 p-6 sm:p-8 mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,var(--primary)/20%,transparent)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/20 dark:bg-primary/30 text-primary shadow-lg shadow-primary/20">
              <Smartphone className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Mobile Recharge
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5 max-w-md">
                Recharge any number instantly from your wallet. Verified users only.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Balance card - vibrant */}
        <Card className="rounded-2xl border-2 border-primary/20 dark:border-primary/30 bg-gradient-to-br from-card to-primary/5 dark:to-primary/10 shadow-xl shadow-primary/5 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Wallet className="h-4 w-4" />
                </div>
                Available balance
              </CardTitle>
              <Link
                href="/wallet"
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View wallet →
              </Link>
            </div>
            <CardDescription>Amount will be deducted from your wallet</CardDescription>
          </CardHeader>
          <CardContent>
            {walletLoading ? (
              <Skeleton className="h-10 w-40 rounded-xl" />
            ) : (
              <p className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
                ৳{availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recharge form - vibrant card */}
        <Card className="rounded-2xl border-2 border-border bg-card shadow-lg overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/30 dark:bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-primary" />
              New recharge
            </CardTitle>
            <CardDescription>
              {fromOffer
                ? "Amount and operator are set from the offer. Enter mobile number to recharge."
                : `Choose operator, enter number and amount. Max ৳${availableBalance.toLocaleString()}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="operator" className="text-sm font-medium">
                    Operator
                  </Label>
                  <Select value={operator} onValueChange={fromOffer ? () => {} : setOperator}>
                    <SelectTrigger
                      id="operator"
                      disabled={fromOffer}
                      className="rounded-xl h-11 border-2 focus:border-primary focus:ring-primary/20 w-full min-w-[10rem] [&_span]:flex [&_span]:items-center [&_span]:gap-2"
                    >
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl min-w-[var(--radix-select-trigger-width)]">
                      {OPERATORS.map((op) => {
                        const Icon = op.icon;
                        return (
                          <SelectItem
                            key={op.value}
                            value={op.value}
                            className="rounded-lg pl-3 gap-3 py-2.5"
                          >
                            <span className="flex items-center gap-3">
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${op.bgClass} ${op.iconClass}`}
                              >
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="font-medium">{op.label}</span>
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number_type" className="text-sm font-medium">
                    Number type
                  </Label>
                  <Select value={numberType} onValueChange={setNumberType}>
                    <SelectTrigger
                      id="number_type"
                      className="rounded-xl h-11 border-2 focus:border-primary focus:ring-primary/20"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {NUMBER_TYPES.map((nt) => (
                        <SelectItem key={nt.value} value={nt.value} className="rounded-lg">
                          {nt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_number" className="text-sm font-medium">
                  Mobile number
                </Label>
                <Input
                  id="mobile_number"
                  type="tel"
                  placeholder="e.g. 01700000000"
                  value={mobileNumber}
                  onChange={(e) =>
                    setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                  className="rounded-xl h-11 border-2 focus-visible:ring-primary/20 focus-visible:border-primary text-base"
                  maxLength={11}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Amount (৳)
                </Label>
                {!fromOffer && (
                  <div className="flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuickAmount(q)}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                          amount === String(q)
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                            : "bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent hover:border-primary/30"
                        }`}
                      >
                        ৳{q}
                      </button>
                    ))}
                  </div>
                )}
                <Input
                  id="amount"
                  type="number"
                  min={1}
                  step={1}
                  placeholder={fromOffer ? undefined : `Enter amount (max ৳${availableBalance.toLocaleString()})`}
                  value={amount}
                  onChange={(e) => !fromOffer && setAmount(e.target.value)}
                  disabled={fromOffer}
                  className="rounded-xl h-11 border-2 focus-visible:ring-primary/20 focus-visible:border-primary text-base"
                />
                {amountNum > availableBalance && (
                  <p className="text-xs font-medium text-destructive flex items-center gap-1">
                    Amount cannot exceed available balance (৳
                    {availableBalance.toLocaleString()})
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-xl h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/30 transition-all disabled:opacity-50"
                disabled={!canSubmit}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing…
                  </>
                ) : (
                  "Recharge now"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent recharges - vibrant list */}
        <Card className="rounded-2xl border-2 border-border bg-card shadow-lg overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/30 dark:bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Recent recharges
                </CardTitle>
                <CardDescription>Your last recharge requests</CardDescription>
              </div>
              <Link
                href="/recharge/history"
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
              >
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {rechargesLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : !recharges?.length ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
                  <History className="h-7 w-7" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No recharges yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your recharge history will appear here
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {(recharges as MobileRecharge[]).slice(0, 10).map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5 sm:py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-semibold text-sm">
                        {OPERATORS.find((o) => o.value === r.operator)?.short ?? "—"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {r.mobile_number}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ৳{parseFloat(r.amount).toLocaleString()} · {r.refid.slice(0, 8)}…
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
