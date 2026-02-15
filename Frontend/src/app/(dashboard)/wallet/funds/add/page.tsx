'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { ChevronLeft, Coins, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { walletsApi } from '@/lib/api';

export default function AddFundsPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');

  const createPayment = useMutation({
    mutationFn: () => {
      const num = parseFloat(amount.replace(/,/g, ''));
      if (!Number.isFinite(num) || num < 10) throw new Error('Minimum amount is ৳10');
      return walletsApi.createAddFundsPayment(num);
    },
    onSuccess: (data) => {
      if (data.payment_url) {
        toast.success('Redirecting to payment...');
        window.location.href = data.payment_url;
      } else {
        toast.error('No payment link received');
      }
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(e.response?.data?.error || e.message || 'Failed to create payment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPayment.mutate();
  };

  const numAmount = parseFloat(amount.replace(/,/g, ''));
  const isValid = Number.isFinite(numAmount) && numAmount >= 10;

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 px-3 py-4 sm:px-4 sm:py-5 md:px-0 md:py-0 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg">
              <Coins className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Add Funds
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Enter amount and pay via gateway
              </p>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:via-teal-500/20 dark:to-cyan-500/20 border border-emerald-200/50 dark:border-emerald-800/50">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Amount</CardTitle>
            <CardDescription>
              Minimum ৳10. You will be redirected to the payment gateway.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Amount (৳)
                </Label>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="h-12 text-lg font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
                {amount && !isValid && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    Minimum amount is ৳10
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={!isValid || createPayment.isPending}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/20"
              >
                {createPayment.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>Continue to Payment</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center">
          <Link href="/wallet" className="text-sm text-muted-foreground hover:underline">
            Back to Wallet
          </Link>
        </p>
      </div>
    </div>
  );
}
