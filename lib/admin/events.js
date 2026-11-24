// lib/admin/events.js
// Database service for managing campus mixer events.
// Aggregates attendee counts without exposing individual attendee identities.

import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import { recordAudit } from "./audit";

function toObjId(id) {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
}

/**
 * Lists campus events split into upcoming and past groups.
 */
export async function listEvents() {
  await connectDB();
  const now = new Date();

  const [upcomingDocs, pastDocs] = await Promise.all([
    Event.find({ date: { $gte: now } }).sort({ date: 1 }).lean(),
    Event.find({ date: { $lt: now } }).sort({ date: -1 }).limit(50).lean(),
  ]);

  const mapEvent = (e) => ({
    _id: e._id.toString(),
    title: e.title,
    description: e.description || "",
    date: e.date ? new Date(e.date).toISOString() : null,
    location: e.location || "",
    region: e.region || [],
    attendeeCount: Array.isArray(e.attendees) ? e.attendees.length : 0,
    isSample: Boolean(e.isSample),
    createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : null,
    updatedAt: e.updatedAt ? new Date(e.updatedAt).toISOString() : null,
  });

  return {
    upcoming: upcomingDocs.map(mapEvent),
    past: pastDocs.map(mapEvent),
  };
}

/**
 * Creates a new event.
 */
export async function createEvent(data, adminId) {
  await connectDB();
  const event = await Event.create({
    ...data,
    attendees: [],
    isSample: false,
  });

  await recordAudit({
    adminId,
    action: "event_created",
    entityType: "event",
    entityId: event._id.toString(),
    summary: `Created event "${event.title}"`,
  });

  return {
    _id: event._id.toString(),
    title: event.title,
    description: event.description || "",
    date: event.date ? new Date(event.date).toISOString() : null,
    location: event.location || "",
    region: event.region || [],
    attendeeCount: 0,
    isSample: Boolean(event.isSample),
  };
}

/**
 * Updates an existing event.
 */
export async function updateEvent(id, data, adminId) {
  await connectDB();
  const objId = toObjId(id);
  if (!objId) {
    const err = new Error("Invalid event ID.");
    err.status = 400;
    throw err;
  }

  const event = await Event.findById(objId);
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }

  event.title = data.title;
  event.description = data.description || "";
  event.date = data.date;
  event.location = data.location;
  event.region = data.region;
  event.isSample = false;

  await event.save();

  await recordAudit({
    adminId,
    action: "event_updated",
    entityType: "event",
    entityId: event._id.toString(),
    summary: `Updated event "${event.title}"`,
  });

  return {
    _id: event._id.toString(),
    title: event.title,
    description: event.description || "",
    date: event.date ? new Date(event.date).toISOString() : null,
    location: event.location || "",
    region: event.region || [],
    attendeeCount: Array.isArray(event.attendees) ? event.attendees.length : 0,
    isSample: Boolean(event.isSample),
  };
}

/**
 * Deletes an event.
 */
export async function deleteEvent(id, adminId) {
  await connectDB();
  const objId = toObjId(id);
  if (!objId) {
    const err = new Error("Invalid event ID.");
    err.status = 400;
    throw err;
  }

  const event = await Event.findById(objId);
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }

  const title = event.title;
  await Event.findByIdAndDelete(objId);

  await recordAudit({
    adminId,
    action: "event_deleted",
    entityType: "event",
    entityId: id,
    summary: `Deleted event "${title}"`,
  });

  return { success: true };
}
