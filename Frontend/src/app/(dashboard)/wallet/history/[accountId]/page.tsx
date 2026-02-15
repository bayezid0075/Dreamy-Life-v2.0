'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  subDays,
  subMonths,
  startOfDay,
  endOfDay,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import {
  ChevronLeft,
  Wallet,
  Coins,
  Star,
  ArrowDown,
  ArrowUp,
  Calendar,
  TrendingUp,
  TrendingDown,
  Receipt,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { walletsApi } from '@/lib/api';
import type { Transaction } from '@/types';

const ACCOUNT_CONFIG: Record<
  string,
  { title: string; gradient: string; icon: typeof Wallet }
> = {
  wallet: {
    title: 'Wallet',
    gradient: 'from-violet-500 via-fuchsia-500 to-pink-500',
    icon: Wallet,
  },
  funds: {
    title: 'Funds',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    icon: Coins,
  },
  points: {
    title: 'Points',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    icon: Star,
  },
};

const TIME_RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '3d', label: '3 Days' },
  { id: '7d', label: '7 Days' },
  { id: '1m', label: '1 Month' },
  { id: '3m', label: '3 Months' },
  { id: '6m', label: '6 Months' },
  { id: 'all', label: 'All' },
] as const;

type TimeRangeId = (typeof TIME_RANGES)[number]['id'];

function getRangeDates(range: TimeRangeId): { start: Date; end: Date } | null {
  const now = new Date();
  if (range === 'today') {
    return { start: startOfDay(now), end: endOfDay(now) };
  }
  if (range === 'yesterday') {
    const y = subDays(now, 1);
    return { start: startOfDay(y), end: endOfDay(y) };
  }
  if (range === '3d') return { start: startOfDay(subDays(now, 2)), end: endOfDay(now) };
  if (range === '7d') return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
  if (range === '1m') return { start: startOfDay(subMonths(now, 1)), end: endOfDay(now) };
  if (range === '3m') return { start: startOfDay(subMonths(now, 3)), end: endOfDay(now) };
  if (range === '6m') return { start: startOfDay(subMonths(now, 6)), end: endOfDay(now) };
  return null; // all
}

function filterByRange(transactions: Transaction[], range: TimeRangeId): Transaction[] {
  const dates = getRangeDates(range);
  if (!dates) return [...transactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return transactions
    .filter((t) => isWithinInterval(parseISO(t.created_at), { start: dates.start, end: dates.end }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default function WalletHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = (params?.accountId as string) || 'wallet';
  const [timeRange, setTimeRange] = useState<TimeRangeId>('all');

  const config = ACCOUNT_CONFIG[accountId] ?? ACCOUNT_CONFIG.wallet;
  const Icon = config.icon;

  const queryKey = accountId === 'wallet' ? 'wallet' : accountId === 'funds' ? 'funds' : 'points';
  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: () =>
      accountId === 'wallet'
        ? walletsApi.getWallet()
        : accountId === 'funds'
          ? walletsApi.getFunds()
          : walletsApi.getPoints(),
    enabled: !!accountId && ['wallet', 'funds', 'points'].includes(accountId),
  });

  const transactions = data?.transactions ?? [];
  const filtered = useMemo(() => filterByRange(transactions, timeRange), [transactions, timeRange]);

  const summary = useMemo(() => {
    let credit = 0;
    let debit = 0;
    filtered.forEach((t) => {
      const amt = parseFloat(t.amount);
      if (t.transaction_type === 'credit') credit += amt;
      else debit += amt;
    });
    const max = Math.max(credit, debit, 1);
    return { credit, debit, total: credit - debit, max };
  }, [filtered]);

  if (!['wallet', 'funds', 'points'].includes(accountId)) {
    router.replace('/wallet');
    return null;
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 pb-6 md:pb-8">
      <div className="px-3 py-4 sm:px-4 sm:py-5 md:px-0 md:py-0 space-y-4 sm:space-y-5 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${config.gradient} shadow-lg`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {config.title} History
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Debit & credit transactions
              </p>
            </div>
          </div>
        </div>

        {/* Time range pills */}
        <div className="flex flex-wrap gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          {TIME_RANGES.map((r) => (
            <Button
              key={r.id}
              variant={timeRange === r.id ? 'default' : 'outline'}
              size="sm"
              className={`rounded-full text-xs font-medium transition-all ${
                timeRange === r.id
                  ? `bg-gradient-to-r ${config.gradient} text-white border-0 shadow-md`
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              onClick={() => setTimeRange(r.id)}
            >
              {r.label}
            </Button>
          ))}
        </div>

        {/* Summary card with visual */}
        <Card className={`relative overflow-hidden border-0 shadow-xl bg-gradient-to-br ${config.gradient}`}>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:20px_20px] opacity-50 pointer-events-none" />
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-medium text-white/90 flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full bg-white/20 rounded-xl" />
                <Skeleton className="h-8 w-3/4 bg-white/20 rounded-lg" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="rounded-xl bg-white/20 backdrop-blur-sm p-3 sm:p-4 border border-white/30">
                    <div className="flex items-center gap-2 text-white/80 text-xs sm:text-sm font-medium">
                      <TrendingUp className="h-4 w-4" />
                      Credit
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-emerald-200 mt-1">
                      +৳{summary.credit.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/20 backdrop-blur-sm p-3 sm:p-4 border border-white/30">
                    <div className="flex items-center gap-2 text-white/80 text-xs sm:text-sm font-medium">
                      <TrendingDown className="h-4 w-4" />
                      Debit
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-rose-200 mt-1">
                      -৳{summary.debit.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Bar visual */}
                <div className="space-y-2">
                  <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-white/20">
                    <div
                      className="h-full bg-emerald-400/90 rounded-l-full transition-all duration-500"
                      style={{ width: `${(summary.credit / summary.max) * 100}%` }}
                    />
                    <div
                      className="h-full bg-rose-400/90 rounded-r-full transition-all duration-500"
                      style={{ width: `${(summary.debit / summary.max) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] sm:text-xs text-white/70 text-center">
                    Credit vs Debit · Net: {summary.total >= 0 ? '+' : ''}৳{summary.total.toLocaleString()}
                  </p>
                </div>

                <p className="text-xs text-white/60">
                  {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} in selected period
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Transactions list */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-700">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No transactions</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No debit or credit in this period
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {filtered.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-all"
                  >
                    <div
                      className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl flex-shrink-0 ${
                        t.transaction_type === 'credit'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {t.transaction_type === 'credit' ? (
                        <ArrowDown className="h-5 w-5" />
                      ) : (
                        <ArrowUp className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                        {t.description || 'Transaction'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(t.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`shrink-0 text-xs ${
                        t.transaction_type === 'credit'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400'
                      }`}
                    >
                      {t.transaction_type}
                    </Badge>
                    <span
                      className={`font-bold text-sm sm:text-base shrink-0 ${
                        t.transaction_type === 'credit'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {t.transaction_type === 'credit' ? '+' : '-'}৳
                      {parseFloat(t.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button variant="outline" asChild className="rounded-xl">
            <Link href="/wallet">Back to Wallet</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
