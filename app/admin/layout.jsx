import { requireAdmin } from "@/lib/session";
import AdminShell from "@/components/modules/admin/shell/AdminShell";

export const metadata = {
  title: "Admin Panel | GlobalConnect",
  description: "Campus administrator operations and moderation",
};

export default async function AdminLayout({ children }) {
  const sessionUser = await requireAdmin();

  const userSafe = {
    id: sessionUser.id,
    name: sessionUser.name,
    email: sessionUser.email,
    role: sessionUser.role,
  };

  return <AdminShell user={userSafe}>{children}</AdminShell>;
}
