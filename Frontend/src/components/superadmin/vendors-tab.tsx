"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Store, Loader2, RefreshCw } from "lucide-react";
import { superadminApi } from "@/lib/api";
import type { Vendor, VendorStatus } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SuperadminTheme = "dark" | "light";

interface SuperadminVendorsTabProps {
  theme?: SuperadminTheme;
}

const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  active: "Active",
  hold: "Hold",
  ban: "Ban",
};

export function SuperadminVendorsTab({ theme = "dark" }: SuperadminVendorsTabProps) {
  const isLight = theme === "light";
  const queryClient = useQueryClient();

  const { data: vendors, isLoading, refetch } = useQuery({
    queryKey: ["superadmin-vendors"],
    queryFn: superadminApi.getVendors,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, vendor_status }: { id: number; vendor_status: VendorStatus }) =>
      superadminApi.updateVendorStatus(id, vendor_status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-vendors"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-vendor", variables.id] });
      toast.success(`Vendor status set to ${VENDOR_STATUS_LABELS[variables.vendor_status]}`);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err?.response?.data?.detail ?? "Failed to update vendor status");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className={`text-lg font-semibold ${isLight ? "text-slate-800" : "text-slate-200"}`}>
          Vendors overview
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className={
            isLight
              ? "border-slate-300 text-slate-700 hover:bg-slate-100 font-mono"
              : "border-slate-600 text-slate-400 hover:bg-slate-800 font-mono"
          }
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div
        className={`rounded-lg border overflow-hidden ${
          isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-[#161b22]"
        }`}
      >
        {isLoading ? (
          <div className={`flex items-center justify-center py-16 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !vendors?.length ? (
          <div className={`py-16 text-center ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            <Store className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No vendors yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr
                  className={
                    isLight
                      ? "border-b border-slate-200 bg-slate-50 text-slate-600"
                      : "border-b border-slate-700 bg-slate-800/50 text-slate-400"
                  }
                >
                  <th className="text-left px-4 py-3 font-medium">Shop</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Products</th>
                  <th className="text-left px-4 py-3 font-medium">Orders</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => {
                  const isUpdating =
                    updateStatusMutation.isPending &&
                    updateStatusMutation.variables?.id === vendor.id;
                  const status = (vendor.vendor_status ?? "active") as VendorStatus;

                  return (
                    <tr
                      key={vendor.id}
                      className={
                        isLight
                          ? "border-b border-slate-100 hover:bg-slate-50 text-slate-800"
                          : "border-b border-slate-700/50 hover:bg-slate-800/30 text-slate-200"
                      }
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium">{vendor.shop_name}</span>
                        {vendor.address && (
                          <p className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                            {vendor.address.slice(0, 40)}
                            {vendor.address.length > 40 ? "…" : ""}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">{vendor.user_email ?? "—"}</td>
                      <td className="px-4 py-3">{vendor.products_count ?? 0}</td>
                      <td className="px-4 py-3">{vendor.orders_count ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            status === "active"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : status === "hold"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {VENDOR_STATUS_LABELS[status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={status}
                          onValueChange={(value) =>
                            updateStatusMutation.mutate({
                              id: vendor.id,
                              vendor_status: value as VendorStatus,
                            })
                          }
                          disabled={isUpdating}
                        >
                          <SelectTrigger
                            className={`h-8 w-[100px] text-xs font-mono ${
                              isLight
                                ? "border-slate-300 bg-white"
                                : "border-slate-600 bg-slate-800 text-slate-200"
                            }`}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {(["active", "hold", "ban"] as const).map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {VENDOR_STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
