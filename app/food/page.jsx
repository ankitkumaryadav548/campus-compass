// app/food/page.jsx
// Protected Food Finder module

import { requireUser } from "@/lib/session";
import AppShell from "@/components/layout/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import { Utensils } from "lucide-react";

export default async function FoodPage() {
  await requireUser("/food");

  return (
    <AppShell>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-card">
        <EmptyState
          icon={Utensils}
          title="Food Finder – Coming Soon"
          description="Discover groceries and restaurants filtered by cuisine, diet tags, and home country."
        />
      </div>
    </AppShell>
  );
}
