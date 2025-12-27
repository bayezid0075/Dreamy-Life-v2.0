"use client";

import { useRouter } from "next/navigation";
import { BuildingStorefrontIcon, PlusIcon, ShoppingBagIcon, ChartBarIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { Page } from "components/shared/Page";
import { Card, Button } from "components/ui";

export default function CreateVendorPage() {
  const router = useRouter();

  return (
    <Page title="Create Vendor">
      <div className="space-y-4 sm:space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-6 shadow-xl sm:p-8 lg:p-10">
          <div className="relative z-10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="rounded-xl bg-white/20 p-2 sm:p-3 backdrop-blur-sm">
                <BuildingStorefrontIcon className="size-5 text-white sm:size-6 lg:size-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                  Create a Vendor and Start Selling
                </h1>
                <p className="mt-1 text-sm text-primary-100 sm:text-base lg:text-lg">
                  Set up your vendor profile to start selling products
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-2xl sm:size-48 lg:size-64" />
          <div className="absolute -bottom-8 -left-8 size-24 rounded-full bg-white/10 blur-2xl sm:size-40 lg:size-56" />
        </div>

        {/* Create Vendor Card */}
        <Card className="p-6 sm:p-8 lg:p-10">
          <div className="text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 sm:size-24">
              <BuildingStorefrontIcon className="size-10 text-primary-600 dark:text-primary-400 sm:size-12" />
            </div>
            <h2 className="mt-6 text-xl font-bold text-gray-900 dark:text-dark-50 sm:text-2xl">
              Start Your Vendor Shop
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-dark-300 sm:text-base">
              Create your vendor profile to start managing products, track sales, and grow your business
            </p>
            
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border-2 border-gray-200 p-4 dark:border-dark-600">
                <ShoppingBagIcon className="mx-auto size-8 text-primary-600 dark:text-primary-400" />
                <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-dark-50">
                  Product Management
                </h3>
                <p className="mt-1 text-xs text-gray-600 dark:text-dark-400">
                  Add and manage your product inventory
                </p>
              </div>
              <div className="rounded-lg border-2 border-gray-200 p-4 dark:border-dark-600">
                <ChartBarIcon className="mx-auto size-8 text-primary-600 dark:text-primary-400" />
                <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-dark-50">
                  Sales Analytics
                </h3>
                <p className="mt-1 text-xs text-gray-600 dark:text-dark-400">
                  Track your sales and income
                </p>
              </div>
              <div className="rounded-lg border-2 border-gray-200 p-4 dark:border-dark-600">
                <CurrencyDollarIcon className="mx-auto size-8 text-primary-600 dark:text-primary-400" />
                <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-dark-50">
                  Income Tracking
                </h3>
                <p className="mt-1 text-xs text-gray-600 dark:text-dark-400">
                  Monitor your earnings and revenue
                </p>
              </div>
            </div>

            <Button
              onClick={() => router.push("/vendors/new")}
              color="primary"
              size="lg"
              className="mt-8 w-full space-x-2 sm:w-auto sm:px-8"
            >
              <PlusIcon className="size-5" />
              <span>Create Vendor Shop</span>
            </Button>
          </div>
        </Card>
      </div>
    </Page>
  );
}

