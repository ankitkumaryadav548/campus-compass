"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/modules/admin/shared/DataTable";
import EventModal from "@/components/modules/admin/events/EventModal";
import ConfirmDialog from "@/components/modules/admin/shared/ConfirmDialog";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Plus, Edit3, Trash2, Calendar, MapPin, Users } from "lucide-react";

export default function AdminEventsPage() {
  const [data, setData] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/events");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${deleteTarget._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTarget(null);
        loadEvents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const currentList = tab === "upcoming" ? data.upcoming : data.past;

  const columns = [
    {
      header: "Event",
      cell: (row) => (
        <div className="space-y-1 py-1">
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{row.title}</span>
            {!row.isPublished && (
              <Badge variant="neutral" className="text-[10px]">
                Draft / Hidden
              </Badge>
            )}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {new Date(row.date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {row.location}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      cell: (row) => (
        <Badge variant="info" className="text-xs uppercase">
          {row.category}
        </Badge>
      ),
    },
    {
      header: "Attendees",
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Users size={14} className="text-primary-500" />
          <span>
            {row.attendeeCount ?? 0}
            {row.maxAttendees ? ` / ${row.maxAttendees}` : " RSVP"}
          </span>
        </div>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingEvent(row);
              setModalOpen(true);
            }}
            className="p-1.5 text-slate-600"
            title="Edit event"
          >
            <Edit3 size={15} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 text-danger-600 hover:text-danger-700"
            title="Delete event"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Campus Events
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Community orientations, cultural mixers, and international student gatherings.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingEvent(null);
            setModalOpen(true);
          }}
          leftIcon={Plus}
        >
          New Event
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setTab("upcoming")}
          className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            tab === "upcoming"
              ? "border-primary-600 text-primary-600 dark:text-primary-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          Upcoming ({data.upcoming?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setTab("past")}
          className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            tab === "past"
              ? "border-primary-600 text-primary-600 dark:text-primary-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          Past Events ({data.past?.length || 0})
        </button>
      </div>

      <DataTable
        columns={columns}
        data={currentList}
        emptyMessage={`No ${tab} events found`}
      />

      <EventModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
        }}
        onSaved={loadEvents}
        event={editingEvent}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Campus Event"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This event and student RSVPs will be removed.`}
      />
    </div>
  );
}
