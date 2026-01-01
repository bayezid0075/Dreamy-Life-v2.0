"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { Page } from "components/shared/Page";
import { Card, Button, Select, Spinner } from "components/ui";
import axios from "utils/axios";

export default function VendorSalesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [salesData, setSalesData] = useState(null);

  useEffect(() => {
    checkVendorAndFetchSales();
  }, [timeRange]);

  const checkVendorAndFetchSales = async () => {
    try {
      setLoading(true);
      // First check if user has a vendor
      try {
        const vendorResponse = await axios.get("/api/vendors/vendors/");
        const vendorData = Array.isArray(vendorResponse.data) && vendorResponse.data.length > 0
          ? vendorResponse.data[0]
          : vendorResponse.data;
        
        if (!vendorData) {
          // No vendor exists, redirect to create page
          router.push("/vendors/new");
          return;
        }
      } catch (vendorError) {
        // If 404 or 403, user has no vendor
        if (vendorError.response?.status === 404 || vendorError.response?.status === 403) {
          router.push("/vendors/new");
          return;
        }
      }
      
      // User has vendor, fetch sales data
      // Mock sales data - replace with real API endpoint when available
      const mockData = {
        total_income: 0,
        total_orders: 0,
        this_month_income: 0,
        this_month_orders: 0,
        last_month_income: 0,
        last_month_orders: 0,
        income_trend: 0,
        orders_trend: 0,
        recent_orders: [],
        income_by_month: [],
      };
      setSalesData(mockData);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      if (error.response?.status === 404 || error.response?.status === 403) {
        router.push("/vendors/new");
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Page title="Sales & Income">
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Sales & Income">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button
            onClick={() => router.back()}
            variant="flat"
            isIcon
            className="size-8 sm:size-9"
          >
            <ArrowLeftIcon className="size-4 sm:size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-gray-900 dark:text-dark-50 sm:text-2xl">
              Sales & Income
            </h1>
            <p className="mt-0.5 text-xs text-gray-600 dark:text-dark-300 sm:mt-1 sm:text-sm">
              Track your sales performance and income
            </p>
          </div>
          <Select
            data={[
              { label: "All Time", value: "all" },
              { label: "This Month", value: "month" },
              { label: "This Year", value: "year" },
            ]}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-32 sm:w-40"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-dark-400 sm:text-sm">
                  Total Income
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-dark-50 sm:text-3xl">
                  ৳{(salesData?.total_income || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                <CurrencyDollarIcon className="size-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-dark-400 sm:text-sm">
                  Total Orders
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-dark-50 sm:text-3xl">
                  {salesData?.total_orders || 0}
                </p>
              </div>
              <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                <ShoppingBagIcon className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-dark-400 sm:text-sm">
                  This Month
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-dark-50 sm:text-3xl">
                  ৳{(salesData?.this_month_income || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                <ChartBarIcon className="size-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-dark-400 sm:text-sm">
                  Avg. Order Value
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-dark-50 sm:text-3xl">
                  ৳{salesData?.total_orders > 0 
                    ? (salesData.total_income / salesData.total_orders).toLocaleString('en-BD', { minimumFractionDigits: 2 })
                    : '0.00'}
                </p>
              </div>
              <div className="rounded-lg bg-amber-100 p-3 dark:bg-amber-900/30">
                <CurrencyDollarIcon className="size-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Sales Chart Placeholder */}
        <Card className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-dark-50">
            Income Trend
          </h2>
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-dark-600">
            <div className="text-center">
              <ChartBarIcon className="mx-auto size-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-dark-400">
                Sales chart will be displayed here
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-dark-500">
                Connect your order system to see real-time data
              </p>
            </div>
          </div>
        </Card>

        {/* Recent Orders */}
        <Card className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-dark-50">
            Recent Orders
          </h2>
          {salesData?.recent_orders && salesData.recent_orders.length > 0 ? (
            <div className="space-y-3">
              {salesData.recent_orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-dark-600"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-dark-50">
                      Order #{order.id}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-dark-50">
                      ৳{parseFloat(order.total || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-400">
                      {order.items_count || 0} items
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <ShoppingBagIcon className="size-12 text-gray-400 dark:text-dark-400" />
              <p className="mt-4 text-sm font-medium text-gray-900 dark:text-dark-100">
                No orders yet
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-dark-300">
                Orders will appear here once customers start purchasing
              </p>
            </div>
          )}
        </Card>
        </div>
      </div>
    </Page>
  );
}

