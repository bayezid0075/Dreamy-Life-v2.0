'use client';

import NotificationCenter from '@/features/notifications/NotificationCenter';

export default function NotificationsPage() {
  return (
    <div className="space-y-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Notifications</h1>
        <p className="text-on-surface-variant font-body-sm text-body-sm mt-xs">
          Manage and send notifications to all users
        </p>
      </div>
      <NotificationCenter />
    </div>
  );
}
