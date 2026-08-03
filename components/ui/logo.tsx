import { Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Pencil spec — Logo/Light and Logo/Dark: 40px rounded-10 tile with a 22px
 * wallet glyph, 12px gap, wordmark at 22px/600.
 */
export function Logo({
  variant = "light",
  size = "md",
  showWordmark = true,
  className,
}: {
  readonly variant?: "light" | "dark";
  readonly size?: "sm" | "md";
  readonly showWordmark?: boolean;
  readonly className?: string;
}) {
  const tile = size === "sm" ? "size-8 rounded-md" : "size-10 rounded-md";
  const glyph = size === "sm" ? "size-[18px]" : "size-[22px]";
  const word = size === "sm" ? "text-h3" : "text-[22px] leading-7";

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "flex items-center justify-center",
          tile,
          variant === "light" ? "bg-brand-900" : "bg-surface",
        )}
      >
        <Wallet
          className={cn(
            glyph,
            variant === "light" ? "text-brand-50" : "text-brand-900",
          )}
          aria-hidden
        />
      </span>
      {showWordmark ? (
        <span
          className={cn(
            "font-semibold tracking-tight",
            word,
            variant === "light" ? "text-brand-900" : "text-content-inverse",
          )}
        >
          Expensio
        </span>
      ) : null}
    </span>
  );
}
