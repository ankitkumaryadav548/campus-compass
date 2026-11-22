// lib/chatbot/validate.js
// Pure validation logic for chatbot request payloads.

import { CHATBOT_CONFIG } from "./config.js";

/**
 * Validates and sanitizes the incoming chat request body.
 *
 * @param {any} body - Parsed JSON body
 * @returns {{ valid: boolean, messages?: Array<{ role: string, text: string }>, error?: string, code?: string }}
 */
export function validateChatRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      valid: false,
      code: "invalid_request",
      error: "Request body must be a JSON object with a messages array.",
    };
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      valid: false,
      code: "invalid_request",
      error: "The messages array must contain at least 1 message.",
    };
  }

  if (messages.length > CHATBOT_CONFIG.maxClientMessages) {
    return {
      valid: false,
      code: "invalid_request",
      error: `Too many messages in request (maximum ${CHATBOT_CONFIG.maxClientMessages}).`,
    };
  }

  const sanitized = [];

  for (let i = 0; i < messages.length; i++) {
    const item = messages[i];
    if (!item || typeof item !== "object") {
      return {
        valid: false,
        code: "invalid_request",
        error: `Message at index ${i} is not an object.`,
      };
    }

    const { role, text } = item;
    if (role !== "user" && role !== "assistant") {
      return {
        valid: false,
        code: "invalid_request",
        error: `Message at index ${i} has invalid role "${role}". Must be "user" or "assistant".`,
      };
    }

    if (typeof text !== "string") {
      return {
        valid: false,
        code: "invalid_request",
        error: `Message at index ${i} must have a string text property.`,
      };
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return {
        valid: false,
        code: "invalid_request",
        error: `Message at index ${i} cannot be empty.`,
      };
    }

    const maxLen =
      role === "user"
        ? CHATBOT_CONFIG.maxUserMessageLength
        : CHATBOT_CONFIG.maxAssistantMessageLength;

    if (trimmed.length > maxLen) {
      return {
        valid: false,
        code: "invalid_request",
        error: `Message at index ${i} exceeds maximum allowed length of ${maxLen} characters.`,
      };
    }

    // Keep only role and text, stripping any unexpected fields
    sanitized.push({
      role,
      text: trimmed,
    });
  }

  const lastMessage = sanitized[sanitized.length - 1];
  if (lastMessage.role !== "user") {
    return {
      valid: false,
      code: "invalid_request",
      error: "The last message in the conversation must be from the user.",
    };
  }

  return {
    valid: true,
    messages: sanitized,
  };
}
