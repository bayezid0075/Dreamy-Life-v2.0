// Import Dependencies
import PropTypes from "prop-types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PhoneIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  StarIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";

// Local Imports
import { Avatar, AvatarDot, Card, CopyButton, Button } from "components/ui";

// ----------------------------------------------------------------------

export function UserProfileCard({
  username = "Bayeid hOshen",
  phoneNumber = "+1 234 567 8900",
  avatarSrc,
  referralCode = "REF123456",
  showStatus = true,
  statusColor = "success",
  isVerified = false,
  membershipStatus = "user",
  className,
  ...props
}) {
  const router = useRouter();
  const [isPhoneVisible, setIsPhoneVisible] = useState(false);

  // Function to mask phone number: show first 3 digits, stars in middle, last 2 digits
  const maskPhoneNumber = (phone) => {
    // Extract only digits from phone number
    const digits = phone.replace(/\D/g, "");
    if (digits.length <= 5) {
      // If phone number is too short, just show stars
      return "*".repeat(digits.length);
    }
    const firstThree = digits.slice(0, 3);
    const lastTwo = digits.slice(-2);
    const middleStars = "*".repeat(digits.length - 5);
    return `${firstThree}${middleStars}${lastTwo}`;
  };

  const displayPhone = isPhoneVisible
    ? phoneNumber
    : maskPhoneNumber(phoneNumber);
  return (
    <div
      className={clsx(
        "dark:border-dark-600/50 dark:bg-dark-800 hover:shadow-3xl dark:shadow-dark-900/50 mx-4 mb-3 overflow-hidden rounded-2xl border-0 bg-white shadow-2xl transition-all duration-300 hover:scale-[1.02]",
        className,
      )}
      {...props}
    >
      {/* Modern Card Design with Gradient Background */}
      <div className="relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="from-primary-500/10 via-primary-600/5 dark:from-primary-500/20 dark:via-primary-600/10 absolute inset-0 bg-gradient-to-br to-purple-500/10 dark:to-purple-500/20"></div>
        <div className="bg-primary-400/20 dark:bg-primary-500/10 absolute -top-20 -right-20 size-40 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 size-40 rounded-full bg-purple-400/20 blur-3xl dark:bg-purple-500/10"></div>

        {/* Top Accent Bar with Gradient */}
        <div className="from-primary-500 via-primary-600 relative h-2 bg-gradient-to-r to-purple-600 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>

        {/* Card Content */}
        <div className="relative p-4 backdrop-blur-sm">
          {/* User Header Section */}
          <div className="mb-4 flex items-center gap-3">
            <div className="group relative">
              <div className="from-primary-400 absolute -inset-1 rounded-full bg-gradient-to-br to-purple-500 opacity-75 blur transition-opacity group-hover:opacity-100"></div>
              <div className="dark:bg-dark-800 absolute inset-0 rounded-full bg-white"></div>
              <Avatar
                src={avatarSrc}
                name={username}
                size={16}
                className="ring-primary-500/50 dark:ring-primary-400/50 relative shadow-lg ring-2"
              />
              {showStatus && (
                <AvatarDot
                  color={statusColor}
                  className="dark:border-dark-800 dark:ring-dark-800 absolute -right-0.5 -bottom-0.5 size-4 border-2 border-white shadow-lg ring-2 ring-white"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="dark:text-dark-50 dark:from-dark-50 dark:to-dark-200 truncate bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-lg font-bold text-transparent">
                {username}
              </h3>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="dark:bg-dark-700/80 dark:border-dark-600 flex items-center gap-1.5 rounded-lg border border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-1.5 shadow-sm">
                  <div className="bg-primary-500/10 dark:bg-primary-500/20 flex size-6 items-center justify-center rounded-md">
                    <PhoneIcon className="text-primary-600 dark:text-primary-400 size-3.5" />
                  </div>
                  <span className="dark:text-dark-200 text-sm font-semibold text-gray-800">
                    {displayPhone}
                  </span>
                  <button
                    onClick={() => setIsPhoneVisible(!isPhoneVisible)}
                    className="dark:hover:bg-dark-600 focus:ring-primary-500 ml-auto rounded-md p-1 transition-all hover:scale-110 hover:bg-gray-200 focus:ring-2 focus:outline-none"
                    aria-label={
                      isPhoneVisible ? "Hide phone number" : "Show phone number"
                    }
                  >
                    {isPhoneVisible ? (
                      <EyeSlashIcon className="dark:text-dark-300 size-4 text-gray-600" />
                    ) : (
                      <EyeIcon className="dark:text-dark-300 size-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            {/* Verification Badge */}
            <div
              className={clsx(
                "group relative overflow-hidden rounded-lg border-2 px-2 py-2 transition-all duration-300 hover:scale-105 hover:shadow-md",
                isVerified
                  ? "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-green-200/50 dark:border-green-700/50 dark:from-green-900/30 dark:to-emerald-900/20 dark:shadow-green-900/20"
                  : "border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-yellow-200/50 dark:border-yellow-700/50 dark:from-yellow-900/30 dark:to-amber-900/20 dark:shadow-yellow-900/20",
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="relative flex flex-col items-center gap-1 text-center">
                <div
                  className={clsx(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg shadow-sm",
                    isVerified
                      ? "bg-green-500 text-white"
                      : "bg-yellow-500 text-white",
                  )}
                >
                  <ShieldCheckIcon className="size-3.5" />
                </div>
                <div className="w-full min-w-0">
                  <p className="dark:text-dark-400 truncate text-[9px] font-medium text-gray-500">
                    Status
                  </p>
                  <p
                    className={clsx(
                      "truncate text-[10px] leading-tight font-bold",
                      isVerified
                        ? "text-green-700 dark:text-green-300"
                        : "text-yellow-700 dark:text-yellow-300",
                    )}
                  >
                    {isVerified ? "Verified" : "Not Verified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Membership Badge */}
            <div
              className={clsx(
                "group relative overflow-hidden rounded-lg border-2 px-2 py-2 transition-all duration-300 hover:scale-105 hover:shadow-md",
                membershipStatus === "user"
                  ? "dark:from-dark-700 dark:to-dark-800 dark:shadow-dark-900/50 border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50 shadow-gray-200/50 dark:border-gray-700"
                  : membershipStatus === "Basic"
                    ? "border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-blue-200/50 dark:border-blue-700/50 dark:from-blue-900/30 dark:to-cyan-900/20 dark:shadow-blue-900/20"
                    : membershipStatus === "Standard"
                      ? "border-purple-300 bg-gradient-to-br from-purple-50 to-violet-50 shadow-purple-200/50 dark:border-purple-700/50 dark:from-purple-900/30 dark:to-violet-900/20 dark:shadow-purple-900/20"
                      : membershipStatus === "Smart"
                        ? "border-indigo-300 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-indigo-200/50 dark:border-indigo-700/50 dark:from-indigo-900/30 dark:to-blue-900/20 dark:shadow-indigo-900/20"
                        : "border-pink-300 bg-gradient-to-br from-pink-50 to-rose-50 shadow-pink-200/50 dark:border-pink-700/50 dark:from-pink-900/30 dark:to-rose-900/20 dark:shadow-pink-900/20", // VVIP
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="relative flex flex-col items-center gap-1 text-center">
                <div
                  className={clsx(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg shadow-sm",
                    membershipStatus === "user"
                      ? "bg-gray-500 text-white"
                      : membershipStatus === "Basic"
                        ? "bg-blue-500 text-white"
                        : membershipStatus === "Standard"
                          ? "bg-purple-500 text-white"
                          : membershipStatus === "Smart"
                            ? "bg-indigo-500 text-white"
                            : "bg-pink-500 text-white", // VVIP
                  )}
                >
                  <StarIcon className="size-3.5" />
                </div>
                <div className="w-full min-w-0">
                  <p className="dark:text-dark-400 truncate text-[9px] font-medium text-gray-500">
                    Member
                  </p>
                  <p
                    className={clsx(
                      "truncate text-[10px] leading-tight font-bold capitalize",
                      membershipStatus === "user"
                        ? "text-gray-700 dark:text-gray-300"
                        : membershipStatus === "Basic"
                          ? "text-blue-700 dark:text-blue-300"
                          : membershipStatus === "Standard"
                            ? "text-purple-700 dark:text-purple-300"
                            : membershipStatus === "Smart"
                              ? "text-indigo-700 dark:text-indigo-300"
                              : "text-pink-700 dark:text-pink-300", // VVIP
                    )}
                  >
                    {membershipStatus}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Verify Now Button */}
          {!isVerified && (
            <div className="mb-4">
              <Button
                onClick={() => router.push("/ekyc")}
                variant="filled"
                color="warning"
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold"
              >
                <ShieldCheckIcon className="size-4" />
                Verify Now
                <ArrowRightIcon className="size-4" />
              </Button>
            </div>
          )}

          {/* Referral Code Section */}
          <div className="border-primary-200/50 from-primary-50 dark:border-primary-800/30 dark:from-primary-900/30 relative overflow-hidden rounded-xl border-2 bg-gradient-to-br via-purple-50 to-pink-50 p-3 shadow-lg dark:via-purple-900/20 dark:to-pink-900/20">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity hover:opacity-100"></div>
            <div className="relative mb-2.5 flex items-center justify-between">
              <label className="from-primary-600 dark:from-primary-400 bg-gradient-to-r to-purple-600 bg-clip-text text-xs font-bold text-transparent dark:to-purple-400">
                Referral Code
              </label>
            </div>
            <CopyButton value={referralCode} timeout={2000}>
              {({ copy, copied }) => (
                <div className="group hover:border-primary-300 dark:border-dark-700/50 dark:bg-dark-800/90 relative flex items-center gap-2 overflow-hidden rounded-lg border-2 border-white/80 bg-white/90 px-3 py-2.5 shadow-md backdrop-blur-sm transition-all hover:shadow-lg">
                  <div className="from-primary-500/0 via-primary-500/10 to-primary-500/0 absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100"></div>
                  <code className="dark:from-dark-50 dark:to-dark-200 relative flex-1 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text font-mono text-sm font-bold text-transparent">
                    {referralCode}
                  </code>
                  <Button
                    onClick={copy}
                    isIcon
                    variant="flat"
                    size="sm"
                    className={clsx(
                      "relative shrink-0 transition-all duration-300 hover:scale-110",
                      copied
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50"
                        : "from-primary-500 shadow-primary-500/30 hover:shadow-primary-500/50 bg-gradient-to-br to-purple-600 text-white shadow-md hover:shadow-lg",
                    )}
                    aria-label={copied ? "Copied!" : "Copy referral code"}
                  >
                    {copied ? (
                      <CheckIcon className="size-4" />
                    ) : (
                      <DocumentDuplicateIcon className="size-4" />
                    )}
                  </Button>
                </div>
              )}
            </CopyButton>
          </div>
        </div>
      </div>
    </div>
  );
}

UserProfileCard.propTypes = {
  username: PropTypes.string,
  phoneNumber: PropTypes.string,
  avatarSrc: PropTypes.string,
  referralCode: PropTypes.string,
  showStatus: PropTypes.bool,
  statusColor: PropTypes.oneOf([
    "primary",
    "secondary",
    "success",
    "warning",
    "error",
    "info",
  ]),
  isVerified: PropTypes.bool,
  membershipStatus: PropTypes.string,
  className: PropTypes.string,
};
