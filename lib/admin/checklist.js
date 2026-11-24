// lib/admin/checklist.js
// Database service for managing arrival checklist tasks and orders.

import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import ChecklistItem from "@/models/ChecklistItem";
import UserChecklist from "@/models/UserChecklist";
import { recordAudit } from "./audit";

function toObjId(id) {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
}

/**
 * Lists all checklist items in order.
 */
export async function listChecklistItems() {
  await connectDB();
  const items = await ChecklistItem.find().sort({ order: 1 }).lean();

  return items.map((item) => ({
    _id: item._id.toString(),
    title: item.title,
    description: item.description || "",
    region: item.region || [],
    order: item.order,
    deadlineOffsetDays: item.deadlineOffsetDays !== undefined ? item.deadlineOffsetDays : null,
    guideCategory: item.guideCategory || null,
    isSample: Boolean(item.isSample),
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null,
  }));
}

/**
 * Creates a new checklist item with next order number.
 */
export async function createChecklistItem(data, adminId) {
  await connectDB();
  const lastItem = await ChecklistItem.findOne().sort({ order: -1 }).select("order").lean();
  const nextOrder = (lastItem?.order || 0) + 1;

  const item = await ChecklistItem.create({
    ...data,
    order: nextOrder,
    isSample: false,
  });

  await recordAudit({
    adminId,
    action: "checklist_created",
    entityType: "checklist_item",
    entityId: item._id.toString(),
    summary: `Created checklist item "${item.title}"`,
  });

  return {
    _id: item._id.toString(),
    title: item.title,
    description: item.description || "",
    region: item.region || [],
    order: item.order,
    deadlineOffsetDays: item.deadlineOffsetDays !== undefined ? item.deadlineOffsetDays : null,
    guideCategory: item.guideCategory || null,
    isSample: Boolean(item.isSample),
  };
}

/**
 * Updates a checklist item.
 */
export async function updateChecklistItem(id, data, adminId) {
  await connectDB();
  const objId = toObjId(id);
  if (!objId) {
    const err = new Error("Invalid checklist item ID.");
    err.status = 400;
    throw err;
  }

  const item = await ChecklistItem.findById(objId);
  if (!item) {
    const err = new Error("Checklist item not found.");
    err.status = 404;
    throw err;
  }

  item.title = data.title;
  item.description = data.description || "";
  item.region = data.region;
  item.deadlineOffsetDays = data.deadlineOffsetDays;
  item.guideCategory = data.guideCategory || null;
  item.isSample = false;

  await item.save();

  await recordAudit({
    adminId,
    action: "checklist_updated",
    entityType: "checklist_item",
    entityId: item._id.toString(),
    summary: `Updated checklist item "${item.title}"`,
  });

  return {
    _id: item._id.toString(),
    title: item.title,
    description: item.description || "",
    region: item.region || [],
    order: item.order,
    deadlineOffsetDays: item.deadlineOffsetDays !== undefined ? item.deadlineOffsetDays : null,
    guideCategory: item.guideCategory || null,
    isSample: Boolean(item.isSample),
  };
}

/**
 * Deletes a checklist item and cascades deletion to UserChecklist status records.
 */
export async function deleteChecklistItem(id, adminId) {
  await connectDB();
  const objId = toObjId(id);
  if (!objId) {
    const err = new Error("Invalid checklist item ID.");
    err.status = 400;
    throw err;
  }

  const item = await ChecklistItem.findById(objId);
  if (!item) {
    const err = new Error("Checklist item not found.");
    err.status = 404;
    throw err;
  }

  const title = item.title;
  await Promise.all([
    ChecklistItem.findByIdAndDelete(objId),
    UserChecklist.deleteMany({ itemId: objId }),
  ]);

  await recordAudit({
    adminId,
    action: "checklist_deleted",
    entityType: "checklist_item",
    entityId: id,
    summary: `Deleted checklist item "${title}"`,
  });

  return { success: true };
}

/**
 * Reorders all checklist items in one atomic batch.
 * Validates that orderedIds contains all and only existing items.
 */
export async function reorderChecklist(orderedIds, adminId) {
  await connectDB();
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    const err = new Error("orderedIds must be a non-empty array of item IDs.");
    err.status = 400;
    throw err;
  }

  const allItems = await ChecklistItem.find().select("_id").lean();
  const existingSet = new Set(allItems.map((i) => i._id.toString()));

  if (orderedIds.length !== existingSet.size || !orderedIds.every((id) => existingSet.has(id))) {
    const err = new Error("Ordered IDs must exactly match all existing checklist items.");
    err.status = 400;
    throw err;
  }

  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: toObjId(id) },
      update: { $set: { order: index + 1 } },
    },
  }));

  await ChecklistItem.bulkWrite(bulkOps);

  await recordAudit({
    adminId,
    action: "checklist_reordered",
    entityType: "checklist_item",
    entityId: "all",
    summary: `Reordered ${orderedIds.length} checklist items`,
  });

  return listChecklistItems();
}
