"use client";
// components/modules/community/InvitationsTab.jsx
// Displays received and sent invitations with responsive actions:
// Received: Accept, Decline, Block, Report
// Sent: status display and Cancel while pending.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRelativeTime } from "@/lib/notificationText";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { UserCheck, Clock, Globe, MessageSquare, MoreVertical, ShieldAlert, Flag } from "lucide-react";

function getInitials(name) {
  if (!name) return "CC";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function PersonAvatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
      {getInitials(name)}
    </div>
  );
}

function ReportModal({ open, isOpen, onClose, matchId, personName, onReported }) {
  const isModalOpen = Boolean(isOpen ?? open);
  const toast = useToast();
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [reporting, setReporting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setReporting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, reason, details: details.trim(), alsoBlock: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit report.");
      toast({ message: "Thank you. Your report has been submitted confidentially.", type: "success" });
      onReported?.();
      onClose();
    } catch (err) {
      toast({ message: err.message, type: "error" });
    } finally {
      setReporting(false);
    }
  };

  const firstName = personName?.split(" ")[0] || "this person";

  return (
    <Modal isOpen={isModalOpen} open={isModalOpen} onClose={onClose} title={`Report ${firstName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your report is confidential. {firstName} will not be notified of who reported them.
        </p>
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
                name="reason"
                value={item.id}
                checked={reason === item.id}
                onChange={(e) => setReason(e.target.value)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Details (optional)
          </label>
          <textarea
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={300}
            placeholder="Provide any additional context…"
            className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
          <div className="text-right text-[10px] text-slate-400">{details.length} / 300</div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" disabled={reporting} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={reporting} disabled={reporting}>
            Submit report
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function InvitationsTab({ initialData, currentUserId, onChanged }) {
  const toast = useToast();
  const router = useRouter();

  const [received, setReceived] = useState(initialData?.received || []);
  const [sent, setSent] = useState(initialData?.sent || []);
  const [actingId, setActingId] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const actOnInvitation = async (matchId, action) => {
    if (actingId) return;
    setActingId(matchId + action);
    setOpenMenuId(null);

    try {
      const res = await fetch(`/api/invitations/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update invitation.");

      if (action === "accept") {
        toast({ message: "Chat started! You can now message each other.", type: "success" });
        router.push(`/community/chat/${data.matchId || matchId}`);
      } else if (action === "decline") {
        setReceived((prev) => prev.filter((i) => i._id !== matchId));
        toast({ message: "Invitation declined.", type: "info" });
      } else if (action === "block") {
        setReceived((prev) => prev.filter((i) => i._id !== matchId));
        toast({ message: "User blocked.", type: "info" });
      } else if (action === "cancel") {
        setSent((prev) => prev.filter((i) => i._id !== matchId));
        toast({ message: "Invitation cancelled.", type: "info" });
      }

      onChanged?.();
    } catch (err) {
      toast({ message: err.message || "Something went wrong.", type: "error" });
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Received Group */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Received
          </h2>
          {received.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-semibold">
              {received.length}
            </span>
          )}
        </div>

        {received.length === 0 ? (
          <EmptyState
            icon={<UserCheck size={28} />}
            title="No received invitations"
            description="When another student invites you to chat, their invitation will appear here."
          />
        ) : (
          <Card className="divide-y divide-slate-100 dark:divide-slate-800 overflow-visible">
            {received.map((inv) => {
              const name =
                inv.requester?.name?.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "") ||
                "Someone";
              const isActing = actingId?.startsWith(inv._id);
              const isMenuOpen = openMenuId === inv._id;

              return (
                <div key={inv._id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <PersonAvatar name={name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate mt-0.5">
                        <Globe size={11} aria-hidden="true" />
                        {inv.requester?.country || "International"}
                        {inv.requester?.regionGroup && ` · ${inv.requester.regionGroup}`}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock size={9} aria-hidden="true" />
                        {formatRelativeTime(inv.invitedAt)}
                      </p>
                    </div>
                  </div>

                  {inv.note && (
                    <div className="ml-13 pl-1">
                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 leading-relaxed border border-slate-100 dark:border-slate-700">
                        &ldquo;{inv.note}&rdquo;
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={isActing}
                      loading={actingId === inv._id + "accept"}
                      onClick={() => actOnInvitation(inv._id, "accept")}
                      className="min-h-[44px]"
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isActing}
                      loading={actingId === inv._id + "decline"}
                      onClick={() => actOnInvitation(inv._id, "decline")}
                      className="min-h-[44px]"
                    >
                      Decline
                    </Button>

                    {/* Menu with Block and Report */}
                    <div className="relative ml-auto">
                      <button
                        type="button"
                        aria-label="More options"
                        aria-expanded={isMenuOpen}
                        disabled={isActing}
                        onClick={() => setOpenMenuId(isMenuOpen ? null : inv._id)}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-20 py-1 overflow-hidden animate-scale-in">
                          <button
                            type="button"
                            onClick={() => actOnInvitation(inv._id, "block")}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 min-h-[44px]"
                          >
                            <ShieldAlert size={14} />
                            <span>Block</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              setReportTarget({ matchId: inv._id, name });
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
                          >
                            <Flag size={14} />
                            <span>Report</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>

      {/* Sent Group */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Sent
          </h2>
          {sent.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              {sent.length}
            </span>
          )}
        </div>

        {sent.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={28} />}
            title="No sent invitations"
            description="When you invite other students from People, your sent invitations will be listed here."
          />
        ) : (
          <Card className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {sent.map((inv) => {
              const name =
                inv.recipient?.name?.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "") ||
                "Someone";
              const isPending = inv.status === "pending";
              const isActing = actingId === inv._id + "cancel";

              const statusBadge =
                inv.displayStatus === "unavailable" ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                    Not available right now
                  </span>
                ) : inv.status === "pending" ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-800">
                    Pending
                  </span>
                ) : inv.status === "active" ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                    Accepted
                  </span>
                ) : inv.status === "cancelled" ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                    Cancelled
                  </span>
                ) : inv.status === "expired" ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                    Expired
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                    {inv.status}
                  </span>
                );

              return (
                <div key={inv._id} className="p-4 flex items-center justify-between gap-3 min-h-[64px]">
                  <div className="flex items-center gap-3 min-w-0">
                    <PersonAvatar name={name} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {statusBadge}
                        <span className="text-[10px] text-slate-400">
                          {formatRelativeTime(inv.invitedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isPending && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isActing}
                      loading={isActing}
                      onClick={() => actOnInvitation(inv._id, "cancel")}
                      className="text-xs min-h-[44px] shrink-0"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              );
            })}
          </Card>
        )}
      </div>

      {reportTarget && (
        <ReportModal
          open={Boolean(reportTarget)}
          onClose={() => setReportTarget(null)}
          matchId={reportTarget.matchId}
          personName={reportTarget.name}
          onReported={() => {
            setReceived((prev) => prev.filter((i) => i._id !== reportTarget.matchId));
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}
