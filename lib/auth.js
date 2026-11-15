// lib/auth.js
// NextAuth configuration with Credentials provider, rate limiting, and session update support.

import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * Basic in-memory rate limiter for failed login attempts.
 * Format: Map<key, { count: number, resetAt: number }>
 * Note: In production with multiple instances/serverless, a shared store (Redis/Upstash) should be used.
 */
const failedAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(key) {
  const now = Date.now();
  const record = failedAttempts.get(key);

  if (!record || now > record.resetAt) {
    return true; // allowed
  }

  return record.count < MAX_ATTEMPTS;
}

function recordFailedAttempt(key) {
  const now = Date.now();
  const record = failedAttempts.get(key);

  if (!record || now > record.resetAt) {
    failedAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    record.count += 1;
  }
}

function resetFailedAttempts(key) {
  failedAttempts.delete(key);
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        // Extract IP if available in headers, fallback to email-based rate limit
        const forwardedFor = req?.headers?.["x-forwarded-for"];
        const ip = typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : "unknown";
        const rateLimitKey = `${ip}:${email}`;

        if (!checkRateLimit(rateLimitKey)) {
          throw new Error("Too many failed login attempts. Please try again in 15 minutes.");
        }

        try {
          await connectDB();

          // Find user by lowercase email and explicitly select password
          const user = await User.findOne({ email }).select("+password").lean();

          if (!user || !user.password) {
            recordFailedAttempt(rateLimitKey);
            return null; // Don't leak whether email exists
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            recordFailedAttempt(rateLimitKey);
            return null;
          }

          // Successful login: reset attempts
          resetFailedAttempts(rateLimitKey);

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role || "student",
            country: user.country || "",
            regionGroup: user.regionGroup || "",
            onboardingDone: Boolean(user.onboardingDone),
          };
        } catch (error) {
          // If error is our rate limit message, rethrow
          if (error.message.includes("Too many failed")) {
            throw error;
          }
          console.error("Authorize error:", error.message);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in: copy user properties into JWT token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.country = user.country;
        token.regionGroup = user.regionGroup;
        token.onboardingDone = user.onboardingDone;
      }

      // Handle session.update() triggered on client (e.g. after onboarding or profile update)
      if (trigger === "update") {
        if (session) {
          if (session.country !== undefined) token.country = session.country;
          if (session.regionGroup !== undefined) token.regionGroup = session.regionGroup;
          if (session.onboardingDone !== undefined) token.onboardingDone = session.onboardingDone;
          if (session.name !== undefined) token.name = session.name;
        } else if (token.id) {
          // If no specific payload passed in update(), refresh directly from DB
          try {
            await connectDB();
            const freshUser = await User.findById(token.id).select("name country regionGroup onboardingDone role").lean();
            if (freshUser) {
              token.name = freshUser.name;
              token.role = freshUser.role;
              token.country = freshUser.country;
              token.regionGroup = freshUser.regionGroup;
              token.onboardingDone = freshUser.onboardingDone;
            }
          } catch (err) {
            console.error("Failed to refresh user in JWT callback:", err.message);
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.country = token.country;
        session.user.regionGroup = token.regionGroup;
        session.user.onboardingDone = token.onboardingDone;
      }
      return session;
    },
  },
};
