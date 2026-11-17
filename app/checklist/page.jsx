// app/checklist/page.jsx
// Arrival checklist – Server Component.
// Fetches and merges data server-side; hands off interactivity to ChecklistClient.

import { requireUser } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { getChecklistForUser } from "@/lib/checklist";
import AppShell from "@/components/layout/AppShell";
import ChecklistClient from "@/components/modules/checklist/ChecklistClient";
import Badge from "@/components/ui/Badge";
import { CheckSquare, Globe } from "lucide-react";

export const metadata = {
  title: "Arrival Checklist – Campus Compass",
};

export default async function ChecklistPage() {
  const user = await requireUser("/checklist");
  await connectDB();

  const items = await getChecklistForUser(user);
  const hasArrivalDate = Boolean(user.arrivalDate);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-0 py-6 sm:py-8">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <CheckSquare size={22} className="text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Your arrival checklist
            </h1>
            {user.country && (
              <Badge variant="info" className="flex items-center gap-1">
                <Globe size={11} aria-hidden="true" />
                {user.country}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Everything you need to do to get settled. Work through these at your own pace.
          </p>
        </div>

        <ChecklistClient
          initialItems={items}
          hasArrivalDate={hasArrivalDate}
        />
      </div>
    </AppShell>
  );
}
