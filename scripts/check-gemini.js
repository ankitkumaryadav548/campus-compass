// scripts/check-gemini.js
// Verification script to test Google Gemini REST API connectivity.
// Run with: node --env-file=.env.local scripts/check-gemini.js

import { callGemini } from "../lib/chatbot/gemini.js";
import { CHATBOT_CONFIG } from "../lib/chatbot/config.js";

async function checkGeminiConnectivity() {
  console.log("Checking Google Gemini REST API connectivity...");
  console.log(`Configured model: ${CHATBOT_CONFIG.modelName}`);

  const testPayload = {
    systemInstruction:
      "You are a helpful assistant. Reply with only the word OK.",
    contents: [
      {
        role: "user",
        parts: [{ text: "Ping test. Please reply with only OK." }],
      },
    ],
  };

  const result = await callGemini(testPayload);

  if (result.ok) {
    console.log(`\nOK (${CHATBOT_CONFIG.modelName})`);
    console.log(`Response received: "${result.answer.trim()}"`);
    process.exitCode = 0;
  } else {
    console.error(`\nFAILED: Chatbot error code "${result.code}".`);
    console.error(
      "Please verify your LLM_API_KEY and GEMINI_MODEL in .env.local."
    );
    process.exitCode = 1;
  }
}

checkGeminiConnectivity();
