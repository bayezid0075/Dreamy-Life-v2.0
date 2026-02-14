"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";
import { superadminApi, getSuperadminStreamUrl } from "@/lib/api";
import type { SuperadminOverviewStats } from "@/types";
import { SuperadminOverviewTab } from "@/components/superadmin/overview-tab";
import { SuperadminUsersTab } from "@/components/superadmin/users-tab";
import { SuperadminVendorsTab } from "@/components/superadmin/vendors-tab";
import { SuperadminOrdersTab } from "@/components/superadmin/orders-tab";
import { SuperadminWithdrawalsTab } from "@/components/superadmin/withdrawals-tab";
import { SuperadminNotificationsTab } from "@/components/superadmin/notifications-tab";
import { SuperadminSettingsTab } from "@/components/superadmin/settings-tab";

type TabId = "overview" | "users" | "vendors" | "orders" | "withdrawals" | "notifications" | "settings";
export type SuperadminTheme = "dark" | "light";

const THEME_KEY = "superadmin-theme";

function getStoredTheme(): SuperadminTheme {
  if (typeof window === "undefined") return "dark";
  const s = localStorage.getItem(THEME_KEY);
  return s === "light" ? "light" : "dark";
}

export default function SuperadminPage() {
  const [tab, setTab] = useState<TabId>("overview");
  const [theme, setTheme] = useState<SuperadminTheme>("dark");
  const [liveOverview, setLiveOverview] =
    useState<SuperadminOverviewStats | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  const toggleTheme = () => {
    const next: SuperadminTheme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };

  useEffect(() => {
    const url = getSuperadminStreamUrl();
    if (!url) return;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("overview", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as SuperadminOverviewStats;
        setLiveOverview(data);
      } catch {
        // ignore
      }
    });

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, []);

  const isLight = theme === "light";

  return (
    <div
      className={`min-h-screen font-mono transition-colors ${
        isLight ? "bg-slate-50 text-slate-800" : "bg-[#0d1117] text-slate-200"
      }`}
    >
      {/* Header */}
      <header
        className={`border-b sticky top-0 z-10 transition-colors ${
          isLight
            ? "border-slate-200 bg-white/90 backdrop-blur"
            : "border-slate-700/80 bg-[#161b22]/80"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isLight
                  ? "bg-amber-100 border border-amber-300 text-amber-700"
                  : "bg-amber-500/20 border border-amber-500/40 text-amber-400"
              }`}
            >
              <span className="font-bold text-lg">S</span>
            </div>
            <div>
              <h1
                className={`text-lg font-bold tracking-tight ${
                  isLight ? "text-slate-900" : "text-slate-100"
                }`}
              >
                SUPERADMIN
              </h1>
              <p
                className={`text-xs ${
                  isLight ? "text-slate-500" : "text-slate-500"
                }`}
              >
                Dreamy Life · Live panel
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isLight ? "Switch to dark" : "Switch to light"}
              className={`p-2 rounded-lg border transition-colors ${
                isLight
                  ? "border-slate-300 text-slate-600 hover:bg-slate-100"
                  : "border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {isLight ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
            <span
              className={`text-xs flex items-center gap-1.5 ${
                isLight ? "text-emerald-600" : "text-emerald-500"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
            <Link
              href="/dashboard"
              className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                isLight
                  ? "border-slate-300 text-slate-600 hover:bg-slate-100"
                  : "border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              Exit
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div
          className={`max-w-[1400px] mx-auto px-4 sm:px-6 flex gap-1 border-t ${
            isLight ? "border-slate-200" : "border-slate-700/50"
          }`}
        >
          <button
            type="button"
            onClick={() => setTab("overview")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "overview"
                ? isLight
                  ? "border-amber-500 text-amber-600 bg-amber-50"
                  : "border-amber-500 text-amber-400 bg-amber-500/5"
                : isLight
                ? "border-transparent text-slate-500 hover:bg-slate-100"
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            OVERVIEW
          </button>
          <button
            type="button"
            onClick={() => setTab("users")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "users"
                ? isLight
                  ? "border-amber-500 text-amber-600 bg-amber-50"
                  : "border-amber-500 text-amber-400 bg-amber-500/5"
                : isLight
                ? "border-transparent text-slate-500 hover:bg-slate-100"
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            USER CONTROL
          </button>
          <button
            type="button"
            onClick={() => setTab("vendors")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "vendors"
                ? isLight
                  ? "border-amber-500 text-amber-600 bg-amber-50"
                  : "border-amber-500 text-amber-400 bg-amber-500/5"
                : isLight
                ? "border-transparent text-slate-500 hover:bg-slate-100"
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            VENDORS
          </button>
          <button
            type="button"
            onClick={() => setTab("orders")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "orders"
                ? isLight
                  ? "border-amber-500 text-amber-600 bg-amber-50"
                  : "border-amber-500 text-amber-400 bg-amber-500/5"
                : isLight
                ? "border-transparent text-slate-500 hover:bg-slate-100"
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            ORDERS
          </button>
          <button
            type="button"
            onClick={() => setTab("withdrawals")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "withdrawals"
                ? isLight
                  ? "border-amber-500 text-amber-600 bg-amber-50"
                  : "border-amber-500 text-amber-400 bg-amber-500/5"
                : isLight
                  ? "border-transparent text-slate-500 hover:bg-slate-100"
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            WITHDRAWALS
          </button>
          <button
            type="button"
            onClick={() => setTab("notifications")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "notifications"
                ? isLight
                  ? "border-amber-500 text-amber-600 bg-amber-50"
                  : "border-amber-500 text-amber-400 bg-amber-500/5"
                : isLight
                  ? "border-transparent text-slate-500 hover:bg-slate-100"
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            NOTIFICATIONS
          </button>
          <button
            type="button"
            onClick={() => setTab("settings")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "settings"
                ? isLight
                  ? "border-amber-500 text-amber-600 bg-amber-50"
                  : "border-amber-500 text-amber-400 bg-amber-500/5"
                : isLight
                  ? "border-transparent text-slate-500 hover:bg-slate-100"
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            SETTINGS
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {tab === "overview" && (
          <SuperadminOverviewTab liveData={liveOverview} theme={theme} />
        )}
        {tab === "users" && <SuperadminUsersTab theme={theme} />}
        {tab === "vendors" && <SuperadminVendorsTab theme={theme} />}
        {tab === "orders" && <SuperadminOrdersTab theme={theme} />}
        {tab === "withdrawals" && <SuperadminWithdrawalsTab theme={theme} />}
        {tab === "notifications" && (
          <SuperadminNotificationsTab theme={theme} />
        )}
        {tab === "settings" && <SuperadminSettingsTab theme={theme} />}
      </main>
    </div>
  );
}
