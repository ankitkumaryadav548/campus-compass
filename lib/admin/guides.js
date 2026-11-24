// lib/admin/guides.js
// Database service for managing step-by-step student guides.

import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Guide from "@/models/Guide";
import { ADMIN_CONFIG } from "./config";
import { recordAudit } from "./audit";
import { canPublishGuide, isGuideStale } from "./rules";
import { getRegionGroup } from "@/lib/countries";
import { regionQuery, sortBySpecificity, getSpecificityLabel } from "@/lib/personalization";

function toObjId(id) {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
}

/**
 * Lists guides with administrative filters and pagination.
 */
export async function listGuides(filters = {}) {
  await connectDB();
  const { category, status, search, page = 1 } = filters;
  const pageSize = ADMIN_CONFIG.pageSize;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const skip = (currentPage - 1) * pageSize;

  const query = {};
  if (category && ADMIN_CONFIG.categories.includes(category)) {
    query.category = category;
  }
  if (status && ADMIN_CONFIG.guideStatuses.includes(status)) {
    query.status = status;
  }
  if (search && typeof search === "string" && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { region: { $in: [new RegExp(escaped, "i")] } },
    ];
  }

  const [total, docs] = await Promise.all([
    Guide.countDocuments(query),
    Guide.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
  ]);

  const now = new Date();
  const guides = docs.map((g) => ({
    _id: g._id.toString(),
    title: g.title,
    category: g.category,
    region: g.region || [],
    visaTypes: g.visaTypes || [],
    status: g.status || "published",
    isSample: Boolean(g.isSample),
    isStale: isGuideStale(g.lastVerified, now),
    lastVerified: g.lastVerified ? new Date(g.lastVerified).toISOString() : null,
    updatedAt: g.updatedAt ? new Date(g.updatedAt).toISOString() : null,
    createdAt: g.createdAt ? new Date(g.createdAt).toISOString() : null,
  }));

  return {
    guides,
    pagination: {
      page: currentPage,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

/**
 * Retrieves a single guide by ID with complete details for editing.
 */
export async function getGuide(id) {
  await connectDB();
  const objId = toObjId(id);
  if (!objId) return null;

  const guide = await Guide.findById(objId).lean();
  if (!guide) return null;

  const now = new Date();
  return {
    _id: guide._id.toString(),
    title: guide.title,
    category: guide.category,
    region: guide.region || [],
    visaTypes: guide.visaTypes || [],
    requiredDocs: guide.requiredDocs || [],
    providers: (guide.providers || []).map((p) => ({
      name: p.name,
      notes: p.notes || "",
    })),
    steps: (guide.steps || []).map((s) => ({
      order: s.order,
      title: s.title,
      description: s.description || "",
    })),
    tips: guide.tips || [],
    sourceUrl: guide.sourceUrl || "",
    lastVerified: guide.lastVerified ? new Date(guide.lastVerified).toISOString() : null,
    status: guide.status || "published",
    isSample: Boolean(guide.isSample),
    isStale: isGuideStale(guide.lastVerified, now),
    createdAt: guide.createdAt ? new Date(guide.createdAt).toISOString() : null,
    updatedAt: guide.updatedAt ? new Date(guide.updatedAt).toISOString() : null,
  };
}

/**
 * Creates a new guide.
 */
export async function createGuide(data, adminId) {
  await connectDB();
  const now = new Date();

  if (data.status === "published") {
    const publishCheck = canPublishGuide(data, now);
    if (!publishCheck.allowed) {
      const err = new Error(publishCheck.missing.join(" "));
      err.status = 400;
      throw err;
    }
  }

  const guide = await Guide.create({
    ...data,
    isSample: false,
    createdBy: adminId,
    updatedBy: adminId,
  });

  await recordAudit({
    adminId,
    action: "guide_created",
    entityType: "guide",
    entityId: guide._id.toString(),
    summary: `Created ${guide.category.toUpperCase()} guide "${guide.title}"`,
  });

  return getGuide(guide._id);
}

/**
 * Updates an existing guide.
 * If guide is sample content, requires verified: true to remove sample flag.
 */
export async function updateGuide(id, data, adminId, verifiedCheckbox = false) {
  await connectDB();
  const objId = toObjId(id);
  if (!objId) {
    const err = new Error("Invalid guide ID.");
    err.status = 400;
    throw err;
  }

  const existing = await Guide.findById(objId);
  if (!existing) {
    const err = new Error("Guide not found.");
    err.status = 404;
    throw err;
  }

  // Sample guide verification check
  if (existing.isSample) {
    if (!verifiedCheckbox && !data.verified) {
      const err = new Error("You must check 'I have verified this information' to save sample content as real content.");
      err.status = 400;
      throw err;
    }
    existing.isSample = false;
  }

  if (data.status === "published") {
    const publishCheck = canPublishGuide({ ...data, lastVerified: data.lastVerified || existing.lastVerified });
    if (!publishCheck.allowed) {
      const err = new Error(publishCheck.missing.join(" "));
      err.status = 400;
      throw err;
    }
  }

  existing.title = data.title;
  existing.category = data.category;
  existing.region = data.region;
  existing.visaTypes = data.visaTypes;
  existing.requiredDocs = data.requiredDocs;
  existing.providers = data.providers;
  existing.steps = data.steps;
  existing.tips = data.tips;
  existing.sourceUrl = data.sourceUrl || "";
  if (data.lastVerified) {
    existing.lastVerified = data.lastVerified;
  }
  if (data.status) {
    existing.status = data.status;
  }
  existing.updatedBy = adminId;

  await existing.save();

  await recordAudit({
    adminId,
    action: "guide_updated",
    entityType: "guide",
    entityId: existing._id.toString(),
    summary: `Updated guide "${existing.title}"`,
  });

  return getGuide(existing._id);
}

/**
 * Changes a guide's status (publish, unpublish, archive, restore).
 */
export async function setGuideStatus(id, action, adminId) {
  await connectDB();
  const objId = toObjId(id);
  if (!objId) {
    const err = new Error("Invalid guide ID.");
    err.status = 400;
    throw err;
  }

  const guide = await Guide.findById(objId);
  if (!guide) {
    const err = new Error("Guide not found.");
    err.status = 404;
    throw err;
  }

  let auditAction = "";
  if (action === "publish") {
    const check = canPublishGuide(guide);
    if (!check.allowed) {
      const err = new Error(check.missing.join(" "));
      err.status = 400;
      throw err;
    }
    guide.status = "published";
    auditAction = "guide_published";
  } else if (action === "unpublish") {
    guide.status = "draft";
    auditAction = "guide_unpublished";
  } else if (action === "archive") {
    guide.status = "archived";
    auditAction = "guide_archived";
  } else if (action === "restore") {
    guide.status = "draft";
    auditAction = "guide_restored";
  } else {
    const err = new Error("Invalid status action. Use publish, unpublish, archive, or restore.");
    err.status = 400;
    throw err;
  }

  guide.updatedBy = adminId;
  await guide.save();

  await recordAudit({
    adminId,
    action: auditAction,
    entityType: "guide",
    entityId: guide._id.toString(),
    summary: `${action.toUpperCase()} guide "${guide.title}"`,
  });

  return getGuide(guide._id);
}

/**
 * Preview visibility tool ("Who sees this?").
 * Evaluates which published guides a student with a given country and visa type will see.
 */
export async function previewVisibility({ country, visaType }) {
  await connectDB();
  const regionGroup = country ? getRegionGroup(country) : "";
  const stubUser = { country: country || "", regionGroup, visaType: visaType || "student" };

  const visaFilter = stubUser.visaType
    ? {
        $or: [
          { visaTypes: stubUser.visaType },
          { visaTypes: "ALL" },
          { visaTypes: { $size: 0 } },
          { visaTypes: { $exists: false } },
        ],
      }
    : {};

  const query = {
    status: "published",
    ...regionQuery(stubUser),
    ...visaFilter,
  };

  const guides = await Guide.find(query).lean();
  const sorted = sortBySpecificity(guides, stubUser);

  return sorted.map((g) => ({
    _id: g._id.toString(),
    title: g.title,
    category: g.category,
    region: g.region || [],
    specificityLabel: getSpecificityLabel(g, stubUser),
    isSample: Boolean(g.isSample),
  }));
}
