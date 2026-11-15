// app/checklist/page.jsx
// Protected Checklist module

import { requireUser } from "@/lib/session";
import AppShell from "@/components/layout/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import { CheckSquare } from "lucide-react";

export default async function ChecklistPage() {
  await requireUser("/checklist");

  return (
    <AppShell>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-card">
        <EmptyState
          icon={CheckSquare}
          title="Arrival Checklist – Coming Soon"
          description="Track your arrival documentation, deadlines, and progress bars."
        />
      </div>
    </AppShell>
  );
}
