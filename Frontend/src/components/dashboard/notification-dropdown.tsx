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
        className="w-[340px] sm:w-[380px] p-0 rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-1)] shadow-[var(--shadow-lg)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-3)] text-[var(--color-primary)]">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-1)]">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p className="text-[10px] font-medium text-[var(--color-text-3)] mt-0.5">
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-primary-l)]"
              onClick={() => markAllReadMutation.mutate()}
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[320px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-text-3)]" />
              <p className="text-sm text-[var(--color-text-2)]">Loading…</p>
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-3)] mb-3">
                <Bell className="h-6 w-6 text-[var(--color-text-3)]" />
              </div>
              <p className="text-sm font-medium text-[var(--color-text-1)]">No notifications</p>
              <p className="text-xs text-[var(--color-text-3)] mt-1 text-center">
                You&apos;re all caught up
              </p>
            </div>
          ) : (
            <ul className="py-0" role="list">
              {list.map((n) => (
                <li key={n.id}>
                  <NotificationItem
                    notification={n}
                    onMarkRead={() => markReadMutation.mutate(n.id)}
                  />
                </li>
              ))}
            </ul>
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
        "flex gap-3 px-4 py-3 transition-colors cursor-pointer border-b border-[var(--color-border)] last:border-b-0",
        "hover:bg-[var(--color-surface-2)] active:bg-[var(--color-surface-3)]",
        !notification.is_read && "bg-[var(--color-surface-2)]/80"
      )}
    >
      {/* Left: source icon */}
      <div className="shrink-0 pt-0.5">
        {notification.image ? (
          <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-[var(--color-surface-3)] ring-1 ring-[var(--color-border)]">
            <img src={notification.image} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-[var(--color-border)]",
              config.className
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Right: content stack */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-sm leading-tight line-clamp-1",
            notification.is_read ? "font-medium text-[var(--color-text-2)]" : "font-semibold text-[var(--color-text-1)]"
          )}>
            {notification.title}
          </p>
          <span
            className={cn(
              "shrink-0 text-[10px] font-medium tabular-nums",
              notification.is_read ? "text-[var(--color-text-3)]" : "text-[var(--color-primary)]"
            )}
          >
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-2)] line-clamp-2 mt-1 leading-relaxed">
          {notification.message}
        </p>
        <span
          className={cn(
            "inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full",
            config.className
          )}
        >
          {config.label}
        </span>
      </div>

      {/* Unread dot */}
      {!notification.is_read && (
        <div className="shrink-0 w-2 h-2 rounded-full bg-[var(--color-primary)] mt-2" aria-hidden />
      )}
    </div>
  );

  const handleClick = () => {
    if (!notification.is_read) onMarkRead();
  };

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={handleClick} className="block">
        {content}
      </Link>
    );
  }

  return (
    <div onClick={handleClick}>
      {content}
    </div>
  );
}
