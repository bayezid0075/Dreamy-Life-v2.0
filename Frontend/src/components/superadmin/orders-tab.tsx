"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingBag, Loader2, RefreshCw } from "lucide-react";
import { superadminApi } from "@/lib/api";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SuperadminTheme = "dark" | "light";

interface SuperadminOrdersTabProps {
  theme?: SuperadminTheme;
}

const ORDER_STATUSES: Order["order_status"][] = [
  "placed",
  "confirmed",
  "packed",
  "shipping",
  "shipped",
  "received",
  "cancelled",
];

const ORDER_STATUS_LABELS: Record<Order["order_status"], string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipping: "Shipping",
  shipped: "Shipped",
  received: "Received",
  cancelled: "Cancelled",
};

export function SuperadminOrdersTab({
  theme = "dark",
}: SuperadminOrdersTabProps) {
  const isLight = theme === "light";
  const queryClient = useQueryClient();

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["superadmin-orders"],
    queryFn: superadminApi.getOrders,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      order_status,
    }: {
      id: number;
      order_status: Order["order_status"];
    }) => superadminApi.updateOrderStatus(id, order_status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["superadmin-order", variables.id],
      });
      toast.success(
        `Order status set to ${ORDER_STATUS_LABELS[variables.order_status]}`
      );
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err?.response?.data?.detail ?? "Failed to update order status");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2
          className={`text-lg font-semibold ${
            isLight ? "text-slate-800" : "text-slate-200"
          }`}
        >
          All orders
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
          <RefreshCw
            className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div
        className={`rounded-lg border overflow-hidden ${
          isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-[#161b22]"
        }`}
      >
        {isLoading ? (
          <div
            className={`flex items-center justify-center py-16 ${
              isLight ? "text-slate-500" : "text-slate-400"
            }`}
          >
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !orders?.length ? (
          <div
            className={`py-16 text-center ${
              isLight ? "text-slate-500" : "text-slate-400"
            }`}
          >
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No orders yet</p>
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
                  <th className="text-left px-4 py-3 font-medium">Order #</th>
                  <th className="text-left px-4 py-3 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 font-medium">Total</th>
                  <th className="text-left px-4 py-3 font-medium">Order status</th>
                  <th className="text-left px-4 py-3 font-medium">Payment</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isUpdating =
                    updateStatusMutation.isPending &&
                    updateStatusMutation.variables?.id === order.id;

                  return (
                    <tr
                      key={order.id}
                      className={
                        isLight
                          ? "border-b border-slate-100 hover:bg-slate-50 text-slate-800"
                          : "border-b border-slate-700/50 hover:bg-slate-800/30 text-slate-200"
                      }
                    >
                      <td className="px-4 py-3 font-medium">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3">
                        <p>{order.customer_name}</p>
                        <p
                          className={`text-xs ${
                            isLight ? "text-slate-500" : "text-slate-500"
                          }`}
                        >
                          {order.customer_email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        ৳{parseFloat(order.total_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            order.order_status === "cancelled"
                              ? "bg-red-500/20 text-red-400"
                              : order.order_status === "received"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {ORDER_STATUS_LABELS[order.order_status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs capitalize">
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={order.order_status}
                          onValueChange={(value) =>
                            updateStatusMutation.mutate({
                              id: order.id,
                              order_status: value as Order["order_status"],
                            })
                          }
                          disabled={isUpdating}
                        >
                          <SelectTrigger
                            className={`h-8 w-[110px] text-xs font-mono ${
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
                            {ORDER_STATUSES.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {ORDER_STATUS_LABELS[s]}
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
