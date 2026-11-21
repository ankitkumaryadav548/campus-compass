"use client";
// components/modules/community/PeopleSection.jsx
// Peer and Senior connection directory with filter chips, country select, name search,
// "Let others find and message me" visibility switch, and direct "Message" / "Open chat" actions.

import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Users,
  Sparkles,
  Globe,
  Info,
  MessageSquare,
  Search,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
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

  // Starting chat state
  const [startingChatId, setStartingChatId] = useState(null);

  // "Let others find and message me" visibility switch state
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

  // Check if current list has anyone from the user's country
  const hasCountryMatch = useMemo(() => {
    if (!currentUser?.country) return true;
    return people.some((p) => p.country === currentUser.country);
  }, [people, currentUser?.country]);

  // Visibility toggle
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

      if (!res.ok) {
        throw new Error("Could not update profile visibility.");
      }

      toast({
        message: nextVal
          ? "You can now receive direct messages from other students."
          : "You are now hidden from new chats. Existing chats continue.",
        type: "success",
      });

      onConnectionsChanged?.();
    } catch {
      setOpenToConnect(!nextVal);
      toast({
        message: "Failed to update visibility. Please try again.",
        type: "error",
      });
    } finally {
      setUpdatingVisibility(false);
    }
  };

  // Direct start chat handler
  const handleStartChat = async (person) => {
    if (startingChatId) return;
    setStartingChatId(person._id);

    try {
      const res = await fetch("/api/buddies/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: person._id }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          toast({
            message:
              data.error ||
              "You have reached your daily limit of 10 new chats. Please try again tomorrow.",
            type: "warning",
          });
          return;
        }
        throw new Error(data.error || "Could not start chat.");
      }

      router.push(`/community/chat/${data.matchId}`);
    } catch (err) {
      toast({
        message: err.message || "Failed to start chat.",
        type: "error",
      });
    } finally {
      setStartingChatId(null);
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
              Let others find and message me
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
              ? "Other students and senior buddies can discover your profile and start direct chats with you."
              : "When turned off, people cannot start new chats with you, but your existing chats continue."}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={openToConnect}
          aria-label="Let others find and message me"
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
          description="Try selecting a different category or clearing search filters to meet other students."
          action={
            <Button variant="secondary" size="sm" onClick={handleClearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person) => {
            const isStarting = startingChatId === person._id;
            const hasActiveChat = person.relation === "active" && person.matchId;

            return (
              <Card
                key={person._id}
                className="p-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-card-hover transition-all"
              >
                <div>
                  {/* Top: Avatar + Name + Senior Badge */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                      {getInitials(person.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {person.name.replace(" (Sample)", "")}
                        </h3>
                        {person.isSenior && (
                          <Badge variant="neutral" className="text-[10px]">
                            Senior
                          </Badge>
                        )}
                      </div>

                      {/* Country & Region */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate mt-0.5">
                        <Globe size={11} aria-hidden="true" />
                        {person.country || "International"}
                        {person.regionGroup && ` • ${person.regionGroup}`}
                      </p>
                    </div>
                  </div>

                  {/* Highlights: Same country badge */}
                  {person.isSameCountry && (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-md border border-primary-100 dark:border-primary-900">
                        <Sparkles size={10} aria-hidden="true" /> Same Country
                      </span>
                    </div>
                  )}

                  {/* Bio */}
                  {person.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                      {person.bio}
                    </p>
                  )}

                  {/* Languages with shared indicator */}
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

                {/* Card Action Button: ONE main button ("Open chat" or "Message") */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between min-h-[44px]">
                  {hasActiveChat ? (
                    <Link
                      href={`/community/chat/${person.matchId}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors shadow-sm min-h-[44px]"
                    >
                      <MessageSquare size={13} aria-hidden="true" /> Open chat
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full min-h-[44px]"
                      disabled={isStarting}
                      loading={isStarting}
                      leftIcon={<MessageSquare size={13} />}
                      onClick={() => handleStartChat(person)}
                    >
                      Message
                    </Button>
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
    </div>
  );
}
