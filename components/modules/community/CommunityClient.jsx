"use client";
// components/modules/community/CommunityClient.jsx
// Client orchestrator managing tabs (People / Chats / Campus Events),
// URL synchronization (?tab=people|chats|events, with ?tab=buddies and ?tab=matches aliases),
// and active tab switching with unread message priority.

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Users, MessageSquare, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import PeopleSection from "./PeopleSection";
import MyConnections from "./MyConnections";
import EventsSection from "./EventsSection";

export default function CommunityClient({
  peopleData,
  chatsData,
  matches = [],
  events = [],
  currentUser,
  noContentBannerText,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Normalize chats data
  const chatsList = chatsData?.chats || matches.filter((m) => m.status === "active") || [];
  const blockedList = chatsData?.blockedChats || matches.filter((m) => m.status === "blocked") || [];

  const rawTab = searchParams.get("tab");
  // Aliases: buddies -> people, matches -> chats
  const resolvedTabParam =
    rawTab === "buddies" ? "people" : rawTab === "matches" ? "chats" : rawTab;

  // Unread messages count
  const totalUnreadMessages = chatsList.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const [unreadMessages, setUnreadMessages] = useState(totalUnreadMessages);

  useEffect(() => {
    setUnreadMessages(totalUnreadMessages);
  }, [totalUnreadMessages]);

  // Keep unread messages count live with notifications/presence polling
  useEffect(() => {
    const handleUnreadUpdate = (e) => {
      if (typeof e.detail?.unreadMessages === "number") {
        setUnreadMessages(e.detail.unreadMessages);
      }
    };

    window.addEventListener("campus:unread-notifications", handleUnreadUpdate);
    return () => {
      window.removeEventListener("campus:unread-notifications", handleUnreadUpdate);
    };
  }, []);

  // Default tab: Chats if user has unread messages, otherwise People
  const defaultTab = totalUnreadMessages > 0 ? "chats" : "people";

  const [activeTab, setActiveTab] = useState(
    ["people", "chats", "events"].includes(resolvedTabParam) ? resolvedTabParam : defaultTab
  );

  useEffect(() => {
    const currentRaw = searchParams.get("tab");
    const resolved =
      currentRaw === "buddies" ? "people" : currentRaw === "matches" ? "chats" : currentRaw;
    if (resolved && ["people", "chats", "events"].includes(resolved)) {
      setActiveTab(resolved);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    startTransition(() => {
      const current = new URLSearchParams(searchParams.toString());
      // Keep URL tab query synced
      current.set("tab", tabId);
      router.replace(`${pathname}?${current.toString()}`, { scroll: false });
    });
  };

  const handleRefreshConnections = () => {
    startTransition(() => {
      router.refresh();
    });
  };

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
          aria-selected={activeTab === "chats"}
          onClick={() => handleTabChange("chats")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[44px] shrink-0",
            activeTab === "chats"
              ? "bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <MessageSquare size={16} aria-hidden="true" />
          Chats
          {unreadMessages > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold animate-pulse">
              {unreadMessages}
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

      {activeTab === "chats" && (
        <MyConnections
          chats={chatsList}
          blockedChats={blockedList}
          matches={matches}
          currentUserId={currentUser?.id || currentUser?._id}
          onConnectionsChanged={handleRefreshConnections}
          onNavigateToPeople={() => handleTabChange("people")}
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
