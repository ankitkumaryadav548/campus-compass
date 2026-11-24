// middleware.js
// Next.js Route Protection Middleware

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// Public paths that do not require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/design-system",
];

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;

  // 1. Bypass Next.js internals, static files, and NextAuth endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") // favicon.ico, images, etc.
  ) {
    return NextResponse.next();
  }

  // 2. Read JWT session token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = Boolean(token);
  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  // 3. Inactive account enforcement
  if (token && token.isActive === false) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Account inactive", code: "inactive" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login?error=inactive", req.url));
  }

  // 4. Handle public auth pages when already logged in
  if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
    const dest = token.role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Allow access to public pages if not logged in
  if (isPublicPage) {
    return NextResponse.next();
  }

  // 5. Require authentication for everything else
  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const callbackUrl = encodeURIComponent(`${pathname}${search}`);
    const roleParam = pathname.startsWith("/admin") ? "&role=admin" : "";
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}${roleParam}`, req.url));
  }

  // 6. Admin route protection: /admin and /api/admin/* require role === "admin"
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (token.role !== "admin") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 7. Admin isolation: Admins only see the admin panel, not student module pages
  const isStudentPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/checklist") ||
    pathname.startsWith("/guides") ||
    pathname.startsWith("/food") ||
    pathname.startsWith("/community") ||
    pathname.startsWith("/language") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/onboarding");

  if (token.role === "admin" && isStudentPage) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // 8. Onboarding enforcement for students:
  if (!token.onboardingDone && isStudentPage) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
