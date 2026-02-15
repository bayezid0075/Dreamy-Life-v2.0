'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function AddFundsCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
        <XCircle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
      </div>
      <h1 className="text-xl font-semibold mb-2">Payment Cancelled</h1>
      <p className="text-muted-foreground text-center mb-6 max-w-sm">
        You cancelled the payment. No amount was charged. You can add funds anytime from the Funds card.
      </p>
      <Button
        onClick={() => router.push('/wallet')}
        variant="outline"
        asChild
      >
        <Link href="/wallet">Back to Wallet</Link>
      </Button>
    </div>
  );
}
