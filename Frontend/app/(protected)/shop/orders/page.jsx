"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import { Page } from "components/shared/Page";
import { Button, Card } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get("/api/vendors/orders/list/");
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
      delivered: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <Page title="My Orders">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse p-6">
              <div className="h-6 w-1/4 rounded bg-gray-200 dark:bg-dark-600" />
            </Card>
          ))}
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="My Orders">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
        {/* Header with gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-purple-600 p-6 text-white shadow-lg sm:p-8">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
              My Orders
            </h1>
            <p className="mt-2 text-sm text-primary-50 sm:text-base">
              View and track your orders
            </p>
          </div>
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
        </div>

        {orders.length === 0 ? (
          <Card className="p-8 text-center sm:p-12">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-600 sm:size-20">
              <ShoppingBagIcon className="size-8 text-gray-400 sm:size-10" />
            </div>
            <p className="text-base font-medium text-gray-600 dark:text-dark-300 sm:text-lg">
              You haven't placed any orders yet.
            </p>
            <Button
              onClick={() => router.push("/shop")}
              className="mt-6 rounded-xl px-8 py-3 text-base font-semibold shadow-lg"
              color="primary"
              size="lg"
            >
              Start Shopping
            </Button>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="overflow-hidden border-2 border-gray-100 p-4 shadow-md transition-all hover:border-primary-300 hover:shadow-lg dark:border-dark-600 sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h3 className="text-base font-bold text-gray-900 dark:text-dark-50 sm:text-lg">
                        {order.order_number}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(
                          order.order_status
                        )}`}
                      >
                        {order.order_status.charAt(0).toUpperCase() +
                          order.order_status.slice(1)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-dark-300 sm:text-sm">
                      <span className="font-medium">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </span>
                      <span>•</span>
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400 sm:text-xl">
                        ৳{parseFloat(order.total_amount).toFixed(2)}
                      </p>
                      {order.reseller_price_applied && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Reseller
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push(`/shop/orders/${order.id}`)}
                    variant="outlined"
                    className="mt-4 w-full rounded-xl border-2 sm:mt-0 sm:w-auto"
                  >
                    <EyeIcon className="mr-2 size-4" />
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
    </Page>
  );
}

