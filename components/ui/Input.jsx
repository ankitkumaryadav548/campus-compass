// components/ui/Input.jsx
"use client";

import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

/**
 * Input – text input with label, helper text, error state and optional left icon.
 */
export function Input({
  id,
  label,
  helper,
  error,
  leftIcon: LeftIcon,
  rightElement,
  className,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {LeftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <LeftIcon size={16} aria-hidden="true" />
          </div>
        )}

        <input
          id={inputId}
          aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
          aria-invalid={!!error}
          className={cn(
            "w-full rounded-xl border bg-white dark:bg-slate-900 px-4 py-2.5 text-sm",
            "text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
            "transition-all duration-200 outline-none",
            "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
            LeftIcon && "pl-9",
            rightElement && "pr-10",
            error
              ? "border-danger-500 focus:ring-danger-500"
              : "border-slate-300 dark:border-slate-600",
            className
          )}
          {...props}
        />

        {rightElement && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} role="alert" className="flex items-center gap-1 text-xs text-danger-600">
          <AlertCircle size={12} aria-hidden="true" /> {error}
        </p>
      )}
      {!error && helper && (
        <p id={`${inputId}-helper`} className="text-xs text-slate-500 dark:text-slate-400">
          {helper}
        </p>
      )}
    </div>
  );
}

/**
 * Select – styled dropdown with the same design system.
 */
export function Select({
  id,
  label,
  helper,
  error,
  options = [],
  placeholder = "Select an option",
  className,
  ...props
}) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <select
        id={selectId}
        aria-describedby={error ? `${selectId}-error` : undefined}
        aria-invalid={!!error}
        className={cn(
          "w-full rounded-xl border bg-white dark:bg-slate-900 px-4 py-2.5 text-sm",
          "text-slate-900 dark:text-slate-100",
          "transition-all duration-200 outline-none",
          "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
          error
            ? "border-danger-500 focus:ring-danger-500"
            : "border-slate-300 dark:border-slate-600",
          className
        )}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>

      {error && (
        <p id={`${selectId}-error`} role="alert" className="flex items-center gap-1 text-xs text-danger-600">
          <AlertCircle size={12} aria-hidden="true" /> {error}
        </p>
      )}
      {!error && helper && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helper}</p>
      )}
    </div>
  );
}

