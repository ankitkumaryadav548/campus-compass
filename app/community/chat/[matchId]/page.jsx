// app/community/chat/[matchId]/page.jsx
// Dedicated conversation page for direct 1-to-1 chats with real-time polling, status ticks, and safety tools.

import { notFound, redirect } from "next/navigation";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import BuddyMatch from "@/models/BuddyMatch";
import User from "@/models/User";
import { getMessagesForMatch } from "@/lib/messages";
import { getUserPresence } from "@/lib/presence";
import { getMyChats } from "@/lib/community";
import AppShell from "@/components/layout/AppShell";
import ChatWindow from "@/components/modules/community/chat/ChatWindow";
import ChatListItem from "@/components/modules/community/chat/ChatListItem";
import { MessageSquare, Users } from "lucide-react";

export const metadata = {
  title: "Chat – Campus Compass",
};

export default async function CommunityChatPage({ params }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/community");
  }

  const { matchId } = await params;
  if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
    notFound();
  }

  await connectDB();

  // Find the match using lean to preserve raw ObjectId values
  const rawMatch = await BuddyMatch.findById(matchId).lean();
  if (!rawMatch) {
    notFound();
  }

  const rawReqId = (rawMatch.requesterId || rawMatch.studentId)?.toString();
  const rawRecId = (rawMatch.recipientId || rawMatch.buddyId)?.toString();

  let userId = (user.id || user._id)?.toString();
  let isRequester = rawReqId === userId;
  let isRecipient = rawRecId === userId;

  // If session ID does not match directly, check if session user's email matches either participant
  if (!isRequester && !isRecipient && user.email) {
    const dbUser = await User.findOne({ email: user.email }).select("_id").lean();
    if (dbUser) {
      const currentDbId = dbUser._id.toString();
      if (rawReqId === currentDbId) {
        isRequester = true;
        userId = currentDbId;
      }
      if (rawRecId === currentDbId) {
        isRecipient = true;
        userId = currentDbId;
      }
    }
  }

  if (!isRequester && !isRecipient) {
    notFound();
  }

  if (rawMatch.status !== "active" && rawMatch.status !== "blocked") {
    redirect("/community?tab=matches");
  }

  const partnerId = isRequester ? rawRecId : rawReqId;
  const partnerDoc = await User.findById(partnerId)
    .select("name country regionGroup languages bio isSenior lastSeenAt")
    .lean();

  const partnerPresence = partnerDoc?._id
    ? await getUserPresence(partnerDoc._id)
    : { online: false, lastSeenAt: null };

  // Concurrently fetch initial messages, partner presence, and all user active chats for desktop sidebar
  const [messagesResult, userChats] = await Promise.all([
    getMessagesForMatch({
      matchId,
      userId,
      limit: 50,
    }),
    getMyChats(user),
  ]);

  const activeChats = userChats.chats || [];
  const hasReplied = messagesResult.messages.some((m) => m.senderId === userId);

  const partnerName =
    partnerDoc?.name?.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "") || "Connection";
  const serializedPartner = {
    _id: partnerId,
    name: partnerName,
    country: partnerDoc?.country || "",
    regionGroup: partnerDoc?.regionGroup || "",
    languages: partnerDoc?.languages || [],
    bio: partnerDoc?.bio || "",
    isSenior: Boolean(partnerDoc?.isSenior),
    lastSeenAt: partnerDoc?.lastSeenAt ? new Date(partnerDoc.lastSeenAt).toISOString() : null,
    online: partnerPresence.online,
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Desktop Left Chats Panel (Hidden on mobile) */}
          <div className="hidden lg:flex lg:col-span-4 xl:col-span-4 flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card h-[82vh] min-h-[520px] max-h-[820px] overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-primary-600 dark:text-primary-400" aria-hidden="true" />
                <h1 className="text-sm font-bold text-slate-900 dark:text-white">
                  Conversations
                </h1>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                {activeChats.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {activeChats.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <Users size={24} className="mx-auto mb-2 opacity-50" />
                  No other active chats yet.
                </div>
              ) : (
                activeChats.map((conn) => (
                  <ChatListItem
                    key={conn._id}
                    match={conn}
                    isSelected={conn._id === matchId}
                    currentUserId={userId}
                  />
                ))
              )}
            </div>
          </div>

          {/* Chat Window Panel (Full width on mobile, 8-col on desktop) */}
          <div className="col-span-1 lg:col-span-8 xl:col-span-8">
            <ChatWindow
              matchId={matchId}
              partner={serializedPartner}
              initialMessages={messagesResult.messages}
              initialPartnerPresence={partnerPresence}
              initialFirstUnreadId={messagesResult.firstUnreadId}
              currentUserId={userId}
              backHref="/community?tab=matches"
              matchStatus={rawMatch.status}
              blockedBy={rawMatch.blockedBy ? rawMatch.blockedBy.toString() : null}
              isStarter={isRequester}
              initialHasReplied={hasReplied}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
