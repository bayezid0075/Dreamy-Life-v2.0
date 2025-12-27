"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BuildingStorefrontIcon,
  PhotoIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { Page } from "components/shared/Page";
import { Card, Button, Spinner } from "components/ui";
import axios from "utils/axios";
import clsx from "clsx";

export default function VendorDashboard() {
  const router = useRouter();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      
      // Fetch vendor
      try {
        const vendorResponse = await axios.get("/api/vendors/vendors/");
        const vendorData = Array.isArray(vendorResponse.data) && vendorResponse.data.length > 0
          ? vendorResponse.data[0]
          : vendorResponse.data;
        setVendor(vendorData);
        
        // If vendor exists, fetch products and stats
        if (vendorData) {
          await Promise.all([
            fetchProducts(),
            fetchStats(vendorData.id),
          ]);
        }
      } catch (error) {
        if (error.response?.status === 404 || error.response?.status === 403) {
          // No vendor exists yet
          setVendor(null);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error fetching vendor data:", error);
      toast.error("Failed to load vendor data", {
        description: error.response?.data?.detail || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/vendors/products/");
      setProducts(response.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchStats = async (vendorId) => {
    try {
      // Calculate basic stats from products
      const productsResponse = await axios.get("/api/vendors/products/");
      const vendorProducts = productsResponse.data || [];
      
      const totalProducts = vendorProducts.length;
      const totalValue = vendorProducts.reduce((sum, p) => {
        const price = parseFloat(p.price) || 0;
        return sum + price;
      }, 0);
      
      // Mock sales data (you can replace with real API later)
      const mockSales = {
        total_sales: 0,
        total_income: 0,
        orders_count: 0,
        this_month_sales: 0,
        this_month_income: 0,
      };
      
      setStats({
        total_products: totalProducts,
        total_inventory_value: totalValue,
        ...mockSales,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  if (loading) {
    return (
      <Page title="Vendor Dashboard">
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  // If user doesn't have a vendor, redirect to create page
  if (!vendor) {
    router.replace("/vendors/new");
    return (
      <Page title="Vendor Dashboard">
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  // User has a vendor - show dashboard
  const statCards = [
    {
      title: "Total Products",
      value: stats?.total_products || 0,
      icon: ShoppingBagIcon,
      color: "primary",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
      link: "/vendors/products",
    },
    {
      title: "Inventory Value",
      value: `৳${(stats?.total_inventory_value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`,
      icon: CurrencyDollarIcon,
      color: "success",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
    },
    {
      title: "Total Sales",
      value: stats?.orders_count || 0,
      icon: ChartBarIcon,
      color: "info",
      gradient: "from-indigo-500 to-purple-500",
      bgGradient: "from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20",
    },
    {
      title: "Total Income",
      value: `৳${(stats?.total_income || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`,
      icon: CurrencyDollarIcon,
      color: "success",
      gradient: "from-teal-500 to-cyan-500",
      bgGradient: "from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20",
    },
  ];

  return (
    <Page title="Vendor Dashboard">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-6 shadow-xl sm:p-8 lg:p-10">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                {vendor.banner_image ? (
                  <img
                    src={vendor.banner_image.startsWith('http') 
                      ? vendor.banner_image 
                      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${vendor.banner_image}`}
                    alt={vendor.shop_name}
                    className="size-12 rounded-xl object-cover sm:size-16"
                  />
                ) : (
                  <div className="rounded-xl bg-white/20 p-2 sm:p-3 backdrop-blur-sm">
                    <BuildingStorefrontIcon className="size-5 text-white sm:size-6 lg:size-7" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                    {vendor.shop_name}
                  </h1>
                  <p className="mt-1 text-xs text-primary-100 sm:text-sm">
                    {vendor.address}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push("/vendors/profile")}
                variant="outlined"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <PencilIcon className="size-4 sm:size-5" />
                <span className="hidden sm:inline">Edit Profile</span>
              </Button>
            </div>
          </div>
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-2xl sm:size-48 lg:size-64" />
          <div className="absolute -bottom-8 -left-8 size-24 rounded-full bg-white/10 blur-2xl sm:size-40 lg:size-56" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className={clsx(
                  "group relative overflow-hidden p-4 transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-xl",
                  "sm:p-5 lg:p-6",
                  "border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800",
                  stat.link && "cursor-pointer"
                )}
                onClick={() => stat.link && router.push(stat.link)}
              >
                <div
                  className={clsx(
                    "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                    stat.bgGradient
                  )}
                />
                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-400 sm:text-sm">
                        {stat.title}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-dark-50 sm:text-3xl lg:text-4xl">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={clsx(
                        "relative rounded-xl p-3 transition-all duration-300",
                        "group-hover:scale-110 group-hover:rotate-3",
                        "bg-gradient-to-br shadow-lg",
                        stat.gradient
                      )}
                    >
                      <Icon className="size-6 text-white sm:size-7 lg:size-8" />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          {/* Products Section */}
          <Card className="lg:col-span-2 p-4 sm:p-6 lg:p-8">
            <div className="mb-4 flex items-center justify-between sm:mb-6">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
                  <ShoppingBagIcon className="size-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-dark-50 sm:text-xl lg:text-2xl">
                  Products
                </h2>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push("/vendors/products")}
                  variant="flat"
                  className="text-xs sm:text-sm"
                  size="sm"
                >
                  View All
                </Button>
                <Button
                  onClick={() => router.push("/vendors/products/new")}
                  color="primary"
                  className="text-xs sm:text-sm"
                  size="sm"
                >
                  <PlusIcon className="size-3 sm:size-4" />
                  <span className="hidden sm:inline">Add Product</span>
                </Button>
              </div>
            </div>
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <ShoppingBagIcon className="size-12 text-gray-400 dark:text-dark-400" />
                <p className="mt-4 text-sm font-medium text-gray-900 dark:text-dark-100">
                  No products yet
                </p>
                <p className="mt-1 text-xs text-gray-600 dark:text-dark-300">
                  Start by adding your first product
                </p>
                <Button
                  onClick={() => router.push("/vendors/products/new")}
                  color="primary"
                  className="mt-4"
                >
                  Add Your First Product
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {products.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border-2 border-gray-200 p-3 transition-all duration-200 hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-md dark:border-dark-600 dark:bg-dark-800 dark:hover:border-primary-700 dark:hover:bg-primary-950/30 sm:p-4"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0].image}
                          alt={product.title}
                          className="size-12 rounded-lg object-cover sm:size-14"
                        />
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-600 sm:size-14">
                          <PhotoIcon className="size-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-dark-50 truncate sm:text-base">
                          {product.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-dark-400">
                          ৳{parseFloat(product.price || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push(`/vendors/products/${product.id}`)}
                      variant="flat"
                      className="text-xs sm:text-sm"
                    >
                      Edit
                    </Button>
                  </div>
                ))}
                {products.length > 5 && (
                  <Button
                    onClick={() => router.push("/vendors/products")}
                    variant="outlined"
                    className="w-full text-xs sm:text-sm"
                  >
                    View All {products.length} Products
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Sales Summary */}
          <Card className="p-4 sm:p-6 lg:p-8">
            <div className="mb-4 flex items-center gap-2 sm:mb-6">
              <div className="rounded-lg bg-success-100 p-2 dark:bg-success-900/30">
                <ChartBarIcon className="size-5 text-success-600 dark:text-success-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-dark-50 sm:text-xl">
                Sales Summary
              </h2>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-gray-200 p-4 dark:border-dark-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-dark-400">
                      Total Income
                    </p>
                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-dark-50 sm:text-2xl">
                      ৳{(stats?.total_income || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                    <CurrencyDollarIcon className="size-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border-2 border-gray-200 p-4 dark:border-dark-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-dark-400">
                      Total Orders
                    </p>
                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-dark-50 sm:text-2xl">
                      {stats?.orders_count || 0}
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                    <ShoppingBagIcon className="size-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border-2 border-gray-200 p-4 dark:border-dark-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-dark-400">
                      This Month
                    </p>
                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-dark-50">
                      ৳{(stats?.this_month_income || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                    <ArrowTrendingUpIcon className="size-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
            <Button
              onClick={() => router.push("/vendors/sales")}
              variant="outlined"
              className="mt-4 w-full text-xs sm:text-sm"
            >
              View Detailed Reports
            </Button>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-4 sm:p-6 lg:p-8">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-dark-50 sm:text-xl">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <Button
              onClick={() => router.push("/vendors/products/new")}
              color="primary"
              className="h-auto flex-col space-y-2 p-4"
            >
              <PlusIcon className="size-5" />
              <span className="text-xs sm:text-sm">Add Product</span>
            </Button>
            <Button
              onClick={() => router.push("/vendors/products")}
              variant="outlined"
              className="h-auto flex-col space-y-2 p-4"
            >
              <ShoppingBagIcon className="size-5" />
              <span className="text-xs sm:text-sm">Manage Products</span>
            </Button>
            <Button
              onClick={() => router.push("/vendors/profile")}
              variant="outlined"
              className="h-auto flex-col space-y-2 p-4"
            >
              <BuildingStorefrontIcon className="size-5" />
              <span className="text-xs sm:text-sm">Edit Profile</span>
            </Button>
            <Button
              onClick={() => router.push("/vendors/sales")}
              variant="outlined"
              className="h-auto flex-col space-y-2 p-4"
            >
              <ChartBarIcon className="size-5" />
              <span className="text-xs sm:text-sm">View Reports</span>
            </Button>
          </div>
        </Card>
      </div>
    </Page>
  );
}

