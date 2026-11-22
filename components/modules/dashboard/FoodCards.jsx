// components/modules/dashboard/FoodCards.jsx
import Link from "next/link";
import Card from "@/components/ui/Card";
import { Utensils, ArrowRight } from "lucide-react";

export default function FoodCards({ userDiet }) {
  return (
    <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
            <Utensils size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Food near you
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Find real restaurants, halal & veg dining, and grocery stores powered by OpenStreetMap, calculated from your exact distance.
            </p>
            {userDiet && userDiet !== "no preference" && (
              <span className="inline-block mt-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Personalized for {userDiet}
              </span>
            )}
          </div>
        </div>

        <Link
          href="/food"
          className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 shrink-0 self-start sm:self-center min-h-[36px]"
        >
          Explore map <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}
