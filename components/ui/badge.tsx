import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Pencil spec — Badge/Income | Expense | Category | Warning | Info:
 * padding [4, 12], gap 6, radius-pill, 12px/500 text, 12px icon.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-3 py-1 text-caption font-medium [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        income: "bg-success-light text-success",
        expense: "bg-danger-light text-danger",
        category: "bg-brand-50 text-brand-900",
        transfer: "bg-info-light text-info",
        warning: "bg-warning-light text-warning",
        neutral: "bg-surface-secondary text-content-secondary",
      },
    },
    defaultVariants: {
      variant: "category",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
