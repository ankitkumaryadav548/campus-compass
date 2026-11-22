// lib/chatDates.js
// Pure date helpers for WhatsApp-style chat:
// Calendar day comparisons, dividers, time labels, and presence labels.
// All functions accept a `now` parameter for deterministic testing.

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function toDate(d) {
  if (!d) return null;
  const parsed = d instanceof Date ? d : new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Returns difference in calendar days between `date` and `now` in local time.
 * 0 = today, 1 = yesterday, 2 = 2 days ago, etc.
 */
function calendarDaysAgo(date, now = new Date()) {
  const d = toDate(date);
  const n = toDate(now);
  if (!d || !n) return null;

  const startOfD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const startOfN = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();

  const diffMs = startOfN - startOfD;
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Formats time in 12-hour format: "4:32 PM"
 */
export function timeOfDay(date) {
  const d = toDate(date);
  if (!d) return "";

  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;

  return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Formats date as full date string: "12 Nov 2026"
 */
function formatFullDate(date) {
  const d = toDate(date);
  if (!d) return "";
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Formats date as short date: "12/11/2026" (DD/MM/YYYY)
 */
function formatShortDate(date) {
  const d = toDate(date);
  if (!d) return "";
  const day = d.getDate() < 10 ? `0${d.getDate()}` : `${d.getDate()}`;
  const month = d.getMonth() + 1 < 10 ? `0${d.getMonth() + 1}` : `${d.getMonth() + 1}`;
  return `${day}/${month}/${d.getFullYear()}`;
}

/**
 * Day label for dividers between messages:
 * - same calendar day -> "Today"
 * - previous calendar day -> "Yesterday"
 * - 2 to 6 days ago -> weekday name, e.g. "Wednesday"
 * - older -> full date, e.g. "12 Nov 2026"
 */
export function dayLabel(date, now = new Date()) {
  const d = toDate(date);
  if (!d) return "";

  const daysDiff = calendarDaysAgo(d, now);
  if (daysDiff === null) return "";

  if (daysDiff === 0) return "Today";
  if (daysDiff === 1) return "Yesterday";
  if (daysDiff >= 2 && daysDiff <= 6) {
    return WEEKDAYS[d.getDay()];
  }
  return formatFullDate(d);
}

/**
 * Time label for chat list items:
 * - today -> time, e.g. "4:32 PM"
 * - yesterday -> "Yesterday"
 * - 2 to 6 days -> weekday name, e.g. "Wednesday"
 * - older -> short date, e.g. "12/11/2026"
 */
export function listTimeLabel(date, now = new Date()) {
  const d = toDate(date);
  if (!d) return "";

  const daysDiff = calendarDaysAgo(d, now);
  if (daysDiff === null) return "";

  if (daysDiff === 0) return timeOfDay(d);
  if (daysDiff === 1) return "Yesterday";
  if (daysDiff >= 2 && daysDiff <= 6) {
    return WEEKDAYS[d.getDay()];
  }
  return formatShortDate(d);
}

/**
 * Presence last seen label:
 * - empty -> ""
 * - today -> "last seen today at 4:32 PM"
 * - yesterday -> "last seen yesterday at 9:10 PM"
 * - 2 to 6 days ago -> "last seen Wednesday at 4:32 PM"
 * - older -> "last seen 12 Nov 2026"
 */
export function lastSeenLabel(date, now = new Date()) {
  const d = toDate(date);
  if (!d) return "";

  const daysDiff = calendarDaysAgo(d, now);
  if (daysDiff === null) return "";

  const timeStr = timeOfDay(d);
  if (daysDiff === 0) return `last seen today at ${timeStr}`;
  if (daysDiff === 1) return `last seen yesterday at ${timeStr}`;
  if (daysDiff >= 2 && daysDiff <= 6) {
    return `last seen ${WEEKDAYS[d.getDay()]} at ${timeStr}`;
  }
  return `last seen ${formatFullDate(d)}`;
}

/**
 * Groups messages by calendar day in local timezone.
 * Sorts messages by createdAt (then by _id/id/clientId) before grouping,
 * returning unique, stable groups: { dateKey, label, messages }.
 */
export function groupByDay(messages = [], now = new Date()) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  // 1. Sort messages chronologically by createdAt, then stably by id/clientId
  const sortedMessages = [...messages].sort((a, b) => {
    const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    const keyA = (a?._id || a?.id || a?.clientId || "").toString();
    const keyB = (b?._id || b?.id || b?.clientId || "").toString();
    return keyA.localeCompare(keyB);
  });

  const groupMap = new Map();

  for (const msg of sortedMessages) {
    const d = toDate(msg?.createdAt);
    if (!d) continue;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;

    if (!groupMap.has(dateKey)) {
      const label = dayLabel(d, now);
      groupMap.set(dateKey, {
        dateKey,
        label,
        messages: [msg],
      });
    } else {
      groupMap.get(dateKey).messages.push(msg);
    }
  }

  return Array.from(groupMap.values());
}
