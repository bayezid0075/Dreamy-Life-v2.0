"use client";

import Link from "next/link";
import {
  useQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notificationsApi } from "@/lib/api";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";

export function NotificationDropdown() {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 h-9 w-9 sm:h-10 sm:w-10 relative"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-black">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] sm:w-[380px] p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {list.some((n) => !n.is_read) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllReadMutation.mutate()}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[280px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Loading…
            </div>
          ) : list.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No notifications
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
  const content = (
    <div
      className={cn(
        "flex gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer",
        !notification.is_read && "bg-primary/5"
      )}
    >
      {notification.image && (
        <div className="relative h-12 w-12 shrink-0 rounded-md overflow-hidden bg-muted">
          <img
            src={notification.image}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-1">{notification.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );

  const handleClick = () => {
    if (!notification.is_read) onMarkRead();
  };

  if (notification.link) {
    return (
      <Link
        href={notification.link}
        onClick={handleClick}
        className="block border-b last:border-b-0 border-border/50"
      >
        {content}
      </Link>
    );
  }

  return (
    <div onClick={handleClick} className="border-b last:border-b-0 border-border/50">
      {content}
    </div>
  );
}
