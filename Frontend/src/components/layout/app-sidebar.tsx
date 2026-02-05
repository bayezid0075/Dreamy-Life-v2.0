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
  Store,
  Package,
  BarChart3,
  ShoppingCart,
  Sparkles,
  LogOut,
  Moon,
  Sun,
  Phone,
  Copy,
  CheckCircle,
  BadgeCheck,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useAuthStore } from '@/store';
import { useVendor } from '@/hooks/use-vendor';

const mainNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
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
    title: 'Reseller Shop',
    href: '/reseller',
    icon: Store,
  },
  {
    title: 'My Orders',
    href: '/orders',
    icon: ShoppingBag,
  },
];

const vendorSubItems = [
  { title: 'Overview', href: '/vendor', icon: BarChart3 },
  { title: 'Orders', href: '/vendor/orders', icon: ShoppingCart },
  { title: 'Inventory', href: '/vendor/products', icon: Package },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const { hasVendor, isLoading: vendorLoading } = useVendor();

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

  return (
    <Sidebar className="border-r-violet-200/50 dark:border-r-violet-800/30">
      <SidebarHeader className="border-b border-violet-200/50 dark:border-violet-800/30 p-4">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 text-white font-bold shadow-lg shadow-fuchsia-500/25 group-hover:shadow-fuchsia-500/40 transition-all group-hover:scale-105">
            DL
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Dreamy Life</span>
        </Link>
      </SidebarHeader>

      {/* Profile Card */}
      <div className="p-3">
        <div className="relative overflow-hidden rounded-2xl">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-cyan-500/20 via-transparent to-amber-500/20"></div>
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:16px_16px]"></div>
          {/* Decorative Orbs */}
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-yellow-400/30 rounded-full blur-xl"></div>
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-cyan-400/30 rounded-full blur-xl"></div>

          {/* Content */}
          <div className="relative p-4 text-white">
            {/* Profile Picture & Name */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <Avatar className="h-14 w-14 ring-3 ring-white/30 shadow-xl">
                  <AvatarImage src={user?.profile_picture || undefined} />
                  <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-lg font-bold">
                    {user?.user.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {user?.is_verified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white shadow-lg">
                    <BadgeCheck className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base truncate">{user?.user.username}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    user?.member_status === 'user'
                      ? 'bg-white/20'
                      : 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg'
                  }`}>
                    <Crown className="h-3 w-3 inline mr-1" />
                    {user?.member_status}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Items */}
            <div className="space-y-2">
              {/* Phone */}
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                <Phone className="h-4 w-4 text-white/70" />
                <span className="text-sm font-medium truncate">{user?.user.phone_number || 'No phone'}</span>
              </div>

              {/* Referral Code */}
              <div
                className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-colors group"
                onClick={copyReferralCode}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-white/70">Refer Code:</span>
                  <span className="font-mono font-bold text-sm text-yellow-300 truncate">{user?.own_refercode}</span>
                </div>
                <button className="p-1 hover:bg-white/10 rounded transition-colors">
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-white/70 group-hover:text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Shop</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {shopNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Vendor</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {vendorLoading ? (
                <SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              ) : hasVendor ? (
                <Collapsible
                  defaultOpen={pathname.startsWith('/vendor')}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={pathname.startsWith('/vendor')}
                      >
                        <Store className="h-4 w-4" />
                        <span>My Shop</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {vendorSubItems.map((item) => (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === item.href}
                            >
                              <Link href={item.href}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/vendor">
                      <Sparkles className="h-4 w-4 text-fuchsia-500" />
                      <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent font-medium">
                        Become a Vendor
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-violet-200/50 dark:border-violet-800/30 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 px-2 hover:bg-violet-100 dark:hover:bg-violet-900/30">
              <Avatar className="h-8 w-8 ring-2 ring-violet-200 dark:ring-violet-800">
                <AvatarImage src={user?.profile_picture || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                  {user?.user.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-sm">
                <span className="font-medium">{user?.user.username}</span>
                <span className="text-xs text-muted-foreground">
                  {user?.member_status}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              Toggle Theme
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
