import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Utensils, Star, MapPin, ArrowRight } from "lucide-react";

export default function FoodCards({ places, userDiet }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <Utensils size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Food near you
            </h2>
            <p className="text-xs text-slate-500">
              {userDiet && userDiet !== "no preference"
                ? `Filtered for ${userDiet} and familiar cuisines`
                : "Groceries and dining spots around campus"}
            </p>
          </div>
        </div>

        <Link
          href="/food"
          className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 min-h-[36px]"
        >
          Explore map <ArrowRight size={13} />
        </Link>
      </div>

      {places && places.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {places.map((place) => (
            <Link
              key={place._id.toString()}
              href="/food"
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-primary-400 dark:hover:border-primary-600 transition-all block group"
            >
              <div className="flex items-start justify-between gap-1 mb-1.5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {place.name.replace("[SAMPLE] ", "")}
                </h3>
                {place.rating > 0 && (
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    {place.rating.toFixed(1)}
                  </span>
                )}
              </div>

              {place.address && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate mb-2">
                  <MapPin size={11} className="shrink-0" />
                  {place.address}
                </p>
              )}

              <div className="flex flex-wrap gap-1">
                {place.cuisine?.slice(0, 2).map((c) => (
                  <Badge key={c} variant="neutral" className="text-[10px]">
                    {c}
                  </Badge>
                ))}
                {place.dietTags?.map((d) => (
                  <Badge key={d} variant="success" className="text-[10px] capitalize">
                    {d}
                  </Badge>
                ))}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Utensils size={32} />}
          title="No food spots found"
          description="We could not find places matching your exact dietary filters near campus."
          className="py-6"
        />
      )}
    </Card>
  );
}

