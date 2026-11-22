// components/modules/food/DietBadge.jsx
// Displays evidence-based dietary classifications derived from OpenStreetMap tags.
// Places are never labeled without tag evidence. Groceries display no diet badge.

import Badge from "@/components/ui/Badge";
import { Leaf, Flame, HelpCircle } from "lucide-react";

export default function DietBadge({ diet, kind, className = "" }) {
  if (kind === "grocery" || !diet) return null;

  const { vegLevel, nonVegLikely } = diet;
  const badges = [];

  if (vegLevel === "only") {
    badges.push(
      <Badge
        key="pure-veg"
        variant="success"
        className={`text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 ${className}`}
      >
        <Leaf size={10} className="mr-0.5 inline-block shrink-0" aria-hidden="true" />
        Pure veg
      </Badge>
    );
  } else if (vegLevel === "options") {
    badges.push(
      <Badge
        key="veg-options"
        variant="success"
        className={`text-[10px] font-semibold bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800 ${className}`}
      >
        <Leaf size={10} className="mr-0.5 inline-block shrink-0" aria-hidden="true" />
        Veg options
      </Badge>
    );
  }

  if (nonVegLikely) {
    badges.push(
      <Badge
        key="non-veg"
        variant="danger"
        className={`text-[10px] font-semibold bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800 ${className}`}
      >
        <Flame size={10} className="mr-0.5 inline-block shrink-0" aria-hidden="true" />
        Non-veg likely
      </Badge>
    );
  }

  if (vegLevel === "unknown" && !nonVegLikely) {
    badges.push(
      <Badge
        key="unconfirmed"
        variant="neutral"
        className={`text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 ${className}`}
      >
        <HelpCircle size={10} className="mr-0.5 inline-block shrink-0" aria-hidden="true" />
        Diet not confirmed
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {badges}
    </div>
  );
}
