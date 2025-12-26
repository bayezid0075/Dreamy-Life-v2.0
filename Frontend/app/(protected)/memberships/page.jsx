"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Page } from "components/shared/Page";
import { Button } from "components/ui";
import axios from "utils/axios";
import clsx from "clsx";
import {
  CheckIcon,
  StarIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";
import {
  CheckCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useAuthContext } from "app/contexts/auth/context";

export default function MembershipsPage() {
  const router = useRouter();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      const response = await axios.get("/api/memberships/");
      setMemberships(response.data);
    } catch (error) {
      console.error("Error fetching memberships:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (membershipId) => {
    if (!user) {
      alert("Please login to purchase a membership");
      return;
    }

    // Redirect to payment page
    router.push(`/memberships/payment?membership_id=${membershipId}`);
  };

  const getMembershipColor = (name) => {
    const nameLower = name?.toLowerCase() || "";
    if (nameLower.includes("basic")) return "blue";
    if (nameLower.includes("standard")) return "purple";
    if (nameLower.includes("smart")) return "indigo";
    if (nameLower.includes("vvip")) return "pink";
    return "primary";
  };

  const getMembershipIcon = (name) => {
    const nameLower = name?.toLowerCase() || "";
    if (nameLower.includes("vvip")) return SparklesIcon;
    return StarIcon;
  };

  if (loading) {
    return (
      <Page title="Memberships">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block size-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="text-gray-600 dark:text-dark-300">Loading memberships...</p>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Memberships">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
        {/* Header Section */}
        <div className="mb-6 text-center sm:mb-12">
          <h1 className="dark:text-dark-50 mb-2 text-2xl font-bold text-gray-900 sm:mb-4 sm:text-4xl lg:text-5xl">
            Choose Your Membership
          </h1>
          <p className="dark:text-dark-300 mx-auto max-w-2xl text-sm text-gray-600 sm:text-base lg:text-lg">
            Select the perfect membership plan that suits your needs and unlock
            exclusive benefits
          </p>
        </div>

        {/* Membership Cards Grid - Mobile First, Centered */}
        <div className="mx-auto flex max-w-sm flex-col items-center justify-center gap-4 sm:max-w-2xl sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-7xl lg:grid-cols-4">
          {memberships.map((membership, index) => {
            const color = getMembershipColor(membership.name);
            const Icon = getMembershipIcon(membership.name);

            return (
              <div
                key={membership.id}
                className={clsx(
                  "group relative w-full max-w-sm overflow-hidden rounded-2xl border-2 bg-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl dark:bg-dark-800 sm:max-w-none",
                  color === "blue"
                    ? "border-blue-300 dark:border-blue-700/50"
                    : color === "purple"
                      ? "border-purple-300 dark:border-purple-700/50"
                      : color === "indigo"
                        ? "border-indigo-300 dark:border-indigo-700/50"
                        : color === "pink"
                          ? "border-pink-300 dark:border-pink-700/50"
                          : "border-primary-300 dark:border-primary-700/50",
                )}
              >
                {/* Gradient Background */}
                <div
                  className={clsx(
                    "absolute inset-0 opacity-5 transition-opacity group-hover:opacity-10",
                    color === "blue"
                      ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                      : color === "purple"
                        ? "bg-gradient-to-br from-purple-500 to-violet-500"
                        : color === "indigo"
                          ? "bg-gradient-to-br from-indigo-500 to-blue-500"
                          : color === "pink"
                            ? "bg-gradient-to-br from-pink-500 to-rose-500"
                            : "bg-gradient-to-br from-primary-500 to-purple-500",
                  )}
                />

                {/* Content */}
                <div className="relative p-4 sm:p-6">
                  {/* Icon and Badge */}
                  <div className="mb-3 flex items-center justify-between sm:mb-4">
                    <div
                      className={clsx(
                        "flex size-10 items-center justify-center rounded-xl shadow-lg sm:size-12",
                        color === "blue"
                          ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                          : color === "purple"
                            ? "bg-gradient-to-br from-purple-500 to-violet-500"
                            : color === "indigo"
                              ? "bg-gradient-to-br from-indigo-500 to-blue-500"
                              : color === "pink"
                                ? "bg-gradient-to-br from-pink-500 to-rose-500"
                                : "bg-gradient-to-br from-primary-500 to-purple-500",
                      )}
                    >
                      <Icon className="size-5 text-white sm:size-6" />
                    </div>
                    {index === 0 && (
                      <span className="bg-primary-500 dark:bg-primary-600 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white sm:px-3 sm:py-1 sm:text-xs">
                        Popular
                      </span>
                    )}
                  </div>

                  {/* Membership Name */}
                  <h3 className="dark:text-dark-50 mb-2 text-xl font-bold text-gray-900 sm:text-2xl">
                    {membership.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-baseline gap-1">
                      <span
                        className={clsx(
                          "text-3xl font-bold sm:text-4xl",
                          color === "blue"
                            ? "text-blue-600 dark:text-blue-400"
                            : color === "purple"
                              ? "text-purple-600 dark:text-purple-400"
                              : color === "indigo"
                                ? "text-indigo-600 dark:text-indigo-400"
                                : color === "pink"
                                  ? "text-pink-600 dark:text-pink-400"
                                  : "text-primary-600 dark:text-primary-400",
                        )}
                      >
                        ৳{parseFloat(membership.price).toLocaleString()}
                      </span>
                    </div>
                    <p className="dark:text-dark-400 text-xs text-gray-500 sm:text-sm">
                      One-time payment
                    </p>
                  </div>

                  {/* Description */}
                  {membership.description && (
                    <p className="dark:text-dark-300 mb-4 text-xs text-gray-600 sm:mb-6 sm:text-sm">
                      {membership.description}
                    </p>
                  )}

                  {/* Features List */}
                  <div className="mb-4 space-y-2 sm:mb-6 sm:space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="text-primary-500 dark:text-primary-400 size-4 shrink-0 sm:size-5" />
                      <span className="dark:text-dark-200 text-xs text-gray-700 sm:text-sm">
                        Verified Account
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="text-primary-500 dark:text-primary-400 size-4 shrink-0 sm:size-5" />
                      <span className="dark:text-dark-200 text-xs text-gray-700 sm:text-sm">
                        Commission Benefits
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="text-primary-500 dark:text-primary-400 size-4 shrink-0 sm:size-5" />
                      <span className="dark:text-dark-200 text-xs text-gray-700 sm:text-sm">
                        Priority Support
                      </span>
                    </div>
                  </div>

                  {/* Purchase Button */}
                  <Button
                    onClick={() => handlePurchase(membership.id)}
                    variant="filled"
                    color={color === "blue" ? "info" : color === "purple" ? "secondary" : color === "indigo" ? "primary" : color === "pink" ? "error" : "primary"}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all sm:py-3 sm:text-base"
                  >
                    Purchase Now
                    <ArrowRightIcon className="size-4 sm:size-5" />
                  </Button>
                </div>

                {/* Shine Effect on Hover */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100" />
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        {memberships.length > 0 && (
          <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 dark:border-dark-600 dark:from-dark-800 dark:to-dark-900 sm:max-w-2xl sm:mt-12 sm:p-6 lg:max-w-7xl">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
              <div className="bg-primary-500/10 dark:bg-primary-500/20 flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-12">
                <SparklesIcon className="text-primary-600 dark:text-primary-400 size-5 sm:size-6" />
              </div>
              <div className="flex-1">
                <h3 className="dark:text-dark-50 mb-1.5 text-base font-semibold text-gray-900 sm:mb-2 sm:text-lg">
                  Why Choose a Membership?
                </h3>
                <p className="dark:text-dark-300 text-xs text-gray-600 sm:text-sm">
                  Unlock exclusive features, earn higher commissions, and get
                  verified status. All memberships include lifetime access to
                  premium benefits and priority customer support.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {memberships.length === 0 && !loading && (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-dark-600 dark:bg-dark-800">
            <StarIcon className="text-gray-400 dark:text-dark-500 mb-4 size-16" />
            <h3 className="dark:text-dark-300 mb-2 text-xl font-semibold text-gray-700">
              No Memberships Available
            </h3>
            <p className="dark:text-dark-400 text-sm text-gray-500">
              Check back later for available membership plans.
            </p>
          </div>
        )}
      </div>
    </Page>
  );
}

