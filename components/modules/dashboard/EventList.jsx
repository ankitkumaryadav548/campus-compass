import Link from "next/link";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { Calendar, MapPin, ArrowRight } from "lucide-react";

export default function EventList({ events }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <Calendar size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Coming up
            </h2>
            <p className="text-xs text-slate-500">
              Campus and cultural meetups for international students
            </p>
          </div>
        </div>

        <Link
          href="/community?tab=events"
          className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 min-h-[36px]"
        >
          All events <ArrowRight size={13} />
        </Link>
      </div>

      {events && events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => {
            const eventDate = new Date(event.date);
            const monthStr = eventDate.toLocaleDateString("en-US", { month: "short" });
            const dayStr = eventDate.getDate();

            return (
              <Link
                key={event._id.toString()}
                href="/community?tab=events"
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3.5 hover:border-primary-400 dark:hover:border-primary-600 transition-all block group"
              >
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shrink-0 shadow-sm text-center">
                  <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">
                    {monthStr}
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                    {dayStr}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {event.title.replace("[SAMPLE] ", "")}
                  </h3>
                  {event.location && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate mt-0.5">
                      <MapPin size={11} className="shrink-0" />
                      {event.location}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Calendar size={32} />}
          title="No upcoming events"
          description="Check back soon for upcoming campus orientations and cultural mixers."
          className="py-6"
        />
      )}
    </Card>
  );
}

