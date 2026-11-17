// app/food/page.jsx
// Food Finder module: Server Component fetching initial personalized places,
// dietary preferences, and distinct filter options.

import { requireUser } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { getPlacesForUser, getPlaceFilterOptions } from "@/lib/places";
import { noContentNote } from "@/lib/personalization";
import { CAMPUS_COORDS } from "@/lib/campus";
import AppShell from "@/components/layout/AppShell";
import FoodFinderClient from "@/components/modules/food/FoodFinderClient";
import { Utensils } from "lucide-react";

export const metadata = {
  title: "Food Finder & Groceries – Campus Compass",
};

export default async function FoodPage({ searchParams }) {
  const user = await requireUser("/food");
  const params = await searchParams;

  await connectDB();

  // Diet pre-selection: if user has a saved diet (and URL has not explicitly cleared it), pre-filter with it
  const hasExplicitDietParam = params.diet !== undefined || params.dietTags !== undefined;
  const userSavedDiet = user.diet && user.diet !== "none" && user.diet !== "no preference" ? user.diet : null;
  const initialDiets = hasExplicitDietParam
    ? (params.diet || params.dietTags || "").split(",").filter(Boolean)
    : userSavedDiet
    ? [userSavedDiet]
    : [];

  const filters = {
    forMyCountry: params.forMyCountry !== "false",
    type: params.type || undefined,
    cuisine: params.cuisine || undefined,
    dietTags: initialDiets,
    search: params.search || undefined,
    sort: params.sort || "best_match",
  };

  const [places, filterOptions] = await Promise.all([
    getPlacesForUser(user, filters),
    getPlaceFilterOptions(),
  ]);

  const noContentBannerText = noContentNote(user);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-0 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <Utensils size={22} className="text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Food Finder & Groceries
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Explore familiar home flavors, campus canteens, and dietary-verified groceries around campus.
          </p>
        </div>

        <FoodFinderClient
          initialPlaces={places}
          filterOptions={filterOptions}
          userCountry={user.country}
          campusCoords={CAMPUS_COORDS}
          noContentBannerText={noContentBannerText}
          currentUserId={user.id || user._id?.toString()}
        />
      </div>
    </AppShell>
  );
}
