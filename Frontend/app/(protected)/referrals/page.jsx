"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { Page } from "components/shared/Page";
import {
  Card,
  Button,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
} from "components/ui";
import clsx from "clsx";
import dayjs from "dayjs";
import {
  ChevronDownIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  PhoneIcon,
  IdentificationIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import axios from "utils/axios";
import { useAuthContext } from "app/contexts/auth/context";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Time period options
const TIME_PERIODS = [
  { id: "today", label: "Today", days: 0 },
  { id: "3days", label: "3 Days", days: 3 },
  { id: "7days", label: "7 Days", days: 7 },
  { id: "15days", label: "15 Days", days: 15 },
  { id: "1month", label: "1 Month", days: 30 },
  { id: "alltime", label: "All Time", days: null },
];

// Sample referral data - simulating 10 levels
const generateSampleData = (timePeriod) => {
  const now = new Date();
  const startDate = timePeriod.days
    ? dayjs(now).subtract(timePeriod.days, "days").toDate()
    : new Date(0); // All time

  // Generate random data for each level
  const levels = Array.from({ length: 10 }, (_, i) => i + 1);

  return levels.map((level) => {
    // Higher levels typically have fewer referrals
    const baseCount = Math.max(1, Math.floor(100 / level));
    const variance = Math.floor(baseCount * 0.3);
    const count = baseCount + Math.floor(Math.random() * variance);

    return {
      level,
      count,
      date: dayjs(startDate)
        .add(Math.random() * (timePeriod.days || 365), "days")
        .toDate(),
    };
  });
};

// Get filtered data based on time period
const getFilteredData = (allData, timePeriod) => {
  if (timePeriod.days === null) {
    return allData; // All time
  }

  const cutoffDate = dayjs().subtract(timePeriod.days, "days").toDate();
  return allData.filter((item) => new Date(item.date) >= cutoffDate);
};

// Generate sample users for each level
const generateUsersForLevel = (level, count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `USER${level}${String(i + 1).padStart(3, "0")}`,
    userId: `UID${level}${String(i + 1).padStart(4, "0")}`,
    referCode: `REF${level}${String(i + 1).padStart(5, "0")}`,
    phoneNumber: `+880${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    name: `User ${i + 1} - Level ${level}`,
    joinDate: dayjs()
      .subtract(Math.floor(Math.random() * 30), "days")
      .format("MMM DD, YYYY"),
  }));
};

export default function Referrals() {
  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS[5]); // Default to "All Time"
  const { user } = useAuthContext();
  const [downlines, setDownlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfoMap, setUserInfoMap] = useState({});

  // Fetch downlines from backend
  useEffect(() => {
    const fetchDownlines = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("/api/users/downlines/");
        const downlinesData = response.data.downlines || [];
        setDownlines(downlinesData);

        // Fetch user info for each downline to get phone and refer code
        const infoPromises = downlinesData.map(async (downline) => {
          try {
            // Note: This would require a backend endpoint to get user info by ID
            // For now, we'll use the data we have
            return { userId: downline.user_id, ...downline };
          } catch (error) {
            console.error(
              `Error fetching info for user ${downline.user_id}:`,
              error,
            );
            return { userId: downline.user_id, ...downline };
          }
        });

        const infoResults = await Promise.all(infoPromises);
        const infoMap = {};
        infoResults.forEach((info) => {
          infoMap[info.userId] = info;
        });
        setUserInfoMap(infoMap);
      } catch (error) {
        console.error("Error fetching downlines:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDownlines();
  }, [user]);

  // Transform downlines data to match expected format
  const currentData = useMemo(() => {
    // Group downlines by level
    const levelMap = {};
    downlines.forEach((downline) => {
      const level = downline.level;
      if (!levelMap[level]) {
        levelMap[level] = [];
      }
      levelMap[level].push(downline);
    });

    // Create data structure for all 10 levels
    return Array.from({ length: 10 }, (_, i) => {
      const level = i + 1;
      const levelDownlines = levelMap[level] || [];
      return {
        level,
        count: levelDownlines.length,
        downlines: levelDownlines,
      };
    });
  }, [downlines]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const levels = Array.from({ length: 10 }, (_, i) => `Level ${i + 1}`);
    const counts = Array.from({ length: 10 }, (_, i) => {
      const levelData = currentData.find((d) => d.level === i + 1);
      return levelData?.count || 0;
    });

    return {
      series: [
        {
          name: "Referral Count",
          data: counts,
        },
      ],
      options: {
        chart: {
          type: "bar",
          height: 400,
          toolbar: {
            show: true,
          },
          zoom: {
            enabled: false,
          },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "60%",
            borderRadius: 4,
            dataLabels: {
              position: "top",
            },
          },
        },
        dataLabels: {
          enabled: true,
          offsetY: -20,
          style: {
            fontSize: "12px",
            colors: ["#6b7280"],
          },
        },
        stroke: {
          show: true,
          width: 2,
          colors: ["transparent"],
        },
        xaxis: {
          categories: levels,
          labels: {
            style: {
              colors: "#6b7280",
              fontSize: "12px",
            },
          },
        },
        yaxis: {
          title: {
            text: "Referral Count",
            style: {
              color: "#6b7280",
            },
          },
          labels: {
            style: {
              colors: "#6b7280",
            },
          },
        },
        fill: {
          opacity: 1,
          colors: [
            "#8b5cf6", // Purple for level 1
            "#7c3aed", // Purple for level 2
            "#6d28d9", // Purple for level 3
            "#5b21b6", // Purple for level 4
            "#4c1d95", // Purple for level 5
            "#9333ea", // Purple for level 6
            "#a855f7", // Purple for level 7
            "#c084fc", // Purple for level 8
            "#d8b4fe", // Purple for level 9
            "#e9d5ff", // Purple for level 10
          ],
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return val + " referrals";
            },
          },
        },
        grid: {
          borderColor: "#e5e7eb",
          strokeDashArray: 4,
        },
        theme: {
          mode: "light",
        },
        responsive: [
          {
            breakpoint: 768,
            options: {
              chart: {
                height: 300,
              },
              plotOptions: {
                bar: {
                  columnWidth: "70%",
                },
              },
              dataLabels: {
                style: {
                  fontSize: "10px",
                },
              },
            },
          },
        ],
      },
    };
  }, [currentData]);

  // Calculate totals
  const totalReferrals = useMemo(() => {
    return currentData.reduce((sum, item) => sum + item.count, 0);
  }, [currentData]);

  const handleChat = (userId) => {
    console.log("Chat with user:", userId);
    // Add your chat logic here
  };

  const handleProfile = (userId) => {
    console.log("View profile:", userId);
    // Add your profile view logic here
  };

  if (loading) {
    return (
      <Page title="Referrals">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block size-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="text-gray-600">Loading referrals...</p>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Referrals">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        {/* Note: Time period filtering removed as backend doesn't support it yet */}

        {/* Summary Card */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="dark:border-dark-600 border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="dark:text-dark-400 text-sm text-gray-600">
                  Total Referrals
                </p>
                <p className="dark:text-dark-50 mt-1 text-2xl font-bold text-gray-900">
                  {totalReferrals}
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                <svg
                  className="size-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="dark:border-dark-600 border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="dark:text-dark-400 text-sm text-gray-600">
                  Active Levels
                </p>
                <p className="dark:text-dark-50 mt-1 text-2xl font-bold text-gray-900">
                  {currentData.filter((d) => d.count > 0).length}/10
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <svg
                  className="size-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="dark:border-dark-600 border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="dark:text-dark-400 text-sm text-gray-600">
                  Max Level
                </p>
                <p className="dark:text-dark-50 mt-1 text-lg font-semibold text-gray-900">
                  10
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <svg
                  className="size-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Chart Card */}
        <Card className="dark:border-dark-600 border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="dark:text-dark-50 text-lg font-semibold text-gray-900">
              Referral Count by Level
            </h3>
            <p className="dark:text-dark-400 mt-1 text-sm text-gray-600">
              Showing referral counts for all 10 levels
            </p>
          </div>
          <div className="w-full">
            {typeof window !== "undefined" && (
              <Chart
                options={chartData.options}
                series={chartData.series}
                type="bar"
                height={400}
              />
            )}
          </div>
        </Card>

        {/* Level Details Accordion */}
        <Card className="dark:border-dark-600 mt-6 border border-gray-200">
          <div className="dark:bg-dark-800 dark:border-dark-600 border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
            <h3 className="dark:text-dark-50 text-lg font-semibold text-gray-900">
              Level Details
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            <Accordion
              defaultValue={currentData.find((d) => d.count > 0)?.level || 1}
            >
              {Array.from({ length: 10 }, (_, i) => {
                const level = i + 1;
                const levelData = currentData.find((d) => d.level === level);
                const count = levelData?.count || 0;
                const percentage =
                  totalReferrals > 0
                    ? ((count / totalReferrals) * 100).toFixed(1)
                    : "0.0";
                const levelDownlines = levelData?.downlines || [];

                return (
                  <AccordionItem
                    key={level}
                    value={level}
                    className="dark:border-dark-600 dark:bg-dark-800 mb-3 overflow-hidden rounded-lg border border-gray-200 bg-white transition-all"
                  >
                    {({ open }) => (
                      <>
                        <AccordionButton
                          className={clsx(
                            "dark:hover:bg-dark-700 w-full px-4 py-4 text-left transition-all hover:bg-gray-50 sm:px-6",
                            count > 0 &&
                              "hover:bg-purple-50 dark:hover:bg-purple-900/10",
                          )}
                        >
                          <div className="flex w-full items-center justify-between">
                            <div className="flex flex-1 items-center gap-3 sm:gap-4">
                              {/* Level Badge */}
                              <div
                                className={clsx(
                                  "flex size-10 shrink-0 items-center justify-center rounded-lg font-bold text-white shadow-sm",
                                  count > 0
                                    ? "bg-gradient-to-br from-purple-600 to-indigo-600"
                                    : "bg-gray-400",
                                )}
                              >
                                {level}
                              </div>

                              {/* Level Info */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <h4 className="dark:text-dark-50 text-base font-semibold text-gray-900">
                                    Level {level}
                                  </h4>
                                  {count > 0 && (
                                    <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 sm:hidden dark:bg-green-900/20 dark:text-green-400">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <div className="dark:text-dark-400 mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                  <span className="dark:text-dark-200 font-medium text-gray-700">
                                    {count}{" "}
                                    {count === 1 ? "referral" : "referrals"}
                                  </span>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="dark:text-dark-300 font-medium text-purple-600">
                                    {percentage}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Desktop: Show percentage bar and status */}
                            <div className="hidden items-center gap-4 sm:flex">
                              <div className="flex items-center gap-2">
                                <div className="dark:bg-dark-700 h-2 w-24 rounded-full bg-gray-200">
                                  <div
                                    className="h-2 rounded-full bg-purple-600 transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                              {count > 0 ? (
                                <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                  Active
                                </span>
                              ) : (
                                <span className="dark:bg-dark-700 dark:text-dark-300 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </div>

                            {/* Chevron Icon */}
                            <ChevronDownIcon
                              className={clsx(
                                "ml-2 size-5 shrink-0 text-gray-400 transition-transform duration-200",
                                open && "rotate-180",
                              )}
                            />
                          </div>
                        </AccordionButton>

                        <AccordionPanel className="dark:bg-dark-900 dark:border-dark-600 border-t border-gray-200 bg-gray-50">
                          {count > 0 ? (
                            <div className="p-4 sm:p-6">
                              <div className="mb-4">
                                <p className="dark:text-dark-300 text-sm text-gray-600">
                                  {count} {count === 1 ? "user" : "users"} in
                                  Level {level}
                                </p>
                              </div>
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {levelDownlines.map((downline) => (
                                  <Card
                                    key={downline.user_id}
                                    className="dark:border-dark-600 group border border-gray-200 p-4 transition-all hover:border-purple-300 hover:shadow-md dark:hover:border-purple-700"
                                  >
                                    <div className="space-y-3">
                                      {/* Username */}
                                      <div className="flex items-start gap-2">
                                        <UserIcon className="dark:text-dark-400 mt-0.5 size-4 shrink-0 text-gray-500" />
                                        <div className="min-w-0 flex-1">
                                          <p className="dark:text-dark-400 text-xs text-gray-500">
                                            Username
                                          </p>
                                          <p className="dark:text-dark-100 mt-0.5 truncate text-sm font-semibold text-gray-900">
                                            {downline.username}
                                          </p>
                                        </div>
                                      </div>

                                      {/* User ID */}
                                      <div className="flex items-start gap-2">
                                        <IdentificationIcon className="dark:text-dark-400 mt-0.5 size-4 shrink-0 text-gray-500" />
                                        <div className="min-w-0 flex-1">
                                          <p className="dark:text-dark-400 text-xs text-gray-500">
                                            User ID
                                          </p>
                                          <p className="dark:text-dark-100 mt-0.5 truncate text-sm font-semibold text-gray-900">
                                            {downline.user_id}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Level */}
                                      <div className="flex items-start gap-2">
                                        <QrCodeIcon className="dark:text-dark-400 mt-0.5 size-4 shrink-0 text-gray-500" />
                                        <div className="min-w-0 flex-1">
                                          <p className="dark:text-dark-400 text-xs text-gray-500">
                                            Level
                                          </p>
                                          <p className="dark:text-dark-100 mt-0.5 truncate font-mono text-sm font-semibold text-purple-600 dark:text-purple-400">
                                            {downline.level}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Action Buttons */}
                                      <div className="flex gap-2 pt-2">
                                        <Button
                                          size="sm"
                                          variant="plain"
                                          className="flex-1 gap-2 bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30"
                                          onClick={() =>
                                            handleChat(downline.user_id)
                                          }
                                        >
                                          <ChatBubbleLeftRightIcon className="size-4" />
                                          <span className="hidden sm:inline">
                                            Chat
                                          </span>
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="plain"
                                          className="dark:bg-dark-700 dark:text-dark-300 dark:hover:bg-dark-600 flex-1 gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200"
                                          onClick={() =>
                                            handleProfile(downline.user_id)
                                          }
                                        >
                                          <UserIcon className="size-4" />
                                          <span className="hidden sm:inline">
                                            Profile
                                          </span>
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-6 text-center">
                              <p className="dark:text-dark-400 text-sm text-gray-600">
                                No referrals in this level yet
                              </p>
                            </div>
                          )}
                        </AccordionPanel>
                      </>
                    )}
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </Card>
      </div>
    </Page>
  );
}
