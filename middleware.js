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

  // 3. Handle public auth pages when already logged in
  if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Allow access to public pages if not logged in
  if (isPublicPage) {
    return NextResponse.next();
  }

  // 4. Require authentication for everything else
  if (!isAuthenticated) {
    // If it's an API route, return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const callbackUrl = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
  }

  // 5. Admin route protection: /admin and /api/admin/* require role === "admin"
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (token.role !== "admin") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 6. Onboarding enforcement:
  // If authenticated but onboardingDone is false, redirect module pages to /onboarding
  // Do NOT redirect /onboarding itself or /api routes
  const isModulePage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/checklist") ||
    pathname.startsWith("/guides") ||
    pathname.startsWith("/food") ||
    pathname.startsWith("/community") ||
    pathname.startsWith("/language") ||
    pathname.startsWith("/chat");

  if (!token.onboardingDone && isModulePage) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // If onboarding IS done and user tries to access /onboarding, we could allow or redirect to /dashboard
  // PROJECT_CONTEXT.md specifies that onboarding form is Prompt 4, so allowing it is fine.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

