'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { walletsApi } from '@/lib/api';

export default function AddFundsSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');

  const invoiceId = searchParams.get('invoice_id');

  useEffect(() => {
    if (!invoiceId) {
      setStatus('failed');
      setMessage('No payment reference received.');
      return;
    }
    walletsApi
      .verifyAddFundsPayment(invoiceId)
      .then((data) => {
        if (data.status === 'success') {
          setStatus('success');
          setMessage(data.message || `৳${data.amount || ''} added to Funds.`);
          queryClient.invalidateQueries({ queryKey: ['funds'] });
          toast.success(data.message || 'Funds added successfully!');
        } else {
          setStatus('failed');
          setMessage(data.message || 'Payment could not be confirmed.');
        }
      })
      .catch(() => {
        setStatus('failed');
        setMessage('Verification failed. Your funds may still be added shortly.');
        toast.error('Verification failed');
      });
  }, [invoiceId, queryClient]);

  const goToWallet = () => {
    router.push('/wallet');
  };

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      {status === 'loading' && (
        <>
          <Loader2 className="h-16 w-16 text-emerald-500 animate-spin mb-4" />
          <p className="text-muted-foreground">Confirming your payment...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Payment Successful</h1>
          <p className="text-muted-foreground text-center mb-6 max-w-sm">{message}</p>
          <Button
            onClick={goToWallet}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            asChild
          >
            <Link href="/wallet">Back to Wallet</Link>
          </Button>
        </>
      )}
      {status === 'failed' && (
        <>
          <div className="h-20 w-20 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
            <XCircle className="h-12 w-12 text-rose-600 dark:text-rose-400" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Payment Not Completed</h1>
          <p className="text-muted-foreground text-center mb-6 max-w-sm">{message}</p>
          <Button variant="outline" asChild>
            <Link href="/wallet">Back to Wallet</Link>
          </Button>
        </>
      )}
    </div>
  );
}
