"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Car,
  ArrowLeft,
  Wifi,
  PhoneCall,
  Package,
  AlertCircle,
  Signal,
  Radio,
  Phone,
  Smartphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { rechargeApi } from "@/lib/api";
import type { DriveOfferPack } from "@/lib/api/recharge";

const OFFER_TYPE_OPTIONS = [
  { value: "all", label: "All", icon: Package },
  { value: "internet", label: "Internet", icon: Wifi },
  { value: "minutes", label: "Minutes", icon: PhoneCall },
  { value: "bundle", label: "Bundle", icon: Package },
];

// Backend uses 3,4,5,6,7,8,9 (GP 3/7, BL 4/9, Robi 8, Airtel 6, TeleTalk 5)
const OPERATORS: {
  value: string;
  label: string;
  short: string;
  icon: LucideIcon;
  iconClass: string;
  bgClass: string;
}[] = [
  { value: "3", label: "Grameenphone", short: "GP", icon: Signal, iconClass: "text-emerald-600 dark:text-emerald-400", bgClass: "bg-emerald-500/15" },
  { value: "7", label: "Grameenphone", short: "GP", icon: Signal, iconClass: "text-emerald-600 dark:text-emerald-400", bgClass: "bg-emerald-500/15" },
  { value: "4", label: "Banglalink", short: "BL", icon: Radio, iconClass: "text-blue-600 dark:text-blue-400", bgClass: "bg-blue-500/15" },
  { value: "9", label: "Banglalink", short: "BL", icon: Radio, iconClass: "text-blue-600 dark:text-blue-400", bgClass: "bg-blue-500/15" },
  { value: "8", label: "Robi", short: "Robi", icon: Wifi, iconClass: "text-rose-600 dark:text-rose-400", bgClass: "bg-rose-500/15" },
  { value: "6", label: "Airtel", short: "Airtel", icon: Smartphone, iconClass: "text-red-600 dark:text-red-400", bgClass: "bg-red-500/15" },
  { value: "5", label: "TeleTalk", short: "TT", icon: Phone, iconClass: "text-violet-600 dark:text-violet-400", bgClass: "bg-violet-500/15" },
];

// Map pack operator_id to primary value for recharge URL (GP 3/7->7, BL 4/9->9)
function toPrimaryOperatorId(opId: string): string {
  if (opId === "3") return "7";
  if (opId === "4") return "9";
  return opId;
}

// Unique operators for filter chips (one per brand; GP 3/7, BL 4/9 map to single chip)
const FILTER_OPERATORS: { value: string; short: string; icon: LucideIcon; iconClass: string; bgClass: string; matchIds: string[] }[] = [
  { value: "7", short: "GP", icon: Signal, iconClass: "text-emerald-600 dark:text-emerald-400", bgClass: "bg-emerald-500/15", matchIds: ["3", "7"] },
  { value: "9", short: "BL", icon: Radio, iconClass: "text-blue-600 dark:text-blue-400", bgClass: "bg-blue-500/15", matchIds: ["4", "9"] },
  { value: "8", short: "Robi", icon: Wifi, iconClass: "text-rose-600 dark:text-rose-400", bgClass: "bg-rose-500/15", matchIds: ["8"] },
  { value: "6", short: "Airtel", icon: Smartphone, iconClass: "text-red-600 dark:text-red-400", bgClass: "bg-red-500/15", matchIds: ["6"] },
  { value: "5", short: "TT", icon: Phone, iconClass: "text-violet-600 dark:text-violet-400", bgClass: "bg-violet-500/15", matchIds: ["5"] },
];

function getPackDisplay(pack: DriveOfferPack) {
  const name = [pack.pack_name, pack.name, pack.title, pack.pack_code].find(Boolean);
  const internet = pack.internet ?? pack.data;
  const minutes = pack.minutes;
  const validity = pack.validity;
  const price = pack.price ?? pack.amount;
  const opId = String(pack.operator_id ?? pack.operator ?? "").trim();
  return { name: String(name || "Offer"), internet, minutes, validity, price, opId };
}

function packMatchesFilter(
  pack: DriveOfferPack,
  operatorFilter: string,
  typeFilter: string
): boolean {
  const { opId, internet, minutes } = getPackDisplay(pack);
  if (operatorFilter && operatorFilter !== "all" && opId) {
    const filterOp = FILTER_OPERATORS.find((f) => f.value === operatorFilter);
    const matchIds = filterOp?.matchIds ?? [operatorFilter];
    if (!matchIds.includes(opId)) return false;
  }
  if (typeFilter === "all") return true;
  const hasInternet = internet != null && String(internet).toLowerCase() !== "0" && String(internet) !== "";
  const hasMinutes = minutes != null && String(minutes).toLowerCase() !== "0" && String(minutes) !== "";
  if (typeFilter === "internet") return hasInternet;
  if (typeFilter === "minutes") return hasMinutes;
  if (typeFilter === "bundle") return hasInternet && hasMinutes;
  return true;
}

