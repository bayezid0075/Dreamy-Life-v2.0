"use client";

import Link from "next/link";
import {
  useQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import {
  Bell,
  Wallet,
  Coins,
  Gift,
  ShoppingBag,
  Megaphone,
  Award,
  Receipt,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notificationsApi } from "@/lib/api";
import type { Notification, NotificationSource } from "@/types";
import { cn } from "@/lib/utils";

const SOURCE_CONFIG: Record<
  NotificationSource,
  { icon: typeof Bell; label: string; className: string }
> = {
  system: { icon: Bell, label: "System", className: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
  admin: { icon: Megaphone, label: "Admin", className: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300" },
  order: { icon: ShoppingBag, label: "Order", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  referral: { icon: Gift, label: "Referral", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
  wallet: { icon: Wallet, label: "Wallet", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  membership: { icon: Award, label: "Membership", className: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300" },
  transaction: { icon: Receipt, label: "Transaction", className: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300" },
};

interface NotificationDropdownProps {
  /** Use for desktop/light headers e.g. "text-foreground hover:bg-muted" */
  triggerClassName?: string;
}

export function NotificationDropdown(props?: NotificationDropdownProps) {
  const { triggerClassName } = props ?? {};
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: () => notificationsApi.unreadCount(),
  });

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => notificationsApi.list(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const hasUnread = list.some((n) => !n.is_read);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 sm:h-10 sm:w-10 relative",
            triggerClassName ?? "text-white hover:bg-white/20"
          )}
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-amber-950">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[340px] sm:w-[400px] p-0 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/80 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200/80 dark:bg-slate-700">
              <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllReadMutation.mutate()}
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[320px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                <Bell className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                You&apos;re all caught up
              </p>
            </div>
          ) : (
            <div className="py-1">
              {list.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={() => markReadMutation.mutate(n.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: () => void;
}) {
  const config = SOURCE_CONFIG[notification.source] ?? SOURCE_CONFIG.system;
  const Icon = config.icon;

  const content = (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 transition-colors cursor-pointer border-l-2 border-transparent",
        "hover:bg-slate-50 dark:hover:bg-slate-800/50",
        !notification.is_read && "border-l-violet-500 bg-violet-50/50 dark:bg-violet-950/20"
      )}
    >
      {/* Source icon */}
      {notification.image ? (
        <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-muted ring-1 ring-slate-200/50 dark:ring-slate-700">
          <img src={notification.image} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-slate-200/50 dark:ring-slate-700",
            config.className
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 leading-tight">
            {notification.title}
          </p>
          <span
            className={cn(
              "shrink-0 text-[10px] font-medium tabular-nums",
              notification.is_read
                ? "text-muted-foreground"
                : "text-violet-600 dark:text-violet-400"
            )}
          >
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
          {notification.message}
        </p>
        <span
          className={cn(
            "inline-block mt-2 text-[10px] font-medium px-1.5 py-0.5 rounded",
            config.className
          )}
        >
          {config.label}
        </span>
      </div>
    </div>
  );

  const handleClick = () => {
    if (!notification.is_read) onMarkRead();
  };

  const itemClassName = "border-b border-slate-100 dark:border-slate-800/80 last:border-b-0";

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={handleClick} className={cn("block", itemClassName)}>
        {content}
      </Link>
    );
  }

  return (
    <div onClick={handleClick} className={itemClassName}>
      {content}
    </div>
  );
}
