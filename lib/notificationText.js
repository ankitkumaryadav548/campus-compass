// lib/notificationText.js
// Pure functions transforming notification documents into user-facing text, icons, and links.

/**
 * Derives display attributes for a notification from its type and actor details.
 */
export function describeNotification(notification) {
  const actorName =
    notification.actor?.name?.replace(/^\[SAMPLE\]\s*/i, "") || "A campus student";
  const matchId = notification.matchId;
  const count = notification.count || 1;

  switch (notification.type) {
    case "buddy_request":
      return {
        title: `${actorName} sent you a connection request`,
        body: "Check their request and profile in the Community section.",
        href: "/community?tab=matches",
        iconName: "user-plus",
      };

    case "request_accepted":
      return {
        title: `${actorName} accepted your connection request`,
        body: "You can now message each other in your connection chat.",
        href: matchId ? `/community/chat/${matchId}` : "/community?tab=matches",
        iconName: "check-circle",
      };

    case "request_declined":
      return {
        title: `${actorName} could not take your request right now`,
        body: "Explore other students and senior buddies ready to connect.",
        href: "/community?tab=people",
        iconName: "user-x",
      };

    case "new_message":
      return {
        title:
          count > 1
            ? `${count} new messages from ${actorName}`
            : `New message from ${actorName}`,
        body: count > 1 ? `You have ${count} unread chat messages.` : "You have a new message.",
        href: matchId ? `/community/chat/${matchId}` : "/community",
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
 * Returns human-readable relative time (e.g., "just now", "5m ago", "2h ago", "Yesterday", "Oct 12").
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 45) return "just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  // Compare calendar days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((today - itemDate) / (1000 * 60 * 60 * 24));

  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return `${dayDiff}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
