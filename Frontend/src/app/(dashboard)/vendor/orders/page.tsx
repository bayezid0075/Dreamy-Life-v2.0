'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { vendorsApi } from '@/lib/api';
import type { Order } from '@/types';

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: {
    label: 'Pending',
    color:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmed',
    color:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: CheckCircle2,
  },
  processing: {
    label: 'Processing',
    color:
      'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
    icon: Loader2,
  },
  shipped: {
    label: 'Shipped',
    color:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    color:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircle,
  },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: {
    label: 'Unpaid',
    color:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  },
  paid: {
    label: 'Paid',
    color:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  refunded: {
    label: 'Refunded',
    color:
      'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
  },
};

export default function VendorOrdersPage() {
  const router = useRouter();
  const {
    data: orders,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['vendor-orders'],
    queryFn: vendorsApi.getVendorOrders,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 sm:h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const totalOrders = orders?.length ?? 0;
  const pendingOrders =
    orders?.filter(
      (o) => o.order_status === 'pending' || o.order_status === 'confirmed'
    ).length ?? 0;
  const deliveredOrders =
    orders?.filter((o) => o.order_status === 'delivered').length ?? 0;
  const totalRevenue =
    orders?.reduce((sum, o) => sum + parseFloat(o.total_amount), 0) ?? 0;

  const stats = [
    {
      title: 'Total Orders',
      value: totalOrders,
      icon: ShoppingCart,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/20',
    },
    {
      title: 'Pending',
      value: pendingOrders,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/20',
    },
    {
      title: 'Delivered',
      value: deliveredOrders,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20',
    },
    {
      title: 'Revenue',
      value: `\u09F3${totalRevenue.toLocaleString()}`,
      icon: Package,
      gradient: 'from-pink-500 to-rose-600',
      shadow: 'shadow-pink-500/20',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 px-4 py-4 md:px-0 md:py-0">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Vendor Orders</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Orders containing your products from customers
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="relative overflow-hidden border-0 shadow-lg"
          >
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow}`}
                >
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                {stat.title}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders List */}
      {totalOrders === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-8 pb-8 sm:pt-12 sm:pb-12 text-center px-4 sm:px-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/20 flex items-center justify-center mb-3 sm:mb-4">
              <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-violet-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No Orders Yet</h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto">
              When customers purchase your products, their orders will appear
              here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">All Orders</CardTitle>
            <CardDescription>
              {totalOrders} order{totalOrders !== 1 ? 's' : ''} total
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-b bg-muted/40">
                    <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">
                      Order #
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">
                      Customer
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">
                      Items
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">
                      Total
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">
                      Payment
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders?.map((order) => {
                    const status =
                      statusConfig[order.order_status] ??
                      statusConfig['pending'];
                    const payment =
                      paymentStatusConfig[order.payment_status] ??
                      paymentStatusConfig['pending'];

                    return (
                      <tr
                        key={order.id}
                        className="border-b last:border-b-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-medium">
                            {order.order_number}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium">
                            {order.customer_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.customer_phone}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm">
                            {order.items?.length ?? 0} item
                            {(order.items?.length ?? 0) !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold">
                            &#x09F3;{parseFloat(order.total_amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="secondary"
                            className={`${status.color} border-0 text-xs`}
                          >
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="secondary"
                            className={`${payment.color} border-0 text-xs`}
                          >
                            {payment.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              {orders?.map((order) => {
                const status =
                  statusConfig[order.order_status] ?? statusConfig['pending'];
                const payment =
                  paymentStatusConfig[order.payment_status] ??
                  paymentStatusConfig['pending'];

                return (
                  <div key={order.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-medium">
                        {order.order_number}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`${status.color} border-0 text-xs`}
                      >
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.items?.length ?? 0} item
                          {(order.items?.length ?? 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          &#x09F3;{parseFloat(order.total_amount).toLocaleString()}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`${payment.color} border-0 text-[10px] px-1.5 py-0`}
                        >
                          {payment.label}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
