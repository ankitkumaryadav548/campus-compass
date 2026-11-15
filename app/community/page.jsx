// app/community/page.jsx
// Protected Community & Buddy module

import { requireUser } from "@/lib/session";
import AppShell from "@/components/layout/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import { Users } from "lucide-react";

export default async function CommunityPage() {
  await requireUser("/community");

  return (
    <AppShell>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-card">
        <EmptyState
          icon={Users}
          title="Community & Buddy Matching – Coming Soon"
          description="Connect with senior mentors from your country, attend international student events, and join peer groups."
        />
      </div>
    </AppShell>
  );
}
