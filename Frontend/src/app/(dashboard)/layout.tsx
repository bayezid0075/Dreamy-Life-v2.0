"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { MobileBottomNav, AccountStatusBanner } from "@/components/dashboard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 dark:border-t-violet-400"></div>
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Desktop Layout with Sidebar */}
      <div className="hidden md:flex min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="bg-gradient-to-b from-violet-50/30 via-background to-background dark:from-violet-950/20">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-violet-200/50 dark:border-violet-800/30 px-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 h-4 bg-violet-200 dark:bg-violet-800"
              />
            </header>
            <main className="flex-1 p-6">
              <AccountStatusBanner />
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden min-h-dvh bg-slate-50 dark:bg-slate-950 pb-16">
        <main>
          <AccountStatusBanner />
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </>
  );
}
