// app/api/chat/route.js
// Protected API route for AI Chatbot.
// Handles authentication, input validation, rate limiting, context assembly, and Gemini REST call.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { CHATBOT_CONFIG } from "@/lib/chatbot/config";
import { validateChatRequest } from "@/lib/chatbot/validate";
import { loadChatContext } from "@/lib/chatbot/context";
import { buildContents } from "@/lib/chatbot/prompt";
import { callGemini } from "@/lib/chatbot/gemini";

// In-memory per-user sliding window timestamps
// Map<userId, { minute: number[], hour: number[] }>
const userChatRateLimits = new Map();

function checkChatRateLimit(userId) {
  const now = Date.now();
  const entry = userChatRateLimits.get(userId) || { minute: [], hour: [] };

  // Filter out timestamps outside the sliding windows
  const validMinute = entry.minute.filter((t) => now - t < CHATBOT_CONFIG.rateLimits.windowMinuteMs);
  const validHour = entry.hour.filter((t) => now - t < CHATBOT_CONFIG.rateLimits.windowHourMs);

  // Check 1-minute limit
  if (validMinute.length >= CHATBOT_CONFIG.rateLimits.requestsPerMinute) {
    const oldest = validMinute[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + CHATBOT_CONFIG.rateLimits.windowMinuteMs - now) / 1000));
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  // Check 1-hour limit
  if (validHour.length >= CHATBOT_CONFIG.rateLimits.requestsPerHour) {
    const oldest = validHour[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + CHATBOT_CONFIG.rateLimits.windowHourMs - now) / 1000));
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  // Record this request
  validMinute.push(now);
  validHour.push(now);
  userChatRateLimits.set(userId, { minute: validMinute, hour: validHour });

  return { allowed: true };
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to chat.", code: "unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id || session.user._id;
  if (!userId) {
    return NextResponse.json(
      { error: "User session invalid.", code: "unauthorized" },
      { status: 401 }
    );
  }

  // Parse JSON body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON.", code: "invalid_request" },
      { status: 400 }
    );
  }

  // Validate payload structure, role alternation, and length
  const validation = validateChatRequest(body);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error, code: validation.code },
      { status: 400 }
    );
  }

  // Rate limit check
  const rateLimitStatus = checkChatRateLimit(String(userId));
  if (!rateLimitStatus.allowed) {
    return NextResponse.json(
      {
        error: `You are sending messages too quickly. Please wait ${rateLimitStatus.retryAfterSeconds} seconds.`,
        code: "rate_limited",
        retryAfterSeconds: rateLimitStatus.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitStatus.retryAfterSeconds),
        },
      }
    );
  }

  try {
    await connectDB();

    // Load verified database context & assemble system instruction
    const { systemInstruction, sources } = await loadChatContext(session.user, validation.messages);

    // Format message history into alternating Gemini contents
    const contents = buildContents(validation.messages, CHATBOT_CONFIG.maxHistoryMessages);

    // Invoke Gemini via server REST API
    const geminiResult = await callGemini({ systemInstruction, contents });

    if (!geminiResult.ok) {
      if (geminiResult.code === "chatbot_busy") {
        return NextResponse.json(
          {
            error: "The assistant service is currently busy. Please try again in a few moments.",
            code: "chatbot_busy",
          },
          { status: 429 }
        );
      }

      if (geminiResult.code === "no_answer") {
        return NextResponse.json(
          {
            answer:
              "I am sorry, but I do not have enough verified information to safely answer this question. Please check with your university's International Student Office or visit the dedicated Guides section.",
            sources,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          error: "The assistant is temporarily unavailable. Please try again shortly.",
          code: "chatbot_unavailable",
        },
        { status: 503 }
      );
    }

    // Return successful response with verified source chips
    return NextResponse.json(
      {
        answer: geminiResult.answer,
        sources,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Chat API route error:", err.message);
    return NextResponse.json(
      {
        error: "An unexpected error occurred while processing your request. Please try again.",
        code: "chatbot_unavailable",
      },
      { status: 500 }
    );
  }
}
