// lib/chatbot/retrieval.js
// Pure retrieval and relevance scoring functions for guides and glossary terms.

import { CHATBOT_CONFIG } from "./config.js";

/**
 * Normalizes and tokenizes text, removing punctuation and stopwords.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function tokenize(text) {
  if (!text || typeof text !== "string") return [];
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/);

  return words.filter((w) => w.length > 1 && !CHATBOT_CONFIG.stopwords.has(w));
}

/**
 * Selects up to CHATBOT_CONFIG.maxRelevantGuides guides most relevant to
 * the student's question and immediate conversation context.
 *
 * @param {Array} guides - Guides list (already filtered for student's country & visa)
 * @param {string} currentMessage - Last student user message
 * @param {string} [previousMessage=""] - Previous student user message (for follow-ups)
 * @returns {Array} Selected relevant guides
 */
export function selectRelevantGuides(guides, currentMessage, previousMessage = "") {
  if (!Array.isArray(guides) || guides.length === 0) return [];

  const currentTokens = new Set(tokenize(currentMessage));
  const prevTokens = new Set(tokenize(previousMessage));

  const scored = [];

  for (const guide of guides) {
    let score = 0;
    const category = (guide.category || "").toLowerCase();
    const keywords = CHATBOT_CONFIG.categoryKeywords[category] || [];

    // 1. Direct category keyword match from current question (weight: 3)
    for (const kw of keywords) {
      if (currentTokens.has(kw)) {
        score += 3;
      } else if (prevTokens.has(kw)) {
        // Follow-up context bonus (weight: 1.5)
        score += 1.5;
      }
    }

    // 2. Guide title and summary word match
    const guideText = `${guide.title || ""} ${guide.summary || ""}`.toLowerCase();
    for (const token of currentTokens) {
      if (guideText.includes(token)) {
        score += 2;
      }
    }
    for (const token of prevTokens) {
      if (guideText.includes(token)) {
        score += 1;
      }
    }

    // 3. Document or provider names match
    if (Array.isArray(guide.requiredDocuments)) {
      const docText = guide.requiredDocuments.join(" ").toLowerCase();
      for (const token of currentTokens) {
        if (docText.includes(token)) score += 1.5;
      }
    }

    // 4. Country-specific guides receive an additional priority weight
    // if country is explicitly set and not 'ALL'
    if (guide.country && guide.country !== "ALL") {
      score += 0.5;
    }

    // Require a minimum relevance threshold (e.g., at least 2 points)
    if (score >= 2) {
      scored.push({ guide, score });
    }
  }

  // Sort descending by score. If scores are tied, preserve original order (country-specific comes first)
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, CHATBOT_CONFIG.maxRelevantGuides).map((item) => item.guide);
}

/**
 * Selects up to CHATBOT_CONFIG.maxGlossaryTerms relevant terms from the campus glossary.
 *
 * @param {Array<{ term: string, meaning: string }>} glossary - Campus glossary
 * @param {string} userMessage - Student's question
 * @returns {Array<{ term: string, meaning: string }>}
 */
export function selectRelevantGlossary(glossary, userMessage) {
  if (!Array.isArray(glossary) || glossary.length === 0 || !userMessage) return [];

  const lowerMsg = userMessage.toLowerCase();
  const matched = [];

  for (const item of glossary) {
    if (!item?.term) continue;
    const termLower = item.term.toLowerCase();

    // Check full term substring (e.g. "bonafide certificate", "frro")
    // or key words inside the term
    if (lowerMsg.includes(termLower)) {
      matched.push(item);
      continue;
    }

    // Extract significant words of term (e.g., "warden", "registrar", "mess")
    const termWords = tokenize(item.term);
    const hasWordMatch = termWords.some(
      (w) => w.length >= 4 && lowerMsg.includes(w)
    );
    if (hasWordMatch) {
      matched.push(item);
    }
  }

  return matched.slice(0, CHATBOT_CONFIG.maxGlossaryTerms);
}
