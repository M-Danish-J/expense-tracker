import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

/**
 * Only the public marketing surface belongs here. Application routes sit behind
 * authentication, so listing them would just hand crawlers a set of redirects.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: siteUrl(),
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: siteUrl("/auth/sign-up"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: siteUrl("/auth/login"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
