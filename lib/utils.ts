import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The design system names its font sizes after roles (`text-body`,
 * `text-caption`, `text-h2`…) rather than t-shirt sizes.
 *
 * tailwind-merge can't know that, so out of the box it reads `text-caption` as
 * a *colour* — same class group as `text-content-inverse` — and keeps only the
 * last one. That silently deleted the white from every `size="sm"` primary
 * button, leaving inherited near-black text on a navy background.
 *
 * Registering the scale here fixes it everywhere at once, and keeps future
 * font-size tokens from reintroducing the same bug.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "overline",
            "caption",
            "label",
            "body",
            "h3",
            "h2",
            "h1",
            "stat",
            "display",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
