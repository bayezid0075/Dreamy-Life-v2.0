"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { MobileBottomNav, AccountStatusBanner, NotificationDropdown, MobileSideDrawer } from "@/components/dashboard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const isDashboard = pathname === "/dashboard";

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
      {/* Desktop Layout with Sidebar - same structure as mobile (sidebar = drawer nav, main = content) */}
      <div className="hidden md:flex min-h-screen w-full">
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
          <SidebarInset className="flex flex-col min-h-screen bg-gradient-to-b from-violet-50/30 via-background to-background dark:from-violet-950/20">
            <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-violet-200/50 dark:border-violet-800/30 px-4 lg:px-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <div className="flex items-center gap-2 min-w-0">
                <SidebarTrigger className="-ml-1 shrink-0" />
                <Separator orientation="vertical" className="mr-2 h-4 bg-violet-200 dark:bg-violet-800 shrink-0" />
                <span className="text-sm font-medium text-muted-foreground truncate hidden sm:inline">
                  Welcome, {user?.user?.username || "User"}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <NotificationDropdown triggerClassName="text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" />
                <Link href="/profile" className="rounded-full ring-2 ring-transparent hover:ring-violet-200 dark:hover:ring-violet-800 transition-all">
                  <Avatar className="h-8 w-8 lg:h-9 lg:w-9">
                    <AvatarImage src={user?.profile_picture || undefined} />
                    <AvatarFallback className="bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-sm font-semibold">
                      {user?.user?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </div>
            </header>
            <main className="flex-1 overflow-auto p-4 lg:p-6">
              <AccountStatusBanner />
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden min-h-dvh bg-slate-50 dark:bg-slate-950 pb-16">
        <MobileSideDrawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen} />
        {/* Slim mobile top bar with menu - show on all pages except dashboard (dashboard has its own header) */}
        {!isDashboard && (
          <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-violet-200/50 dark:border-violet-800/30 px-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileDrawerOpen(true)}
                className="h-8 w-8 shrink-0 text-slate-700 dark:text-slate-300"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Link href="/dashboard" className="flex items-center gap-1.5 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-xs font-bold">
                  DL
                </div>
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">Dreamy Life</span>
              </Link>
            </div>
            <Link href="/profile" className="shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profile_picture || undefined} />
                <AvatarFallback className="bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-semibold">
                  {user?.user?.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
          </header>
        )}
        <main>
          <AccountStatusBanner />
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </>
  );
}
