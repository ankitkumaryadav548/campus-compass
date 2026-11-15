// lib/session.js
// Server-side helpers for session and role verification.

import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

/**
 * Returns the current authenticated user object from the server session,
 * or null if not authenticated.
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

/**
 * Server-side guard: Ensures the user is logged in.
 * If not, redirects to /login with callbackUrl.
 * @param {string} [callbackUrl]
 */
export async function requireUser(callbackUrl = "/dashboard") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return user;
}

/**
 * Server-side guard: Ensures the user is logged in and has role "admin".
 * If not logged in, redirects to /login.
 * If logged in but role is not admin, redirects to /dashboard.
 */
export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}

