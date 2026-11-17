// app/guides/page.jsx
// Overview landing page for Guides module.
// Displays two primary action cards: SIM Guide and Bank Guide.

import Link from "next/link";
import { requireUser } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { getGuidesOverviewForUser } from "@/lib/guides";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { Smartphone, Landmark, ArrowRight, BookOpen } from "lucide-react";

export const metadata = {
  title: "Practical Guides – Campus Compass",
};

export default async function GuidesLandingPage() {
  const user = await requireUser("/guides");
  await connectDB();

  const overview = await getGuidesOverviewForUser(user);

  const cards = [
    {
      category: "sim",
      title: "SIM Card Setup",
      description: "Get connected with a local Indian SIM card, compare campus providers, and complete digital KYC verification.",
      icon: <Smartphone size={24} className="text-primary-600 dark:text-primary-400" aria-hidden="true" />,
      href: "/guides/sim",
      data: overview.sim,
    },
    {
      category: "bank",
      title: "Bank Account Opening",
      description: "Open a zero-balance student bank account, submit required FRRO documentation, and set up net-banking.",
      icon: <Landmark size={24} className="text-primary-600 dark:text-primary-400" aria-hidden="true" />,
      href: "/guides/bank",
      data: overview.bank,
    },
  ];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-0 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen size={22} className="text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Practical Arrival Guides
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Step-by-step documentation walkthroughs verified for international students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((item) => {
            const guide = item.data?.guide;
            const completedCount = item.data?.completedCount || 0;
            const totalSteps = item.data?.totalSteps || 0;
            const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
            const isCountrySpecific = guide?.specificityLabel === "country";

            return (
              <Card key={item.category} className="p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    {isCountrySpecific ? (
                      <Badge variant="info">For {user.country} students</Badge>
                    ) : (
                      <Badge variant="neutral">General guide</Badge>
                    )}
                  </div>

                  <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                    {item.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {completedCount} of {totalSteps} steps completed
                    </span>
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                      {progress}%
                    </span>
                  </div>
                  <ProgressBar value={progress} size="md" showLabel={false} className="mb-4" />

                  <Link
                    href={item.href}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity min-h-[44px]"
                  >
                    View step-by-step guide <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
