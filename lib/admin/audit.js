// lib/admin/audit.js
// Sole entry point for recording audit log events.

import { connectDB } from "@/lib/mongodb";
import AuditLog from "@/models/AuditLog";

/**
 * Records an immutable audit event for an administrative action.
 * Failures to record are logged with console.error and never break the caller.
 *
 * @param {Object} params
 * @param {string|Object} params.adminId - The ObjectId of the performing admin
 * @param {string} params.action - One of ADMIN_CONFIG.auditActions
 * @param {string} params.entityType - One of ADMIN_CONFIG.auditEntityTypes
 * @param {string} params.entityId - String identifier of affected entity
 * @param {string} params.summary - Plain text description (max 200 chars, no sensitive data)
 * @returns {Promise<Object|null>}
 */
export async function recordAudit({ adminId, action, entityType, entityId, summary }) {
  try {
    await connectDB();
    const entry = await AuditLog.create({
      adminId,
      action,
      entityType,
      entityId: String(entityId),
      summary: (summary || "").slice(0, 200),
    });
    return entry;
  } catch (err) {
    console.error("Audit log write failed:", err.message);
    return null;
  }
}
