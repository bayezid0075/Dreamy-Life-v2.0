"use client";
import PropTypes from "prop-types";
import {
  HomeIcon,
  QrCodeIcon,
  InboxIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { Link } from "components/shared/Link";

// ----------------------------------------------------------------------

const navItems = [
  {
    id: "home",
    label: "হোম",
    icon: HomeIcon,
    path: "/dashboards/home",
  },
  {
    id: "wallet",
    label: "আমার বিকাশ",
    icon: WalletIcon,
    path: "/wallet",
  },
  {
    id: "qr-scan",
    label: "QR স্ক্যান",
    icon: QrCodeIcon,
    path: "/wallet/qr-scan",
  },
  {
    id: "inbox",
    label: "ইনবক্স",
    icon: InboxIcon,
    path: "/wallet/inbox",
  },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/50 bg-white/95 backdrop-blur-md shadow-lg md:hidden">
      <div className="grid grid-cols-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className="flex flex-col items-center justify-center gap-1 py-2.5 transition-colors active:bg-gray-50"
            >
              <Icon
                className={clsx(
                  "size-6 transition-colors",
                  isActive
                    ? "text-pink-600"
                    : "text-gray-600"
                )}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className={clsx(
                  "text-xs font-medium transition-colors",
                  isActive
                    ? "text-pink-600"
                    : "text-gray-600"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

