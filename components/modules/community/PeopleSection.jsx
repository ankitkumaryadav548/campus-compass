"use client";
// components/modules/community/PeopleSection.jsx
// People discovery with country scope filter, invitation flow buttons, and "Let others find and invite me" switch.

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Users, Sparkles, Globe, Info, MessageSquare, Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import InviteModal from "./InviteModal";

function getInitials(name) {
  if (!name) return "CC";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function PeopleSection({
  initialData,
  currentUser,
  noContentBannerText,
  initialScope = "country",
  onConnectionsChanged,
  onGoToInvitations,
}) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [scope, setScope] = useState(searchParams.get("scope") === "all" ? "all" : initialScope);
  const [kind, setKind] = useState(searchParams.get("kind") || "all");
  const [country, setCountry] = useState(searchParams.get("country") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [searchInput, setSearchInput] = useState(search);

  const [people, setPeople] = useState(initialData?.people || []);
  const [hasMore, setHasMore] = useState(Boolean(initialData?.hasMore));
  const [nextOffset, setNextOffset] = useState(initialData?.nextOffset ?? 12);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Invite modal state
  const [inviteTarget, setInviteTarget] = useState(null);
  const [sending, setSending] = useState(false);

  const [openToConnect, setOpenToConnect] = useState(currentUser?.openToConnect ?? true);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);

  useEffect(() => {
    if (initialData?.people) {
      setPeople(initialData.people);
      setHasMore(Boolean(initialData.hasMore));
      setNextOffset(initialData.nextOffset ?? 12);
    }
  }, [initialData]);

  const fetchPeople = async (targetScope, targetKind, targetCountry, targetSearch) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        scope: targetScope || "country",
        kind: targetKind || "all",
        country: targetCountry || "",
        search: targetSearch || "",
        limit: "12",
        offset: "0",
      });
      const res = await fetch(`/api/buddies?${params.toString()}`);
      if (!res.ok) throw new Error("Could not load people.");
      const data = await res.json();
      setPeople(data.people || []);
      setHasMore(Boolean(data.hasMore));
      setNextOffset(data.nextOffset ?? 12);

      const current = new URLSearchParams(searchParams.toString());
      if (!current.has("tab")) current.set("tab", "people");
      if (targetScope === "all") {
        current.set("scope", "all");
      } else {
        current.delete("scope");
      }
      if (targetKind && targetKind !== "all") {
        current.set("kind", targetKind);
      } else {
        current.delete("kind");
      }
      if (targetCountry) {
        current.set("country", targetCountry);
      } else {
        current.delete("country");
      }
      if (targetSearch) {
        current.set("search", targetSearch);
      } else {
        current.delete("search");
      }
      router.replace(`${pathname}?${current.toString()}`, { scroll: false });
    } catch (err) {
      toast({ message: err.message || "Failed to load people.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleScopeChange = (newScope) => {
    setScope(newScope);
    fetchPeople(newScope, kind, country, search);
  };

  const handleKindChange = (newKind) => {
    setKind(newKind);
    fetchPeople(scope, newKind, country, search);
  };

  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    setCountry(newCountry);
    fetchPeople(scope, kind, newCountry, search);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(val.trim());
      fetchPeople(scope, kind, country, val.trim());
    }, 400);
  };

  const handleClearFilters = () => {
    setScope("country");
    setKind("all");
    setCountry("");
    setSearch("");
    setSearchInput("");
    fetchPeople("country", "all", "", "");
  };

  const availableCountries = useMemo(() => {
    const set = new Set();
    people.forEach((p) => { if (p.country) set.add(p.country); });
    return Array.from(set).sort();
  }, [people]);

  // Show banner when scope is "country" but no country-match results exist
  const showRegionFallbackBanner = useMemo(() => {
    if (scope !== "country" || !currentUser?.country) return false;
    return people.length === 0 || people.every((p) => p.country !== currentUser.country);
  }, [people, scope, currentUser?.country]);

  const handleToggleVisibility = async () => {
    if (updatingVisibility) return;
    const nextVal = !openToConnect;
    setOpenToConnect(nextVal);
    setUpdatingVisibility(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openToConnect: nextVal }),
      });
      if (!res.ok) throw new Error("Could not update profile visibility.");
      toast({
        message: nextVal
          ? "You can now receive invitations from other students."
          : "Nobody can send you new invitations, but your existing chats continue.",
        type: "success",
      });
      onConnectionsChanged?.();
    } catch {
      setOpenToConnect(!nextVal);
      toast({ message: "Failed to update visibility. Please try again.", type: "error" });
    } finally {
      setUpdatingVisibility(false);
    }
  };

  const handleSendInvite = async (note) => {
    if (!inviteTarget || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: inviteTarget._id, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          message: data.error || "Could not send invitation.",
          type: res.status === 429 ? "warning" : "error",
        });
        return;
      }
      toast({ message: `Invitation sent to ${inviteTarget.name.split(" ")[0]}!`, type: "success" });
      setPeople((prev) =>
        prev.map((p) =>
          p._id === inviteTarget._id
            ? { ...p, relation: "invited", matchId: data.matchId }
            : p
        )
      );
      setInviteTarget(null);
      onConnectionsChanged?.();
    } catch (err) {
      toast({ message: err.message || "Failed to send invitation.", type: "error" });
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvite = async (person) => {
    try {
      const res = await fetch(`/api/invitations/${person.matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not cancel invitation.");
      toast({ message: "Invitation cancelled.", type: "info" });
      setPeople((prev) =>
        prev.map((p) =>
          p._id === person._id ? { ...p, relation: "none", matchId: null } : p
        )
      );
      onConnectionsChanged?.();
    } catch (err) {
      toast({ message: err.message || "Failed to cancel invitation.", type: "error" });
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        scope,
        kind,
        country,
        search,
        limit: "12",
        offset: nextOffset.toString(),
      });
      const res = await fetch(`/api/buddies?${params.toString()}`);
      if (!res.ok) throw new Error("Could not load more people.");
      const data = await res.json();
      setPeople((prev) => [...prev, ...(data.people || [])]);
      setHasMore(Boolean(data.hasMore));
      setNextOffset(data.nextOffset ?? nextOffset + 12);
    } catch (err) {
      toast({ message: err.message || "Failed to load more people.", type: "error" });
    } finally {
      setLoadingMore(false);
    }
  };

  const scopeOptions = [
    { id: "country", label: "My country" },
    { id: "all", label: "All countries" },
  ];

  return (
    <div className="space-y-5">
      {/* Visibility Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Let others find and invite me
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
              ? "Other students can find your profile and send you invitations."
              : "Nobody can send you new invitations, but your existing chats continue."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={openToConnect}
          aria-label="Let others find and invite me"
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

      {/* Scope + Filters */}
      <div className="space-y-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Scope chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="group" aria-label="People scope">
          {scopeOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleScopeChange(opt.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 min-h-[38px]",
                scope === opt.id
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row md:items-center justify-between gap-2">
          {/* Kind chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto" role="group" aria-label="Filter by role">
            {[
              { id: "all", label: "All" },
              { id: "seniors", label: "Seniors" },
              { id: "peers", label: "Peers" },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleKindChange(chip.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 min-h-[36px]",
                  kind === chip.id
                    ? "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Country select */}
            <div className="relative min-w-[140px]">
              <select
                value={country}
                onChange={handleCountryChange}
                aria-label="Filter by country"
                className="w-full text-xs py-2 px-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[38px] appearance-none"
              >
                <option value="">All Countries</option>
                {availableCountries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <SlidersHorizontal size={12} aria-hidden="true" />
              </div>
            </div>

            {/* Name search */}
            <div className="relative min-w-[180px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
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
      </div>

      {/* Fallback banner */}
      {showRegionFallbackBanner && noContentBannerText && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-primary-200 bg-primary-50/70 dark:bg-primary-950/20 dark:border-primary-800">
          <Info size={17} className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs text-primary-900 dark:text-primary-200 leading-relaxed">
            <p className="font-semibold mb-0.5">Looking beyond your country</p>
            <p>{noContentBannerText}</p>
          </div>
        </div>
      )}

      {/* People Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      ) : people.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title="No people found"
          description={
            scope === "country"
              ? "No students from your country found. Try switching to 'All countries'."
              : "Try clearing your search filters or choosing a different scope."
          }
          action={
            <Button variant="secondary" size="sm" onClick={handleClearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person) => {
            const cleanName = person.name.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "");

            return (
              <Card
                key={person._id}
                className="p-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-card-hover transition-all"
              >
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                      {getInitials(cleanName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {cleanName}
                        </h3>
                        {person.isSenior && (
                          <Badge variant="neutral" className="text-[10px]">Senior</Badge>
                        )}
                        {person.isSameCountry && (
                          <Badge variant="primary" className="text-[10px]">
                            <Sparkles size={9} className="mr-0.5" aria-hidden="true" />
                            Same country
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate mt-0.5">
                        <Globe size={11} aria-hidden="true" />
                        {person.country || "International"}
                        {person.regionGroup && ` · ${person.regionGroup}`}
                      </p>
                    </div>
                  </div>

                  {person.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                      {person.bio}
                    </p>
                  )}

                  {person.languages && person.languages.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4" aria-label="Languages spoken">
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

                {/* One button by relation */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 min-h-[44px] flex items-center">
                  {person.relation === "active" && person.matchId ? (
                    <Link
                      href={`/community/chat/${person.matchId}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors shadow-sm min-h-[44px]"
                    >
                      <MessageSquare size={13} aria-hidden="true" /> Open chat
                    </Link>
                  ) : person.relation === "invited" ? (
                    <div className="w-full flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Invitation sent
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCancelInvite(person)}
                        className="text-xs text-danger-600 dark:text-danger-400 hover:underline font-medium min-h-[44px] px-2 flex items-center"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : person.relation === "received" ? (
                    <div className="w-full flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        Wants to chat with you
                      </span>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={onGoToInvitations}
                        className="text-xs min-h-[38px]"
                      >
                        Invitations
                      </Button>
                    </div>
                  ) : person.relation === "unavailable" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled
                      className="w-full min-h-[44px] opacity-60 cursor-not-allowed"
                    >
                      Not available right now
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full min-h-[44px]"
                      onClick={() => setInviteTarget({ _id: person._id, name: cleanName })}
                    >
                      Invite
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="min-h-[40px] px-6"
          >
            {loadingMore ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={14} className="animate-spin" /> Loading…
              </span>
            ) : (
              "Load more people"
            )}
          </Button>
        </div>
      )}

      <InviteModal
        open={Boolean(inviteTarget)}
        onClose={() => !sending && setInviteTarget(null)}
        onSend={handleSendInvite}
        personName={inviteTarget?.name}
        sending={sending}
      />
    </div>
  );
}
