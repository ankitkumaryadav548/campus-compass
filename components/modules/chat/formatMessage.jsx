// components/modules/chat/formatMessage.jsx
// Safe markdown renderer for assistant responses.
// Converts paragraphs, bullet lists, numbered lists, and **bold** into safe React elements.
// Statically avoids dangerouslySetInnerHTML.

import React from "react";

/**
 * Parses inline bold syntax (**text**) into safe React elements.
 *
 * @param {string} text
 * @returns {React.ReactNode[]}
 */
export function renderInlineFormattedText(text) {
  if (!text || typeof text !== "string") return "";

  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong
          key={index}
          className="font-semibold text-slate-900 dark:text-white"
        >
          {inner}
        </strong>
      );
    }
    return part;
  });
}

/**
 * Parses structured markdown text into safe React elements.
 *
 * @param {string} text
 * @returns {React.ReactNode}
 */
export default function FormatMessage({ text }) {
  if (!text || typeof text !== "string") return null;

  // Split into raw lines to preserve sequence of lists vs paragraphs
  const rawLines = text.replace(/\r\n/g, "\n").split("\n");
  const nodes = [];

  let currentList = null; // { type: "ul" | "ol", items: [] }

  function flushList() {
    if (!currentList) return;
    const ListTag = currentList.type;
    const listClasses =
      currentList.type === "ol"
        ? "list-decimal pl-5 space-y-1.5 my-2 text-slate-800 dark:text-slate-200"
        : "list-disc pl-5 space-y-1.5 my-2 text-slate-800 dark:text-slate-200";

    nodes.push(
      <ListTag key={`list-${nodes.length}`} className={listClasses}>
        {currentList.items.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            {renderInlineFormattedText(item)}
          </li>
        ))}
      </ListTag>
    );
    currentList = null;
  }

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();

    if (!line) {
      flushList();
      continue;
    }

    // Numbered list item: "1. text" or "1) text"
    const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (numberedMatch) {
      if (currentList && currentList.type !== "ol") {
        flushList();
      }
      if (!currentList) {
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(numberedMatch[2]);
      continue;
    }

    // Bullet list item: "- text" or "* text"
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      if (currentList && currentList.type !== "ul") {
        flushList();
      }
      if (!currentList) {
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Regular paragraph line
    flushList();
    nodes.push(
      <p
        key={`p-${nodes.length}`}
        className="mb-2.5 last:mb-0 leading-relaxed text-slate-800 dark:text-slate-200"
      >
        {renderInlineFormattedText(line)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1">{nodes}</div>;
}
