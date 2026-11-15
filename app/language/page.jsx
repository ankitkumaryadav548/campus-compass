// app/language/page.jsx
// Protected Language Help module

import { requireUser } from "@/lib/session";
import AppShell from "@/components/layout/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import { Languages } from "lucide-react";

export default async function LanguagePage() {
  await requireUser("/language");

  return (
    <AppShell>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-card">
        <EmptyState
          icon={Languages}
          title="Language Help – Coming Soon"
          description="Common campus phrases, local survival vocabulary, and colloquial glossaries."
        />
      </div>
    </AppShell>
  );
}
