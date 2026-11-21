"use client";
// components/modules/community/MyConnections.jsx
// Displays active chats list sorted by latest message, unread counters, and a collapsible Blocked group with Unblock actions.

import { useState } from "react";
import {
  MessageSquare,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Users,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import ChatListItem from "./chat/ChatListItem";

function getInitials(name) {
  if (!name) return "CC";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function MyConnections({
  chats: initialChats = [],
  blockedChats: initialBlockedChats = [],
  matches,
  currentUserId,
  onConnectionsChanged,
  onNavigateToPeople,
}) {
  const toast = useToast();

  // Normalize data whether passed as { chats, blockedChats } or flat matches array
  const normalizedChats = initialChats.length > 0 || initialBlockedChats.length > 0
    ? initialChats
    : (matches || []).filter((m) => m.status === "active");

  const normalizedBlocked = initialBlockedChats.length > 0
    ? initialBlockedChats
    : (matches || []).filter((m) => m.status === "blocked");

  const [chats, setChats] = useState(normalizedChats);
  const [blockedChats, setBlockedChats] = useState(normalizedBlocked);
  const [showBlocked, setShowBlocked] = useState(false);
  const [unblockingId, setUnblockingId] = useState(null);

  const handleUnblock = async (matchId) => {
    if (unblockingId) return;
    setUnblockingId(matchId);

    try {
      const res = await fetch(`/api/buddies/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unblock" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not unblock user.");
      }

      toast({
        message: "User unblocked. You can now chat again.",
        type: "success",
      });

      // Move unblocked chat from blocked list to active chats
      const unblocked = blockedChats.find((m) => m._id === matchId);
      if (unblocked) {
        setBlockedChats((prev) => prev.filter((m) => m._id !== matchId));
        setChats((prev) => [{ ...unblocked, status: "active", blockedBy: null }, ...prev]);
      }

      onConnectionsChanged?.();
    } catch (err) {
      toast({
        message: err.message || "Failed to unblock user.",
        type: "error",
      });
    } finally {
      setUnblockingId(null);
    }
  };

  const hasAnyChats = chats.length > 0 || blockedChats.length > 0;

  if (!hasAnyChats) {
    return (
      <EmptyState
        icon={<MessageSquare size={32} />}
        title="No chats yet"
        description="Say hi to someone from your country in People."
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateToPeople}
          >
            Find people
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Chats List */}
      <Card className="divide-y divide-slate-100 dark:divide-slate-800 p-2 sm:p-3 overflow-hidden">
        {chats.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No active conversations right now.
          </div>
        ) : (
          chats.map((chat) => (
            <ChatListItem
              key={chat._id}
              match={chat}
              currentUserId={currentUserId}
            />
          ))
        )}
      </Card>

      {/* Blocked Conversations Collapsible Section */}
      {blockedChats.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setShowBlocked((prev) => !prev)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors min-h-[44px]"
            aria-expanded={showBlocked}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-slate-400" aria-hidden="true" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Blocked ({blockedChats.length})
              </span>
            </div>
            {showBlocked ? (
              <ChevronDown size={16} className="text-slate-400" />
            ) : (
              <ChevronRight size={16} className="text-slate-400" />
            )}
          </button>

          {showBlocked && (
            <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 p-2">
              {blockedChats.map((chat) => {
                const partnerName =
                  chat.partner?.name?.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "") ||
                  "Connection";
                const isUnblocking = unblockingId === chat._id;

                return (
                  <div
                    key={chat._id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-h-[52px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 text-xs font-bold shrink-0">
                        {getInitials(partnerName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {partnerName}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {chat.partner?.country || "International"} • Blocked
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isUnblocking}
                      loading={isUnblocking}
                      onClick={() => handleUnblock(chat._id)}
                      className="text-xs min-h-[36px] px-3 shrink-0"
                    >
                      Unblock
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
