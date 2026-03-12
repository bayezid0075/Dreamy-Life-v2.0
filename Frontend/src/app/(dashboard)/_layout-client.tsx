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

export default function DashboardLayoutClient({
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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-10 w-10 rounded-full border-4 animate-spin"
            style={{
              borderColor: "var(--color-border)",
              borderTopColor: "var(--color-primary)",
            }}
          />
          <span
            className="text-sm font-mono tracking-widest uppercase"
            style={{ color: "var(--color-text-3)" }}
          >
            Loading…
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex min-h-screen w-full" style={{ background: "var(--color-bg)" }}>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
          <SidebarInset
            className="flex flex-col min-h-screen"
            style={{ background: "var(--color-bg)" }}
          >
            {/* Desktop top bar */}
            <header
              className="flex h-14 shrink-0 items-center justify-between gap-4 px-4 lg:px-6"
              style={{
                background: "var(--color-surface-1)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <SidebarTrigger
                  className="-ml-1 shrink-0"
                  style={{ color: "var(--color-text-2)" }}
                />
                <Separator
                  orientation="vertical"
                  className="mr-2 h-4 shrink-0"
                  style={{ background: "var(--color-border)" }}
                />
                <span
                  className="text-sm font-medium truncate hidden sm:inline"
                  style={{ color: "var(--color-text-2)" }}
                >
                  Welcome,{" "}
                  <span style={{ color: "var(--color-text-1)", fontWeight: 600 }}>
                    {user?.user?.username || "User"}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <NotificationDropdown triggerClassName="" />
                <Link href="/profile">
                  <Avatar
                    className="h-8 w-8 lg:h-9 lg:w-9 ring-2 transition-all"
                    style={{ "--tw-ring-color": "var(--color-border)" } as React.CSSProperties}
                  >
                    <AvatarImage src={user?.profile_picture || undefined} />
                    <AvatarFallback
                      className="text-sm font-bold"
                      style={{
                        background: "var(--color-surface-3)",
                        color: "var(--color-primary)",
                      }}
                    >
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
      <div
        className="md:hidden min-h-dvh"
        style={{ background: "var(--color-bg)" }}
      >
        <MobileSideDrawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen} />

        {/* Slim top bar for non-dashboard pages */}
        {!isDashboard && (
          <header
            className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between gap-2 px-3 backdrop-blur-sm"
            style={{
              background: "var(--color-surface-1)",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileDrawerOpen(true)}
                className="h-8 w-8 shrink-0"
                style={{ color: "var(--color-text-2)" }}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Link href="/dashboard" className="flex items-center gap-1.5 min-w-0">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                  style={{ background: "linear-gradient(135deg, var(--color-primary-d), var(--color-primary))" }}
                >
                  DL
                </div>
                <span
                  className="font-semibold text-sm truncate"
                  style={{ color: "var(--color-text-1)" }}
                >
                  Dreamy Life
                </span>
              </Link>
            </div>
            <Link href="/profile" className="shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profile_picture || undefined} />
                <AvatarFallback
                  className="text-xs font-bold"
                  style={{
                    background: "var(--color-surface-3)",
                    color: "var(--color-primary)",
                  }}
                >
                  {user?.user?.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
          </header>
        )}

        <main className="px-4 pt-4 pb-[88px]">
          <AccountStatusBanner />
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </>
  );
}
