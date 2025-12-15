"use client";

import { Page } from "components/shared/Page";

export default function Referrals() {
  return (
    <Page title="Referrals">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Referrals
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-dark-300">
            This is a referrals page.
          </p>
        </div>
      </div>
    </Page>
  );
}

