// app/community/chat/[matchId]/page.jsx
// Dedicated conversation page for accepted student-buddy pairs.

import { redirect, notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import BuddyMatch from "@/models/BuddyMatch";
import Message from "@/models/Message";
import AppShell from "@/components/layout/AppShell";
import ChatClient from "@/components/modules/community/ChatClient";

export const metadata = {
  title: "Chat – Campus Compass",
};

export default async function CommunityChatPage({ params }) {
  const { matchId } = await params;
  const user = await requireUser(`/community/chat/${matchId}`);

  await connectDB();

  const match = await BuddyMatch.findById(matchId)
    .populate("requesterId", "name country regionGroup languages bio isSenior")
    .populate("recipientId", "name country regionGroup languages bio isSenior")
    .populate("studentId", "name country regionGroup languages bio isSenior")
    .populate("buddyId", "name country regionGroup languages bio isSenior")
    .lean();

  if (!match) {
    notFound();
  }

  const userId = (user.id || user._id).toString();
  const requester = match.requesterId || match.studentId;
  const recipient = match.recipientId || match.buddyId;

  const isRequester = requester?._id?.toString() === userId;
  const isRecipient = recipient?._id?.toString() === userId;

  if (!isRequester && !isRecipient) {
    redirect("/community");
  }

  if (match.status !== "accepted") {
    redirect("/community?tab=matches");
  }

  const partner = isRequester ? recipient : requester;

  // Fetch chronological messages
  const rawMessages = await Message.find({ matchId })
    .sort({ createdAt: 1 })
    .lean();

  // Mark unread messages from the partner as read
  const unreadIds = rawMessages
    .filter((m) => m.senderId.toString() !== userId && !m.readAt)
    .map((m) => m._id);

  if (unreadIds.length > 0) {
    await Message.updateMany(
      { _id: { $in: unreadIds } },
      { $set: { readAt: new Date() } }
    );
  }

  const serializedMessages = rawMessages.map((m) => ({
    _id: m._id.toString(),
    matchId: m.matchId.toString(),
    senderId: m.senderId.toString(),
    isMine: m.senderId.toString() === userId,
    text: m.text,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt ? m.readAt.toISOString() : null,
  }));

  const serializedPartner = {
    _id: partner._id.toString(),
    name: partner.name,
    country: partner.country || "",
    regionGroup: partner.regionGroup || "",
    languages: partner.languages || [],
    bio: partner.bio || "",
    isSenior: Boolean(partner.isSenior),
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-0 py-6 sm:py-8">
        <ChatClient
          matchId={matchId}
          partner={serializedPartner}
          initialMessages={serializedMessages}
          currentUserId={userId}
        />
      </div>
    </AppShell>
  );
}
