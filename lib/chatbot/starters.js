// lib/chatbot/starters.js
// Pure generator for starter questions shown on the empty chat state.

/**
 * Returns a list of starter questions personalized with the student's pending checklist item if available.
 *
 * @param {string|string[]} [pendingTitles] - Nearest pending checklist item title or array of pending titles
 * @returns {string[]} Array of suggested starter questions
 */
export function getStarterQuestions(pendingTitles) {
  let primaryPending = null;
  if (Array.isArray(pendingTitles) && pendingTitles.length > 0) {
    primaryPending = pendingTitles[0];
  } else if (typeof pendingTitles === "string" && pendingTitles.trim()) {
    primaryPending = pendingTitles.trim();
  }

  const starters = [];

  if (primaryPending) {
    starters.push(`What should I do for "${primaryPending}"?`);
  }

  starters.push("How do I get a local SIM card?");
  starters.push("What documents do I need to open a student bank account?");
  starters.push("What should I do first after arriving on campus?");

  return starters.slice(0, 4);
}
