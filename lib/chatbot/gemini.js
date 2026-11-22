// lib/chatbot/gemini.js
// Server-only Google Gemini REST client for generateContent.
// Uses process.env.LLM_API_KEY. Never exposes the key or logs student input.

import { CHATBOT_CONFIG } from "./config.js";

/**
 * Calls Google's Gemini REST API with the system prompt and conversation history.
 *
 * @param {Object} params
 * @param {string} params.systemInstruction - Complete system prompt with verified context
 * @param {Array<{ role: "user" | "model", parts: Array<{ text: string }> }>} params.contents - Message history
 * @returns {Promise<{ ok: true, answer: string } | { ok: false, code: string }>}
 */
export async function callGemini({ systemInstruction, contents }) {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    console.error("Gemini API call failed: LLM_API_KEY is not configured.");
    return { ok: false, code: "chatbot_unavailable" };
  }

  const model = CHATBOT_CONFIG.modelName;
  const endpoint = `${CHATBOT_CONFIG.baseUrl}/models/${encodeURIComponent(model)}:generateContent`;

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: contents,
    generationConfig: {
      temperature: CHATBOT_CONFIG.generationConfig.temperature,
      maxOutputTokens: CHATBOT_CONFIG.generationConfig.maxOutputTokens,
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CHATBOT_CONFIG.requestTimeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey.trim(),
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return { ok: false, code: "chatbot_busy" };
      }

      let errorStatusText = response.statusText;
      try {
        const errJson = await response.json();
        if (errJson?.error?.status) {
          errorStatusText = errJson.error.status;
        }
      } catch {
        // Fall back to HTTP statusText
      }

      if (status === 404) {
        console.error(
          `Gemini API returned 404 (${errorStatusText}). Please verify the GEMINI_MODEL name.`
        );
      } else if (status === 400 || status === 401 || status === 403) {
        console.error(`Gemini API error HTTP ${status}: ${errorStatusText}`);
      } else {
        console.error(`Gemini API returned server error HTTP ${status}`);
      }

      return { ok: false, code: "chatbot_unavailable" };
    }

    const data = await response.json();

    const candidate = data?.candidates?.[0];
    if (!candidate) {
      return { ok: false, code: "no_answer" };
    }

    // Check finishReason for safety / recitation blocks
    const finishReason = candidate.finishReason;
    if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
      if (
        finishReason === "SAFETY" ||
        finishReason === "RECITATION" ||
        finishReason === "BLOCKLIST" ||
        finishReason === "PROHIBITED_CONTENT"
      ) {
        return { ok: false, code: "no_answer" };
      }
    }

    const parts = candidate.content?.parts;
    if (!Array.isArray(parts) || parts.length === 0) {
      return { ok: false, code: "no_answer" };
    }

    // Filter out parts marked as thought and concatenate text parts
    const textPieces = parts
      .filter((p) => !p.thought && typeof p.text === "string")
      .map((p) => p.text);

    const fullAnswer = textPieces.join("\n").trim();
    if (!fullAnswer) {
      return { ok: false, code: "no_answer" };
    }

    return { ok: true, answer: fullAnswer };
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      console.error("Gemini API request timed out after 20 seconds.");
    } else {
      console.error("Gemini network error:", err.message);
    }
    return { ok: false, code: "chatbot_unavailable" };
  }
}
