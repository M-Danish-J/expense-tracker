/**
 * The canonical origin, resolved once.
 *
 * `NEXT_PUBLIC_SITE_URL` wins when set (a custom domain), then Vercel's
 * deployment URL, then localhost for development. Canonical tags, the sitemap
 * and JSON-LD all read from here so they can't disagree.
 */
export function siteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function siteUrl(path = "/"): string {
  return `${siteOrigin()}${path === "/" ? "" : path}` || siteOrigin();
}
