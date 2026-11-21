"use client";
// components/modules/community/PeopleSection.jsx
// Peer and Senior connection suggestions with filter chips, country select, name search,
// "Show me in People" visibility switch, connection request modal, and direct card response actions.

import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
  Check,
  X,
  MessageSquare,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

function getInitials(name) {
  if (!name) return "CC";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function PeopleSection({
  initialData,
  currentUser,
  noContentBannerText,
  onConnectionsChanged,
}) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Filters from URL query params
  const currentKind = searchParams.get("kind") || "all";
  const currentCountry = searchParams.get("country") || "";
  const currentSearch = searchParams.get("search") || "";

  // State
  const [people, setPeople] = useState(initialData?.people || []);
  const [hasMore, setHasMore] = useState(Boolean(initialData?.hasMore));
  const [nextOffset, setNextOffset] = useState(initialData?.nextOffset ?? 12);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search input state (with debouncing to update URL)
  const [searchInput, setSearchInput] = useState(currentSearch);
  const searchTimeoutRef = useRef(null);

  // Connection request modal state
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Card action states
  const [actingId, setActingId] = useState(null);

  // "Show me in People" visibility switch state
  const [openToConnect, setOpenToConnect] = useState(currentUser?.openToConnect ?? true);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);

  // Sync state when initialData updates (e.g. after router.refresh())
  useEffect(() => {
    if (initialData?.people) {
      setPeople(initialData.people);
      setHasMore(Boolean(initialData.hasMore));
      setNextOffset(initialData.nextOffset ?? 12);
    }
  }, [initialData]);

  // Sync search input if URL changes externally
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const updateFiltersInUrl = (updates) => {
    const current = new URLSearchParams(searchParams.toString());
    // Ensure tab stays as people
    if (!current.has("tab")) {
      current.set("tab", "people");
    }

    for (const [key, val] of Object.entries(updates)) {
      if (val && val !== "all") {
        current.set(key, val);
      } else {
        current.delete(key);
      }
    }

    startTransition(() => {
      router.replace(`${pathname}?${current.toString()}`, { scroll: false });
    });
  };

  const handleKindChange = (kind) => {
    updateFiltersInUrl({ kind });
  };

  const handleCountryChange = (e) => {
    updateFiltersInUrl({ country: e.target.value });
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      updateFiltersInUrl({ search: val.trim() });
    }, 400);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    updateFiltersInUrl({ kind: "all", country: "", search: "" });
  };

  // Unique country list built from current people suggestions
  const availableCountries = useMemo(() => {
    const set = new Set();
    people.forEach((p) => {
      if (p.country) set.add(p.country);
    });
    return Array.from(set).sort();
  }, [people]);

  const hasCountryMatch = people.some((p) => p.isSameCountry);

  // Toggle "Show me in People"
  const handleToggleVisibility = async () => {
    if (updatingVisibility) return;
    const nextVal = !openToConnect;
    setUpdatingVisibility(true);

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openToConnect: nextVal }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Could not update visibility setting.");
      }

      setOpenToConnect(nextVal);
      toast({
        message: nextVal
          ? "You are now visible in People discovery."
          : "You are now hidden from People discovery.",
        type: nextVal ? "success" : "info",
      });
    } catch (err) {
      toast({
        message: err.message || "Failed to update visibility.",
        type: "error",
      });
    } finally {
      setUpdatingVisibility(false);
    }
  };

  // Open modal to send request
  const handleOpenRequestModal = (person) => {
    setSelectedPerson(person);
    const greetingName = person.name.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "").split(" ")[0];
    setRequestMessage(`Hi ${greetingName}, I recently arrived and would love to connect!`);
    setModalOpen(true);
  };

  // Submit connection request
  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedPerson || submittingRequest) return;

    setSubmittingRequest(true);
    try {
      const res = await fetch("/api/buddies/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: selectedPerson._id,
          message: requestMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not send connection request.");
      }

      toast({
        message: "Connection request sent!",
        type: "success",
      });

      // Update person card state locally
      setPeople((prev) =>
        prev.map((p) =>
          p._id === selectedPerson._id
            ? { ...p, requestStatus: "pending_sent", matchId: data.matchId }
            : p
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
      setSubmittingRequest(false);
    }
  };

  // Cancel sent request
  const handleCancelRequest = async (personId, matchId) => {
    if (!matchId || actingId) return;

    setActingId(personId);
    try {
      const res = await fetch(`/api/buddies/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not cancel request.");
      }

      toast({ message: "Request cancelled.", type: "info" });

      setPeople((prev) =>
        prev.map((p) =>
          p._id === personId
            ? { ...p, requestStatus: "cancelled" }
            : p
        )
      );

      onConnectionsChanged?.();
    } catch (err) {
      toast({
        message: err.message || "Failed to cancel request.",
        type: "error",
      });
    } finally {
      setActingId(null);
    }
  };

  // Accept or decline an incoming request directly on the card
  const handleRespondRequest = async (personId, matchId, action) => {
    if (!matchId || actingId) return;

    setActingId(personId);
    try {
      const res = await fetch(`/api/buddies/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not update request.");
      }

      toast({
        message: action === "accept" ? "Connection accepted! You can now chat." : "Request declined.",
        type: action === "accept" ? "success" : "info",
      });

      setPeople((prev) =>
        prev.map((p) =>
          p._id === personId
            ? {
                ...p,
                requestStatus: action === "accept" ? "accepted" : "declined",
                matchId: data.matchId || p.matchId || matchId,
              }
            : p
        )
      );

      onConnectionsChanged?.();
    } catch (err) {
      toast({
        message: err.message || "Failed to update connection request.",
        type: "error",
      });
    } finally {
      setActingId(null);
    }
  };

  // Load more pagination
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        kind: currentKind,
        country: currentCountry,
        search: currentSearch,
        limit: "12",
        offset: nextOffset.toString(),
      });

      const res = await fetch(`/api/buddies?${params.toString()}`);
      if (!res.ok) throw new Error("Could not load more people.");

      const data = await res.json();
      setPeople((prev) => [...prev, ...(data.people || [])]);
      setHasMore(Boolean(data.hasMore));
      setNextOffset(data.nextOffset ?? (nextOffset + 12));
    } catch (err) {
      toast({
        message: err.message || "Failed to load more people.",
        type: "error",
      });
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Visibility Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Show me in People
            </span>
            <span
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full font-semibold",
                openToConnect
                  ? "bg-success-50 text-success-700 dark:bg-success-950/40 dark:text-success-400"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              )}
            >
              {openToConnect ? "Visible" : "Hidden"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {openToConnect
              ? "Other students and senior buddies can discover your profile and send you connection requests."
              : "You are currently hidden from search and cannot receive new connection requests."}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={openToConnect}
          aria-label="Show me in People directory"
          disabled={updatingVisibility}
          onClick={handleToggleVisibility}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 self-start sm:self-center",
            openToConnect ? "bg-primary-600" : "bg-slate-300 dark:bg-slate-700",
            updatingVisibility && "opacity-50 cursor-not-allowed"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
              openToConnect ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Kind Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0" role="group" aria-label="Filter by person role">
          {[
            { id: "all", label: "All" },
            { id: "seniors", label: "Seniors" },
            { id: "peers", label: "Peers" },
          ].map((chip) => {
            const isSelected = currentKind === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleKindChange(chip.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 min-h-[38px]",
                  isSelected
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Country and Search controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Country Select */}
          <div className="relative min-w-[150px]">
            <select
              value={currentCountry}
              onChange={handleCountryChange}
              aria-label="Filter by country"
              className="w-full text-xs py-2 px-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[38px] appearance-none"
            >
              <option value="">All Countries</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <SlidersHorizontal size={13} aria-hidden="true" />
            </div>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search by name…"
              aria-label="Search people by name"
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-slate-400 min-h-[38px]"
            />
          </div>
        </div>
      </div>

      {/* Info banner if no person from student's country */}
      {!hasCountryMatch && noContentBannerText && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-primary-200 bg-primary-50/70 dark:bg-primary-950/20 dark:border-primary-800">
          <Info size={18} className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs text-primary-900 dark:text-primary-200 leading-relaxed">
            <p className="font-semibold mb-0.5">International Community</p>
            <p>{noContentBannerText}</p>
          </div>
        </div>
      )}

      {/* People Grid */}
      {people.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title="No people found"
          description="Try selecting a different filter chip, clearing the country filter, or checking your search terms."
          action={
            <Button size="sm" variant="secondary" onClick={handleClearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {people.map((person) => {
            const cleanName = person.name.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "");
            const cleanBio = person.bio ? person.bio.replace(/^\[SAMPLE\]\s*/i, "") : "";
            const isActing = actingId === person._id;

            return (
              <Card key={person._id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  {/* Top info header */}
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
                          {person.isSenior && (
                            <Badge variant="info" className="text-[10px]">
                              Senior
                            </Badge>
                          )}
                          {person.isSameCountry && (
                            <Badge variant="success" className="text-[10px] flex items-center gap-1">
                              <Sparkles size={10} aria-hidden="true" /> Great match
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <Globe size={11} aria-hidden="true" />
                          <span>{person.country}</span>
                          {person.regionGroup && (
                            <span className="text-slate-400">• {person.regionGroup}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {cleanBio && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 mb-3">
                      {cleanBio}
                    </p>
                  )}

                  {/* Language tags */}
                  {person.languages?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {person.languages.map((lang) => {
                        const isShared = person.sharedLanguages?.includes(lang);
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

                {/* Card Action / Status Bar */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between min-h-[44px]">
                  {/* Case 1: No match, or cancelled, or declined -> "Connect" */}
                  {(!person.requestStatus ||
                    person.requestStatus === "none" ||
                    person.requestStatus === "cancelled" ||
                    person.requestStatus === "declined") && (
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Send size={12} />}
                      onClick={() => handleOpenRequestModal(person)}
                    >
                      Connect
                    </Button>
                  )}

                  {/* Case 2: Sent by current user -> "Request sent" + Cancel button */}
                  {person.requestStatus === "pending_sent" && (
                    <div className="flex items-center justify-between w-full">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <Clock size={13} aria-hidden="true" /> Request sent
                      </span>
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleCancelRequest(person._id, person.matchId)}
                        className="text-xs text-slate-400 hover:text-danger-600 dark:hover:text-danger-400 underline min-h-[36px] flex items-center"
                      >
                        {isActing ? "Cancelling…" : "Cancel"}
                      </button>
                    </div>
                  )}

                  {/* Case 3: Received by current user -> "Wants to connect" + Accept & Decline buttons */}
                  {person.requestStatus === "pending_received" && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <Clock size={13} aria-hidden="true" /> Wants to connect
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isActing}
                          leftIcon={<X size={12} />}
                          onClick={() => handleRespondRequest(person._id, person.matchId, "decline")}
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={isActing}
                          loading={isActing}
                          leftIcon={<Check size={12} />}
                          onClick={() => handleRespondRequest(person._id, person.matchId, "accept")}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Case 4: Accepted connection -> "Connected" + Open chat link */}
                  {person.requestStatus === "accepted" && (
                    <div className="flex items-center justify-between w-full">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success-600 dark:text-success-400">
                        <CheckCircle2 size={13} aria-hidden="true" /> Connected
                      </span>
                      {person.matchId && (
                        <Link
                          href={`/community/chat/${person.matchId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors shadow-sm min-h-[36px]"
                        >
                          <MessageSquare size={12} aria-hidden="true" /> Open chat
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* "Load more" button */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLoadMore}
            loading={loadingMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading more…" : "Load more people"}
          </Button>
        </div>
      )}

      {/* Connection Request Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedPerson ? `Connect with ${selectedPerson.name.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "")}` : "Send Connection Request"}
        size="md"
      >
        <form onSubmit={handleSendRequest} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Introduce yourself! Send a short note about your course, interests, or questions.
          </p>

          <div>
            <textarea
              rows={4}
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Hi, I am new on campus and would love to connect..."
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
              loading={submittingRequest}
              leftIcon={submittingRequest ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            >
              Send request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
