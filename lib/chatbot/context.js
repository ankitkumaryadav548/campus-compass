// lib/chatbot/context.js
// Loads verified database context (guides, checklist, glossary) for the current student.
// Runs only on the server.

import { getGuidesForUser } from "@/lib/guides";
import { getChecklistForUser } from "@/lib/checklist";
import { campusGlossary } from "@/lib/languageData";
import { CHATBOT_CONFIG } from "./config";
import { selectRelevantGuides, selectRelevantGlossary } from "./retrieval";
import {
  buildProfileBlock,
  formatGuide,
  formatChecklist,
  formatGlossary,
  buildSystemInstruction,
} from "./prompt";

/**
 * Loads verified app context for the student and returns the assembled system instruction and source chips.
 *
 * @param {Object} user - Session user
 * @param {Array<{ role: string, text: string }>} messages - Sanitized message history
 * @returns {Promise<{ systemInstruction: string, sources: Array<{ type: string, title: string, href: string, lastVerified: string|null, isSample: boolean }> }>}
 */
export async function loadChatContext(user, messages) {
  // Extract last student question and the previous one for context
  const userMessages = messages.filter((m) => m.role === "user");
  const currentMsg = userMessages.length > 0 ? userMessages[userMessages.length - 1].text : "";
  const prevMsg = userMessages.length > 1 ? userMessages[userMessages.length - 2].text : "";

  // 1. Fetch user-visible guides and checklist in parallel
  const [simGuides, bankGuides, checklistItems] = await Promise.all([
    getGuidesForUser(user, "sim").catch(() => []),
    getGuidesForUser(user, "bank").catch(() => []),
    getChecklistForUser(user).catch(() => []),
  ]);

  const allGuides = [...simGuides, ...bankGuides];

  // 2. Select relevant items based on query
  const relevantGuides = selectRelevantGuides(allGuides, currentMsg, prevMsg);
  const relevantGlossary = selectRelevantGlossary(campusGlossary, currentMsg);

  // 3. Format individual context blocks
  const profileBlock = buildProfileBlock(user);
  const checklistText = formatChecklist(checklistItems);
  const glossaryText = formatGlossary(relevantGlossary);

  // 4. Assemble guide texts, trimming least relevant if exceeding maxContextLength
  let guideSections = relevantGuides.map((g) => formatGuide(g));
  let guidesText = guideSections.join("\n\n");

  let baseInstruction = buildSystemInstruction({
    profileBlock,
    checklistText,
    glossaryText,
    guidesText,
  });

  // If context exceeds maxContextLength, trim least relevant guide (at end of array)
  while (baseInstruction.length > CHATBOT_CONFIG.maxContextLength && guideSections.length > 1) {
    guideSections.pop();
    guidesText = guideSections.join("\n\n");
    baseInstruction = buildSystemInstruction({
      profileBlock,
      checklistText,
      glossaryText,
      guidesText,
    });
  }

  // If still too long, truncate guides text
  if (baseInstruction.length > CHATBOT_CONFIG.maxContextLength) {
    const excess = baseInstruction.length - CHATBOT_CONFIG.maxContextLength;
    if (guidesText.length > excess + 100) {
      guidesText = guidesText.slice(0, guidesText.length - excess - 50) + "\n...[Guide text truncated]";
      baseInstruction = buildSystemInstruction({
        profileBlock,
        checklistText,
        glossaryText,
        guidesText,
      });
    }
  }

  // 5. Build source chips from the guides actually retained in context
  const sources = relevantGuides
    .slice(0, guideSections.length)
    .map((g) => {
      let verifiedDate = null;
      if (g.lastVerified) {
        verifiedDate =
          typeof g.lastVerified === "string"
            ? g.lastVerified
            : new Date(g.lastVerified).toISOString().split("T")[0];
      }
      return {
        type: "guide",
        title: g.title,
        href: `/guides/${g.category}`,
        lastVerified: verifiedDate,
        isSample: Boolean(g.isSample),
      };
    });

  return {
    systemInstruction: baseInstruction,
    sources,
  };
}
