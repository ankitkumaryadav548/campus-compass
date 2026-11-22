// components/modules/chat/ChatInput.jsx
// Auto-growing textarea chat input with character counter and Stop action.

"use client";

import { useEffect, useRef } from "react";
import { Send, Square } from "lucide-react";
import { CHATBOT_CONFIG } from "@/lib/chatbot/config";

export default function ChatInput({
  input,
  setInput,
  onSend,
  onStop,
  isLoading,
  disabled,
  waitSeconds = 0,
}) {
  const textareaRef = useRef(null);

  // Auto-grow textarea up to 5 lines (~120px)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.min(el.scrollHeight, 130);
    el.style.height = `${newHeight}px`;
  }, [input]);

  // Focus textarea when not loading
  useEffect(() => {
    if (!isLoading && !disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading, disabled]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && !disabled && input.trim()) {
        onSend();
      }
    }
  };

  const isOverLimit = input.length > CHATBOT_CONFIG.maxUserMessageLength;
  const charsRemaining = CHATBOT_CONFIG.maxUserMessageLength - input.length;
  const isSendDisabled =
    !input.trim() || isOverLimit || isLoading || disabled || waitSeconds > 0;

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-b-2xl shadow-sm">
      {waitSeconds > 0 && (
        <div className="mb-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 rounded-lg flex items-center justify-between">
          <span>Rate limit reached. Please wait before asking another question.</span>
          <span className="font-semibold">{waitSeconds}s</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isSendDisabled) onSend();
        }}
        className="flex items-end gap-2"
      >
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || waitSeconds > 0}
            placeholder={
              waitSeconds > 0
                ? `Please wait ${waitSeconds}s...`
                : "Ask about SIM cards, bank accounts, checklist tasks, or campus terms…"
            }
            aria-label="Message the Campus Compass Assistant"
            className="w-full resize-none rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50"
          />
        </div>

        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating response"
            className="flex-shrink-0 h-10 px-3.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950/60 dark:hover:text-red-300 text-slate-700 dark:text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors active:scale-95 shadow-xs"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSendDisabled}
            aria-label="Send message"
            className="flex-shrink-0 h-10 w-10 sm:w-auto sm:px-4 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-95 text-white font-medium text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        )}
      </form>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-1">
        <span>
          Press <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">Enter</kbd> to send,{" "}
          <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">Shift+Enter</kbd> for newline
        </span>
        <span
          className={
            charsRemaining < 0
              ? "text-red-600 dark:text-red-400 font-semibold"
              : charsRemaining < 50
              ? "text-amber-600 dark:text-amber-400"
              : ""
          }
        >
          {input.length} / {CHATBOT_CONFIG.maxUserMessageLength}
        </span>
      </div>
    </div>
  );
}
