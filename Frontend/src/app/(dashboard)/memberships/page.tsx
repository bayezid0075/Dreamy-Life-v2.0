'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Crown, Check, Loader2, Sparkles, ChevronLeft, Zap, Star, TrendingUp, Shield } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useAuthStore } from '@/store';
import { membershipsApi, usersApi } from '@/lib/api';
import type { Membership } from '@/types';

const membershipFeatures: Record<string, string[]> = {
  Basic: [
    'Access to basic features',
    'Commission up to Level 3',
    'Standard support',
  ],
  Standard: [
    'All Basic features',
    'Commission up to Level 5',
    'Priority support',
    'Exclusive deals access',
  ],
  Smart: [
    'All Standard features',
    'Commission up to Level 7',
    'Premium support',
    'Early access to new products',
    'Special discounts',
  ],
  VVIP: [
    'All Smart features',
    'Commission up to Level 10',
    'VIP support 24/7',
    'Maximum commission rates',
    'Exclusive VVIP events',
    'Personal account manager',
  ],
};

const membershipColors: Record<string, string> = {
  Basic: 'from-blue-500 via-blue-600 to-indigo-600',
  Standard: 'from-purple-500 via-purple-600 to-fuchsia-600',
  Smart: 'from-fuchsia-500 via-pink-600 to-rose-600',
  VVIP: 'from-amber-500 via-orange-600 to-red-600',
};

const membershipBgColors: Record<string, string> = {
  Basic: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
  Standard: 'from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30',
  Smart: 'from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/30 dark:to-pink-950/30',
  VVIP: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
};

const membershipIcons: Record<string, typeof Crown> = {
  Basic: Shield,
  Standard: Crown,
  Smart: Zap,
  VVIP: Sparkles,
};

// Most popular plan (adjust as needed)
const MOST_POPULAR = 'Smart';

// Force Tailwind to include gradient classes (dynamic concatenation is purged otherwise)
const TAILWIND_SAFELIST_GRADIENTS =
  ' from-blue-500 via-blue-600 to-indigo-600 from-purple-500 via-purple-600 to-fuchsia-600 from-fuchsia-500 via-pink-600 to-rose-600 from-amber-500 via-orange-600 to-red-600 from-gray-500 via-gray-600 to-gray-700' +
  ' from-blue-50 to-indigo-50 from-purple-50 to-fuchsia-50 from-fuchsia-50 to-pink-50 from-amber-50 to-orange-50 from-gray-50 to-gray-100' +
  ' dark:from-blue-950/30 dark:to-indigo-950/30 dark:from-purple-950/30 dark:to-fuchsia-950/30 dark:from-fuchsia-950/30 dark:to-pink-950/30 dark:from-amber-950/30 dark:to-orange-950/30 dark:from-gray-950/30 dark:to-gray-900/30';