export default function DriveOfferPage() {
  const [driveOperator, setDriveOperator] = useState("all");
  const [driveType, setDriveType] = useState("all");

  const { data: driveOffers, isLoading: driveOffersLoading, error: driveOffersError } = useQuery({
    queryKey: ["drive-offers"],
    queryFn: () => rechargeApi.driveOfferList(),
  });

  const filteredDrivePacks = useMemo(() => {
    const packs = driveOffers?.packs ?? [];
    return packs.filter((p) => packMatchesFilter(p, driveOperator, driveType));
  }, [driveOffers?.packs, driveOperator, driveType]);

  return (
    <div className="min-h-[60vh] px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6 rounded-full px-3 py-1.5 hover:bg-primary/5"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-primary/10 dark:from-orange-500/20 dark:via-amber-500/15 dark:to-primary/15 border border-orange-500/20 dark:border-orange-500/30 p-6 sm:p-8 mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,var(--primary)/15%,transparent)]" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-500/20 dark:bg-orange-500/30 text-orange-600 dark:text-orange-400 shadow-lg shadow-orange-500/20">
            <Car className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Drive Offer
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 max-w-md">
              Browse pack offers by operator. Filter by internet, minutes, or bundle.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="rounded-2xl border-2 border-border bg-card shadow-lg overflow-hidden">
          <CardContent className="space-y-3 pt-4">
            {/* Operator row */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Operator</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDriveOperator("all")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all",
                    driveOperator === "all"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                  )}
                >
                  <Package className="h-4 w-4 shrink-0" />
                  All
                </button>
                {FILTER_OPERATORS.map((op) => (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() => setDriveOperator(op.value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all",
                      driveOperator === op.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                    )}
                  >
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", op.bgClass, op.iconClass)}>
                      <op.icon className="h-3.5 w-3.5" />
                    </span>
                    {op.short}
                  </button>
                ))}
              </div>
            </div>
            {/* Type row */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</p>
              <div className="flex flex-wrap items-center gap-2">
                {OFFER_TYPE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setDriveType(t.value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all",
                      driveType === t.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                    )}
                  >
                    <t.icon className="h-4 w-4 shrink-0" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {driveOffersError ? (
          <Card className="rounded-2xl border-2 border-destructive/30 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-3" />
              <p className="text-sm font-medium text-foreground">Could not load offers</p>
              <p className="text-xs text-muted-foreground mt-1">
                {(driveOffersError as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Check your connection and try again."}
              </p>
            </CardContent>
          </Card>
        ) : driveOffersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-20 sm:h-24 rounded-xl" />
            ))}
          </div>
        ) : filteredDrivePacks.length === 0 ? (
          <Card className="rounded-2xl border-2 border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-14 w-14 text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-foreground">
                {driveOffers?.message ? "Could not load offers" : "No offers match your filters"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {driveOffers?.message ?? "Try changing operator or type."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredDrivePacks.map((pack, idx) => {
              const d = getPackDisplay(pack);
              const op = OPERATORS.find((o) => o.value === d.opId);
              const priceNum = typeof d.price === "number" ? d.price : parseFloat(String(d.price ?? 0));
              const hasValidOffer = d.opId && !Number.isNaN(priceNum) && priceNum >= 1;
              const rechargeHref = hasValidOffer
                ? `/recharge?operator=${encodeURIComponent(toPrimaryOperatorId(d.opId))}&amount=${encodeURIComponent(priceNum)}`
                : null;

              const cardContent = (
                <Card
                  key={idx}
                  className={cn(
                    "flex-row items-center gap-0 rounded-xl sm:rounded-2xl border-2 border-border bg-card shadow-md hover:shadow-lg hover:border-primary/30 transition-all overflow-hidden py-0",
                    rechargeHref && "cursor-pointer"
                  )}
                >
                  <CardContent className="p-0 flex-1 min-w-0">
                    <div className="flex flex-row items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 min-h-[3.25rem] sm:min-h-0">
                      {/* Operator icon */}
                      {op && (
                        <div className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg ${op.bgClass} ${op.iconClass}`}>
                          <op.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                      )}
                      {!op && (
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                      )}
                      {/* Details only: internet, minutes, validity (no duplicate name) */}
                      <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-3 min-w-0 overflow-hidden">
                        {d.internet != null && String(d.internet) !== "" && String(d.internet) !== "0" && (
                          <span className="flex items-center gap-1 text-foreground/90 text-xs sm:text-sm font-medium shrink-0">
                            <Wifi className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-600 dark:text-violet-400 shrink-0" />
                            <span>{String(d.internet)}</span>
                          </span>
                        )}
                        {d.minutes != null && String(d.minutes) !== "" && String(d.minutes) !== "0" && (
                          <span className="flex items-center gap-1 text-foreground/90 text-xs sm:text-sm font-medium shrink-0">
                            <PhoneCall className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-600 dark:text-violet-400 shrink-0" />
                            <span>{String(d.minutes)}</span>
                          </span>
                        )}
                        {d.validity != null && String(d.validity) !== "" && (
                          <span className="flex items-center gap-1 text-foreground/90 text-xs sm:text-sm font-medium shrink-0">
                            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-600 dark:text-violet-400 shrink-0" />
                            <span>{String(d.validity)}</span>
                          </span>
                        )}
                        {!d.internet && !d.minutes && !d.validity && (
                          <span className="text-xs sm:text-sm text-muted-foreground italic">Offer</span>
                        )}
                      </div>
                      {/* Price + operator label side by side */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0 border-l border-border pl-2 sm:pl-3">
                        <span className="text-base sm:text-lg font-bold text-violet-700 dark:text-violet-300 tabular-nums">
                          ৳{typeof d.price === "number" ? d.price.toLocaleString() : (d.price ?? "—")}
                        </span>
                        {op && (
                          <span className="text-[10px] sm:text-xs font-semibold text-foreground/80">
                            {op.short}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );

              return rechargeHref ? (
                <Link key={idx} href={rechargeHref} className="block">
                  {cardContent}
                </Link>
              ) : (
                <div key={idx}>{cardContent}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
