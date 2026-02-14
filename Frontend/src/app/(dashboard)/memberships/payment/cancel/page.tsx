'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function MembershipPaymentCancelPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
        <XCircle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
      </div>
      <h1 className="text-xl font-semibold mb-2">Payment Cancelled</h1>
      <p className="text-muted-foreground text-center mb-6">
        You cancelled the payment. No charge was made.
      </p>
      <Button asChild className="bg-gradient-to-r from-violet-600 to-fuchsia-600">
        <Link href="/memberships">Back to Memberships</Link>
      </Button>
    </div>
  );
}
