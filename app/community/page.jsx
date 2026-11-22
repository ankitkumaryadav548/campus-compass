// app/community/page.jsx
// Community & Connections module:
// Direct peer and senior buddy discovery, direct messaging, safety tools (block/report), and campus mixer events.

import { requireUser } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import {
  getPeopleSuggestions,
  getMyChats,
  getUpcomingEvents,
} from "@/lib/community";
import { getInvitations } from "@/lib/invitations";
import { noContentNote } from "@/lib/personalization";
import AppShell from "@/components/layout/AppShell";
import CommunityClient from "@/components/modules/community/CommunityClient";
import { Users } from "lucide-react";

export const metadata = {
  title: "Community & Connections – Campus Compass",
};

export default async function CommunityPage({ searchParams }) {
  const sessionUser = await requireUser("/community");
  const resolvedSearchParams = (await searchParams) || {};

  const scope = resolvedSearchParams.scope === "all" ? "all" : "country";
  const kind = resolvedSearchParams.kind || "all";
  const country = resolvedSearchParams.country || "";
  const search = resolvedSearchParams.search || "";

  await connectDB();

  const dbUser = await User.findById(sessionUser.id)
    .select("name country regionGroup languages bio isSenior openToConnect role onboardingDone")
    .lean();

  const currentUser = {
    _id: sessionUser.id,
    id: sessionUser.id,
    name: dbUser?.name || sessionUser.name,
    country: dbUser?.country || sessionUser.country || "",
    regionGroup: dbUser?.regionGroup || sessionUser.regionGroup || "",
    languages: dbUser?.languages || [],
    bio: dbUser?.bio || "",
    isSenior: Boolean(dbUser?.isSenior),
    openToConnect: dbUser?.openToConnect !== false,
  };

  const [peopleData, chatsData, invitationsData, events] = await Promise.all([
    getPeopleSuggestions(currentUser, { scope, kind, country, search }),
    getMyChats(currentUser),
    getInvitations(currentUser),
    getUpcomingEvents(currentUser),
  ]);

  const pendingInvitations = invitationsData.received.length;
  const totalUnreadMessages = chatsData.chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const noContentBannerText = noContentNote(currentUser);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-0 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <Users size={22} className="text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              International Student Community
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Find students from your country, send an invitation, and start chatting once they accept.
          </p>
        </div>

        <CommunityClient
          peopleData={peopleData}
          chatsData={chatsData}
          invitationsData={invitationsData}
          events={events}
          currentUser={currentUser}
          noContentBannerText={noContentBannerText}
          pendingInvitations={pendingInvitations}
          totalUnreadMessages={totalUnreadMessages}
          initialScope={scope}
        />
      </div>
    </AppShell>
  );
}
