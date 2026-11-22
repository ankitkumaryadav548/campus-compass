// components/ui/Modal.jsx
"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Modal – accessible dialog with backdrop blur, ESC-to-close, and animation.
 *
 * @param {boolean} isOpen     Show/hide
 * @param {Function} onClose   Called when backdrop or X is clicked, or ESC pressed
 * @param {string} title       Dialog title
 * @param {string} size        sm | md | lg | xl
 */
export default function Modal({ isOpen, open, onClose, title, children, size = "md", className }) {
  const isModalOpen = Boolean(isOpen ?? open);

  // Close on ESC key
  const handleKeyDown = useCallback(
    (e) => { if (e.key === "Escape") onClose?.(); },
    [onClose]
  );

  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isModalOpen, handleKeyDown]);

  const widths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog panel */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "relative w-full rounded-2xl bg-white dark:bg-slate-800",
                "shadow-2xl border border-slate-200 dark:border-slate-700",
                widths[size],
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 id="modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Close dialog"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

