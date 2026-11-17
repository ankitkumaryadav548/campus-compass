"use client";
// components/modules/community/EventsSection.jsx
// Upcoming campus and cultural mixer events with optimistic RSVP toggling.

import { useState } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Check,
  Plus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

export default function EventsSection({ events: initialEvents, userCountry }) {
  const toast = useToast();
  const [events, setEvents] = useState(initialEvents);
  const [updatingId, setUpdatingId] = useState(null);

  const handleToggleRsvp = async (event) => {
    const eventId = event._id;
    if (updatingId) return;

    const newAttending = !event.isAttending;
    setUpdatingId(eventId);

    // Optimistic update
    setEvents((prev) =>
      prev.map((e) =>
        e._id === eventId
          ? {
              ...e,
              isAttending: newAttending,
              attendeeCount: newAttending
                ? e.attendeeCount + 1
                : Math.max(0, e.attendeeCount - 1),
            }
          : e
      )
    );

    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attending: newAttending }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not update RSVP.");
      }

      const data = await res.json();
      toast({
        message: data.message || (newAttending ? "RSVP confirmed!" : "RSVP removed."),
        type: newAttending ? "success" : "info",
      });
    } catch (err) {
      // Rollback
      setEvents((prev) =>
        prev.map((e) =>
          e._id === eventId
            ? {
                ...e,
                isAttending: !newAttending,
                attendeeCount: !newAttending
                  ? e.attendeeCount + 1
                  : Math.max(0, e.attendeeCount - 1),
              }
            : e
        )
      );
      toast({
        message: err.message || "Failed to update RSVP. Please try again.",
        type: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (!events || events.length === 0) {
    return (
      <EmptyState
        icon={<Calendar size={32} />}
        title="No upcoming events found"
        description="Check back soon for new student orientations, cultural dinners, and community gatherings."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((event) => {
          const eventDate = new Date(event.date);
          const monthStr = eventDate.toLocaleDateString("en-US", { month: "short" });
          const dayStr = eventDate.getDate();
          const weekdayStr = eventDate.toLocaleDateString("en-US", { weekday: "short" });
          const cleanTitle = event.title.replace(/^\[SAMPLE\]\s*/i, "");
          const cleanDesc = event.description.replace(/^\[SAMPLE\]\s*/i, "");
          const isUpdating = updatingId === event._id;

          return (
            <Card
              key={event._id}
              className={cn(
                "p-5 flex flex-col justify-between transition-all duration-150",
                event.isAttending
                  ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10"
                  : ""
              )}
            >
              <div>
                <div className="flex items-start gap-3.5 mb-3">
                  {/* Date badge */}
                  <div className="w-13 h-13 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shrink-0 shadow-sm text-center p-2">
                    <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider leading-none">
                      {monthStr}
                    </span>
                    <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 leading-none my-0.5">
                      {dayStr}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {weekdayStr}
                    </span>
                  </div>

                  {/* Title & Badges */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {cleanTitle}
                      </h3>
                      {event.isCountrySpecific ? (
                        <Badge variant="info" className="text-[10px]">
                          For {userCountry} students
                        </Badge>
                      ) : (
                        <Badge variant="neutral" className="text-[10px]">
                          Open to all
                        </Badge>
                      )}
                    </div>

                    {event.location && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                        <MapPin size={11} className="shrink-0" />
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>

                {cleanDesc && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {cleanDesc}
                  </p>
                )}
              </div>

              {/* Footer: Attendee count & RSVP button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Users size={13} className="text-slate-400" aria-hidden="true" />
                  {event.attendeeCount} {event.attendeeCount === 1 ? "attending" : "attending"}
                </span>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleToggleRsvp(event)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[36px]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                    event.isAttending
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  )}
                >
                  {isUpdating ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : event.isAttending ? (
                    <Check size={12} strokeWidth={2.5} />
                  ) : (
                    <Plus size={12} />
                  )}
                  {event.isAttending ? "I will attend" : "RSVP to attend"}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
