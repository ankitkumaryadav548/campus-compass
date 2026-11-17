"use client";
// components/modules/community/BuddySuggestions.jsx
// Senior buddy suggestion cards with matching scores, shared language chips,
// connection request modal, and pending request cancellation.

import { useState } from "react";
import {
  Users,
  Sparkles,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Globe,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

function getInitials(name) {
  if (!name) return "SB";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function BuddySuggestions({
  suggestions: initialSuggestions,
  userCountry,
  noContentBannerText,
  onConnectionsChanged,
}) {
  const toast = useToast();
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [selectedBuddy, setSelectedBuddy] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const hasCountryMatch = suggestions.some((b) => b.isSameCountry);

  const handleOpenRequestModal = (buddy) => {
    setSelectedBuddy(buddy);
    setRequestMessage(`Hi ${buddy.name.split(" ")[0]}, I recently arrived and would love to connect for advice!`);
    setModalOpen(true);
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedBuddy) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/buddies/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buddyId: selectedBuddy._id,
          message: requestMessage.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not send connection request.");
      }

      const data = await res.json();
      toast({
        message: "Connection request sent! The senior buddy will be notified.",
        type: "success",
      });

      // Update state locally
      setSuggestions((prev) =>
        prev.map((b) =>
          b._id === selectedBuddy._id
            ? { ...b, requestStatus: "pending", matchId: data.matchId }
            : b
        )
      );

      setModalOpen(false);
      onConnectionsChanged?.();
    } catch (err) {
      toast({
        message: err.message || "Failed to send request.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (buddyId, matchId) => {
    if (!matchId || cancellingId) return;

    setCancellingId(buddyId);
    try {
      const res = await fetch(`/api/buddies/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not cancel request.");
      }

      toast({ message: "Request cancelled.", type: "info" });

      setSuggestions((prev) =>
        prev.map((b) =>
          b._id === buddyId
            ? { ...b, requestStatus: "cancelled", matchId: null }
            : b
        )
      );

      onConnectionsChanged?.();
    } catch (err) {
      toast({
        message: err.message || "Failed to cancel request.",
        type: "error",
      });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Friendly fallback banner if no senior from student's country */}
      {!hasCountryMatch && noContentBannerText && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-primary-200 bg-primary-50/70 dark:bg-primary-950/20 dark:border-primary-800">
          <Info size={18} className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs text-primary-900 dark:text-primary-200 leading-relaxed">
            <p className="font-semibold mb-0.5">International Senior Buddies</p>
            <p>{noContentBannerText}</p>
          </div>
        </div>
      )}

      {suggestions.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title="No senior buddy suggestions right now"
          description="Check back soon as more senior international students volunteer to mentor newcomers."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((buddy) => {
            const cleanName = buddy.name.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "");
            const cleanBio = buddy.bio ? buddy.bio.replace(/^\[SAMPLE\]\s*/i, "") : "";
            const isCancelling = cancellingId === buddy._id;

            return (
              <Card key={buddy._id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                        {getInitials(cleanName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {cleanName}
                          </h3>
                          {buddy.isSameCountry && (
                            <Badge variant="success" className="text-[10px] flex items-center gap-1">
                              <Sparkles size={10} aria-hidden="true" /> Great match
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <Globe size={11} aria-hidden="true" />
                          <span>{buddy.country}</span>
                          {buddy.regionGroup && (
                            <span className="text-slate-400">• {buddy.regionGroup}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {cleanBio && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 mb-3">
                      {cleanBio}
                    </p>
                  )}

                  {buddy.languages?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {buddy.languages.map((lang) => {
                        const isShared = buddy.sharedLanguages?.includes(lang);
                        return (
                          <span
                            key={lang}
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full border",
                              isShared
                                ? "bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800 font-semibold"
                                : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                            )}
                          >
                            {lang} {isShared && "✓"}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action / Status area */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {buddy.requestStatus === "none" || buddy.requestStatus === "cancelled" ? (
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Send size={12} />}
                      onClick={() => handleOpenRequestModal(buddy)}
                    >
                      Request buddy
                    </Button>
                  ) : buddy.requestStatus === "pending" ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <Clock size={13} aria-hidden="true" /> Request sent
                      </span>
                      <button
                        type="button"
                        disabled={isCancelling}
                        onClick={() => handleCancelRequest(buddy._id, buddy.matchId)}
                        className="text-xs text-slate-400 hover:text-danger-600 dark:hover:text-danger-400 underline min-h-[36px] flex items-center"
                      >
                        {isCancelling ? "Cancelling..." : "Cancel request"}
                      </button>
                    </div>
                  ) : buddy.requestStatus === "accepted" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success-600 dark:text-success-400">
                      <CheckCircle2 size={13} aria-hidden="true" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <XCircle size={13} aria-hidden="true" /> Declined
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Request Message Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedBuddy ? `Request connection with ${selectedBuddy.name.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "")}` : "Request Buddy"}
        size="md"
      >
        <form onSubmit={handleSendRequest} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Introduce yourself! Let your senior buddy know where you are from and what questions you have about settling in.
          </p>

          <div>
            <textarea
              rows={4}
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Hi, I am new on campus and would appreciate your guidance regarding courses and local transport..."
              maxLength={300}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none placeholder:text-slate-400"
            />
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
              <span>Plain text only</span>
              <span>{requestMessage.trim().length} / 300</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={submitting}
              leftIcon={submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            >
              Send request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
