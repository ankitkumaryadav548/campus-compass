"use client";
// components/modules/community/CommunityClient.jsx
// Client orchestrator managing 4 tabs: People, Invitations, Chats, Events.
// URL synchronization (?tab=people|invitations|chats|events, with ?tab=buddies and ?tab=matches aliases).
// Default tab: Invitations if pending invitations > 0, else Chats if unread messages > 0, else People.

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Users, UserCheck, MessageSquare, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import PeopleSection from "./PeopleSection";
import InvitationsTab from "./InvitationsTab";
import MyConnections from "./MyConnections";
import EventsSection from "./EventsSection";

export default function CommunityClient({
  peopleData,
  chatsData,
  invitationsData,
  events = [],
  currentUser,
  noContentBannerText,
  pendingInvitations: initialPendingCount = 0,
  totalUnreadMessages: initialUnreadCount = 0,
  initialScope = "country",
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const chatsList = chatsData?.chats || [];
  const blockedList = chatsData?.blockedChats || [];

  const rawTab = searchParams.get("tab");
  const resolvedTabParam =
    rawTab === "buddies"
      ? "people"
      : rawTab === "matches"
      ? "chats"
      : rawTab;

  const [unreadMessages, setUnreadMessages] = useState(initialUnreadCount);
  const [pendingInvitations, setPendingInvitations] = useState(initialPendingCount);

  useEffect(() => {
    setUnreadMessages(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    setPendingInvitations(initialPendingCount);
  }, [initialPendingCount]);

  // Keep counts in sync with live notifications/presence polling
  useEffect(() => {
    const handleUnreadUpdate = (e) => {
      if (typeof e.detail?.unreadMessages === "number") {
        setUnreadMessages(e.detail.unreadMessages);
      }
      if (typeof e.detail?.pendingInvitations === "number") {
        setPendingInvitations(e.detail.pendingInvitations);
      }
    };

    window.addEventListener("campus:unread-notifications", handleUnreadUpdate);
    return () => {
      window.removeEventListener("campus:unread-notifications", handleUnreadUpdate);
    };
  }, []);

  const defaultTab =
    pendingInvitations > 0 ? "invitations" : unreadMessages > 0 ? "chats" : "people";

  const validTabs = ["people", "invitations", "chats", "events"];
  const [activeTab, setActiveTab] = useState(
    validTabs.includes(resolvedTabParam) ? resolvedTabParam : defaultTab
  );

  useEffect(() => {
    const currentRaw = searchParams.get("tab");
    const resolved =
      currentRaw === "buddies"
        ? "people"
        : currentRaw === "matches"
        ? "chats"
        : currentRaw;
    if (resolved && validTabs.includes(resolved)) {
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

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const peopleCount = peopleData?.totalCount ?? peopleData?.people?.length ?? 0;

  const tabs = [
    {
      id: "people",
      label: "People",
      icon: <Users size={16} aria-hidden="true" />,
      badge: peopleCount > 0 ? peopleCount : null,
      badgeColor: "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold",
    },
    {
      id: "invitations",
      label: "Invitations",
      icon: <UserCheck size={16} aria-hidden="true" />,
      badge: pendingInvitations > 0 ? pendingInvitations : null,
      badgeColor: "bg-primary-600 text-white font-bold animate-pulse",
    },
    {
      id: "chats",
      label: "Chats",
      icon: <MessageSquare size={16} aria-hidden="true" />,
      badge: unreadMessages > 0 ? unreadMessages : null,
      badgeColor: "bg-emerald-500 text-white font-bold animate-pulse",
    },
    {
      id: "events",
      label: "Events",
      icon: <Calendar size={16} aria-hidden="true" />,
      badge: events.length > 0 ? events.length : null,
      badgeColor: "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Community sections"
        className="flex border-b border-slate-200 dark:border-slate-800 gap-2 pb-1 overflow-x-auto"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[44px] shrink-0",
              activeTab === tab.id
                ? "bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== null && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full", tab.badgeColor)}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === "people" && (
        <PeopleSection
          initialData={peopleData}
          currentUser={currentUser}
          noContentBannerText={noContentBannerText}
          initialScope={initialScope}
          onConnectionsChanged={handleRefresh}
          onGoToInvitations={() => handleTabChange("invitations")}
        />
      )}

      {activeTab === "invitations" && (
        <InvitationsTab
          initialData={invitationsData}
          currentUserId={currentUser?.id || currentUser?._id}
          onChanged={handleRefresh}
        />
      )}

      {activeTab === "chats" && (
        <MyConnections
          chats={chatsList}
          blockedChats={blockedList}
          currentUserId={currentUser?.id || currentUser?._id}
          onConnectionsChanged={handleRefresh}
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
