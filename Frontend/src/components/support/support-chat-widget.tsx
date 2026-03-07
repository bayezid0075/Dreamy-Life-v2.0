"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store";
import { supportApi } from "@/lib/api";
import type { SupportConversation, SupportMessage } from "@/types";

const GUEST_STORAGE_KEY = "support_guest";
const POLL_INTERVAL_MS = 5000;

function getSupportErrorMessage(err: unknown, fallback: string): string {
  const ax = err as { response?: { data?: { detail?: string }; status?: number } };
  if (ax?.response?.status === 503 && ax.response?.data?.detail) {
    return ax.response.data.detail;
  }
  return fallback;
}

function formatTime(s: string) {
  try {
    const d = new Date(s);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function SupportChatWidget() {
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<SupportConversation | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [guestStartSending, setGuestStartSending] = useState(false);
  const [userStartMessage, setUserStartMessage] = useState("");
  const [userStartSending, setUserStartSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const loadGuestFromStorage = () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (raw) {
        const { conversationId, guest_email } = JSON.parse(raw);
        if (conversationId && guest_email) {
          setGuestEmail(guest_email);
          return { conversationId, guest_email };
        }
      }
    } catch {}
    return null;
  };

  const saveGuestToStorage = (conversationId: number, guest_email: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      GUEST_STORAGE_KEY,
      JSON.stringify({ conversationId, guest_email })
    );
  };

  const loadConversations = async () => {
    if (!open) return;
    setLoading(true);
    try {
      if (isAuthenticated) {
        const list = await supportApi.listConversations();
        setConversations(list);
        if (list.length > 0 && !activeConversation) {
          setActiveConversation(list[0]);
        }
      } else {
        const stored = loadGuestFromStorage();
        if (stored?.guest_email) {
          setGuestEmail(stored.guest_email);
          const list = await supportApi.listConversations(stored.guest_email);
          setConversations(list);
          const conv = list.find((c) => c.id === stored.conversationId) || list[0];
          if (conv) setActiveConversation(conv);
        }
      }
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (id: number) => {
    try {
      if (isAuthenticated) {
        const conv = await supportApi.getConversation(id);
        setActiveConversation(conv);
      } else {
        const email = guestEmail || loadGuestFromStorage()?.guest_email;
        if (email) {
          const conv = await supportApi.getConversation(id, email);
          setActiveConversation(conv);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!open) return;
    loadConversations();
  }, [open, isAuthenticated]);

  useEffect(() => {
    if (!open || !activeConversation) return;
    pollRef.current = setInterval(() => {
      loadConversation(activeConversation.id);
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, activeConversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages?.length]);

  const handleSend = async () => {
    const body = message.trim();
    if (!body || sending) return;
    if (activeConversation) {
      setSending(true);
      try {
        await supportApi.sendMessage(activeConversation.id, {
          message: body,
          ...(isAuthenticated ? {} : { guest_email: guestEmail || loadGuestFromStorage()?.guest_email }),
        });
        setMessage("");
        await loadConversation(activeConversation.id);
      } catch (err) {
        toast.error(getSupportErrorMessage(err, "Failed to send message"));
      } finally {
        setSending(false);
      }
    }
  };

  const handleGuestStart = async () => {
    const email = guestEmail.trim();
    const name = guestName.trim();
    const msg = guestMessage.trim();
    if (!name || !email || !msg || guestStartSending) return;
    setGuestStartSending(true);
    try {
      const conv = await supportApi.createConversation({ guest_email: email, guest_name: name, message: msg });
      saveGuestToStorage(conv.id, email);
      setGuestEmail(email);
      setConversations([conv]);
      setActiveConversation(conv);
      setGuestMessage("");
    } catch (err) {
      toast.error(getSupportErrorMessage(err, "Could not start conversation. Please check your name, email and message."));
    } finally {
      setGuestStartSending(false);
    }
  };

  const handleUserStartConversation = async () => {
    const msg = userStartMessage.trim();
    if (!msg || userStartSending) return;
    setUserStartSending(true);
    try {
      const conv = await supportApi.createConversation({ message: msg });
      setConversations([conv]);
      setActiveConversation(conv);
      setUserStartMessage("");
    } catch (err) {
      toast.error(getSupportErrorMessage(err, "Could not start conversation. Please try again."));
    } finally {
      setUserStartSending(false);
    }
  };

  const showGuestForm = !isAuthenticated && conversations.length === 0 && !activeConversation;
  const showUserStartForm = isAuthenticated && conversations.length === 0 && !activeConversation;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-700 hover:scale-110 md:bottom-6 md:right-6"
        aria-label="Open support chat"
      >
        <MessageCircle className="h-7 w-7" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col border-violet-200/50 bg-white dark:border-violet-800/50 dark:bg-slate-900 sm:max-w-md"
          showCloseButton={true}
        >
          <SheetHeader className="border-b border-violet-200/50 dark:border-violet-800/50 pb-3">
            <SheetTitle className="text-lg font-semibold text-violet-700 dark:text-violet-300">
              Support
            </SheetTitle>
            <p className="text-xs text-muted-foreground">
              {isAuthenticated ? "Chat with our team" : "Send a message (guest)"}
            </p>
          </SheetHeader>

          <div className="flex flex-1 flex-col overflow-hidden">
            {showGuestForm ? (
              <div className="flex flex-1 flex-col gap-4 p-4">
                <p className="text-sm text-muted-foreground">
                  Please enter your name and email to start a chat. You can return later with the same email to see replies.
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Name *</label>
                  <Input
                    placeholder="Your name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Email *</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Message *</label>
                  <textarea
                    placeholder="How can we help?"
                    value={guestMessage}
                    onChange={(e) => setGuestMessage(e.target.value)}
                    className="min-h-[100px] w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm dark:border-violet-800 dark:bg-slate-900"
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleGuestStart}
                  disabled={!guestName.trim() || !guestEmail.trim() || !guestMessage.trim() || guestStartSending}
                  className="w-full bg-violet-600 hover:bg-violet-700"
                >
                  {guestStartSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Send"
                  )}
                </Button>
              </div>
            ) : showUserStartForm ? (
              <div className="flex flex-1 flex-col gap-4 p-4">
                <p className="text-sm text-muted-foreground">
                  Send a message to start a conversation with our team.
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Message</label>
                  <textarea
                    placeholder="How can we help?"
                    value={userStartMessage}
                    onChange={(e) => setUserStartMessage(e.target.value)}
                    className="min-h-[100px] w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm dark:border-violet-800 dark:bg-slate-900"
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleUserStartConversation}
                  disabled={!userStartMessage.trim() || userStartSending}
                  className="w-full bg-violet-600 hover:bg-violet-700"
                >
                  {userStartSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Send"
                  )}
                </Button>
              </div>
            ) : (
              <>
                {loading ? (
                  <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                  </div>
                ) : activeConversation ? (
                  <>
                    {conversations.length > 1 && (
                      <div className="flex gap-1 overflow-x-auto border-b border-violet-200/50 p-2 dark:border-violet-800/50">
                        {conversations.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setActiveConversation(c)}
                            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                              activeConversation.id === c.id
                                ? "bg-violet-600 text-white"
                                : "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
                            }`}
                          >
                            #{c.id}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
                      {[...(activeConversation.messages || [])]
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((m: SupportMessage) => {
                        const sender = String(m.sender_type ?? "").toLowerCase();
                        const hasAdminUser = m.admin_user != null && m.admin_user !== undefined;
                        const isFromAdmin = sender === "admin" || hasAdminUser;
                        return (
                          <div
                            key={m.id}
                            className={`flex w-full ${isFromAdmin ? "justify-start" : "justify-end"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                                isFromAdmin
                                  ? "rounded-bl-md bg-violet-100 text-slate-900 dark:bg-violet-900/50 dark:text-slate-100"
                                  : "rounded-br-md bg-violet-600 text-white"
                              }`}
                              style={isFromAdmin ? { marginRight: "auto" } : { marginLeft: "auto" }}
                            >
                              {isFromAdmin ? (
                                <span className="mb-1 block text-[10px] font-medium opacity-80">Support</span>
                              ) : (
                                <span className="mb-1 block text-[10px] font-medium opacity-80">You</span>
                              )}
                              <p className="whitespace-pre-wrap break-words">{m.body}</p>
                              <p className="mt-1 text-[10px] opacity-70">{formatTime(m.created_at)}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="border-t border-violet-200/50 p-3 dark:border-violet-800/50">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          onClick={handleSend}
                          disabled={!message.trim() || sending}
                          className="shrink-0 bg-violet-600 hover:bg-violet-700"
                        >
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-muted-foreground">
                    No conversations yet. Send a message to start.
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
