import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Everything below is either private data or a one-time auth callback —
      // nothing a crawler should spend budget on.
      disallow: [
        "/dashboard",
        "/transactions",
        "/accounts",
        "/categories",
        "/settings",
        "/auth/confirm",
        "/auth/update-password",
        "/auth/error",
      ],
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
