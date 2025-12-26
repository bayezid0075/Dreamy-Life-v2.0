"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Page } from "components/shared/Page";
import { Button } from "components/ui";
import axios from "utils/axios";
import clsx from "clsx";
import {
  CreditCardIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuthContext } from "app/contexts/auth/context";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [error, setError] = useState(null);
  const membershipId = searchParams.get("membership_id");

  useEffect(() => {
    if (!membershipId) {
      setError("Membership ID is required");
      setLoading(false);
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    createPayment();
  }, [membershipId, user]);

  const createPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post("/api/memberships/payment/create/", {
        membership_id: membershipId,
      });

      if (response.data.payment_url) {
        setPaymentUrl(response.data.payment_url);
        // Redirect to payment gateway
        window.location.href = response.data.payment_url;
      } else {
        setError(response.data.error || "Failed to create payment");
      }
    } catch (err) {
      console.error("Error creating payment:", err);
      setError(
        err.response?.data?.error ||
          "Failed to create payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Page title="Processing Payment">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block size-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <h2 className="dark:text-dark-50 mb-2 text-xl font-semibold text-gray-900">
              Creating Payment...
            </h2>
            <p className="dark:text-dark-300 text-sm text-gray-600">
              Please wait while we prepare your payment
            </p>
          </div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Payment Error">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
          <div className="w-full rounded-2xl border-2 border-red-200 bg-white p-6 text-center shadow-lg dark:border-red-800/50 dark:bg-dark-800">
            <div className="mb-4 flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircleIcon className="text-red-600 dark:text-red-400 size-8" />
              </div>
            </div>
            <h2 className="dark:text-dark-50 mb-2 text-2xl font-bold text-gray-900">
              Payment Error
            </h2>
            <p className="dark:text-dark-300 mb-6 text-sm text-gray-600">
              {error}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => router.push("/memberships")}
                variant="outlined"
                className="flex-1"
              >
                Back to Memberships
              </Button>
              <Button
                onClick={createPayment}
                variant="filled"
                color="primary"
                className="flex-1"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Redirecting to Payment">
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block size-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <h2 className="dark:text-dark-50 mb-2 text-xl font-semibold text-gray-900">
            Redirecting to Payment Gateway...
          </h2>
          <p className="dark:text-dark-300 text-sm text-gray-600">
            You will be redirected to complete your payment
          </p>
        </div>
      </div>
    </Page>
  );
}

