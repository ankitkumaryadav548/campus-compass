// components/modules/chat/MessageList.jsx
// Scrollable container for conversation messages with thinking indicator and retry bubble.

"use client";

import { useEffect, useRef } from "react";
import { Bot, RotateCcw, AlertTriangle } from "lucide-react";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";

export default function MessageList({
  messages = [],
  isThinking = false,
  error = null,
  onRetry,
}) {
  const containerRef = useRef(null);
  const isNearBottomRef = useRef(true);

  // Check if student is near the bottom to avoid fighting intentional upward scrolls
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 150;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = fromBottom <= threshold;
  };

  useEffect(() => {
    if (isNearBottomRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isThinking, error]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      tabIndex={0}
      aria-label="Conversation history"
      aria-live="polite"
      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 focus:outline-none"
    >
      {messages.map((msg, idx) =>
        msg.role === "user" ? (
          <UserMessage key={`user-${idx}`} message={msg} />
        ) : (
          <AssistantMessage key={`assistant-${idx}`} message={msg} />
        )
      )}

      {isThinking && (
        <div className="flex items-start gap-3 mb-4" aria-label="Assistant is thinking">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400 animate-bounce [animation-delay:0.15s]" />
            <span className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400 animate-bounce [animation-delay:0.3s]" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1.5">
              Finding answer…
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="my-3 p-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/40 text-red-800 dark:text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm shadow-xs">
          <div className="flex items-start sm:items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5 sm:mt-0" />
            <span>{error.message || "Failed to get an answer."}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 active:scale-95 text-white transition-colors self-end sm:self-auto shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
