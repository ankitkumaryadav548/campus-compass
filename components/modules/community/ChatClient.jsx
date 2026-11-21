"use client";
// components/modules/community/ChatClient.jsx
// One-to-one conversation interface for matched students and senior buddies.
// Features auto-scrolling, visibility-aware 8-second polling, plain-text security,
// keyboard shortcuts (Enter to send, Shift+Enter for newline), and character limits.

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  ShieldAlert,
  Loader2,
  Globe,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function ChatClient({
  matchId,
  partner,
  initialMessages,
  currentUserId,
}) {
  const toast = useToast();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  // Polling for new messages every 8 seconds while document is visible
  const pollNewMessages = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const afterParam = lastMessage ? `?after=${encodeURIComponent(lastMessage.createdAt)}` : "";

    try {
      const res = await fetch(`/api/buddies/${matchId}/messages${afterParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m._id));
            const newOnes = data.messages.filter((m) => !existingIds.has(m._id));
            if (newOnes.length === 0) return prev;
            return [...prev, ...newOnes];
          });
        }
      }
    } catch {
      // Ignore background network polling errors
    }
  }, [matchId, messages]);

  useEffect(() => {
    const timer = setInterval(pollNewMessages, 8000);
    return () => clearInterval(timer);
  }, [pollNewMessages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    if (trimmed.length > 500) {
      toast({ message: "Message is too long (max 500 characters).", type: "error" });
      return;
    }

    setSending(true);

    try {
      const res = await fetch(`/api/buddies/${matchId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not send message.");
      }

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setText("");
      textareaRef.current?.focus();
    } catch (err) {
      toast({
        message: err.message || "Failed to send message.",
        type: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const partnerName = partner?.name?.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "") || "Buddy";

  return (
    <div className="flex flex-col h-[80vh] min-h-[500px] max-h-[750px] rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
      {/* Chat Top Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/community?tab=matches"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Back to connections"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            {getInitials(partnerName)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {partnerName}
              </h2>
              {partner?.isSenior && (
                <Badge variant="neutral" className="text-[10px]">
                  Senior Buddy
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Globe size={11} /> {partner?.country}
              </span>
              {partner?.languages?.length > 0 && (
                <span className="truncate">• Speaks {partner.languages.join(", ")}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security notice */}
      <div className="bg-amber-50/70 dark:bg-amber-950/20 px-4 py-2 border-b border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300 flex items-center gap-2 shrink-0">
        <ShieldAlert size={14} className="text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
        <span>Safety reminder: Never share passwords, OTPs, or bank account credentials in chat.</span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
            <p className="text-xs">No messages yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Start the conversation by saying hello to {partnerName.split(" ")[0]}!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.isMine || msg.senderId === currentUserId;
            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={msg._id}
                className={cn(
                  "flex flex-col max-w-[80%] sm:max-w-[70%]",
                  isMine ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words shadow-sm",
                    isMine
                      ? "bg-gradient-primary text-white rounded-br-none"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700"
                  )}
                >
                  {/* Strictly plain text rendering */}
                  {msg.text}
                </div>

                <span className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1">
                  <Clock size={9} aria-hidden="true" />
                  {timeStr}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Message Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-2"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${partnerName.split(" ")[0]}... (Press Enter to send, Shift+Enter for new line)`}
            maxLength={500}
            className="flex-1 text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none placeholder:text-slate-400"
          />

          <Button
            type="submit"
            disabled={!text.trim() || sending}
            loading={sending}
            className="h-10 px-4 shrink-0 rounded-xl"
            aria-label="Send message"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </Button>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 px-1">
          <span>Enter to send • Shift+Enter for new line</span>
          <span>{text.trim().length} / 500</span>
        </div>
      </form>
    </div>
  );
}
