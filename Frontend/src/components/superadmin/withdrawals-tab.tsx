"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw, CheckCircle2, XCircle, Flag } from "lucide-react";
import type { WithdrawalRequest, WithdrawalStatus } from "@/types";
import { superadminWithdrawalsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type SuperadminTheme = "dark" | "light";

export function SuperadminWithdrawalsTab({
  theme = "dark",
}: {
  theme?: SuperadminTheme;
}) {
  const isLight = theme === "light";
  const [status, setStatus] = useState<WithdrawalStatus | "all">("pending");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [items, setItems] = useState<WithdrawalRequest[]>([]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await superadminWithdrawalsApi.list(
        status === "all" ? undefined : { status }
      );
      setItems(res);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e.response?.data?.detail || "Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    const t = setInterval(fetchList, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const act = async (id: number, action: "accept" | "reject" | "finish") => {
    setActioningId(id);
    try {
      await superadminWithdrawalsApi.act(id, {
        action,
        admin_note: note || undefined,
      });
      toast.success(`Withdrawal ${action}ed`);
      setNote("");
      fetchList();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e.response?.data?.detail || "Failed to update withdrawal");
    } finally {
      setActioningId(null);
    }
  };

  const emptyText =
    status === "pending"
      ? "No pending withdrawals."
      : status === "accepted"
        ? "No accepted withdrawals."
        : status === "rejected"
          ? "No rejected withdrawals."
          : status === "finished"
            ? "No finished withdrawals."
            : "No withdrawals found.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
        <div>
          <h2
            className={`text-sm font-semibold uppercase tracking-widest ${
              isLight ? "text-slate-500" : "text-slate-500"
            }`}
          >
            Withdrawals
          </h2>
          <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-500"}`}>
            Accept → Reject (refund) → Finish.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger
              className={`w-[180px] font-mono text-sm ${
                isLight
                  ? "bg-white border-slate-300 text-slate-800"
                  : "bg-[#161b22] border-slate-700 text-slate-200"
              }`}
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="finished">Finished</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Admin note (optional)"
              className={`h-9 w-full sm:w-[260px] font-mono text-sm ${
                isLight
                  ? "bg-white border-slate-300 text-slate-800"
                  : "bg-[#161b22] border-slate-700 text-slate-200"
              }`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={fetchList}
              disabled={loading}
              className={
                isLight
                  ? "text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                  : "text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
              }
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <div
        className={`rounded-lg border overflow-hidden ${
          isLight
            ? "border-slate-200 bg-white shadow-sm"
            : "border-slate-700/80 bg-[#161b22]/50"
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2
              className={`w-8 h-8 animate-spin ${
                isLight ? "text-amber-600" : "text-amber-500/60"
              }`}
            />
          </div>
        ) : items.length === 0 ? (
          <div className="py-14 text-center text-sm text-slate-500">
            {emptyText}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className={`border-b ${
                    isLight
                      ? "border-slate-200 bg-slate-50"
                      : "border-slate-700/80 bg-slate-800/30"
                  }`}
                >
                  {["ID", "User", "Amount", "Method", "Phone", "Status", "Created", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className={`text-left py-3 px-4 font-semibold ${
                          isLight ? "text-slate-600" : "text-slate-400"
                        }`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((w) => {
                  const isBusy = actioningId === w.id;
                  return (
                    <tr
                      key={w.id}
                      className={`border-b transition-colors ${
                        isLight
                          ? "border-slate-100 hover:bg-slate-50"
                          : "border-slate-700/50 hover:bg-slate-800/30"
                      }`}
                    >
                      <td className="py-3 px-4 text-slate-500 tabular-nums">
                        {w.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <div
                            className={`font-medium truncate ${
                              isLight ? "text-slate-800" : "text-slate-200"
                            }`}
                          >
                            {w.user_username}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {w.user_email}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold tabular-nums">
                          ৳{parseFloat(w.amount).toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500 tabular-nums">
                          Fee ৳{parseFloat(w.fee).toFixed(2)} • Total ৳
                          {parseFloat(w.total_debit).toFixed(2)}
                        </div>
                      </td>
                      <td className="py-3 px-4 uppercase text-xs text-slate-500">
                        {w.method}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {w.receiver_phone}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${
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
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(w.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy || w.status !== "pending"}
                            onClick={() => act(w.id, "accept")}
                            className={
                              isLight
                                ? "border-slate-300"
                                : "border-slate-700 bg-transparent"
                            }
                          >
                            {isBusy ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy || (w.status !== "pending" && w.status !== "accepted")}
                            onClick={() => act(w.id, "reject")}
                            className={
                              isLight
                                ? "border-slate-300 text-rose-700 hover:bg-rose-50"
                                : "border-slate-700 text-rose-400 hover:bg-rose-500/10"
                            }
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy || w.status !== "accepted"}
                            onClick={() => act(w.id, "finish")}
                            className={
                              isLight
                                ? "border-slate-300 text-emerald-700 hover:bg-emerald-50"
                                : "border-slate-700 text-emerald-400 hover:bg-emerald-500/10"
                            }
                          >
                            <Flag className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

