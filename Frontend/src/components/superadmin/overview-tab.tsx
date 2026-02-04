"use client";

import { useEffect, useState } from "react";
import { superadminApi } from "@/lib/api";
import type { SuperadminOverviewStats } from "@/types";
import {
  Users,
  UserCheck,
  Shield,
  Store,
  Package,
  CreditCard,
  Wallet,
  Loader2,
} from "lucide-react";

type SuperadminTheme = "dark" | "light";

interface OverviewTabProps {
  liveData: SuperadminOverviewStats | null;
  theme?: SuperadminTheme;
}

const statCards: {
  key: keyof Omit<SuperadminOverviewStats, "recent_users">;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { key: "total_users", label: "Total Users", icon: Users, color: "amber" },
  {
    key: "active_users",
    label: "Active Users",
    icon: UserCheck,
    color: "emerald",
  },
  { key: "staff_users", label: "Staff", icon: Shield, color: "violet" },
  { key: "total_vendors", label: "Vendors", icon: Store, color: "cyan" },
  { key: "total_products", label: "Products", icon: Package, color: "blue" },
  {
    key: "total_memberships",
    label: "Active Memberships",
    icon: CreditCard,
    color: "rose",
  },
  {
    key: "total_wallet_balance",
    label: "Total Wallet (৳)",
    icon: Wallet,
    color: "green",
  },
];

export function SuperadminOverviewTab({
  liveData,
  theme = "dark",
}: OverviewTabProps) {
  const [initial, setInitial] = useState<SuperadminOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const data = liveData ?? initial;
  const isLight = theme === "light";

  useEffect(() => {
    let cancelled = false;
    superadminApi
      .getOverview()
      .then((res) => {
        if (!cancelled) setInitial(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2
          className={`w-8 h-8 animate-spin ${
            isLight ? "text-amber-600" : "text-amber-500/60"
          }`}
        />
      </div>
    );
  }

  const colorMap = isLight
    ? {
        amber: "border-amber-300 text-amber-700 bg-amber-50",
        emerald: "border-emerald-300 text-emerald-700 bg-emerald-50",
        violet: "border-violet-300 text-violet-700 bg-violet-50",
        cyan: "border-cyan-300 text-cyan-700 bg-cyan-50",
        blue: "border-blue-300 text-blue-700 bg-blue-50",
        rose: "border-rose-300 text-rose-700 bg-rose-50",
        green: "border-green-300 text-green-700 bg-green-50",
      }
    : {
        amber: "border-amber-500/40 text-amber-400 bg-amber-500/5",
        emerald: "border-emerald-500/40 text-emerald-400 bg-emerald-500/5",
        violet: "border-violet-500/40 text-violet-400 bg-violet-500/5",
        cyan: "border-cyan-500/40 text-cyan-400 bg-cyan-500/5",
        blue: "border-blue-500/40 text-blue-400 bg-blue-500/5",
        rose: "border-rose-500/40 text-rose-400 bg-rose-500/5",
        green: "border-green-500/40 text-green-400 bg-green-500/5",
      };

  return (
    <div className="space-y-8">
      <section>
        <h2
          className={`text-sm font-semibold uppercase tracking-widest mb-4 ${
            isLight ? "text-slate-500" : "text-slate-500"
          }`}
        >
          System metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {statCards.map(({ key, label, icon: Icon, color }) => {
            const value = data?.[key];
            const colorClass = colorMap[color as keyof typeof colorMap];

            return (
              <div
                key={key}
                className={`rounded-lg border ${colorClass} p-4 transition-all ${
                  isLight
                    ? "hover:bg-white hover:shadow-sm"
                    : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider opacity-80">
                    {label}
                  </span>
                  <Icon className="w-4 h-4 opacity-70" />
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {value !== undefined && value !== null ? String(value) : "—"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2
          className={`text-sm font-semibold uppercase tracking-widest mb-4 ${
            isLight ? "text-slate-500" : "text-slate-500"
          }`}
        >
          Recent users
        </h2>
        <div
          className={`rounded-lg border overflow-hidden ${
            isLight
              ? "border-slate-200 bg-white shadow-sm"
              : "border-slate-700/80 bg-[#161b22]/50"
          }`}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className={`border-b ${
                  isLight
                    ? "border-slate-200 bg-slate-50"
                    : "border-slate-700/80 bg-slate-800/30"
                }`}
              >
                <th
                  className={`text-left py-3 px-4 font-semibold ${
                    isLight ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  ID
                </th>
                <th
                  className={`text-left py-3 px-4 font-semibold ${
                    isLight ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  Username
                </th>
                <th
                  className={`text-left py-3 px-4 font-semibold ${
                    isLight ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  Email
                </th>
                <th
                  className={`text-left py-3 px-4 font-semibold ${
                    isLight ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  Joined
                </th>
                <th
                  className={`text-left py-3 px-4 font-semibold ${
                    isLight ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.recent_users?.length ? (
                data.recent_users.map((u) => (
                  <tr
                    key={u.id}
                    className={`border-b transition-colors ${
                      isLight
                        ? "border-slate-100 hover:bg-slate-50"
                        : "border-slate-700/50 hover:bg-slate-800/30"
                    }`}
                  >
                    <td
                      className={`py-3 px-4 tabular-nums ${
                        isLight ? "text-slate-500" : "text-slate-500"
                      }`}
                    >
                      {u.id}
                    </td>
                    <td
                      className={`py-3 px-4 font-medium ${
                        isLight ? "text-slate-800" : "text-slate-200"
                      }`}
                    >
                      {u.username}
                    </td>
                    <td
                      className={`py-3 px-4 ${
                        isLight ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      {u.email}
                    </td>
                    <td
                      className={`py-3 px-4 text-xs ${
                        isLight ? "text-slate-500" : "text-slate-500"
                      }`}
                    >
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          u.is_active
                            ? isLight
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-emerald-500/20 text-emerald-400"
                            : isLight
                            ? "bg-red-100 text-red-700"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className={`py-8 px-4 text-center text-sm ${
                      isLight ? "text-slate-500" : "text-slate-500"
                    }`}
                  >
                    No recent users
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
