export const dynamic = 'force-dynamic';

import AuthLayoutClient from './_layout-client';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayoutClient>{children}</AuthLayoutClient>;
}
