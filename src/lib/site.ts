/**
 * Single source of truth for site-wide constants.
 * Origin is read from SITE_URL at build time (Decision #12), defaulting to the
 * placeholder domain so dev/CI never depends on a real domain being set.
 */
// `import.meta.env` exists in Astro/Vite but is undefined under plain Node (tsx
// scripts), so access it defensively and fall back to process.env.
const metaEnv = (import.meta as unknown as { env?: { SITE_URL?: string } }).env;
export const SITE_URL = (
  metaEnv?.SITE_URL ??
  (typeof process !== "undefined" ? process.env.SITE_URL : undefined) ??
  "https://resumedocs.example"
).replace(/\/$/, "");

export const BRAND = "ResumeDocs";

/** Path prefix the whole directory lives under. The hub owns the head term. */
export const BASE = "/google-docs-resume-template";

/** Canonical URL for a template detail page. trailingSlash:'always' is pinned. */
export function templateUrl(slug: string): string {
  return `${BASE}/${slug}/`;
}

/** Absolute canonical URL from a site-relative path. */
export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}
