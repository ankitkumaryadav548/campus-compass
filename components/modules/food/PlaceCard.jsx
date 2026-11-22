// components/modules/food/PlaceCard.jsx
// Displays a food or grocery spot with distance, walking estimate, diet badges, and action buttons.

import { MapPin, Navigation, Star, Clock, ShoppingCart, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DietBadge from "./DietBadge";
import { directionsUrl } from "@/lib/geo";

export default function PlaceCard({
  place,
  origin,
  isSelected,
  onSelect,
  onOpenDetails,
}) {
  const dirUrl = directionsUrl(origin, place);

  return (
    <Card
      onClick={onSelect}
      className={cn(
        "p-4 transition-all duration-200 cursor-pointer border flex flex-col justify-between",
        isSelected
          ? "border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/20 dark:bg-primary-950/20 shadow-md"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
      )}
    >
      <div>
        {/* Header: Name + Kind badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {place.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="shrink-0 text-slate-400" aria-hidden="true" />
              <span className="truncate">{place.address || "Address not listed"}</span>
            </p>
          </div>

          <Badge
            variant={place.kind === "grocery" ? "neutral" : "primary"}
            className="text-[10px] shrink-0 font-semibold capitalize"
          >
            {place.kind === "grocery" ? (
              <>
                <ShoppingCart size={10} className="mr-0.5 inline-block" aria-hidden="true" />
                Grocery
              </>
            ) : (
              <>
                <Utensils size={10} className="mr-0.5 inline-block" aria-hidden="true" />
                Food
              </>
            )}
          </Badge>
        </div>

        {/* Distance & Walking estimate */}
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mb-3 font-medium">
          <span className="text-primary-700 dark:text-primary-300 font-semibold">
            about {place.distanceKm} km away
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-slate-500 dark:text-slate-400">
            about {place.walkingMinutes} min walk (estimate)
          </span>
        </div>

        {/* Badges: Diet + Cuisines */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <DietBadge diet={place.diet} kind={place.kind} />

          {place.cuisines?.slice(0, 3).map((cuisine) => (
            <Badge
              key={cuisine}
              variant="neutral"
              className="text-[10px] font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            >
              {cuisine}
            </Badge>
          ))}
        </div>

        {/* Opening hours text if available */}
        {place.openingHours && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-3">
            <Clock size={11} className="shrink-0 text-slate-400" aria-hidden="true" />
            <span className="truncate">{place.openingHours}</span>
          </div>
        )}
      </div>

      {/* Footer: Student Rating + Actions */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-1">
        {/* Rating */}
        <div className="text-xs">
          {place.reviewCount > 0 ? (
            <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden="true" />
              <span>{place.ratingAverage.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">
                ({place.reviewCount} {place.reviewCount === 1 ? "review" : "reviews"})
              </span>
            </span>
          ) : (
            <span className="text-slate-400 text-[11px]">No student reviews yet</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails?.(place);
            }}
            className="text-xs min-h-[38px] px-3"
          >
            View details
          </Button>

          <a
            href={dirUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold transition-colors min-h-[38px]"
          >
            <Navigation size={11} aria-hidden="true" />
            Directions
          </a>
        </div>
      </div>
    </Card>
  );
}
