"use client";

import { useAccountStatus } from "@/hooks/use-account-status";

export function AccountStatusBanner() {
  const { accountStatus, message } = useAccountStatus();

  if (accountStatus === "active" || !message) return null;

  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border px-4 py-3 text-sm bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200"
    >
      {message}
    </div>
  );
}
