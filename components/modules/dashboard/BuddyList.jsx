import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Users, ArrowRight } from "lucide-react";

function getInitials(name) {
  if (!name) return "B";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function BuddyList({ buddies, userLanguages, userCountry }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
            <Users size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Meet your people
            </h2>
            <p className="text-xs text-slate-500">
              Senior international buddies matched by country and language
            </p>
          </div>
        </div>

        <Link
          href="/community?tab=buddies"
          className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 min-h-[36px]"
        >
          View community <ArrowRight size={13} />
        </Link>
      </div>

      {buddies && buddies.length > 0 ? (
        <div className="space-y-3">
          {buddies.map((buddy) => {
            const isSameCountry = userCountry && buddy.country === userCountry;

            return (
              <Link
                key={buddy._id.toString()}
                href="/community?tab=buddies"
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-3 hover:border-primary-400 dark:hover:border-primary-600 transition-all block group"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                  {getInitials(buddy.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {buddy.name.replace(" (Sample)", "")}
                    </span>
                    <Badge variant={isSameCountry ? "success" : "info"} className="text-[10px]">
                      {buddy.country}
                    </Badge>
                  </div>

                  {buddy.bio && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {buddy.bio.replace("[SAMPLE] ", "")}
                    </p>
                  )}

                  {buddy.languages?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {buddy.languages.map((lang) => {
                        const isShared = userLanguages?.includes(lang);
                        return (
                          <span
                            key={lang}
                            className={`text-[10px] px-2 py-0.5 rounded-full border ${
                              isShared
                                ? "bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800 font-medium"
                                : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {lang}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Users size={32} />}
          title="Looking for buddies"
          description="We are actively matching you with senior volunteers from your region."
          className="py-6"
        />
      )}
    </Card>
  );
}

