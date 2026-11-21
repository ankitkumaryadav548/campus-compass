// app/notifications/page.jsx
// Full notifications page: Server Component fetching initial paginated notifications.

import { requireUser } from "@/lib/session";
import { getNotifications, countUnread } from "@/lib/notifications";
import AppShell from "@/components/layout/AppShell";
import NotificationsClient from "@/components/modules/notifications/NotificationsClient";

export const metadata = {
  title: "Notifications – Campus Compass",
};

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");
  const userId = user.id || user._id?.toString();

  const [notificationData, unreadCount] = await Promise.all([
    getNotifications(userId, { limit: 20 }),
    countUnread(userId),
  ]);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto py-4 sm:py-6">
        <NotificationsClient
          initialNotifications={notificationData.notifications}
          initialNextCursor={notificationData.nextCursor}
          initialUnreadCount={unreadCount}
        />
      </div>
    </AppShell>
  );
}
