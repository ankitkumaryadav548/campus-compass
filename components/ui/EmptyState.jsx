// components/ui/EmptyState.jsx
// Displayed when a list or page has no content.

import { cn } from "@/lib/utils";
import { PackageOpen } from "lucide-react";
import Button from "./Button";

/**
 * EmptyState – icon, title, description, optional action button.
 *
 * @param {React.ComponentType} icon   Lucide icon component
 * @param {string} title
 * @param {string} description
 * @param {string} actionLabel         If provided, renders a Button
 * @param {Function} onAction
 */
export default function EmptyState({
  icon: Icon = PackageOpen,
  title = "Nothing here yet",
  description = "There is no content to display at the moment.",
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-4",
        className
      )}
    >
      <div className="mb-5 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-500">
        <Icon size={32} aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">
        {description}
      </p>
      {actionLabel && (
        <Button onClick={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

