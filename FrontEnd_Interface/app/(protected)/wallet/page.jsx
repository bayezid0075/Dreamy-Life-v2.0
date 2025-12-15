"use client";

import { Page } from "components/shared/Page";
import PropTypes from "prop-types";
import clsx from "clsx";
import {
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import dayjs from "dayjs";
import { Card } from "components/ui";

// Balance Card Component
function BalanceCard({
  title,
  amount,
  change,
  income,
  expense,
  bgColor,
  iconBgColor,
}) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl p-5 text-white shadow-xl",
        bgColor,
      )}
    >
      {/* Title */}
      <div className="mb-4">
        <h3 className="text-base font-medium text-white/90">{title}</h3>
      </div>

      {/* Balance Amount */}
      <div className="mb-2">
        <p className="text-3xl font-bold leading-tight text-white md:text-4xl">
          {amount}
        </p>
      </div>

      {/* Percentage Change */}
      {change && (
        <div className="mb-6">
          <p className="text-sm font-medium text-white/90">{change}</p>
        </div>
      )}

      {/* Income and Expense Section */}
      <div className="flex items-center justify-between gap-4 border-t border-white/20 pt-4">
        {/* Income */}
        <div className="flex flex-1 items-center gap-2">
          <div
            className={clsx(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              iconBgColor,
            )}
          >
            <ArrowUpIcon className="size-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white/80">Income</p>
            <p className="text-sm font-semibold text-white">{income}</p>
          </div>
        </div>

        {/* Expense */}
        <div className="flex flex-1 items-center gap-2">
          <div
            className={clsx(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              iconBgColor,
            )}
          >
            <ArrowDownIcon className="size-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white/80">Expense</p>
            <p className="text-sm font-semibold text-white">{expense}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

BalanceCard.propTypes = {
  title: PropTypes.string.isRequired,
  amount: PropTypes.string.isRequired,
  change: PropTypes.string,
  income: PropTypes.string.isRequired,
  expense: PropTypes.string.isRequired,
  bgColor: PropTypes.string.isRequired,
  iconBgColor: PropTypes.string.isRequired,
};

