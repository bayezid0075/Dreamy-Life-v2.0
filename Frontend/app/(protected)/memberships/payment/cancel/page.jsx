"use client";

import { useRouter } from "next/navigation";
import { Page } from "components/shared/Page";
import { Button } from "components/ui";
import {
  XCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <Page title="Payment Cancelled">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
        <div className="w-full rounded-2xl border-2 border-yellow-200 bg-white p-6 text-center shadow-lg dark:border-yellow-800/50 dark:bg-dark-800">
          <div className="mb-4 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <XCircleIcon className="text-yellow-600 dark:text-yellow-400 size-10" />
            </div>
          </div>
          <h2 className="dark:text-dark-50 mb-2 text-2xl font-bold text-gray-900">
            Payment Cancelled
          </h2>
          <p className="dark:text-dark-300 mb-6 text-sm text-gray-600">
            Your payment was cancelled. No charges were made to your account.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push("/memberships")}
              variant="filled"
              color="primary"
              className="w-full"
            >
              Back to Memberships
              <ArrowLeftIcon className="ml-2 size-5" />
            </Button>
            <Button
              onClick={() => router.push("/user_dashboard")}
              variant="outlined"
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </Page>
  );
}

