// app/chat/page.jsx
// Protected AI Chatbot module - Server Component

import { requireUser } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { getChecklistForUser } from "@/lib/checklist";
import { getStarterQuestions } from "@/lib/chatbot/starters";
import AppShell from "@/components/layout/AppShell";
import ChatPanel from "@/components/modules/chat/ChatPanel";

export const metadata = {
  title: "Campus Assistant – Campus Compass",
  description: "AI-powered arrival assistant for international students in India",
};

export default async function ChatPage() {
  const user = await requireUser("/chat");

  let starterQuestions = [];
  try {
    await connectDB();
    const checklistItems = await getChecklistForUser(user);
    const pendingItem = checklistItems.find((item) => item.status === "pending");
    starterQuestions = getStarterQuestions(pendingItem?.title);
  } catch (err) {
    console.error("Failed to load checklist starters:", err.message);
    starterQuestions = getStarterQuestions();
  }

  const firstName = user?.name ? user.name.trim().split(" ")[0] : "Student";

  return (
    <AppShell>
      <ChatPanel firstName={firstName} starterQuestions={starterQuestions} />
    </AppShell>
  );
}