export default function MembershipsPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: rawMemberships, isLoading, isError, refetch } = useQuery({
    queryKey: ['memberships'],
    queryFn: async () => {
      const res = await membershipsApi.getMemberships();
      return Array.isArray(res) ? res : [];
    },
  });
  const memberships = Array.isArray(rawMemberships) ? rawMemberships : [];

  const purchaseMutation = useMutation({
    mutationFn: membershipsApi.createPayment,
    onSuccess: (data) => {
      window.location.href = data.payment_url;
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to create payment');
      setIsDialogOpen(false);
    },
  });

  const handlePurchase = (membership: Membership) => {
    setSelectedMembership(membership);
    setIsDialogOpen(true);
  };

  const confirmPurchase = () => {
    if (selectedMembership) {
      purchaseMutation.mutate(selectedMembership.id);
    }
  };

  const isCurrentMembership = (membershipName: string) => {
    return user?.member_status === membershipName;
  };

  const isPurchased = (membershipName: string) => {
    const order = ['user', 'Basic', 'Standard', 'Smart', 'VVIP'];
    const currentIndex = order.indexOf(user?.member_status || 'user');
    const membershipIndex = order.indexOf(membershipName);
    return membershipIndex <= currentIndex && user?.member_status !== 'user';
  };

  const normalizedName = (name: string) =>
    name === 'VVIP' ? 'VVIP' : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 pb-6 md:pb-8">
      <div className={`hidden ${TAILWIND_SAFELIST_GRADIENTS}`} aria-hidden />
      <div className="px-3 py-4 sm:px-4 sm:py-5 md:px-0 md:py-0 space-y-4 sm:space-y-5 md:space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-800/50 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all active:scale-95"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 bg-clip-text text-transparent">
            Membership Plans
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-0.5">
            Upgrade to unlock exclusive benefits and rewards
          </p>
        </div>
      </div>

      {/* Current Status - Enhanced */}
      <Card className="relative overflow-hidden border-0 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 opacity-90" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:16px_16px] opacity-30" />

        <CardContent className="relative flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-4 sm:p-5 md:p-6 text-white">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-2 ring-white/30">
            <Crown className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs sm:text-sm opacity-90">Current Membership Status</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold mt-0.5">
              {user?.member_status || 'Free User'}
            </p>
          </div>
          {user?.active_membership && (
            <Badge className="bg-white/20 hover:bg-white/30 border-white/30 backdrop-blur-sm text-white">
              Active since{' '}
              {new Date(user.active_membership.purchased_at).toLocaleDateString()}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Membership Plans - Enhanced Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-0 shadow-lg">
              <CardHeader className="p-4 sm:p-5 md:p-6">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-32 mt-2" />
              </CardHeader>
              <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                <div className="space-y-2">
                  {[...Array(4)].map((_, j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-4 sm:p-5 md:p-6 pt-0">
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="border border-red-200 dark:border-red-900/50 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">Could not load plans</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Check your connection and try again.
            </p>
            <Button onClick={() => refetch()} className="mt-4" variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : memberships.length === 0 ? (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Crown className="h-14 w-14 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No plans available</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Membership plans are not configured yet. Please try again later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {memberships.map((membership) => {
            const nameKey = normalizedName(membership.name);
            const features = membershipFeatures[membership.name] || membershipFeatures[nameKey] || [];
            const colorClass = membershipColors[membership.name] || membershipColors[nameKey] || 'from-gray-500 via-gray-600 to-gray-700';
            const bgColorClass = membershipBgColors[membership.name] || membershipBgColors[nameKey] || 'from-gray-50 to-gray-100 dark:from-gray-950/30 dark:to-gray-900/30';
            const IconComponent = membershipIcons[membership.name] || membershipIcons[nameKey] || Crown;
            const isCurrent = isCurrentMembership(membership.name);
            const alreadyPurchased = isPurchased(membership.name);
            const isPopular = membership.name === MOST_POPULAR;
            const isVVIP = membership.name === 'VVIP';

            return (
              <Card
                key={membership.id}
                className={`relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
                  isCurrent ? 'ring-2 ring-violet-500 ring-offset-2' : ''
                } ${isPopular || isVVIP ? 'lg:scale-105' : ''}`}
              >
                {/* Top Gradient Border */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClass}`} />

                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${bgColorClass} opacity-50`} />

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] opacity-50" />

                {/* Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
                  {isCurrent && (
                    <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white border-0 shadow-lg text-[10px] sm:text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      Current Plan
                    </Badge>
                  )}
                  {isPopular && !isCurrent && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-lg animate-pulse text-[10px] sm:text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  )}
                  {isVVIP && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-lg text-[10px] sm:text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>

                <CardHeader className="relative p-4 sm:p-5 md:p-6 pb-3 sm:pb-4">
                  {/* Icon Badge */}
                  <div className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${colorClass} px-3 py-1.5 sm:px-4 sm:py-2 text-white w-fit shadow-lg text-sm sm:text-base`}>
                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="font-bold">{membership.name}</span>
                  </div>

                  {/* Price */}
                  <div className="mt-3 sm:mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r ${colorClass} bg-clip-text text-transparent`}>
                        ৳{parseFloat(membership.price).toLocaleString()}
                      </span>
                    </div>
                    <CardDescription className="mt-1 sm:mt-2 text-xs sm:text-sm line-clamp-2">
                      {membership.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="relative p-4 sm:p-5 md:p-6 pt-0">
                  <div className="space-y-0.5 sm:space-y-1 mb-4">
                    <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                      What's Included:
                    </p>
                  </div>
                  <ul className="space-y-2 sm:space-y-2.5">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                        <div className={`flex-shrink-0 h-5 w-5 sm:h-5 sm:w-5 rounded-full bg-gradient-to-r ${colorClass} flex items-center justify-center mt-0.5`}>
                          <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                        </div>
                        <span className="flex-1 leading-tight sm:leading-normal">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Value Indicator for Popular Plan */}
                  {isPopular && !isCurrent && (
                    <div className="mt-4 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-950/30 dark:to-red-950/30 border border-orange-200 dark:border-orange-800">
                      <p className="text-[10px] sm:text-xs font-medium text-orange-900 dark:text-orange-400 flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        Best value for money!
                      </p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="relative p-4 sm:p-5 md:p-6 pt-0">
                  <Button
                    className={`w-full h-10 sm:h-11 text-sm sm:text-base font-semibold transition-all duration-300 ${
                      alreadyPurchased
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        : `bg-gradient-to-r ${colorClass} hover:opacity-90 text-white shadow-lg hover:shadow-xl`
                    }`}
                    disabled={alreadyPurchased || purchaseMutation.isPending}
                    onClick={() => handlePurchase(membership)}
                  >
                    {alreadyPurchased ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Already Purchased
                      </>
                    ) : isCurrent ? (
                      <>
                        <Crown className="mr-2 h-4 w-4" />
                        Current Plan
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Upgrade Now
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog - Enhanced */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-center">
              <div className={`h-16 w-16 rounded-full bg-gradient-to-r ${membershipColors[selectedMembership ? normalizedName(selectedMembership.name) : 'Basic']} flex items-center justify-center shadow-lg`}>
                {selectedMembership?.name === 'VVIP' ? (
                  <Sparkles className="h-8 w-8 text-white" />
                ) : (
                  <Crown className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
            <DialogTitle className="text-center text-xl sm:text-2xl">
              Confirm Your Purchase
            </DialogTitle>
            <DialogDescription className="text-center text-sm sm:text-base">
              You're about to upgrade to the <span className="font-bold text-foreground">{selectedMembership?.name}</span> membership
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Price Highlight */}
            <div className="rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 p-4 sm:p-6 text-center border border-violet-200 dark:border-violet-800">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                ৳{parseFloat(selectedMembership?.price || '0').toLocaleString()}
              </p>
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-400">
                  Secure Payment Gateway
                </p>
                <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-500 mt-0.5">
                  You'll be redirected to complete your payment securely
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={purchaseMutation.isPending}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPurchase}
              disabled={purchaseMutation.isPending}
              className={`w-full sm:w-auto bg-gradient-to-r ${membershipColors[selectedMembership ? normalizedName(selectedMembership.name) : 'Basic']} hover:opacity-90 text-white shadow-lg order-1 sm:order-2`}
            >
              {purchaseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Proceed to Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
