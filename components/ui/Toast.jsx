// components/ui/Toast.jsx
"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle size={18} className="text-success-500" aria-hidden="true" />,
  error:   <XCircle    size={18} className="text-danger-500"  aria-hidden="true" />,
  info:    <Info       size={18} className="text-primary-500" aria-hidden="true" />,
};

const BORDER = {
  success: "border-l-success-500",
  error:   "border-l-danger-500",
  info:    "border-l-primary-500",
};

let _id = 0;

/**
 * ToastProvider – wrap your layout with this.
 * Usage in layout.jsx: <ToastProvider> … </ToastProvider>
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = "info", duration = 4000 }) => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 min-w-[260px] max-w-sm",
                "bg-white dark:bg-slate-800 rounded-xl shadow-xl",
                "border border-slate-200 dark:border-slate-700 border-l-4",
                BORDER[toast.type] || BORDER.info,
                "px-4 py-3"
              )}
              role="status"
            >
              {ICONS[toast.type]}
              <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/**
 * useToast – returns toast({ message, type, duration })
 *
 * Usage:
 *   const toast = useToast();
 *   toast({ message: "Saved!", type: "success" });
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

