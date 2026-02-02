'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Crown, Check, Loader2, Sparkles } from 'lucide-react';

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
  Basic: 'from-slate-500 to-slate-600',
  Standard: 'from-blue-500 to-blue-600',
  Smart: 'from-purple-500 to-purple-600',
  VVIP: 'from-amber-500 to-amber-600',
};

export default function MembershipsPage() {
  const { user, setUser } = useAuthStore();
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: memberships, isLoading } = useQuery({
    queryKey: ['memberships'],
    queryFn: membershipsApi.getMemberships,
  });

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Memberships</h1>
        <p className="text-muted-foreground">
          Upgrade your membership to unlock more benefits
        </p>
      </div>

      {/* Current Status */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Membership</p>
            <p className="text-xl font-bold">{user?.member_status || 'User'}</p>
          </div>
          {user?.active_membership && (
            <Badge variant="outline" className="ml-auto">
              Active since{' '}
              {new Date(user.active_membership.purchased_at).toLocaleDateString()}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Membership Plans */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(4)].map((_, j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {memberships?.map((membership) => {
            const features = membershipFeatures[membership.name] || [];
            const colorClass = membershipColors[membership.name] || 'from-gray-500 to-gray-600';
            const isCurrent = isCurrentMembership(membership.name);
            const alreadyPurchased = isPurchased(membership.name);

            return (
              <Card
                key={membership.id}
                className={`relative overflow-hidden ${
                  isCurrent ? 'ring-2 ring-primary' : ''
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg">
                      Current
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div
                    className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r ${colorClass} px-3 py-1 text-white w-fit`}
                  >
                    {membership.name === 'VVIP' ? (
                      <Sparkles className="h-4 w-4" />
                    ) : (
                      <Crown className="h-4 w-4" />
                    )}
                    <span className="font-semibold">{membership.name}</span>
                  </div>
                  <CardTitle className="text-3xl mt-2">
                    ৳{parseFloat(membership.price).toLocaleString()}
                  </CardTitle>
                  <CardDescription>{membership.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-2">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={alreadyPurchased ? 'secondary' : 'default'}
                    disabled={alreadyPurchased || purchaseMutation.isPending}
                    onClick={() => handlePurchase(membership)}
                  >
                    {alreadyPurchased ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Purchased
                      </>
                    ) : (
                      'Purchase Now'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              You are about to purchase the {selectedMembership?.name} membership
              for ৳{parseFloat(selectedMembership?.price || '0').toLocaleString()}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You will be redirected to the payment gateway to complete your
              purchase.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={purchaseMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPurchase}
              disabled={purchaseMutation.isPending}
            >
              {purchaseMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Proceed to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
