"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store";
import { superadminApi } from "@/lib/api";
import type { SuperadminAccessResponse } from "@/types";

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [access, setAccess] = useState<SuperadminAccessResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!isAuthenticated) return;

    let cancelled = false;
    superadminApi
      .checkAccess()
      .then((res) => {
        if (!cancelled) setAccess(res);
      })
      .catch(() => {
        if (!cancelled)
          setAccess({
            allowed: false,
            email: "",
            reason: "Failed to verify access",
          });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center font-mono">
        <div className="text-amber-400 text-sm tracking-widest animate-pulse">
          VERIFYING ACCESS...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!access?.allowed) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6">
        <div className="max-w-lg w-full border-2 border-red-500/60 rounded-lg bg-red-950/20 p-8 shadow-lg shadow-red-500/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
              <span className="text-red-400 text-2xl">⚠</span>
            </div>
            <h1 className="font-mono text-xl font-bold text-red-400 tracking-tight">
              ACCESS DENIED
            </h1>
          </div>
          <p className="font-mono text-sm text-slate-300 leading-relaxed mb-4">
            {access?.reason ||
              "You are not authorized to access the superadmin panel."}
          </p>
          {access?.email && (
            <p className="font-mono text-xs text-slate-500 mb-6">
              Logged in as:{" "}
              <span className="text-slate-400">{access.email}</span>
            </p>
          )}
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="font-mono text-sm px-4 py-2 rounded border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Back to Dashboard
            </Link>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="font-mono text-sm px-4 py-2 rounded border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Re-login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
