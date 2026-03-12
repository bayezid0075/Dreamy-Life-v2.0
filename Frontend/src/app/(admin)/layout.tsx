export const dynamic = 'force-dynamic';

import AdminLayoutClient from './_layout-client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
