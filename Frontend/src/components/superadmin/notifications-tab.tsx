"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { superadminApi } from "@/lib/api";
import type { SuperadminTheme } from "@/app/(superadmin)/superadmin/page";

interface SuperadminNotificationsTabProps {
  theme: SuperadminTheme;
}

export function SuperadminNotificationsTab({
  theme,
}: SuperadminNotificationsTabProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState("");
  const [link, setLink] = useState("");

  const pushMutation = useMutation({
    mutationFn: () =>
      superadminApi.pushNotification({
        title: title.trim(),
        message: message.trim(),
        image: image.trim() || undefined,
        link: link.trim() || undefined,
      }),
    onSuccess: (data) => {
      toast.success(data.detail);
      setTitle("");
      setMessage("");
      setImage("");
      setLink("");
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err.response?.data?.detail ?? "Failed to push notification");
    },
  });

  const isLight = theme === "light";

  return (
    <div className="space-y-6">
      <div>
        <h2
          className={`text-lg font-semibold ${
            isLight ? "text-slate-900" : "text-slate-100"
          }`}
        >
          Push notification to all users
        </h2>
        <p
          className={`text-sm mt-1 ${
            isLight ? "text-slate-500" : "text-slate-400"
          }`}
        >
          Sends a notification to every active user. It will appear in the
          dashboard bell and in the mobile app.
        </p>
      </div>

      <form
        className={`max-w-xl space-y-4 p-6 rounded-xl border ${
          isLight
            ? "bg-white border-slate-200"
            : "bg-slate-800/50 border-slate-700"
        }`}
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) {
            toast.error("Title is required");
            return;
          }
          pushMutation.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="notif-title">Title *</Label>
          <Input
            id="notif-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New feature available"
            required
            className={isLight ? "bg-white" : "bg-slate-900 border-slate-600"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notif-message">Message</Label>
          <Textarea
            id="notif-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Notification body text"
            rows={3}
            className={isLight ? "bg-white" : "bg-slate-900 border-slate-600"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notif-image">Image URL (optional)</Label>
          <Input
            id="notif-image"
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className={isLight ? "bg-white" : "bg-slate-900 border-slate-600"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notif-link">Link (optional)</Label>
          <Input
            id="notif-link"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://example.com/page"
            className={isLight ? "bg-white" : "bg-slate-900 border-slate-600"}
          />
          <p
            className={`text-xs ${
              isLight ? "text-slate-500" : "text-slate-400"
            }`}
          >
            When the user taps the notification, they will open this link (in app
            or web).
          </p>
        </div>
        <Button
          type="submit"
          disabled={pushMutation.isPending || !title.trim()}
          className="bg-amber-500 hover:bg-amber-600 text-black"
        >
          {pushMutation.isPending ? (
            "Sending…"
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send to all users
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
