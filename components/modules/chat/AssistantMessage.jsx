// components/modules/chat/AssistantMessage.jsx
// Displays an assistant's response bubble with avatar.

import { Bot } from "lucide-react";
import FormatMessage from "./formatMessage";

export default function AssistantMessage({ message }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 flex items-center justify-center shadow-xs">
        <Bot className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 max-w-[90%] sm:max-w-[80%] rounded-2xl rounded-tl-sm bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-3.5 shadow-xs">
        <div className="text-sm">
          <FormatMessage text={message.text} />
          {message.isTyping && (
            <span
              className="inline-block w-1.5 h-3.5 ml-1 bg-primary-600 dark:bg-primary-400 animate-pulse align-middle rounded-xs"
              aria-label="Typing..."
            />
          )}
        </div>
      </div>
    </div>
  );
}
