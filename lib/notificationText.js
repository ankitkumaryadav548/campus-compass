// lib/notificationText.js
// Pure functions transforming notification documents into user-facing text, icons, and links.

/**
 * Truncates message text to a clean preview of at most maxLength characters.
 */
export function buildMessagePreview(text, maxLength = 80) {
  if (!text || typeof text !== "string") return "";
  const plain = text.replace(/<[^>]*>/g, "").trim().replace(/\s+/g, " ");
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength - 3).trimEnd() + "...";
}

/**
 * Derives display attributes for a notification from its type and actor details.
 * In direct chat mode, only "new_message" is active.
 */
export function describeNotification(notification) {
  const actorName =
    notification.actor?.name?.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "") || "Someone";
  const rawMatchId = notification.matchId;
  const matchId =
    rawMatchId && typeof rawMatchId === "object"
      ? (rawMatchId._id || rawMatchId).toString()
      : rawMatchId
      ? String(rawMatchId)
      : null;
  const count = notification.count || 1;

  switch (notification.type) {
    case "new_message":
      return {
        title: count > 1 ? `${actorName} (${count} new messages)` : actorName,
        body: notification.preview || "",
        href: matchId ? `/community/chat/${matchId}` : "/community?tab=matches",
        iconName: "message-circle",
      };

    default:
      return {
        title: "Campus notification",
        body: "",
        href: "/notifications",
        iconName: "bell",
      };
  }
}

/**
 * Formats a timestamp into friendly relative time: "just now", "5m ago", "2h ago", "yesterday", or date.
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 45) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
