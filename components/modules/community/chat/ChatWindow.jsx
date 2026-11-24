"use client";
// components/modules/community/chat/ChatWindow.jsx
// Main client component orchestrating the WhatsApp-style conversation:
// Message bubbles, date dividers, unread pill, optimistic sending with clientId,
// visibility-aware 3s polling, read reporting on focus/visible, scroll retention,
// first message banner, and Block & Report safety workflows.

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  ChevronDown,
  ShieldAlert,
  Loader2,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import DateDivider from "./DateDivider";
import MessageInput from "./MessageInput";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
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
  backHref = "/community?tab=chats",
  matchStatus = "active",
  blockedBy = null,
}) {
  const toast = useToast();

  const [messages, setMessages] = useState(initialMessages);
  const [partnerPresence, setPartnerPresence] = useState(
    initialPartnerPresence || {
      online: Boolean(partner?.online),
      lastSeenAt: partner?.lastSeenAt || null,
    }
  );
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [firstUnreadId, setFirstUnreadId] = useState(initialFirstUnreadId);

  // Safety & Block states
  const [chatStatus, setChatStatus] = useState(matchStatus);
  const [chatBlockedBy, setChatBlockedBy] = useState(blockedBy);

  // Dialog states
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportAlsoBlock, setReportAlsoBlock] = useState(true);

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
  const reportMessagesRead = useCallback(
    async (upToDate) => {
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
    },
    [matchId]
  );

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
          const nextList = [...prev];

          for (const incoming of data.messages) {
            const incomingSavedId = (incoming._id || incoming.id)?.toString();
            const incomingClientId = incoming.clientId;

            // Find existing message by saved ID or by clientId (replaces pending/failed)
            let existingIndex = -1;
            if (incomingSavedId) {
              existingIndex = nextList.findIndex(
                (m) =>
                  ((m._id || m.id)?.toString() === incomingSavedId) ||
                  (incomingClientId && m.clientId === incomingClientId)
              );
            } else if (incomingClientId) {
              existingIndex = nextList.findIndex((m) => m.clientId === incomingClientId);
            }

            if (existingIndex !== -1) {
              // Update in place (replaces pending/failed message with confirmed saved message, or updates read status)
              nextList[existingIndex] = {
                ...nextList[existingIndex],
                ...incoming,
                id: incomingSavedId || nextList[existingIndex].id,
                _id: incomingSavedId || nextList[existingIndex]._id,
              };
            } else {
              if (incoming.senderId !== currentUserId) {
                hasNewIncoming = true;
                latestIncomingDate = incoming.createdAt;
              }
              nextList.push(incoming);
            }
          }

          return nextList.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (timeA !== timeB) return timeA - timeB;
            const keyA = (a._id || a.id || a.clientId || "").toString();
            const keyB = (b._id || b.id || b.clientId || "").toString();
            return keyA.localeCompare(keyB);
          });
        });

        // Announce for accessibility
        if (hasNewIncoming) {
          setLiveAnnouncement("New message received");
          if (isNearBottomRef.current) {
            setTimeout(() => scrollToBottom(true), 50);
          } else {
            setUnseenCountWhileScrolledUp((c) => c + 1);
          }

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
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 403 && errorData.error) {
          toast({ message: errorData.error, type: "error" });
        }
        throw new Error(errorData.error || "Send failed");
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

  // Unblock action
  const handleUnblock = async () => {
    try {
      const res = await fetch(`/api/buddies/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unblock" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not unblock user.");
      setChatStatus("active");
      setChatBlockedBy(null);
      toast({ message: "User unblocked. You can now send messages.", type: "success" });
    } catch (err) {
      toast({ message: err.message || "Failed to unblock.", type: "error" });
    }
  };

  // Block confirm action
  const handleConfirmBlock = async () => {
    setBlocking(true);
    try {
      const res = await fetch(`/api/buddies/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "block" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not block user.");
      setChatStatus("blocked");
      setChatBlockedBy(currentUserId);
      setBlockModalOpen(false);
      toast({ message: "User blocked.", type: "info" });
    } catch (err) {
      toast({ message: err.message || "Failed to block user.", type: "error" });
    } finally {
      setBlocking(false);
    }
  };

  // Report submit action
  const handleSubmitReport = async () => {
    setReporting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          reason: reportReason,
          details: reportDetails.trim(),
          alsoBlock: reportAlsoBlock,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit report.");
      if (data.blocked) {
        setChatStatus("blocked");
        setChatBlockedBy(currentUserId);
      }
      setReportModalOpen(false);
      toast({
        message: "Thank you for letting us know. Your report has been submitted.",
        type: "success",
      });
    } catch (err) {
      toast({ message: err.message || "Failed to submit report.", type: "error" });
    } finally {
      setReporting(false);
    }
  };

  // Group messages by day
  const dayGroups = useMemo(() => groupByDay(messages), [messages]);

  const partnerName =
    partner?.name?.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "") || "Connection";

  const isBlocked = chatStatus === "blocked";
  const isBlocker = isBlocked && chatBlockedBy === currentUserId;

  return (
    <div className="flex flex-col h-[82vh] min-h-[520px] max-h-[820px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden relative">
      {/* Accessible live region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* WhatsApp Chat Header with Block & Report Menu */}
      <ChatHeader
        partner={partner}
        presence={partnerPresence}
        backHref={backHref}
        isBlocked={isBlocked}
        canUnblock={isBlocker}
        onOpenBlockDialog={() => setBlockModalOpen(true)}
        onOpenReportDialog={() => setReportModalOpen(true)}
        onUnblock={handleUnblock}
      />

      {/* Scrollable Conversation History Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-4 bg-slate-50/50 dark:bg-slate-950/30"
      >
        {/* Load older messages button if available */}
        {hasMore && (
          <div className="flex justify-center pt-1 pb-2">
            <button
              type="button"
              onClick={handleLoadOlder}
              disabled={loadingOlder}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {loadingOlder ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Loading older messages…
                </>
              ) : (
                "Load older messages"
              )}
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <p className="text-xs">No messages yet. Say hello to start chatting!</p>
          </div>
        ) : (
          dayGroups.map((group) => (
            <div key={group.dateKey} className="space-y-1">
              {/* WhatsApp Date Divider Pill */}
              <DateDivider label={group.label} />

              {/* Message Group */}
              {group.messages.map((msg, index) => {
                  const isMine = msg.senderId === currentUserId;
                  const prev = group.messages[index - 1];
                  const next = group.messages[index + 1];

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

                  const messageId = (msg._id || msg.id)?.toString();
                  const isFirstUnread = Boolean(
                    firstUnreadId && (messageId === firstUnreadId || msg.id === firstUnreadId)
                  );
                  const messageKey = messageId || msg.clientId;

                  return (
                    <div key={messageKey}>
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

      {/* Bottom Area: Message Input OR Inactive Bar OR Blocked Bar */}
      {partner?.isActive === false ? (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
            This account is inactive
          </span>
        </div>
      ) : isBlocked ? (
        isBlocker ? (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <ShieldAlert size={16} className="text-amber-500 shrink-0" aria-hidden="true" />
              <span>You blocked {partnerName}. Unblock to send messages.</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleUnblock}
              className="text-xs min-h-[36px]"
            >
              Unblock
            </Button>
          </div>
        ) : (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              You cannot send messages in this chat.
            </span>
          </div>
        )
      ) : (
        <MessageInput
          value={text}
          onChange={setText}
          onSend={() => handleSendMessage()}
          disabled={false}
          sending={sending}
          partnerName={partnerName}
        />
      )}

      {/* Block Confirmation Dialog */}
      <Modal
        open={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        title={`Block ${partnerName}?`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {partnerName} will not be able to send you messages or find your profile in People.
            Your existing message history will be preserved. You can unblock them at any time.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={blocking}
              onClick={() => setBlockModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={blocking}
              disabled={blocking}
              onClick={handleConfirmBlock}
            >
              Block {partnerName.split(" ")[0]}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Dialog */}
      <Modal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title={`Report ${partnerName}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitReport();
          }}
          className="space-y-4"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your report is confidential. {partnerName.split(" ")[0]} will not be notified of who reported them.
          </p>

          {/* Reason Radio Group */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Why are you reporting this user?
            </label>
            <div className="space-y-1.5" role="radiogroup" aria-label="Report reasons">
              {[
                { id: "spam", label: "Spam or advertising" },
                { id: "harassment", label: "Harassment or bullying" },
                { id: "inappropriate", label: "Inappropriate or offensive content" },
                { id: "fake_profile", label: "Fake or misleading profile" },
                { id: "other", label: "Other issue" },
              ].map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs text-slate-700 dark:text-slate-300"
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={item.id}
                    checked={reportReason === item.id}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Optional Details with counter */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Details (optional)
            </label>
            <textarea
              rows={3}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              maxLength={300}
              placeholder="Provide any additional context for our team…"
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <div className="text-right text-[10px] text-slate-400">
              {reportDetails.length} / 300
            </div>
          </div>

          {/* Also block checkbox */}
          <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={reportAlsoBlock}
              onChange={(e) => setReportAlsoBlock(e.target.checked)}
              className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
            />
            <span>Also block this user so they cannot message you</span>
          </label>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={reporting}
              onClick={() => setReportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={reporting}
              disabled={reporting}
            >
              Submit report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
