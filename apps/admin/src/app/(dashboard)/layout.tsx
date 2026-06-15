'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/shared/components/Sidebar';
import Topbar from '@/shared/components/Topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-sidebar-width h-screen overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-md md:p-lg">
          {children}
        </main>
      </div>
    </div>
  );
}
