export const dynamic = 'force-dynamic';

import DashboardLayoutClient from './_layout-client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
