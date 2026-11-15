// app/guides/[category]/page.jsx
// Protected Guides module

import { requireUser } from "@/lib/session";
import AppShell from "@/components/layout/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import { BookOpen } from "lucide-react";

export default async function GuidesCategoryPage({ params }) {
  const { category } = await params;
  await requireUser(`/guides/${category}`);

  return (
    <AppShell>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-card">
        <EmptyState
          icon={BookOpen}
          title={`${category?.toUpperCase() || "SIM / Bank"} Guides – Coming Soon`}
          description="Country-tailored step-by-step guides with required documents and provider lists."
        />
      </div>
    </AppShell>
  );
}
