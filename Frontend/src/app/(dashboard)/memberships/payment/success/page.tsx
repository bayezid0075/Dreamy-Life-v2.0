'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { membershipsApi, usersApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import { toast } from 'sonner';

export default function MembershipPaymentSuccessPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const invoiceId = searchParams.get('invoice_id');
  const transactionId = searchParams.get('transaction_id');

  useEffect(() => {
    const run = async () => {
      if (invoiceId || transactionId) {
        try {
          const data = await membershipsApi.verifyPayment(
            invoiceId ? { invoice_id: invoiceId } : { transaction_id: transactionId! }
          );
          if (data.status === 'success') {
            setStatus('success');
            setMessage(data.message || 'Membership purchased successfully!');
            const userInfo = await usersApi.getUserInfo();
            setUser(userInfo);
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['account-status'] });
            toast.success(data.message);
          } else {
            setStatus('error');
            setMessage((data as { message?: string }).message || 'Payment not completed.');
          }
        } catch (err) {
          const e = err as { response?: { data?: { error?: string } } };
          setStatus('error');
          setMessage(e.response?.data?.error || 'Verification failed');
          toast.error(e.response?.data?.error || 'Verification failed');
        }
      } else {
        setStatus('error');
        setMessage('No payment reference (invoice_id or transaction_id) received.');
      }
    };
    run();
  }, [invoiceId, transactionId, setUser, queryClient]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      {status === 'loading' && (
        <>
          <Loader2 className="h-16 w-16 text-violet-500 animate-spin mb-4" />
          <p className="text-muted-foreground">Verifying your payment...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Payment Successful</h1>
          <p className="text-muted-foreground text-center mb-6">{message}</p>
          <Button asChild className="bg-gradient-to-r from-violet-600 to-fuchsia-600">
            <Link href="/memberships">Back to Memberships</Link>
          </Button>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="text-destructive text-center mb-6">{message}</p>
          <Button asChild variant="outline">
            <Link href="/memberships">Back to Memberships</Link>
          </Button>
        </>
      )}
    </div>
  );
}
