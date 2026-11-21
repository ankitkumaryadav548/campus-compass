"use client";
// components/modules/community/CommunityClient.jsx
// Client orchestrator managing tabs (People / My Connections / Campus Events),
// URL synchronization (?tab=people|matches|events, with ?tab=buddies alias),
// and cross-tab connection status refreshing.

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Users, UserCheck, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import PeopleSection from "./PeopleSection";
import MyConnections from "./MyConnections";
import EventsSection from "./EventsSection";

export default function CommunityClient({
  peopleData,
  matches,
  events,
  currentUser,
  noContentBannerText,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const rawTab = searchParams.get("tab");
  const tabParam = rawTab === "buddies" ? "people" : rawTab;

  const hasIncomingPending = matches.some(
    (m) => m.status === "pending" && (m.direction === "incoming" || !m.isRequester)
  );

  const defaultTab = hasIncomingPending ? "matches" : "people";

  const [activeTab, setActiveTab] = useState(
    ["people", "matches", "events"].includes(tabParam) ? tabParam : defaultTab
  );

  useEffect(() => {
    const currentRaw = searchParams.get("tab");
    const resolved = currentRaw === "buddies" ? "people" : currentRaw;
    if (resolved && ["people", "matches", "events"].includes(resolved)) {
      setActiveTab(resolved);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    startTransition(() => {
      const current = new URLSearchParams(searchParams.toString());
      current.set("tab", tabId);
      router.replace(`${pathname}?${current.toString()}`, { scroll: false });
    });
  };

  const handleRefreshConnections = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const pendingIncomingCount = matches.filter(
    (m) => m.status === "pending" && (m.direction === "incoming" || !m.isRequester)
  ).length;

  const peopleCount = peopleData?.totalCount ?? peopleData?.people?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Community sections"
        className="flex border-b border-slate-200 dark:border-slate-800 gap-2 pb-1 overflow-x-auto"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "people"}
          onClick={() => handleTabChange("people")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[44px] shrink-0",
            activeTab === "people"
              ? "bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Users size={16} aria-hidden="true" />
          People
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
            {peopleCount}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "matches"}
          onClick={() => handleTabChange("matches")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[44px] shrink-0",
            activeTab === "matches"
              ? "bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <UserCheck size={16} aria-hidden="true" />
          My Connections
          {pendingIncomingCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold animate-pulse">
              {pendingIncomingCount} new
            </span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "events"}
          onClick={() => handleTabChange("events")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[44px] shrink-0",
            activeTab === "events"
              ? "bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Calendar size={16} aria-hidden="true" />
          Campus Events
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
            {events.length}
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "people" && (
        <PeopleSection
          initialData={peopleData}
          currentUser={currentUser}
          noContentBannerText={noContentBannerText}
          onConnectionsChanged={handleRefreshConnections}
        />
      )}

      {activeTab === "matches" && (
        <MyConnections
          matches={matches}
          onConnectionsChanged={handleRefreshConnections}
        />
      )}

      {activeTab === "events" && (
        <EventsSection
          events={events}
          userCountry={currentUser?.country}
        />
      )}
    </div>
  );
}
