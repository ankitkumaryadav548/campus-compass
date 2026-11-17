// components/ui/Card.jsx
// Flexible card container used throughout the app.

import { isValidElement } from "react";
import { cn } from "@/lib/utils";

/**
 * Card – rounded-2xl container with optional:
 *   - hover lift animation
 *   - gradient top border (pass gradientBorder prop)
 *   - icon badge (pass icon prop)
 *   - padding override
 */
export default function Card({
  children,
  className,
  hover = false,
  gradientBorder = false,
  icon: Icon,
  iconColor = "text-primary-600",
  padding = "p-6",
  ...props
}) {
  return (
    <div
      className={cn(
        // Base styles
        "relative rounded-2xl bg-white dark:bg-slate-800",
        "border border-slate-200 dark:border-slate-700",
        "shadow-card",
        // Optional hover lift
        hover && [
          "transition-all duration-200 cursor-pointer",
          "hover:-translate-y-1 hover:shadow-card-hover",
        ],
        // Optional gradient top border via pseudo element via inline style
        gradientBorder && "overflow-hidden",
        padding,
        className
      )}
      {...props}
    >
      {/* Gradient top border stripe */}
      {gradientBorder && (
        <div
          className="absolute inset-x-0 top-0 h-1 bg-gradient-primary rounded-t-2xl"
          aria-hidden="true"
        />
      )}

      {/* Optional icon badge */}
      {Icon && (
        <div
          className={cn(
            "mb-4 inline-flex items-center justify-center",
            "w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30",
            iconColor
          )}
        >
          {isValidElement(Icon) ? Icon : <Icon size={22} aria-hidden="true" />}
        </div>
      )}

      {children}
    </div>
  );
}

