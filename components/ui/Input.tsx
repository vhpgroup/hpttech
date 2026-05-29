import * as React from "react";
import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, id, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    const describedBy = error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined;

    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}
          </label>
        ) : null}
        <div className="relative">
          {leftIcon ? (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </span>
          ) : null}
          <input
            id={inputId}
            ref={ref}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              "h-10 w-full rounded-md border bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-2",
              leftIcon && "pl-9",
              error
                ? "border-danger focus:ring-danger/35"
                : "border-slate-300 focus:border-primary-600 focus:ring-primary-500/30",
              className
            )}
            {...props}
          />
        </div>
        {error || helperText ? (
          <p
            id={describedBy}
            className={cn("mt-1.5 text-xs", error ? "text-danger" : "text-slate-500")}
          >
            {error || helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
