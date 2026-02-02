'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  User,
  Wallet,
  Users,
  Crown,
  ShoppingBag,
  Package,
  Store,
  LogOut,
  Moon,
  Sun,
  Phone,
  Copy,
  CheckCircle,
  BadgeCheck,
  X,
  XCircle,
  Settings,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import { useAuthStore } from '@/store';

const mainNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Wallet',
    href: '/wallet',
    icon: Wallet,
  },
  {
    title: 'Referrals',
    href: '/referrals',
    icon: Users,
  },
  {
    title: 'Memberships',
    href: '/memberships',
    icon: Crown,
  },
];

const shopNavItems = [
  {
    title: 'My Orders',
    href: '/orders',
    icon: ShoppingBag,
  },
  {
    title: 'My Products',
    href: '/vendor/products',
    icon: Package,
  },
  {
    title: 'My Shop',
    href: '/vendor',
    icon: Store,
  },
];

const otherNavItems = [
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Help & Support',
    href: '/help',
    icon: HelpCircle,
  },
];

interface MobileSideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSideDrawer({ open, onOpenChange }: MobileSideDrawerProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const copyReferralCode = async () => {
    if (user?.own_refercode) {
      await navigator.clipboard.writeText(user.own_refercode);
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNavClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] max-w-[85vw] p-0 bg-white dark:bg-slate-900 border-r-violet-200/50 dark:border-r-violet-800/30 overflow-hidden">
        {/* Header */}
        <SheetHeader className="p-3 border-b border-violet-200/50 dark:border-violet-800/30">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2" onClick={handleNavClick}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 text-white text-sm font-bold shadow-lg shadow-fuchsia-500/25">
                DL
              </div>
              <SheetTitle className="font-bold text-base bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                Dreamy Life
              </SheetTitle>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Profile Card */}
        <div className="p-2.5">
          <div className="relative overflow-hidden rounded-xl">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-cyan-500/20 via-transparent to-amber-500/20"></div>
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:12px_12px]"></div>
            {/* Decorative Orbs */}
            <div className="absolute -top-4 -right-4 w-14 h-14 bg-yellow-400/30 rounded-full blur-xl"></div>
            <div className="absolute -bottom-3 -left-3 w-12 h-12 bg-cyan-400/30 rounded-full blur-xl"></div>

            {/* Content */}
            <div className="relative p-3 text-white">
              {/* Profile Picture & Name */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-11 w-11 ring-2 ring-white/30 shadow-lg">
                    <AvatarImage src={user?.profile_picture || undefined} />
                    <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-sm font-bold">
                      {user?.user.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {user?.is_verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white shadow-lg">
                      <BadgeCheck className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{user?.user.username}</h3>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <div className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      user?.member_status === 'user'
                        ? 'bg-white/20'
                        : 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg'
                    }`}>
                      <Crown className="h-2.5 w-2.5 inline mr-0.5" />
                      {user?.member_status}
                    </div>
                    {user?.is_verified ? (
                      <div className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/90 flex items-center gap-0.5">
                        <CheckCircle className="h-2.5 w-2.5" />
                        Verified
                      </div>
                    ) : (
                      <div className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/90 flex items-center gap-0.5">
                        <XCircle className="h-2.5 w-2.5" />
                        Unverified
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Verify Button for unverified users */}
              {!user?.is_verified && (
                <Link
                  href="/ekyc"
                  onClick={handleNavClick}
                  className="flex items-center justify-center gap-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold text-xs py-1.5 px-3 rounded-lg shadow-lg transition-all mb-2.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verify Now
                </Link>
              )}

              {/* Info Items */}
              <div className="space-y-1.5">
                {/* Phone */}
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2.5 py-1.5 backdrop-blur-sm">
                  <Phone className="h-3.5 w-3.5 text-white/70 flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{user?.user.phone_number || 'No phone'}</span>
                </div>

                {/* Referral Code */}
                <div
                  className="flex items-center justify-between bg-white/10 rounded-lg px-2.5 py-1.5 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-colors group"
                  onClick={copyReferralCode}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] text-white/70">Refer:</span>
                    <span className="font-mono font-bold text-xs text-yellow-300 truncate">{user?.own_refercode}</span>
                  </div>
                  <button className="p-0.5 hover:bg-white/10 rounded transition-colors flex-shrink-0">
                    {copied ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-white/70 group-hover:text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1.5">
          {/* Main Navigation */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">
              Main
            </p>
            <nav className="space-y-0.5">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 font-medium'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/20'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? 'text-violet-600 dark:text-violet-400' : ''}`} />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Shop Navigation */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">
              Shop
            </p>
            <nav className="space-y-0.5">
              {shopNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 font-medium'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/20'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? 'text-violet-600 dark:text-violet-400' : ''}`} />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Other Navigation */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">
              Other
            </p>
            <nav className="space-y-0.5">
              {otherNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 font-medium'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/20'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? 'text-violet-600 dark:text-violet-400' : ''}`} />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-violet-200/50 dark:border-violet-800/30">
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-2 py-1.5 rounded-md text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>

          {/* Version */}
          <p className="text-[9px] text-center text-slate-400 dark:text-slate-500 mt-1.5">
            v1.0.0
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
