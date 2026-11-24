// lib/auth.js
// NextAuth configuration with Credentials provider, rate limiting, and session freshness.

import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { ADMIN_CONFIG } from "@/lib/admin/config";

const failedAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(key) {
  const now = Date.now();
  const record = failedAttempts.get(key);
  if (!record || now > record.resetAt) {
    return true;
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
        const forwardedFor = req?.headers?.["x-forwarded-for"];
        const ip = typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : "unknown";
        const rateLimitKey = `${ip}:${email}`;

        if (!checkRateLimit(rateLimitKey)) {
          throw new Error("Too many failed login attempts. Please try again in 15 minutes.");
        }

        try {
          await connectDB();

          // Find user by lowercase email and explicitly select password and isActive
          const user = await User.findOne({ email }).select("+password").lean();

          if (!user || !user.password) {
            recordFailedAttempt(rateLimitKey);
            return null; // Don't leak whether email exists
          }

          // Check password FIRST
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            recordFailedAttempt(rateLimitKey);
            return null;
          }

          // Reject inactive account ONLY AFTER password is confirmed valid
          if (user.isActive === false) {
            throw new Error("AccountInactive");
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
            isSenior: Boolean(user.isSenior),
            isActive: user.isActive !== false,
          };
        } catch (error) {
          if (error.message === "AccountInactive" || error.message.includes("Too many failed")) {
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
        token.isSenior = user.isSenior;
        token.isActive = user.isActive !== false;
        token.lastRefreshAt = Date.now();
      }

      // Handle session.update() triggered on client
      if (trigger === "update") {
        if (session) {
          if (session.country !== undefined) token.country = session.country;
          if (session.regionGroup !== undefined) token.regionGroup = session.regionGroup;
          if (session.onboardingDone !== undefined) token.onboardingDone = session.onboardingDone;
          if (session.name !== undefined) token.name = session.name;
        } else if (token.id) {
          try {
            await connectDB();
            const freshUser = await User.findById(token.id)
              .select("name country regionGroup onboardingDone role isActive isSenior")
              .lean();
            if (freshUser) {
              token.name = freshUser.name;
              token.role = freshUser.role;
              token.country = freshUser.country;
              token.regionGroup = freshUser.regionGroup;
              token.onboardingDone = freshUser.onboardingDone;
              token.isSenior = Boolean(freshUser.isSenior);
              token.isActive = freshUser.isActive !== false;
              token.lastRefreshAt = Date.now();
            }
          } catch (err) {
            console.error("Failed to refresh user in JWT callback:", err.message);
          }
        }
      }

      // Periodic session freshness check: re-read active, role, isSenior every SESSION_REFRESH_SECONDS
      const now = Date.now();
      const refreshWindowMs = (ADMIN_CONFIG.sessionRefreshSeconds || 300) * 1000;
      if (token.id && (!token.lastRefreshAt || now - token.lastRefreshAt > refreshWindowMs)) {
        try {
          await connectDB();
          const freshUser = await User.findById(token.id)
            .select("role isActive isSenior onboardingDone country regionGroup")
            .lean();
          if (freshUser) {
            token.role = freshUser.role || token.role;
            token.isActive = freshUser.isActive !== false;
            token.isSenior = Boolean(freshUser.isSenior);
            token.onboardingDone = freshUser.onboardingDone !== undefined ? freshUser.onboardingDone : token.onboardingDone;
            token.lastRefreshAt = now;
          } else {
            token.isActive = false;
          }
        } catch (err) {
          console.error("JWT periodic freshness error:", err.message);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user._id = token.id;
        session.user.role = token.role;
        session.user.country = token.country;
        session.user.regionGroup = token.regionGroup;
        session.user.onboardingDone = token.onboardingDone;
        session.user.isSenior = Boolean(token.isSenior);
        session.user.isActive = token.isActive !== false;
      }
      return session;
    },
  },
};
