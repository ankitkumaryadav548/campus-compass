"use client";
// components/modules/community/MyConnections.jsx
// Displays incoming and outgoing connection requests, status indicators,
// accept/decline action controls for seniors, and links to 1-to-1 chats.

import { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Globe,
  Loader2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

function getInitials(name) {
  if (!name) return "C";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function MyConnections({
  matches: initialMatches,
  isSenior,
  onConnectionsChanged,
}) {
  const toast = useToast();
  const [matches, setMatches] = useState(initialMatches);
  const [actingId, setActingId] = useState(null);

  const pendingIncoming = matches.filter(
    (m) => m.status === "pending" && m.myRole === "buddy"
  );
  const pendingOutgoing = matches.filter(
    (m) => m.status === "pending" && m.myRole === "student"
  );
  const acceptedMatches = matches.filter((m) => m.status === "accepted");
  const pastMatches = matches.filter(
    (m) => m.status === "declined" || m.status === "cancelled"
  );

  const handleRespond = async (matchId, action) => {
    if (actingId) return;
    setActingId(matchId);

    try {
      const res = await fetch(`/api/buddies/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not update connection request.");
      }

      const data = await res.json();
      toast({
        message: action === "accept" ? "Connection accepted! You can now chat." : "Request updated.",
        type: "success",
      });

      setMatches((prev) =>
        prev.map((m) =>
          m._id === matchId ? { ...m, status: data.status } : m
        )
      );

      onConnectionsChanged?.();
    } catch (err) {
      toast({
        message: err.message || "Failed to respond to request.",
        type: "error",
      });
    } finally {
      setActingId(null);
    }
  };

  const hasAny = matches.length > 0;

  if (!hasAny) {
    return (
      <EmptyState
        icon={<Users size={32} />}
        title="No connections yet"
        description={
          isSenior
            ? "When new international students request your mentorship, their requests will appear here."
            : "Browse the buddy suggestions tab to find and connect with experienced seniors."
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Pending Incoming Requests (For Seniors) */}
      {isSenior && pendingIncoming.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-500" aria-hidden="true" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Pending Mentorship Requests ({pendingIncoming.length})
            </h2>
          </div>

          <div className="space-y-3">
            {pendingIncoming.map((m) => {
              const partnerName = m.partner?.name?.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "") || "Student";
              const isActing = actingId === m._id;

              return (
                <Card key={m._id} className="p-4 border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getInitials(partnerName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {partnerName}
                          </h3>
                          {m.partner?.country && (
                            <Badge variant="info" className="text-[10px]">
                              {m.partner.country}
                            </Badge>
                          )}
                        </div>
                        {m.message && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 italic mt-1 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                            &ldquo;{m.message.replace(/^\[SAMPLE\]\s*/i, "")}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isActing}
                        leftIcon={<X size={12} />}
                        onClick={() => handleRespond(m._id, "decline")}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isActing}
                        loading={isActing}
                        leftIcon={<Check size={12} />}
                        onClick={() => handleRespond(m._id, "accept")}
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Pending Outgoing Requests (For Students) */}
      {!isSenior && pendingOutgoing.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-500" aria-hidden="true" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Pending Requests ({pendingOutgoing.length})
            </h2>
          </div>

          <div className="space-y-3">
            {pendingOutgoing.map((m) => {
              const partnerName = m.partner?.name?.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "") || "Senior Buddy";
              const isActing = actingId === m._id;

              return (
                <Card key={m._id} className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 text-xs font-bold shrink-0">
                        {getInitials(partnerName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {partnerName}
                          </h3>
                          {m.partner?.country && (
                            <Badge variant="neutral" className="text-[10px]">
                              {m.partner.country}
                            </Badge>
                          )}
                        </div>
                        {m.message && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                            &ldquo;{m.message.replace(/^\[SAMPLE\]\s*/i, "")}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Clock size={12} /> Awaiting reply
                      </span>
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleRespond(m._id, "cancel")}
                        className="text-xs text-slate-400 hover:text-danger-600 dark:hover:text-danger-400 underline min-h-[36px] flex items-center"
                      >
                        {isActing ? "Cancelling..." : "Cancel"}
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Accepted Active Connections with Chat Link */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-success-600 dark:text-success-400" aria-hidden="true" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Active Connections ({acceptedMatches.length})
          </h2>
        </div>

        {acceptedMatches.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
            No accepted connections yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {acceptedMatches.map((m) => {
              const partnerName = m.partner?.name?.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "") || "Connection";
              const hasUnread = m.unreadCount > 0;

              return (
                <Card key={m._id} className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                          {getInitials(partnerName)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {partnerName}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Globe size={10} />
                            {m.partner?.country}
                            {m.partner?.isSenior && " (Senior Buddy)"}
                          </p>
                        </div>
                      </div>

                      {hasUnread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-primary-600 animate-pulse shrink-0" title="Unread messages" />
                      )}
                    </div>

                    {/* Last message preview */}
                    {m.lastMessage ? (
                      <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 mb-3 line-clamp-2 leading-relaxed">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {m.lastMessage.isMine ? "You: " : `${partnerName.split(" ")[0]}: `}
                        </span>
                        {m.lastMessage.text}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic mb-3">
                        No messages yet. Say hello!
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Link
                      href={`/community/chat/${m._id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors shadow-sm min-h-[36px]"
                    >
                      <MessageSquare size={13} aria-hidden="true" />
                      Open chat {hasUnread && `(${m.unreadCount})`}
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Past / Declined Records (Collapsed list) */}
      {pastMatches.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2">
            Archived ({pastMatches.length})
          </h3>
          <div className="space-y-1.5 text-xs text-slate-400 dark:text-slate-500">
            {pastMatches.map((m) => (
              <div key={m._id} className="flex justify-between items-center py-1">
                <span>{m.partner?.name?.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "")}</span>
                <span className="capitalize">{m.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
