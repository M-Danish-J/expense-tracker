import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Pencil spec — Input/Default field: height 44, padding [0, 14],
 * radius-md, 1px border, 14px text, muted placeholder.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-border bg-surface px-3.5 text-body text-content transition-colors",
          "placeholder:text-content-muted",
          "focus-visible:border-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900/15",
          "disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:opacity-70",
          "aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/15",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[88px] w-full resize-y rounded-md border border-border bg-surface px-3.5 py-2.5 text-body text-content transition-colors",
      "placeholder:text-content-muted",
      "focus-visible:border-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900/15",
      "disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:opacity-70",
      "aria-[invalid=true]:border-danger",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Input, Textarea };
