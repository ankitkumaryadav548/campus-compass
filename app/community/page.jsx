// app/community/page.jsx
// Community & Mentorship module:
// Senior buddy matching, connection management, 1-to-1 chat, and campus mixer events.

import { requireUser } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import {
  getBuddySuggestions,
  getMyMatches,
  getUpcomingEvents,
} from "@/lib/community";
import { noContentNote } from "@/lib/personalization";
import AppShell from "@/components/layout/AppShell";
import CommunityClient from "@/components/modules/community/CommunityClient";
import { Users } from "lucide-react";

export const metadata = {
  title: "Community & Senior Buddies – Campus Compass",
};

export default async function CommunityPage() {
  const user = await requireUser("/community");

  await connectDB();

  const [suggestions, matches, events] = await Promise.all([
    getBuddySuggestions(user),
    getMyMatches(user),
    getUpcomingEvents(user),
  ]);

  const noContentBannerText = noContentNote(user);

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
            Connect with senior mentors from your home country, manage your peer connections, and attend campus cultural events.
          </p>
        </div>

        <CommunityClient
          suggestions={suggestions}
          matches={matches}
          events={events}
          userCountry={user.country}
          isSenior={Boolean(user.isSenior)}
          noContentBannerText={noContentBannerText}
        />
      </div>
    </AppShell>
  );
}
