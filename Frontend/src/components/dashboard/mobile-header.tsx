"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/dashboard/notification-dropdown";
import { useAuthStore } from "@/store";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { user } = useAuthStore();

  return (
    <div className="md:hidden -mx-4 -mt-4">
      <div className="relative">
        {/* Gradient hero background */}
        <div
          className="absolute inset-x-0 top-0 h-52.5 xs:h-57.5 sm:h-62.5"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary-d) 0%, var(--color-primary) 55%, var(--color-accent) 100%)",
          }}
        >
          {/* Subtle grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          {/* Decorative orbs */}
          <div
            className="absolute top-0 right-0 w-28 h-28 sm:w-40 sm:h-40 rounded-full -translate-y-1/2 translate-x-1/2"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
          <div
            className="absolute top-16 left-0 w-24 h-24 rounded-full -translate-x-1/2"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <div
            className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full blur-2xl"
            style={{ background: "rgba(255,255,255,0.12)" }}
          />
        </div>

        {/* Content */}
        <div className="relative px-4 pt-4 pb-3 sm:pb-4">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            {/* Left: menu + logo */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="text-white h-9 w-9 sm:h-10 sm:w-10 hover:bg-white/20"
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2">
                <div
                  className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl text-white text-sm sm:text-base font-bold backdrop-blur-sm shadow-lg"
                  style={{ background: "rgba(255,255,255,0.18)" }}
                >
                  DL
                </div>
                <span className="font-bold text-base sm:text-xl text-white">
                  Dreamy Life
                </span>
              </Link>
            </div>

            {/* Right: notifications + avatar */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <NotificationDropdown />
              <Link href="/profile" className="ml-0.5 sm:ml-1">
                <Avatar
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.3)" }}
                >
                  <AvatarImage src={user?.profile_picture || undefined} />
                  <AvatarFallback
                    className="text-xs sm:text-sm font-bold"
                    style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                  >
                    {user?.user.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>

          {/* Welcome text */}
          <div className="mt-5 sm:mt-6 mb-1 sm:mb-2">
            <p className="text-xs sm:text-sm font-mono tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.65)" }}>
              Welcome back,
            </p>
            <h1
              className="text-white text-xl sm:text-2xl font-bold truncate max-w-55 sm:max-w-none"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {user?.user.username || "User"}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
