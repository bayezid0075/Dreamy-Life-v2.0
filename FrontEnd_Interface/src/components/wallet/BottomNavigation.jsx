// Import Dependencies
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
    label: "Home",
    icon: HomeIcon,
    path: "/dashboards/home",
  },
  {
    id: "wallet",
    label: "My Wallet",
    icon: WalletIcon,
    path: "/wallet",
  },
  {
    id: "qr-scan",
    label: "QR Scan",
    icon: QrCodeIcon,
    path: "/wallet/qr-scan",
  },
  {
    id: "inbox",
    label: "Inbox",
    icon: InboxIcon,
    path: "/wallet/inbox",
  },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/80 backdrop-blur-md dark:border-dark-600 dark:bg-dark-900/80 md:hidden">
      <div className="grid grid-cols-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className="flex flex-col items-center justify-center gap-1 py-2 transition-colors"
            >
              <Icon
                className={clsx(
                  "size-6 transition-colors",
                  isActive
                    ? "text-pink-600 dark:text-pink-400"
                    : "text-gray-500 dark:text-dark-400"
                )}
              />
              <span
                className={clsx(
                  "text-xs font-medium transition-colors",
                  isActive
                    ? "text-pink-600 dark:text-pink-400"
                    : "text-gray-500 dark:text-dark-400"
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

