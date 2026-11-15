// components/layout/AuthProvider.jsx
"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Client SessionProvider wrapper for Next.js App Router root layout.
 */
export default function AuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}

