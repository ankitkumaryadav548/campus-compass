// lib/admin/users.js
// Service for managing student and buddy accounts, senior designations, and account deactivations.
// Strictly enforces safety rules from rules.js.

import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { ADMIN_CONFIG } from "./config";
import { canDeactivateUser, canChangeSeniorStatus } from "./rules";
import { recordAudit } from "./audit";

function toObjId(id) {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
}

/**
 * Lists user accounts with search, filters, and pagination.
 */
export async function listUsers(filters = {}) {
  await connectDB();
  const { search, role, senior, status, country, page = 1 } = filters;
  const pageSize = ADMIN_CONFIG.pageSize;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const skip = (currentPage - 1) * pageSize;

  const query = {};

  if (search && typeof search === "string" && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
    ];
  }

  if (role && ["student", "buddy", "admin"].includes(role)) {
    query.role = role;
  }

  if (senior === "true" || senior === true) {
    query.isSenior = true;
  } else if (senior === "false" || senior === false) {
    query.isSenior = false;
  }

  if (status === "active") {
    query.isActive = { $ne: false };
  } else if (status === "inactive") {
    query.isActive = false;
  }

  if (country && typeof country === "string" && country.trim()) {
    query.country = country.trim();
  }

  const [total, docs] = await Promise.all([
    User.countDocuments(query),
    User.find(query)
      .select("name email country role isSenior isActive createdAt lastSeenAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
  ]);

  const users = docs.map((u) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    country: u.country || "",
    role: u.role || "student",
    isSenior: Boolean(u.isSenior),
    isActive: u.isActive !== false,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
    lastSeenAt: u.lastSeenAt ? new Date(u.lastSeenAt).toISOString() : null,
  }));

  return {
    users,
    pagination: {
      page: currentPage,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

/**
 * Marks a student or buddy user as a verified senior.
 */
export async function setSenior(userId, adminId) {
  await connectDB();
  const objId = toObjId(userId);
  if (!objId) {
    const err = new Error("Invalid user ID.");
    err.status = 400;
    throw err;
  }

  const user = await User.findById(objId);
  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const check = canChangeSeniorStatus({ target: user });
  if (!check.allowed) {
    const err = new Error(check.reason);
    err.status = 400;
    throw err;
  }

  user.isSenior = true;
  await user.save();

  await recordAudit({
    adminId,
    action: "user_senior_set",
    entityType: "user",
    entityId: user._id.toString(),
    summary: `Marked "${user.name}" as verified senior`,
  });

  return { _id: user._id.toString(), isSenior: true };
}

/**
 * Removes senior badge from a user.
 */
export async function removeSenior(userId, adminId) {
  await connectDB();
  const objId = toObjId(userId);
  if (!objId) {
    const err = new Error("Invalid user ID.");
    err.status = 400;
    throw err;
  }

  const user = await User.findById(objId);
  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const check = canChangeSeniorStatus({ target: user });
  if (!check.allowed) {
    const err = new Error(check.reason);
    err.status = 400;
    throw err;
  }

  user.isSenior = false;
  await user.save();

  await recordAudit({
    adminId,
    action: "user_senior_removed",
    entityType: "user",
    entityId: user._id.toString(),
    summary: `Removed verified senior badge from "${user.name}"`,
  });

  return { _id: user._id.toString(), isSenior: false };
}

/**
 * Deactivates a student or buddy user account following safety rules.
 */
export async function deactivateUser(userId, adminId) {
  await connectDB();
  const objId = toObjId(userId);
  if (!objId) {
    const err = new Error("Invalid user ID.");
    err.status = 400;
    throw err;
  }

  const user = await User.findById(objId);
  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const activeAdminCount = await User.countDocuments({ role: "admin", isActive: { $ne: false } });
  const check = canDeactivateUser({
    actor: { id: adminId, role: "admin" },
    target: user,
    activeAdminCount,
  });

  if (!check.allowed) {
    const err = new Error(check.reason);
    err.status = 400;
    throw err;
  }

  user.isActive = false;
  user.deactivatedAt = new Date();
  user.deactivatedBy = toObjId(adminId);
  await user.save();

  await recordAudit({
    adminId,
    action: "user_deactivated",
    entityType: "user",
    entityId: user._id.toString(),
    summary: `Deactivated account of "${user.name}"`,
  });

  return { _id: user._id.toString(), isActive: false };
}

/**
 * Reactivates a previously deactivated account.
 */
export async function reactivateUser(userId, adminId) {
  await connectDB();
  const objId = toObjId(userId);
  if (!objId) {
    const err = new Error("Invalid user ID.");
    err.status = 400;
    throw err;
  }

  const user = await User.findById(objId);
  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  if (user.role === "admin") {
    const err = new Error("Cannot alter administrator accounts through this endpoint.");
    err.status = 400;
    throw err;
  }

  user.isActive = true;
  user.deactivatedAt = null;
  user.deactivatedBy = null;
  await user.save();

  await recordAudit({
    adminId,
    action: "user_reactivated",
    entityType: "user",
    entityId: user._id.toString(),
    summary: `Reactivated account of "${user.name}"`,
  });

  return { _id: user._id.toString(), isActive: true };
}
