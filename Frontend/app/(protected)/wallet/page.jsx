"use client";

import { useState, useEffect } from "react";
import { Page } from "components/shared/Page";
import PropTypes from "prop-types";
import clsx from "clsx";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";
import dayjs from "dayjs";
import { Card } from "components/ui";
import axios from "utils/axios";
import { useAuthContext } from "app/contexts/auth/context";

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
        <p className="text-3xl leading-tight font-bold text-white md:text-4xl">
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
        "dark:border-dark-600 dark:bg-dark-800 dark:hover:bg-dark-700 flex items-center gap-4 border-b border-l-4 border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-gray-50",
        colors.border,
      )}
    >
      {/* Color Indicator */}
      <div className={clsx("size-3 shrink-0 rounded-full", colors.indicator)} />

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
            <div className="dark:text-dark-400 mt-1 flex items-center gap-3 text-xs text-gray-500">
              <span>{dayjs(transaction.date).format("MMM DD, YYYY")}</span>
              <span>•</span>
              <span>
                {dayjs(
                  `2000-01-01 ${transaction.time}`,
                  "YYYY-MM-DD HH:mm",
                ).format("h:mm A")}
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

// Format currency
const formatCurrency = (amount) => {
  if (typeof amount === "string") {
    const num = parseFloat(amount);
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Transform backend transaction to frontend format
const transformTransaction = (transaction, type) => {
  const date = new Date(transaction.created_at);
  return {
    id: transaction.id,
    type: type,
    amount: formatCurrency(transaction.amount),
    date: date,
    time: dayjs(date).format("HH:mm"),
    source: transaction.description || "Transaction",
    transactionType:
      transaction.transaction_type === "credit" ? "income" : "expense",
  };
};
export default function Wallet() {
  const { user } = useAuthContext();
  const [walletData, setWalletData] = useState(null);
  const [fundsData, setFundsData] = useState(null);
  const [pointsData, setPointsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState([]);

  // Fetch wallet, funds, and points data
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [walletRes, fundsRes, pointsRes] = await Promise.all([
          axios.get("/api/wallets/"),
          axios.get("/api/wallets/funds/"),
          axios.get("/api/wallets/points/"),
        ]);

        setWalletData(walletRes.data);
        setFundsData(fundsRes.data);
        setPointsData(pointsRes.data);

        // Debug: Log the response data
        console.log("Wallet data:", walletRes.data);
        console.log("Funds data:", fundsRes.data);
        console.log("Points data:", pointsRes.data);

        // Combine all transactions
        const walletTransactions = walletRes.data.transactions || [];
        const fundsTransactions = fundsRes.data.transactions || [];
        const pointsTransactions = pointsRes.data.transactions || [];

        console.log("Wallet transactions:", walletTransactions);
        console.log("Funds transactions:", fundsTransactions);
        console.log("Points transactions:", pointsTransactions);

        const transactions = [
          ...walletTransactions.map((t) => transformTransaction(t, "balance")),
          ...fundsTransactions.map((t) => transformTransaction(t, "funds")),
          ...pointsTransactions.map((t) => transformTransaction(t, "points")),
        ];

        console.log("Combined transactions:", transactions);

        // Sort by date (newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAllTransactions(transactions);
      } catch (error) {
        console.error("Error fetching wallet data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [user]);

  if (loading) {
    return (
      <Page title="Wallet">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block size-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="text-gray-600">Loading wallet data...</p>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Wallet">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        {/* Balance Cards Grid */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Main Balance - Purple */}
          <BalanceCard
            title="Balance"
            amount={formatCurrency(walletData?.balance || 0)}
            income={formatCurrency(walletData?.income || 0)}
            expense={formatCurrency(walletData?.expense || 0)}
            bgColor="bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600"
            iconBgColor="bg-purple-700/50"
          />

          {/* Funds - Red-Pink (Rose) */}
          <BalanceCard
            title="Funds"
            amount={formatCurrency(fundsData?.balance || 0)}
            income={formatCurrency(fundsData?.income || 0)}
            expense={formatCurrency(fundsData?.expense || 0)}
            bgColor="bg-gradient-to-br from-rose-600 via-rose-500 to-pink-600"
            iconBgColor="bg-rose-700/50"
          />

          {/* Points - Green */}
          <BalanceCard
            title="Points"
            amount={formatCurrency(pointsData?.balance || 0)}
            income={formatCurrency(pointsData?.income || 0)}
            expense={formatCurrency(pointsData?.expense || 0)}
            bgColor="bg-gradient-to-br from-green-600 via-green-500 to-emerald-600"
            iconBgColor="bg-green-700/50"
          />
        </div>

        {/* Transaction List */}
        <Card className="dark:border-dark-600 overflow-hidden border border-gray-200">
          <div className="dark:bg-dark-800 dark:border-dark-600 border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="dark:text-dark-50 text-lg font-semibold text-gray-900">
              Transaction History
            </h3>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {allTransactions.length > 0 ? (
              allTransactions.map((transaction) => (
                <TransactionItem
                  key={`${transaction.type}-${transaction.id}`}
                  transaction={{
                    amount: transaction.amount,
                    date: transaction.date,
                    time: transaction.time,
                    source: transaction.source,
                    type: transaction.transactionType,
                  }}
                  type={transaction.type}
                />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No transactions found</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Page>
  );
}
