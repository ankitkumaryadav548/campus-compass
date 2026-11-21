// lib/reports.js
// Business logic for user and chat safety reporting.

import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Report from "@/models/Report";
import BuddyMatch from "@/models/BuddyMatch";

export const MAX_REPORTS_PER_DAY = 5;
const ALLOWED_REASONS = ["spam", "harassment", "inappropriate", "fake_profile", "other"];

/**
 * Creates a safety report for a conversation.
 * Limits users to 5 reports per 24 hours and at most one open report per match.
 *
 * @param {Object} options
 * @param {string|mongoose.Types.ObjectId} options.reporterId
 * @param {string|mongoose.Types.ObjectId} options.matchId
 * @param {string} options.reason
 * @param {string} [options.details]
 * @param {boolean} [options.alsoBlock]
 * @returns {Promise<{ success: boolean, reportId?: string, blocked?: boolean, error?: string, status?: number }>}
 */
export async function createReport({
  reporterId,
  matchId,
  reason,
  details = "",
  alsoBlock = false,
}) {
  if (!reporterId || !matchId) {
    return { error: "Missing reporter or match ID.", status: 400 };
  }

  if (!ALLOWED_REASONS.includes(reason)) {
    return { error: "Please select a valid report reason.", status: 400 };
  }

  const trimmedDetails = typeof details === "string" ? details.trim() : "";
  if (trimmedDetails.length > 300) {
    return { error: "Details must be 300 characters or less.", status: 400 };
  }

  await connectDB();

  const reporterObjId = mongoose.Types.ObjectId.isValid(reporterId)
    ? new mongoose.Types.ObjectId(reporterId)
    : reporterId;
  const matchObjId = mongoose.Types.ObjectId.isValid(matchId)
    ? new mongoose.Types.ObjectId(matchId)
    : matchId;

  // 1. Enforce 24-hour rate limit (5 reports per day)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentReportsCount = await Report.countDocuments({
    reporterId: reporterObjId,
    createdAt: { $gte: oneDayAgo },
  });

  if (recentReportsCount >= MAX_REPORTS_PER_DAY) {
    return {
      error: "You have reached the limit of 5 reports per day. Please try again tomorrow.",
      status: 429,
    };
  }

  // 2. Lookup the match and verify reporter is participant
  const match = await BuddyMatch.findById(matchObjId);
  if (!match) {
    return { error: "Conversation not found.", status: 404 };
  }

  const reqStr = match.requesterId.toString();
  const recStr = match.recipientId.toString();
  const reporterStr = reporterId.toString();

  if (reqStr !== reporterStr && recStr !== reporterStr) {
    return {
      error: "You can only report conversations you are a member of.",
      status: 403,
    };
  }

  const reportedId = reqStr === reporterStr ? match.recipientId : match.requesterId;

  // 3. Ensure one open report per reporter per match
  const existingOpenReport = await Report.findOne({
    reporterId: reporterObjId,
    matchId: matchObjId,
    status: "open",
  }).lean();

  if (existingOpenReport) {
    return {
      error: "You already have an open report for this conversation. Our team is reviewing it.",
      status: 409,
    };
  }

  // 4. Create the report
  const report = await Report.create({
    reporterId: reporterObjId,
    reportedId,
    matchId: matchObjId,
    reason,
    details: trimmedDetails,
    status: "open",
  });

  // 5. If alsoBlock requested, update the match to blocked
  let blocked = false;
  if (alsoBlock) {
    match.status = "blocked";
    match.blockedBy = reporterObjId;
    await match.save();
    blocked = true;
  }

  return {
    success: true,
    reportId: report._id.toString(),
    blocked,
  };
}
