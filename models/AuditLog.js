// models/AuditLog.js
// Immutable audit log recording all administrative modifications.

import mongoose from "mongoose";
import { ADMIN_CONFIG } from "@/lib/admin/config";

const { Schema } = mongoose;

const AuditLogSchema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ADMIN_CONFIG.auditActions,
      required: true,
    },
    entityType: {
      type: String,
      enum: ADMIN_CONFIG.auditEntityTypes,
      required: true,
    },
    entityId: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      maxlength: 200,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for chronological retrieval and filtering
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);

export default AuditLog;
