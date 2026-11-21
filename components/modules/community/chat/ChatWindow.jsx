"use client";
// components/modules/community/chat/ChatWindow.jsx
// Main client component orchestrating the WhatsApp-style conversation:
// Message bubbles, date dividers, unread pill, optimistic sending with clientId,
// visibility-aware 3s polling, read reporting on focus/visible, and scroll retention.

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ChevronDown, ShieldAlert, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import DateDivider from "./DateDivider";
import MessageInput from "./MessageInput";
import { groupByDay } from "@/lib/chatDates";

function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function ChatWindow({
  matchId,
  partner,
  initialMessages = [],
  initialPartnerPresence = null,
  initialFirstUnreadId = null,
  currentUserId,
  backHref = "/community?tab=matches",
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [partnerPresence, setPartnerPresence] = useState(
    initialPartnerPresence || { online: Boolean(partner?.online), lastSeenAt: partner?.lastSeenAt || null }
  );
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showSafetyNotice, setShowSafetyNotice] = useState(true);
  const [firstUnreadId, setFirstUnreadId] = useState(initialFirstUnreadId);

  // Floating scroll button & unread indicator
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [unseenCountWhileScrolledUp, setUnseenCountWhileScrolledUp] = useState(0);

  // Announcement for screen readers
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  const scrollContainerRef = useRef(null);
  const unreadDividerRef = useRef(null);
  const isNearBottomRef = useRef(true);

  // Track latest message timestamp for ?after polling
  const latestTimestampRef = useRef("");
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      latestTimestampRef.current = lastMsg.createdAt;
    }
  }, [messages]);

  // Check if user is scrolled near bottom (< 100px)
  const checkIfNearBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distance < 100;
  };

  const handleScroll = () => {
    const near = checkIfNearBottom();
    isNearBottomRef.current = near;
    setShowScrollBottom(!near);
    if (near) {
      setUnseenCountWhileScrolledUp(0);
    }
  };

  const scrollToBottom = (smooth = true) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
    setUnseenCountWhileScrolledUp(0);
  };

  // Mark unread messages as read on the server
  const reportMessagesRead = useCallback(async (upToDate) => {
    if (!upToDate || typeof document === "undefined") return;
    if (document.visibilityState !== "visible") return;

    try {
      await fetch(`/api/buddies/${matchId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upTo: upToDate }),
      });
    } catch (err) {
      console.error("reportMessagesRead error:", err);
    }
  }, [matchId]);

  // Initial scroll positioning and read reporting on mount
  useEffect(() => {
    if (firstUnreadId && unreadDividerRef.current) {
      unreadDividerRef.current.scrollIntoView({ block: "center", behavior: "auto" });
    } else {
      scrollToBottom(false);
    }

    const lastIncoming = [...messages].reverse().find((m) => m.senderId !== currentUserId);
    if (lastIncoming) {
      reportMessagesRead(lastIncoming.createdAt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3-second Polling for incremental changes (?after) & presence
  const pollMessages = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }

    const after = latestTimestampRef.current;
    const url = after
      ? `/api/buddies/${matchId}/messages?after=${encodeURIComponent(after)}`
      : `/api/buddies/${matchId}/messages`;

    try {
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();

      if (data.partnerPresence) {
        setPartnerPresence(data.partnerPresence);
      }

      if (data.messages && data.messages.length > 0) {
        let hasNewIncoming = false;
        let latestIncomingDate = null;

        setMessages((prev) => {
          const messageMap = new Map(prev.map((m) => [m.id || m.clientId, m]));
          for (const incoming of data.messages) {
            const key = incoming.id || incoming.clientId;
            if (!messageMap.has(key)) {
              if (incoming.senderId !== currentUserId) {
                hasNewIncoming = true;
                latestIncomingDate = incoming.createdAt;
              }
            }
            messageMap.set(key, incoming);
          }
          return Array.from(messageMap.values()).sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
        });

        // Announce for accessibility
        if (hasNewIncoming) {
          setLiveAnnouncement("New message received");
          if (isNearBottomRef.current) {
            setTimeout(() => scrollToBottom(true), 50);
          } else {
            setUnseenCountWhileScrolledUp((c) => c + 1);
          }

          // If window is visible and focused, mark as read
          if (document.hasFocus()) {
            reportMessagesRead(latestIncomingDate);
          }
        }
      }
    } catch {
      // Ignore background network errors
    }
  }, [matchId, currentUserId, reportMessagesRead]);

  useEffect(() => {
    let intervalId = setInterval(pollMessages, 3000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        pollMessages();
        const lastIncoming = [...messages].reverse().find((m) => m.senderId !== currentUserId);
        if (lastIncoming) {
          reportMessagesRead(lastIncoming.createdAt);
        }
      }
    };

    const handleFocus = () => {
      const lastIncoming = [...messages].reverse().find((m) => m.senderId !== currentUserId);
      if (lastIncoming) {
        reportMessagesRead(lastIncoming.createdAt);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [pollMessages, messages, currentUserId, reportMessagesRead]);

  // Load older messages (pagination)
  const handleLoadOlder = async () => {
    if (loadingOlder || messages.length === 0) return;

    const oldest = messages[0];
    if (!oldest?.createdAt) return;

    setLoadingOlder(true);
    const container = scrollContainerRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;
    const prevScrollTop = container ? container.scrollTop : 0;

    try {
      const res = await fetch(
        `/api/buddies/${matchId}/messages?before=${encodeURIComponent(oldest.createdAt)}`
      );
      if (!res.ok) throw new Error("Failed to load older messages");

      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMore(Boolean(data.hasMore));

        // Restore stable scroll position
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
          }
        });
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("handleLoadOlder error:", err);
    } finally {
      setLoadingOlder(false);
    }
  };

  // Optimistic message sending with clientId
  const handleSendMessage = async (textToSend = text, retryClientId = null) => {
    const trimmed = textToSend.trim();
    if (!trimmed || sending) return;

    const clientId = retryClientId || generateClientId();

    if (!retryClientId) {
      // Optimistic message added immediately
      const optimisticMessage = {
        id: clientId,
        clientId,
        text: trimmed,
        senderId: currentUserId,
        createdAt: new Date().toISOString(),
        status: "pending",
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setText("");
      setTimeout(() => scrollToBottom(true), 50);
    } else {
      // Retry: mark back to pending
      setMessages((prev) =>
        prev.map((m) => (m.clientId === retryClientId ? { ...m, status: "pending" } : m))
      );
    }

    setSending(true);

    try {
      const res = await fetch(`/api/buddies/${matchId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          clientId,
        }),
      });

      if (!res.ok) {
        throw new Error("Send failed");
      }

      const data = await res.json();
      const saved = data.message;

      // Replace optimistic message with confirmed server message
      setMessages((prev) =>
        prev.map((m) => (m.clientId === clientId || m.id === clientId ? saved : m))
      );
    } catch {
      // Mark as failed with retry action
      setMessages((prev) =>
        prev.map((m) => (m.clientId === clientId ? { ...m, status: "failed" } : m))
      );
    } finally {
      setSending(false);
    }
  };

  // Retry sending a failed message
  const handleRetry = (failedMsg) => {
    handleSendMessage(failedMsg.text, failedMsg.clientId);
  };

  // Group messages by day and within day group by consecutive sender (within 5 minutes)
  const dayGroups = useMemo(() => groupByDay(messages), [messages]);

  const partnerName = partner?.name?.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "") || "Connection";

  return (
    <div className="flex flex-col h-[82vh] min-h-[520px] max-h-[820px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden relative">
      {/* Accessible live region */}
      <span className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </span>

      {/* Top Header */}
      <ChatHeader
        partner={partner}
        presence={partnerPresence}
        backHref={backHref}
      />

      {/* Dismissible Security Warning */}
      {showSafetyNotice && (
        <div className="bg-amber-50/90 dark:bg-amber-950/30 px-3.5 py-1.5 border-b border-amber-200/80 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2 shrink-0 select-none">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldAlert size={13} className="text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <span className="truncate">Safety tip: Never share passwords, OTPs, or bank account credentials in chat.</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSafetyNotice(false)}
            className="p-1 text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-100 rounded-md"
            aria-label="Dismiss security notice"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-950/40"
      >
        {/* Load older messages button */}
        {hasMore && (
          <div className="flex justify-center mb-3">
            <button
              type="button"
              onClick={handleLoadOlder}
              disabled={loadingOlder}
              className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:underline px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1"
            >
              {loadingOlder && <Loader2 size={11} className="animate-spin" />}
              Load older messages
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No messages yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Say hello to start chatting with {partnerName.split(" ")[0]}!
            </p>
          </div>
        ) : (
          dayGroups.map((group) => (
            <div key={group.dayKey}>
              {/* Date Divider between days */}
              <DateDivider label={group.dayLabel} />

              {/* Messages within this day */}
              {group.messages.map((msg, index) => {
                const isMine = msg.senderId === currentUserId;
                const prev = group.messages[index - 1];
                const next = group.messages[index + 1];

                // Consecutive group logic (same sender within 5 mins)
                const isSameSenderAsPrev = prev && prev.senderId === msg.senderId;
                const timeDiffPrev = prev
                  ? Math.abs(new Date(msg.createdAt) - new Date(prev.createdAt))
                  : Infinity;
                const isFirstInGroup = !isSameSenderAsPrev || timeDiffPrev > 5 * 60 * 1000;

                const isSameSenderAsNext = next && next.senderId === msg.senderId;
                const timeDiffNext = next
                  ? Math.abs(new Date(next.createdAt) - new Date(msg.createdAt))
                  : Infinity;
                const isLastInGroup = !isSameSenderAsNext || timeDiffNext > 5 * 60 * 1000;

                const isFirstUnread = msg.id === firstUnreadId;

                return (
                  <div key={msg.id || msg.clientId}>
                    {/* Unread Messages Pill Divider */}
                    {isFirstUnread && (
                      <div
                        ref={unreadDividerRef}
                        className="flex justify-center my-3 select-none"
                      >
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold text-white bg-emerald-600 dark:bg-emerald-500 shadow-sm">
                          Unread messages below
                        </span>
                      </div>
                    )}

                    <MessageBubble
                      message={msg}
                      isMine={isMine}
                      isFirstInGroup={isFirstInGroup}
                      isLastInGroup={isLastInGroup}
                      onRetry={handleRetry}
                    />
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Floating Scroll to Bottom button with unread count */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 right-5 p-2 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center min-h-[44px] min-w-[44px] z-10"
          aria-label="Scroll to latest messages"
        >
          <ChevronDown size={18} />
          {unseenCountWhileScrolledUp > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-xs">
              {unseenCountWhileScrolledUp}
            </span>
          )}
        </button>
      )}

      {/* Message Input Bar */}
      <MessageInput
        value={text}
        onChange={setText}
        onSend={() => handleSendMessage()}
        disabled={false}
        sending={sending}
        partnerName={partnerName}
      />
    </div>
  );
}