// Transaction Item Component
function TransactionItem({ transaction, type }) {
  const typeColors = {
    balance: {
      border: "border-l-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/10",
      text: "text-purple-700 dark:text-purple-400",
      indicator: "bg-purple-600",
    },
    funds: {
      border: "border-l-rose-600",
      bg: "bg-rose-50 dark:bg-rose-900/10",
      text: "text-rose-700 dark:text-rose-400",
      indicator: "bg-rose-600",
    },
    points: {
      border: "border-l-green-600",
      bg: "bg-green-50 dark:bg-green-900/10",
      text: "text-green-700 dark:text-green-400",
      indicator: "bg-green-600",
    },
  };

  const colors = typeColors[type] || typeColors.balance;
  const isIncome = transaction.type === "income";

  return (
    <div
      className={clsx(
        "dark:border-dark-600 flex items-center gap-4 border-l-4 border-b border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700",
        colors.border,
      )}
    >
      {/* Color Indicator */}
      <div
        className={clsx(
          "size-3 shrink-0 rounded-full",
          colors.indicator,
        )}
      />

      {/* Transaction Icon */}
      <div
        className={clsx(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          isIncome
            ? "bg-green-100 dark:bg-green-900/20"
            : "bg-red-100 dark:bg-red-900/20",
        )}
      >
        {isIncome ? (
          <ArrowUpIcon
            className={clsx(
              "size-5",
              isIncome
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400",
            )}
          />
        ) : (
          <ArrowDownIcon
            className={clsx(
              "size-5",
              isIncome
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400",
            )}
          />
        )}
      </div>

      {/* Transaction Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="dark:text-dark-100 truncate text-sm font-semibold text-gray-900">
              {transaction.source}
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-dark-400">
              <span>{dayjs(transaction.date).format("MMM DD, YYYY")}</span>
              <span>•</span>
              <span>
                {dayjs(`2000-01-01 ${transaction.time}`, "YYYY-MM-DD HH:mm").format("h:mm A")}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={clsx(
                "text-sm font-bold",
                isIncome
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              {isIncome ? "+" : "-"}
              {transaction.amount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

TransactionItem.propTypes = {
  transaction: PropTypes.shape({
    amount: PropTypes.string.isRequired,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
      .isRequired,
    time: PropTypes.string.isRequired,
    source: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["income", "expense"]).isRequired,
  }).isRequired,
  type: PropTypes.oneOf(["balance", "funds", "points"]).isRequired,
};

// Sample transaction data
const sampleTransactions = [
  // Balance transactions
  {
    id: 1,
    type: "balance",
    amount: "$1,250.00",
    date: new Date(),
    time: "14:30",
    source: "Salary Payment",
    transactionType: "income",
  },
  {
    id: 2,
    type: "balance",
    amount: "$450.50",
    date: new Date(Date.now() - 86400000),
    time: "10:15",
    source: "Online Purchase",
    transactionType: "expense",
  },
  {
    id: 3,
    type: "balance",
    amount: "$2,100.00",
    date: new Date(Date.now() - 2 * 86400000),
    time: "09:00",
    source: "Freelance Work",
    transactionType: "income",
  },
  {
    id: 4,
    type: "balance",
    amount: "$125.00",
    date: new Date(Date.now() - 3 * 86400000),
    time: "16:45",
    source: "Grocery Store",
    transactionType: "expense",
  },
  // Funds transactions
  {
    id: 5,
    type: "funds",
    amount: "$800.00",
    date: new Date(),
    time: "11:20",
    source: "Investment Return",
    transactionType: "income",
  },
  {
    id: 6,
    type: "funds",
    amount: "$300.00",
    date: new Date(Date.now() - 86400000),
    time: "13:10",
    source: "Fund Transfer",
    transactionType: "expense",
  },
  {
    id: 7,
    type: "funds",
    amount: "$1,500.00",
    date: new Date(Date.now() - 2 * 86400000),
    time: "08:30",
    source: "Deposit",
    transactionType: "income",
  },
  {
    id: 8,
    type: "funds",
    amount: "$200.00",
    date: new Date(Date.now() - 4 * 86400000),
    time: "15:20",
    source: "Withdrawal",
    transactionType: "expense",
  },
  // Points transactions
  {
    id: 9,
    type: "points",
    amount: "$500.00",
    date: new Date(),
    time: "12:00",
    source: "Reward Points",
    transactionType: "income",
  },
  {
    id: 10,
    type: "points",
    amount: "$150.00",
    date: new Date(Date.now() - 86400000),
    time: "14:00",
    source: "Points Redeemed",
    transactionType: "expense",
  },
  {
    id: 11,
    type: "points",
    amount: "$750.00",
    date: new Date(Date.now() - 2 * 86400000),
    time: "10:30",
    source: "Bonus Points",
    transactionType: "income",
  },
  {
    id: 12,
    type: "points",
    amount: "$100.00",
    date: new Date(Date.now() - 3 * 86400000),
    time: "17:15",
    source: "Points Used",
    transactionType: "expense",
  },
  {
    id: 13,
    type: "balance",
    amount: "$350.00",
    date: new Date(Date.now() - 5 * 86400000),
    time: "09:45",
    source: "Cashback",
    transactionType: "income",
  },
  {
    id: 14,
    type: "funds",
    amount: "$180.00",
    date: new Date(Date.now() - 5 * 86400000),
    time: "11:30",
    source: "Service Fee",
    transactionType: "expense",
  },
  {
    id: 15,
    type: "points",
    amount: "$250.00",
    date: new Date(Date.now() - 6 * 86400000),
    time: "13:00",
    source: "Referral Bonus",
    transactionType: "income",
  },
];

export default function Wallet() {
  // Sort transactions by date (newest first)
  const sortedTransactions = [...sampleTransactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  return (
    <Page title="Wallet">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        {/* Balance Cards Grid */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Main Balance - Purple */}
          <BalanceCard
            title="Balance"
            amount="$6,556.55"
            change="+ 3.5%"
            income="$2,225.22"
            expense="$225.22"
            bgColor="bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600"
            iconBgColor="bg-purple-700/50"
          />

          {/* Funds - Red-Pink (Rose) */}
          <BalanceCard
            title="Funds"
            amount="$6,556.55"
            change="+ 3.5%"
            income="$2,225.22"
            expense="$225.22"
            bgColor="bg-gradient-to-br from-rose-600 via-rose-500 to-pink-600"
            iconBgColor="bg-rose-700/50"
          />

          {/* Points - Green */}
          <BalanceCard
            title="Points"
            amount="$6,556.55"
            change="+ 3.5%"
            income="$2,225.22"
            expense="$225.22"
            bgColor="bg-gradient-to-br from-green-600 via-green-500 to-emerald-600"
            iconBgColor="bg-green-700/50"
          />
        </div>

        {/* Transaction List */}
        <Card className="dark:border-dark-600 overflow-hidden border border-gray-200">
          <div className="dark:bg-dark-800 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-dark-600">
            <h3 className="dark:text-dark-50 text-lg font-semibold text-gray-900">
              Transaction History
            </h3>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {sortedTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={{
                  amount: transaction.amount,
                  date: transaction.date,
                  time: transaction.time,
                  source: transaction.source,
                  type: transaction.transactionType,
                }}
                type={transaction.type}
              />
            ))}
          </div>
        </Card>
      </div>
    </Page>
  );
}

