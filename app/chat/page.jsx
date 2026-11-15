// app/chat/page.jsx
// Protected AI Chatbot module

import { requireUser } from "@/lib/session";
import AppShell from "@/components/layout/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import { MessageSquare } from "lucide-react";

export default async function ChatPage() {
  await requireUser("/chat");

  return (
    <AppShell>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-card">
        <EmptyState
          icon={MessageSquare}
          title="AI Student Assistant – Coming Soon"
          description="Ask questions about SIMs, banking, campus procedures, and food with context from your home country."
        />
      </div>
    </AppShell>
  );
}
