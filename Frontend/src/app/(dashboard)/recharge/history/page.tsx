"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Smartphone,
  History,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Signal,
  Radio,
  Phone,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { rechargeApi } from "@/lib/api";
import type { MobileRecharge } from "@/lib/api/recharge";

const OPERATORS: {
  value: string;
  short: string;
  icon: LucideIcon;
  bgClass: string;
  iconClass: string;
  logo?: string;
}[] = [
  { value: "7", short: "GP", icon: Signal, bgClass: "bg-emerald-500/15", iconClass: "text-emerald-600 dark:text-emerald-400", logo: "/operators/grameenphone.png" },
  { value: "9", short: "BL", icon: Radio, bgClass: "bg-blue-500/15", iconClass: "text-blue-600 dark:text-blue-400", logo: "/operators/banglalink.png" },
  { value: "8", short: "Robi", icon: Wifi, bgClass: "bg-rose-500/15", iconClass: "text-rose-600 dark:text-rose-400", logo: "/operators/robi.png" },
  { value: "6", short: "Airtel", icon: Smartphone, bgClass: "bg-red-500/15", iconClass: "text-red-600 dark:text-red-400", logo: "/operators/airtel.png" },
  { value: "5", short: "TT", icon: Phone, bgClass: "bg-violet-500/15", iconClass: "text-violet-600 dark:text-violet-400", logo: "/operators/teletalk.png" },
];

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

function formatDate(createdAt: string) {
  const d = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function RechargeHistoryPage() {
  const router = useRouter();

  const { data: recharges, isLoading } = useQuery({
    queryKey: ["recharge-list"],
    queryFn: rechargeApi.list,
  });

  const list = (recharges ?? []) as MobileRecharge[];
  const successCount = list.filter((r) => r.status === "received" || r.status === "success").length;
  const totalAmount = list.reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);

  return (
    <div className="min-h-[60vh] px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12">
      {/* Back link */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9 rounded-xl shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Link
          href="/recharge"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-full px-3 py-1.5 hover:bg-primary/5"
        >
          <Smartphone className="h-4 w-4" />
          New recharge
        </Link>
      </div>

      {/* Hero strip */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-violet-500/15 via-primary/10 to-fuchsia-500/10 dark:from-violet-500/20 dark:via-primary/15 dark:to-fuchsia-500/15 border border-violet-500/20 dark:border-violet-500/30 p-6 sm:p-8 mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,var(--primary)/15%,transparent)]" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-500/20 dark:bg-violet-500/30 text-violet-600 dark:text-violet-400 shadow-lg shadow-violet-500/20">
            <History className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Recharge History
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 max-w-md">
              All your mobile recharge requests
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Summary card */}
        <Card className="rounded-2xl border-2 border-border bg-card shadow-lg overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex gap-4">
                <Skeleton className="h-16 flex-1 rounded-xl" />
                <Skeleton className="h-16 flex-1 rounded-xl" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total recharges
                  </p>
                  <p className="text-2xl font-bold text-primary mt-1">{list.length}</p>
                </div>
                <div className="rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Successful
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {successCount}
                  </p>
                </div>
                <div className="rounded-xl bg-violet-500/5 dark:bg-violet-500/10 border border-violet-500/20 p-4 col-span-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total amount
                  </p>
                  <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">
                    ৳{totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History list */}
        <Card className="rounded-2xl border-2 border-border bg-card shadow-lg overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/30 dark:bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              All recharges
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
                  <History className="h-7 w-7" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No recharges yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your recharge history will appear here
                </p>
                <Button asChild className="mt-4 rounded-xl">
                  <Link href="/recharge">New recharge</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {list.map((r) => {
                  const op = OPERATORS.find((o) => o.value === r.operator);
                  return (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5 sm:py-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl overflow-hidden ${op?.logo ? "bg-white" : `${op?.bgClass ?? "bg-muted"} ${op?.iconClass ?? "text-muted-foreground"}`}`}
                        >
                          {op?.logo ? (
                            <img src={op.logo} alt="" className="h-9 w-9 object-contain object-center" />
                          ) : op ? (
                            <op.icon className="h-5 w-5" />
                          ) : (
                            <Smartphone className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {r.mobile_number}
                          </p>
                          <p className="text-xs font-medium text-primary mt-0.5">
                            {formatDate(r.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={r.status} />
                        <span className="text-sm font-bold text-foreground">
                          ৳{parseFloat(r.amount).toLocaleString()}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
