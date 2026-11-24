// lib/session.js
// Server-side session helpers and route protection guards.

import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * Returns the current authenticated user object from the server session,
 * syncing with the database user record to avoid stale session IDs and permissions.
 * Inactive accounts return null.
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.isActive === false) return null;

  try {
    if (session.user.email) {
      await connectDB();
      const dbUser = await User.findOne({ email: session.user.email })
        .select("_id role country regionGroup onboardingDone isActive isSenior")
        .lean();

      if (dbUser) {
        if (dbUser.isActive === false) {
          return null;
        }
        return {
          ...session.user,
          id: dbUser._id.toString(),
          _id: dbUser._id.toString(),
          role: dbUser.role || session.user.role,
          isActive: true,
          isSenior: Boolean(dbUser.isSenior),
        };
      }
    }
  } catch {
    // Fall back to token values if DB lookup encounters an issue
  }

  return session.user;
}

/**
 * Server-side guard: Ensures the user is logged in and active.
 * If not, redirects to /login with callbackUrl.
 * @param {string} [callbackUrl]
 */
export async function requireUser(callbackUrl = "/dashboard") {
  const user = await getCurrentUser();
  if (!user || user.isActive === false) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return user;
}

/**
 * Server-side guard: Ensures the user is logged in, active, and has role "admin".
 * If not logged in or inactive, redirects to /login.
 * If logged in but role is not admin, redirects to /dashboard.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.isActive === false) {
    redirect(`/login?role=admin&callbackUrl=${encodeURIComponent("/admin")}`);
  }
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}
