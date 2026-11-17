// app/admin/page.jsx
// Protected Admin Panel – Server-side guarded by requireAdmin()

import { requireAdmin } from "@/lib/session";
import AppShell from "@/components/layout/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { ShieldAlert } from "lucide-react";

export default async function AdminPage() {
  const admin = await requireAdmin();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Badge variant="danger" dot className="mb-2">
            Admin Access Verified
          </Badge>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Admin Management Panel
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Logged in as {admin.name} ({admin.email})
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-card">
          <EmptyState
            icon={<ShieldAlert size={32} />}
            title="Admin CRUD Management"
            description="Role-protected management for Guides, Food Places, Campus Events, and Checklist Items will be implemented in Module 10."
          />
        </div>
      </div>
    </AppShell>
  );
}
