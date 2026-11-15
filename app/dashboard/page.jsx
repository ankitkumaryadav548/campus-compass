// app/dashboard/page.jsx
// Temporary Dashboard to verify authenticated session data (Prompt 3).

import { requireUser } from "@/lib/session";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { User, Globe, Shield, Calendar, Mail } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Badge variant="success" dot className="mb-2">
            Session Active
          </Badge>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Welcome, {user.name}! 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            This temporary dashboard verifies your authenticated profile and session state.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card gradientBorder className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User size={20} className="text-primary-600" />
              Profile Details
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Full Name</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Email Address</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{user.email}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Assigned Role</span>
                <Badge variant={user.role === "admin" ? "warning" : "info"}>
                  {user.role}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Nationality</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {user.country || "Not yet set"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Region Group</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {user.regionGroup || "Not yet set"}
                </span>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield size={20} className="text-teal-600" />
              Onboarding & Security State
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Onboarding Status</span>
                <Badge variant={user.onboardingDone ? "success" : "warning"} dot>
                  {user.onboardingDone ? "Completed" : "Pending"}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">User ID</span>
                <span className="font-mono text-xs text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                  {user.id}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Next Step</span>
                <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                  {user.onboardingDone ? "Explore modules via sidebar" : "Complete onboarding questionnaire"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
