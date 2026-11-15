// components/ui/Button.jsx
"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * Button – design-system primary interactive element.
 *
 * Variants: primary | secondary | ghost | danger
 * Sizes:    sm | md | lg
 * Props:    leftIcon, rightIcon, loading, disabled, as (element override)
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  loading = false,
  disabled = false,
  className,
  as: Tag = "button",
  ...props
}) {
  const base = [
    // Layout & transitions
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl",
    "transition-all duration-200 select-none cursor-pointer",
    // Interaction states
    "hover:-translate-y-0.5 active:scale-95",
    // Focus ring
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    // Disabled
    (disabled || loading) && "opacity-60 pointer-events-none",
  ];

  const variants = {
    primary: [
      "bg-gradient-primary text-white shadow-md",
      "hover:bg-gradient-primary-h hover:shadow-card-hover",
      "focus-visible:ring-primary-500",
    ],
    secondary: [
      "border-2 border-primary-600 text-primary-600 bg-transparent",
      "hover:bg-primary-50 hover:shadow-card-hover dark:hover:bg-primary-900/20",
      "focus-visible:ring-primary-500 dark:border-primary-400 dark:text-primary-400",
    ],
    ghost: [
      "text-slate-700 dark:text-slate-300 bg-transparent",
      "hover:bg-slate-100 dark:hover:bg-slate-800",
      "focus-visible:ring-slate-400",
    ],
    danger: [
      "bg-danger-500 text-white shadow-md",
      "hover:bg-danger-600 hover:shadow-lg",
      "focus-visible:ring-danger-500",
    ],
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm min-h-[36px]",
    md: "px-5 py-2.5 text-sm min-h-[44px]",
    lg: "px-7 py-3 text-base min-h-[52px]",
  };

  return (
    <Tag
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={16} aria-hidden="true" />
      ) : (
        LeftIcon && <LeftIcon size={size === "sm" ? 14 : size === "lg" ? 20 : 16} aria-hidden="true" />
      )}
      {children}
      {!loading && RightIcon && (
        <RightIcon size={size === "sm" ? 14 : size === "lg" ? 20 : 16} aria-hidden="true" />
      )}
    </Tag>
  );
}

