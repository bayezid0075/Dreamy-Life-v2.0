"use client";

import { Page } from "components/shared/Page";

export default function Wallet() {
  return (
    <Page title="Wallet">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Wallet
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-dark-300">
            This is a sample wallet page.
          </p>
        </div>
      </div>
    </Page>
  );
}

