// Import Dependencies
import PropTypes from "prop-types";
import {
  ArrowRightIcon,
  DevicePhoneMobileIcon,
  HandRaisedIcon,
  ShoppingBagIcon,
  WalletIcon,
  LightBulbIcon,
  QrCodeIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

// Local Imports
import { Button } from "components/ui";

// ----------------------------------------------------------------------

const features = [
  {
    id: "send-money",
    label: "Send Money",
    icon: ArrowRightIcon,
    color: "bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400",
  },
  {
    id: "mobile-recharge",
    label: "Mobile Recharge",
    icon: DevicePhoneMobileIcon,
    color: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  },
  {
    id: "cash-out",
    label: "Cash Out",
    icon: HandRaisedIcon,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  },
  {
    id: "payment",
    label: "Payment",
    icon: ShoppingBagIcon,
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  },
  {
    id: "add-money",
    label: "Add Money",
    icon: WalletIcon,
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  },
  {
    id: "pay-bill",
    label: "Pay Bill",
    icon: LightBulbIcon,
    color: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  },
  {
    id: "savings",
    label: "Savings",
    icon: QrCodeIcon,
    color: "bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400",
  },
  {
    id: "loan",
    label: "Loan",
    icon: BanknotesIcon,
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  },
];

export function FeatureGrid({ onFeatureClick, onSeeMore }) {
  return (
    <div className="bg-white px-4 py-6 dark:bg-dark-900">
      <div className="grid grid-cols-4 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <button
              key={feature.id}
              onClick={() => onFeatureClick?.(feature.id)}
              className="group flex flex-col items-center gap-2 transition-transform active:scale-95"
            >
              <div
                className={clsx(
                  "flex size-14 items-center justify-center rounded-full transition-all",
                  feature.color,
                  "group-hover:scale-110"
                )}
              >
                <Icon className="size-7" />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-dark-200">
                {feature.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* See More Button */}
      <div className="mt-4 flex justify-center">
        <Button
          onClick={onSeeMore}
          variant="outlined"
          className="rounded-xl border-pink-300 px-6 py-2 text-sm font-medium text-pink-600 hover:bg-pink-50 dark:border-pink-500/50 dark:text-pink-400 dark:hover:bg-pink-900/10"
        >
          <span>See More</span>
          <ArrowRightIcon className="ml-2 size-4 rotate-90" />
        </Button>
      </div>
    </div>
  );
}

FeatureGrid.propTypes = {
  onFeatureClick: PropTypes.func,
  onSeeMore: PropTypes.func,
};

