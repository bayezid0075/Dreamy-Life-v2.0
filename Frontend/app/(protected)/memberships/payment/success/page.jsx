"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Page } from "components/shared/Page";
import { Button } from "components/ui";
import axios from "utils/axios";
import {
  CheckCircleIcon,
  ArrowRightIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuthContext } from "app/contexts/auth/context";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthContext();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);
  const [membershipName, setMembershipName] = useState(null);

  const transactionId = searchParams.get("transactionId");
  const status = searchParams.get("status");
  const paymentAmount = searchParams.get("paymentAmount");
  const paymentMethod = searchParams.get("paymentMethod");

  useEffect(() => {
    if (!transactionId) {
      setError("Transaction ID not found");
      setVerifying(false);
      return;
    }

    if (status === "success") {
      verifyPayment();
    } else {
      setError("Payment was not successful");
      setVerifying(false);
    }
  }, [transactionId, status]);

  const verifyPayment = async () => {
    try {
      setVerifying(true);
      setError(null);

      const response = await axios.post("/api/memberships/payment/verify/", {
        transaction_id: transactionId,
      });

      if (response.data.status === "success") {
        setVerified(true);
        setMembershipName(response.data.membership);
      } else if (response.data.status === "pending") {
        setError("Payment is pending. Please wait for confirmation.");
      } else {
        setError(response.data.error || "Payment verification failed");
      }
    } catch (err) {
      console.error("Error verifying payment:", err);
      setError(
        err.response?.data?.error ||
          "Failed to verify payment. Please contact support."
      );
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Page title="Payment Success">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
        <div className="w-full rounded-2xl border-2 border-green-200 bg-white p-6 text-center shadow-lg dark:border-green-800/50 dark:bg-dark-800">
          {verifying ? (
            <>
              <div className="mb-4 flex justify-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <div className="size-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                </div>
              </div>
              <h2 className="dark:text-dark-50 mb-2 text-2xl font-bold text-gray-900">
                Verifying Payment...
              </h2>
              <p className="dark:text-dark-300 text-sm text-gray-600">
                Please wait while we verify your payment
              </p>
            </>
          ) : verified ? (
            <>
              <div className="mb-4 flex justify-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircleIcon className="text-green-600 dark:text-green-400 size-10" />
                </div>
              </div>
              <h2 className="dark:text-dark-50 mb-2 text-2xl font-bold text-gray-900">
                Payment Successful!
              </h2>
              <p className="dark:text-dark-300 mb-4 text-sm text-gray-600">
                {membershipName && (
                  <span className="font-semibold">{membershipName}</span>
                )}{" "}
                membership has been activated successfully.
              </p>
              {paymentAmount && (
                <p className="dark:text-dark-400 mb-6 text-xs text-gray-500">
                  Amount: ৳{parseFloat(paymentAmount).toLocaleString()}
                  {paymentMethod && ` via ${paymentMethod}`}
                </p>
              )}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => router.push("/user_dashboard")}
                  variant="filled"
                  color="success"
                  className="w-full"
                >
                  Go to Dashboard
                  <ArrowRightIcon className="ml-2 size-5" />
                </Button>
                <Button
                  onClick={() => router.push("/memberships")}
                  variant="outlined"
                  className="w-full"
                >
                  View Memberships
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 flex justify-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <XCircleIcon className="text-red-600 dark:text-red-400 size-10" />
                </div>
              </div>
              <h2 className="dark:text-dark-50 mb-2 text-2xl font-bold text-gray-900">
                Verification Failed
              </h2>
              <p className="dark:text-dark-300 mb-6 text-sm text-gray-600">
                {error || "Unable to verify payment. Please contact support."}
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={verifyPayment}
                  variant="filled"
                  color="primary"
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push("/memberships")}
                  variant="outlined"
                  className="w-full"
                >
                  Back to Memberships
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Page>
  );
}

