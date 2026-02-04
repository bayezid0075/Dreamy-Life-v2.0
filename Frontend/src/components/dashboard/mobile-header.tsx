"use client";

import Link from "next/link";
import { Menu, Bell, Search } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { user } = useAuthStore();

  return (
    <div className="md:hidden">
      {/* Gradient Background - extends behind the grid */}
      <div className="relative">
        {/* Background Gradient - responsive height */}
        <div className="absolute inset-x-0 top-0 h-[220px] xs:h-[240px] sm:h-[260px] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-28 h-28 sm:w-40 sm:h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute top-16 sm:top-20 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -translate-x-1/2" />
          <div className="absolute top-1/3 right-1/4 w-16 h-16 sm:w-20 sm:h-20 bg-yellow-400/20 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-1/3 w-20 h-20 sm:w-24 sm:h-24 bg-cyan-400/20 rounded-full blur-2xl" />

          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] sm:bg-[size:24px_24px]" />
        </div>

        {/* Content */}
        <div className="relative px-3 sm:px-4 pt-2 sm:pt-3 pb-3 sm:pb-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            {/* Left: Menu + Logo */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="text-white hover:bg-white/20 h-9 w-9 sm:h-10 sm:w-10"
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 sm:gap-2"
              >
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-white/20 text-white text-sm sm:text-base font-bold backdrop-blur-sm shadow-lg">
                  DL
                </div>
                <span className="font-bold text-base sm:text-xl text-white">
                  Dreamy Life
                </span>
              </Link>
            </div>

            {/* Right: Search + Notification + Avatar */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-9 w-9 sm:h-10 sm:w-10"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-9 w-9 sm:h-10 sm:w-10 relative"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {/* Notification badge */}
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-yellow-400 rounded-full" />
              </Button>
              <Link href="/profile" className="ml-0.5 sm:ml-1">
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-white/30">
                  <AvatarImage src={user?.profile_picture || undefined} />
                  <AvatarFallback className="bg-white/20 text-white text-xs sm:text-sm font-bold">
                    {user?.user.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="mt-4 sm:mt-6 mb-1 sm:mb-2">
            <p className="text-white/80 text-xs sm:text-sm">Welcome back,</p>
            <h1 className="text-white text-xl sm:text-2xl font-bold truncate max-w-[200px] sm:max-w-none">
              {user?.user.username || "User"}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
