"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

/**
 * The Add Transaction segmented control from the Pencil modal: equal-width
 * segments in a bordered, rounded track; the active segment tints to match the
 * transaction type.
 */
const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "grid w-full grid-cols-3 overflow-hidden rounded-md border border-border bg-surface",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    tone?: "expense" | "income" | "transfer";
  }
>(({ className, tone = "expense", ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center gap-1.5 border-r border-border px-3 py-2.5 text-body font-medium text-content-secondary transition-colors last:border-r-0",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
      "hover:bg-surface-secondary/70",
      "[&_svg]:size-3.5 [&_svg]:shrink-0",
      tone === "expense" &&
        "data-[state=active]:bg-danger-light data-[state=active]:text-danger",
      tone === "income" &&
        "data-[state=active]:bg-success-light data-[state=active]:text-success",
      tone === "transfer" &&
        "data-[state=active]:bg-info-light data-[state=active]:text-info",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("focus-visible:outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
