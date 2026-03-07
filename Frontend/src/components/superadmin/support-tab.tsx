"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Send, MessageCircle, RefreshCw } from "lucide-react";
import type { SupportConversation as SupportConversationType } from "@/types";
import { superadminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SuperadminTheme = "dark" | "light";

function formatTime(s: string) {
  try {
    return new Date(s).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function SuperadminSupportTab({ theme = "dark" }: { theme?: SuperadminTheme }) {
  const isLight = theme === "light";
  const [conversations, setConversations] = useState<SupportConversationType[]>([]);
  const [selected, setSelected] = useState<SupportConversationType | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const list = await superadminApi.getSupportConversations();
      setConversations(list);
      if (selected && list.length > 0) {
        const updated = list.find((c) => c.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch {
      toast.error("Failed to load support conversations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const id = setInterval(() => {
      superadminApi.getSupportConversation(selected.id).then(setSelected).catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [selected?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages?.length]);

  const handleReply = async () => {
    if (!selected || !reply.trim() || sending) return;
    const body = reply.trim();
    setSending(true);
    try {
      await superadminApi.replySupportConversation(selected.id, body);
      setReply("");
      const updated = await superadminApi.getSupportConversation(selected.id);
      setSelected(updated);
      toast.success("Reply sent");
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const selectConv = (c: SupportConversationType) => {
    setSelected(c);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className={`text-sm font-semibold uppercase tracking-widest ${isLight ? "text-slate-500" : "text-slate-500"}`}>
            Support chat
          </h2>
          <p className={`text-xs mt-0.5 ${isLight ? "text-slate-600" : "text-slate-500"}`}>
            View all conversations, see messages with username and refer code. Reply to users and guests below.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchList()}
          disabled={loading}
          className={isLight ? "border-slate-300" : "border-slate-600"}
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className={`grid gap-4 md:grid-cols-[320px_1fr] rounded-xl border ${isLight ? "border-slate-200 bg-white" : "border-slate-700/80 bg-[#161b22]/50"}`}>
        <div className={`flex flex-col border-b md:border-b-0 md:border-r ${isLight ? "border-slate-200" : "border-slate-700/80"}`}>
          <div className="p-3 font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
            Conversations
          </div>
          {loading ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">No conversations yet.</div>
          ) : (
            <ul className="max-h-[400px] overflow-y-auto">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => selectConv(c)}
                    className={`w-full text-left px-4 py-3 border-b transition-colors ${
                      selected?.id === c.id
                        ? isLight
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                        : isLight
                          ? "border-slate-100 hover:bg-slate-50 text-slate-800"
                          : "border-slate-700/50 hover:bg-slate-800/50 text-slate-200"
                    }`}
                  >
                    <span className="font-mono text-sm font-medium">#{c.id}</span>
                    <span className="ml-2 text-xs">
                      {c.user
                        ? [c.user_display_name || `User ${c.user}`, c.user_refer_code && `(${c.user_refer_code})`].filter(Boolean).join(" ")
                        : [c.guest_name, c.guest_email].filter(Boolean).join(" · ") || "Guest"}
                    </span>
                    {c.last_message && (
                      <p className="mt-1 truncate text-xs opacity-70">{c.last_message.body}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col min-h-[360px]">
          {selected ? (
            <>
              <div className={`flex items-center gap-2 border-b p-3 ${isLight ? "border-slate-200" : "border-slate-700/80"}`}>
                <MessageCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="font-mono text-sm">
                  #{selected.id}
                  {selected.user != null
                    ? ` – ${selected.user_display_name || "User"}${selected.user_refer_code ? ` (${selected.user_refer_code})` : ""}`
                    : ` – ${[selected.guest_name, selected.guest_email].filter(Boolean).join(" · ") || "Guest"}`}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
                {(selected.messages || []).map((m) => {
                  const isAdmin = m.sender_type === "admin";
                  return (
                    <div
                      key={m.id}
                      className={`flex w-full ${isAdmin ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                          isAdmin
                            ? isLight
                              ? "rounded-br-md bg-amber-100 text-amber-900"
                              : "rounded-br-md bg-amber-500/20 text-amber-200"
                            : isLight
                              ? "rounded-bl-md bg-slate-100 text-slate-800"
                              : "rounded-bl-md bg-slate-700/50 text-slate-200"
                        }`}
                      >
                        <span className="text-[10px] font-medium opacity-80">
                          {isAdmin ? "You (Admin)" : m.sender_type === "guest" ? "Guest" : "User"}
                        </span>
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className="mt-1 text-[10px] opacity-70">{formatTime(m.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className={`border-t p-3 flex gap-2 ${isLight ? "border-slate-200" : "border-slate-700/80"}`}>
                <Input
                  placeholder="Type your reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleReply()}
                  className={isLight ? "bg-white border-slate-300" : "bg-slate-800 border-slate-600"}
                />
                <Button
                  size="icon"
                  onClick={handleReply}
                  disabled={!reply.trim() || sending}
                  className="shrink-0 bg-amber-600 hover:bg-amber-700"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
              Select a conversation to reply.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
