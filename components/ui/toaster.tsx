"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Mutation feedback. Styled with the design tokens rather than sonner's
 * defaults so success/error toasts read as part of the product.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "group flex items-center gap-3 rounded-md border border-border bg-surface p-4 text-body text-content shadow-raised",
          title: "font-medium",
          description: "text-caption text-content-secondary",
          actionButton: "rounded-sm bg-brand-900 px-2 py-1 text-caption text-content-inverse",
          cancelButton:
            "rounded-sm bg-surface-secondary px-2 py-1 text-caption text-content-secondary",
          success: "[&_[data-icon]]:text-success",
          error: "[&_[data-icon]]:text-danger",
        },
      }}
    />
  );
}

export { toast } from "sonner";
