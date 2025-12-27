"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UsersIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  UserPlusIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  ChartBarIcon as ChartBarIconSolid,
  UsersIcon as UsersIconSolid,
} from "@heroicons/react/24/solid";
import { Page } from "components/shared/Page";
import { Card, Button, Spinner } from "components/ui";
import axios from "utils/axios";
import clsx from "clsx";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/dashboard/stats/");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Page title="Admin Dashboard">
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.total_users || 0,
      icon: UsersIconSolid,
      color: "primary",
      link: "/admin/users",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
    },
    {
      title: "Active Users",
      value: stats?.active_users || 0,
      icon: UsersIconSolid,
      color: "success",
      link: "/admin/users?is_active=true",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
    },
    {
      title: "Staff Users",
      value: stats?.staff_users || 0,
      icon: ShieldCheckIcon,
      color: "info",
      link: "/admin/users?is_staff=true",
      gradient: "from-indigo-500 to-purple-500",
      bgGradient: "from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20",
    },
    {
      title: "Total Vendors",
      value: stats?.total_vendors || 0,
      icon: BuildingStorefrontIcon,
      color: "warning",
      link: "/admin/vendors",
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20",
    },
    {
      title: "Total Products",
      value: stats?.total_products || 0,
      icon: ShoppingBagIcon,
      color: "primary",
      link: "/vendors/products",
      gradient: "from-pink-500 to-rose-500",
      bgGradient: "from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20",
    },
    {
      title: "Active Memberships",
      value: stats?.total_memberships || 0,
      icon: CreditCardIcon,
      color: "success",
      link: "/memberships",
      gradient: "from-teal-500 to-cyan-500",
      bgGradient: "from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20",
    },
  ];

  return (
    <Page title="Admin Dashboard">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Hero Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-6 shadow-xl sm:p-8 lg:p-10">
          <div className="relative z-10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="rounded-xl bg-white/20 p-2 sm:p-3 backdrop-blur-sm">
                <ChartBarIconSolid className="size-5 text-white sm:size-6 lg:size-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                  Admin Dashboard
                </h1>
                <p className="mt-1 text-sm text-primary-100 sm:text-base lg:text-lg">
                  Welcome back! Here's what's happening with your platform
                </p>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-2xl sm:size-48 lg:size-64" />
          <div className="absolute -bottom-8 -left-8 size-24 rounded-full bg-white/10 blur-2xl sm:size-40 lg:size-56" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className={clsx(
                  "group relative overflow-hidden p-4 transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-xl",
                  "sm:p-5 lg:p-6",
                  "border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                )}
              >
                {/* Gradient Background */}
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
                      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-dark-50 sm:text-4xl lg:text-5xl">
                        {stat.value.toLocaleString()}
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
                      {/* Shine effect */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => router.push(stat.link)}
                    variant="flat"
                    className={clsx(
                      "mt-4 w-full text-xs font-medium transition-all duration-200",
                      "sm:text-sm sm:mt-5",
                      "hover:shadow-md hover:-translate-y-0.5",
                      "group/btn"
                    )}
                    color={stat.color}
                  >
                    <span className="flex items-center justify-center gap-2">
                      View Details
                      <ArrowRightIcon className="size-3 transition-transform duration-200 group-hover/btn:translate-x-1" />
                    </span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions & Recent Users Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-2 p-4 sm:p-6 lg:p-8">
            <div className="mb-4 flex items-center gap-2 sm:mb-6">
              <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
                <SparklesIcon className="size-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-dark-50 sm:text-xl lg:text-2xl">
                Quick Actions
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <Button
                onClick={() => router.push("/admin/users/new")}
                color="primary"
                className="group h-auto w-full flex-col space-y-2 p-4 transition-all duration-200 hover:scale-105 hover:shadow-lg sm:p-5"
              >
                <UserPlusIcon className="size-6 sm:size-7" />
                <span className="text-sm font-semibold sm:text-base">Create User</span>
              </Button>
              <Button
                onClick={() => router.push("/admin/users")}
                variant="outlined"
                className="group h-auto w-full flex-col space-y-2 border-2 p-4 transition-all duration-200 hover:scale-105 hover:shadow-lg sm:p-5"
              >
                <UsersIcon className="size-6 sm:size-7" />
                <span className="text-sm font-semibold sm:text-base">Manage Users</span>
              </Button>
            <Button
              onClick={() => router.push("/admin/vendors")}
              variant="outlined"
              className="group h-auto w-full flex-col space-y-2 border-2 p-4 transition-all duration-200 hover:scale-105 hover:shadow-lg sm:p-5 sm:col-span-2"
            >
              <BuildingStorefrontIcon className="size-6 sm:size-7" />
              <span className="text-sm font-semibold sm:text-base">Manage Vendors</span>
            </Button>
            </div>
          </Card>

          {/* Recent Users */}
          {stats?.recent_users && stats.recent_users.length > 0 && (
            <Card className="p-4 sm:p-6 lg:p-8">
              <div className="mb-4 flex items-center justify-between sm:mb-6">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-success-100 p-2 dark:bg-success-900/30">
                    <UsersIcon className="size-5 text-success-600 dark:text-success-400" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-dark-50 sm:text-lg lg:text-xl">
                    Recent Users
                  </h2>
                </div>
                <Button
                  onClick={() => router.push("/admin/users")}
                  variant="flat"
                  className="text-xs sm:text-sm"
                  size="sm"
                >
                  View All
                </Button>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {stats.recent_users.map((user, index) => (
                  <div
                    key={user.id}
                    className={clsx(
                      "group flex items-center justify-between rounded-lg border-2 p-3 transition-all duration-200",
                      "border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-md",
                      "dark:border-dark-600 dark:bg-dark-800 dark:hover:border-primary-700 dark:hover:bg-primary-950/30",
                      "sm:p-4"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={clsx(
                        "flex size-10 items-center justify-center rounded-full font-bold text-white shadow-md transition-transform duration-200 group-hover:scale-110 sm:size-12",
                        index % 3 === 0 && "bg-gradient-to-br from-blue-500 to-cyan-500",
                        index % 3 === 1 && "bg-gradient-to-br from-green-500 to-emerald-500",
                        index % 3 === 2 && "bg-gradient-to-br from-purple-500 to-pink-500",
                      )}>
                        {user.username?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-dark-50 truncate sm:text-base">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-dark-400 truncate sm:text-sm">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="ml-3 text-right">
                      <p className="text-xs font-medium text-gray-600 dark:text-dark-300 sm:text-sm">
                        {new Date(user.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
}

