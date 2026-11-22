// app/food/page.jsx
// Food Finder: Server Component that authenticates the user and renders FoodFinder.

import { requireUser } from "@/lib/session";
import AppShell from "@/components/layout/AppShell";
import FoodFinder from "@/components/modules/food/FoodFinder";
import { Utensils } from "lucide-react";

export const metadata = {
  title: "Food near you – Campus Compass",
};

export default async function FoodPage() {
  const user = await requireUser("/food");

  const savedDiet = user.diet && user.diet !== "no preference" && user.diet !== "none"
    ? user.diet
    : null;

  const currentUserId = user.id || user._id?.toString();

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-0 py-6 sm:py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Utensils size={22} className="text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Food near you
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real dining spots and groceries from OpenStreetMap, with distance and dietary evidence.
          </p>
        </div>

        <FoodFinder
          savedDiet={savedDiet}
          currentUserId={currentUserId}
        />
      </div>
    </AppShell>
  );
}
