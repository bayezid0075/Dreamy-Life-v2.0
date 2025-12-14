"use client";
import PropTypes from "prop-types";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Custom Icons matching the design - hands passing money
const SendMoneyIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
    {/* Hand 1 */}
    <path
      d="M8 10C8 8 9 7 10 7C11 7 12 8 12 10"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M8 10L6 12L8 14"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    {/* Hand 2 */}
    <path
      d="M16 10C16 8 15 7 14 7C13 7 12 8 12 10"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M16 10L18 12L16 14"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    {/* Money symbol */}
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const MobileRechargeIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect
      x="6"
      y="3"
      width="12"
      height="18"
      rx="2"
      fill="currentColor"
      opacity="0.15"
    />
    <rect x="8" y="5" width="8" height="14" rx="1" fill="currentColor" />
    <circle cx="12" cy="19" r="1" fill="white" />
    {/* Plus sign */}
    <path
      d="M12 8V12M10 10H14"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CashOutIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
    {/* Hands holding money */}
    <path
      d="M8 10C8 9 8.5 8 9.5 8C10.5 8 11 9 11 10"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M16 10C16 9 15.5 8 14.5 8C13.5 8 13 9 13 10"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    {/* Money stack */}
    <rect x="10" y="10" width="4" height="6" rx="1" fill="currentColor" />
    <path d="M10 12H14M10 14H14" stroke="white" strokeWidth="1" />
  </svg>
);

const PaymentIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
    {/* Shopping bag */}
    <path
      d="M8 8L8 6C8 4.9 8.9 4 10 4H14C15.1 4 16 4.9 16 6V8"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M6 8H18L17 20H7L6 8Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M10 12V14M14 12V14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const AddMoneyIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
    {/* Wallet with plus */}
    <rect x="6" y="8" width="12" height="8" rx="2" fill="currentColor" />
    <path d="M6 12H18" stroke="white" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3" fill="white" />
    <path
      d="M12 10V14M10 12H14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const PayBillIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
    {/* Lightbulb */}
    <path
      d="M12 3C9 3 7 5 7 8C7 10 8 11.5 9 13"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M12 3C15 3 17 5 17 8C17 10 16 11.5 15 13"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M9 13C9 15 10.5 16.5 12 16.5C13.5 16.5 15 15 15 13"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <rect x="10" y="18" width="4" height="2" rx="1" fill="currentColor" />
    <rect x="11" y="20" width="2" height="2" rx="0.5" fill="currentColor" />
  </svg>
);

const SavingsIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
    {/* Piggy bank */}
    <ellipse cx="12" cy="14" rx="7" ry="6" fill="currentColor" />
    <circle cx="9" cy="12" r="1.5" fill="white" />
    <circle cx="15" cy="12" r="1.5" fill="white" />
    <ellipse cx="12" cy="16" rx="2" ry="1.5" fill="white" />
    <rect x="11" y="8" width="2" height="3" rx="1" fill="currentColor" />
    <circle cx="12" cy="7" r="1.5" fill="currentColor" />
  </svg>
);

const LoanIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
    {/* Money bag */}
    <path
      d="M8 10C8 8 9.5 7 11 7H13C14.5 7 16 8 16 10V18C16 19 15 20 14 20H10C9 20 8 19 8 18V10Z"
      fill="currentColor"
    />
    <path
      d="M10 7C10 6 10.5 5 11.5 5H12.5C13.5 5 14 6 14 7"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d="M12 11V15M10 13H14"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const features = [
  {
    id: "send-money",
    label: "সেন্ড মানি",
    icon: SendMoneyIcon,
    color:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    id: "mobile-recharge",
    label: "মোবাইল রিচার্জ",
    icon: MobileRechargeIcon,
    color:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  {
    id: "cash-out",
    label: "ক্যাশ আউট",
    icon: CashOutIcon,
    color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  },
  {
    id: "payment",
    label: "পেমেন্ট",
    icon: PaymentIcon,
    color:
      "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    id: "add-money",
    label: "অ্যাড মানি",
    icon: AddMoneyIcon,
    color:
      "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  },
  {
    id: "pay-bill",
    label: "পে বিল",
    icon: PayBillIcon,
    color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  },
  {
    id: "savings",
    label: "সেভিংস",
    icon: SavingsIcon,
    color:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  {
    id: "loan",
    label: "লোন",
    icon: LoanIcon,
    color: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  },
];

export function FeatureGrid({ onFeatureClick, onSeeMore }) {
  return (
    <div className="dark:bg-dark-900 bg-white px-4 py-6">
      <div className="grid grid-cols-4 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <button
              key={feature.id}
              onClick={() => onFeatureClick?.(feature.id)}
              className="flex flex-col items-center gap-2 transition-transform active:scale-95"
            >
              <div
                className={clsx(
                  "flex size-16 items-center justify-center rounded-2xl shadow-sm transition-all hover:shadow-md",
                  feature.color,
                )}
              >
                <Icon className="size-8" />
              </div>
              <span className="dark:text-dark-200 text-center text-xs leading-tight font-semibold text-gray-700">
                {feature.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* See More Link */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={onSeeMore}
          className="dark:bg-dark-800 flex items-center gap-2 rounded-full border-2 border-purple-200 bg-white px-6 py-2.5 text-sm font-semibold text-purple-600 shadow-sm transition-all hover:border-purple-300 hover:bg-purple-50 hover:shadow-md active:scale-95 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20"
        >
          <span>আরো দেখুন</span>
          <ChevronDownIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}

FeatureGrid.propTypes = {
  onFeatureClick: PropTypes.func,
  onSeeMore: PropTypes.func,
};
