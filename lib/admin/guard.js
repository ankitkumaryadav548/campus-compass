// lib/admin/guard.js
// Server guard for all /api/admin/* endpoints.
// Verifies session, re-checks database role and active status, enforces JSON content type,
// and applies mutation rate limiting.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { ADMIN_CONFIG } from "./config";

// In-memory per-admin mutation rate limiter
// Map<adminId, number[]>
const adminMutationTimestamps = new Map();

function checkAdminMutationRateLimit(adminId) {
  const now = Date.now();
  const windowMs = ADMIN_CONFIG.mutationRateLimit.windowMs;
  const timestamps = (adminMutationTimestamps.get(adminId) || []).filter((t) => now - t < windowMs);

  if (timestamps.length >= ADMIN_CONFIG.mutationRateLimit.maxPerMinute) {
    return false;
  }

  timestamps.push(now);
  adminMutationTimestamps.set(adminId, timestamps);
  return true;
}

/**
 * Asserts admin authority for an incoming API request.
 *
 * @param {Request} request
 * @param {Object} [options]
 * @param {boolean} [options.requireMutation]
 * @returns {Promise<{ admin: Object|null, adminId: string|null, adminName: string|null, error: string|null, status: number, errorResponse: NextResponse|null }>}
 */
export async function assertAdminApi(request, options = {}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      admin: null,
      adminId: null,
      adminName: null,
      error: "Authentication required.",
      status: 401,
      errorResponse: NextResponse.json(
        { error: "Authentication required.", code: "unauthorized" },
        { status: 401 }
      ),
    };
  }

  const userId = (session.user.id || session.user._id)?.toString();
  if (!userId) {
    return {
      admin: null,
      adminId: null,
      adminName: null,
      error: "Invalid session.",
      status: 401,
      errorResponse: NextResponse.json(
        { error: "Invalid session.", code: "unauthorized" },
        { status: 401 }
      ),
    };
  }

  try {
    await connectDB();
    // Re-read role and active status directly from DB (never trust token alone)
    const dbAdmin = await User.findById(userId).select("name email role isActive").lean();

    if (!dbAdmin || dbAdmin.isActive === false || dbAdmin.role !== "admin") {
      return {
        admin: null,
        adminId: null,
        adminName: null,
        error: "Forbidden: Administrator privileges required.",
        status: 403,
        errorResponse: NextResponse.json(
          { error: "Forbidden: Administrator privileges required.", code: "forbidden" },
          { status: 403 }
        ),
      };
    }

    const method = request.method?.toUpperCase() || "GET";
    const requireMutation =
      options.requireMutation !== undefined
        ? options.requireMutation
        : ["POST", "PATCH", "PUT", "DELETE"].includes(method);

    if (requireMutation) {
      // 1. Enforce application/json header for mutation requests
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return {
          admin: null,
          adminId: null,
          adminName: null,
          error: "Content-Type must be application/json.",
          status: 415,
          errorResponse: NextResponse.json(
            { error: "Content-Type must be application/json.", code: "unsupported_media_type" },
            { status: 415 }
          ),
        };
      }

      // 2. Enforce mutation rate limit
      if (!checkAdminMutationRateLimit(String(userId))) {
        return {
          admin: null,
          adminId: null,
          adminName: null,
          error: "Too many administrative mutations. Please slow down.",
          status: 429,
          errorResponse: NextResponse.json(
            { error: "Too many administrative mutations. Please slow down.", code: "rate_limited" },
            { status: 429 }
          ),
        };
      }
    }

    return {
      admin: {
        id: dbAdmin._id.toString(),
        _id: dbAdmin._id,
        name: dbAdmin.name,
        email: dbAdmin.email,
        role: dbAdmin.role,
        isActive: dbAdmin.isActive,
      },
      adminId: dbAdmin._id.toString(),
      adminName: dbAdmin.name,
      error: null,
      status: 200,
      errorResponse: null,
    };
  } catch (err) {
    console.error("assertAdminApi error:", err.message);
    return {
      admin: null,
      adminId: null,
      adminName: null,
      error: "Server authentication error.",
      status: 500,
      errorResponse: NextResponse.json(
        { error: "Server authentication error.", code: "server_error" },
        { status: 500 }
      ),
    };
  }
}
