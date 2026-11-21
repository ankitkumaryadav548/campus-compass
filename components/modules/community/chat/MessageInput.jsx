"use client";
// components/modules/community/chat/MessageInput.jsx
// Auto-growing textarea with keyboard shortcuts, character countdown, and accessible send button.

import { useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

export default function MessageInput({
  value,
  onChange,
  onSend,
  disabled,
  sending,
  partnerName = "Connection",
}) {
  const textareaRef = useRef(null);

  // Auto-grow textarea up to 5 lines (~120px)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.min(el.scrollHeight, 120);
    el.style.height = `${newHeight}px`;
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const trimmedLength = (value || "").trim().length;
  const isNearLimit = trimmedLength > 450;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
      className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-1.5"
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${partnerName.split(" ")[0]}...`}
          maxLength={500}
          disabled={disabled}
          className="flex-1 text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none placeholder:text-slate-400 min-h-[44px] max-h-[120px] transition-[height] duration-75"
        />

        <Button
          type="submit"
          disabled={!trimmedLength || sending || disabled}
          loading={sending}
          className="h-11 w-11 p-0 shrink-0 rounded-2xl flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </Button>
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-400 px-1 select-none">
        <span>Enter to send • Shift+Enter for new line</span>
        <span className={isNearLimit ? "text-amber-500 font-semibold" : ""}>
          {trimmedLength} / 500
        </span>
      </div>
    </form>
  );
}
