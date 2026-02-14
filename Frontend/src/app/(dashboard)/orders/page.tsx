"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Package, Eye, Truck, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ordersApi } from "@/lib/api";
import { printOrderInvoice } from "@/lib/invoice";
import type { Order } from "@/types";

const orderStatusClasses: Record<string, string> = {
  placed: "border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-500/40 dark:text-amber-400 dark:bg-amber-500/10",
  confirmed: "border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-500/40 dark:text-blue-400 dark:bg-blue-500/10",
  packed: "border-violet-300 text-violet-700 bg-violet-50 dark:border-violet-500/40 dark:text-violet-400 dark:bg-violet-500/10",
  shipping: "border-indigo-300 text-indigo-700 bg-indigo-50 dark:border-indigo-500/40 dark:text-indigo-400 dark:bg-indigo-500/10",
  shipped: "border-cyan-300 text-cyan-700 bg-cyan-50 dark:border-cyan-500/40 dark:text-cyan-400 dark:bg-cyan-500/10",
  received: "border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-400 dark:bg-emerald-500/10",
  cancelled: "border-red-300 text-red-700 bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:bg-red-500/10",
};

const paymentStatusClasses: Record<string, string> = {
  pending: "border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-500/40 dark:text-amber-400 dark:bg-amber-500/10",
  paid: "border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-400 dark:bg-emerald-500/10",
  failed: "border-red-300 text-red-700 bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:bg-red-500/10",
  refunded: "border-slate-300 text-slate-600 bg-slate-50 dark:border-slate-500/40 dark:text-slate-400 dark:bg-slate-500/10",
};

const defaultStatusClass = "border-slate-200 text-slate-600 bg-slate-50 dark:border-slate-500/40 dark:text-slate-400 dark:bg-slate-500/10";

const orderStatusLabels: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipping: "Shipping",
  shipped: "Shipped",
  received: "Received",
  cancelled: "Cancelled",
};

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: ordersApi.getOrders,
  });

  const orderStatusClass = (status: string) => orderStatusClasses[status] ?? defaultStatusClass;
  const paymentStatusClass = (status: string) => paymentStatusClasses[status] ?? defaultStatusClass;

  const stats = [
    {
      title: "Total Orders",
      value: orders?.length ?? 0,
      icon: ShoppingBag,
      colorClass: "border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-500/40 dark:text-amber-400 dark:bg-amber-500/10",
    },
    {
      title: "Pending",
      value: orders?.filter((o) => o.order_status === "placed" || o.order_status === "confirmed").length ?? 0,
      icon: Package,
      colorClass: "border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-500/40 dark:text-amber-400 dark:bg-amber-500/10",
    },
    {
      title: "Shipped",
      value: orders?.filter((o) => o.order_status === "shipped").length ?? 0,
      icon: Truck,
      colorClass: "border-cyan-300 text-cyan-700 bg-cyan-50 dark:border-cyan-500/40 dark:text-cyan-400 dark:bg-cyan-500/10",
    },
  ];

  return (
    <div className="min-h-full font-mono text-foreground bg-background">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            My Orders
          </h1>
          <p className="text-sm mt-0.5 text-muted-foreground">
            Reseller orders · View, track & download invoices
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={`rounded-lg border ${stat.colorClass} p-4 transition-all hover:bg-accent/5 dark:hover:bg-white/5`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground opacity-90">
                  {stat.title}
                </span>
                <Icon className="w-4 h-4 opacity-70" />
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-12 rounded bg-muted" />
              ) : (
                <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Order history
          </h2>
          <p className="text-xs mt-0.5 text-muted-foreground">
            All reseller orders in one place
          </p>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded bg-muted" />
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                    Order #
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                    Total
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                    Payment
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border transition-colors hover:bg-muted/30"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-amber-600 dark:text-amber-400">
                      {order.order_number}
                    </td>
                    <td className="py-3 px-4">{order.customer_name}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      ৳{parseFloat(order.total_amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${orderStatusClass(
                          order.order_status
                        )}`}
                      >
                        {orderStatusLabels[order.order_status] ?? order.order_status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${paymentStatusClass(
                          order.payment_status
                        )}`}
                      >
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-500/10"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => printOrderInvoice(order)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10"
                          title="Download invoice"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground">
            <div className="w-14 h-14 mx-auto rounded-lg border border-border bg-muted/30 flex items-center justify-center mb-4">
              <ShoppingBag className="h-7 w-7 opacity-60" />
            </div>
            <h3 className="font-semibold mb-1 text-foreground">
              No orders yet
            </h3>
            <p className="text-sm">
              Your reseller orders will appear here
            </p>
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="font-mono max-w-2xl bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Order details</DialogTitle>
            <p className="text-sm text-muted-foreground">
              #{selectedOrder?.order_number}
            </p>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${orderStatusClass(
                    selectedOrder.order_status
                  )}`}
                >
                  {orderStatusLabels[selectedOrder.order_status] ?? selectedOrder.order_status}
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${paymentStatusClass(
                    selectedOrder.payment_status
                  )}`}
                >
                  {selectedOrder.payment_status}
                </span>
                <Button
                  size="sm"
                  onClick={() => printOrderInvoice(selectedOrder)}
                  className="ml-auto font-mono border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                  variant="outline"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download invoice
                </Button>
              </div>

              <div className="rounded-lg border border-border p-4 bg-muted/20">
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                  Customer information
                </h4>
                <div className="text-sm space-y-1">
                  <p>Name: {selectedOrder.customer_name}</p>
                  <p>Email: {selectedOrder.customer_email}</p>
                  <p>Phone: {selectedOrder.customer_phone}</p>
                  <p>Address: {selectedOrder.delivery_address}</p>
                  <p>
                    Area:{" "}
                    {selectedOrder.delivery_area === "inside_dhaka"
                      ? "Inside Dhaka"
                      : "Outside Dhaka"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border overflow-hidden bg-muted/20">
                <h4 className="text-xs font-semibold uppercase tracking-wider px-4 py-2 border-b border-border text-muted-foreground">
                  Items
                </h4>
                <div className="divide-y divide-border">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 px-4 py-3"
                    >
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_title}
                          className="h-14 w-14 object-cover rounded border border-border"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {item.product_title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {item.product_sku} · Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold shrink-0">
                        ৳{parseFloat(item.subtotal).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-2 text-sm bg-muted/20">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>৳{parseFloat(selectedOrder.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT</span>
                  <span>৳{parseFloat(selectedOrder.vat_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>
                    ৳{parseFloat(selectedOrder.delivery_charge).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                  <span>Total</span>
                  <span>৳{parseFloat(selectedOrder.total_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
