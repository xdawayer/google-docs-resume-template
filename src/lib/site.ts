/**
 * Single source of truth for site-wide constants.
 * Origin is read from SITE_URL at build time (Decision #12), defaulting to the
 * live production domain so dev/CI render real canonicals without extra env.
 */
// `import.meta.env` exists in Astro/Vite but is undefined under plain Node (tsx
// scripts), so access it defensively and fall back to process.env.
const metaEnv = (import.meta as unknown as { env?: { SITE_URL?: string } }).env;
export const SITE_URL = (
  metaEnv?.SITE_URL ??
  (typeof process !== "undefined" ? process.env.SITE_URL : undefined) ??
  "https://googledocsresumetemplate.com"
).replace(/\/$/, "");

export const BRAND = "ResumeDocs";

/** One-line brand entity description (GEO: used in Organization/WebSite JSON-LD). */
export const BRAND_DESCRIPTION =
  "Free, ATS-friendly Google Docs resume templates plus a private, client-side resume builder that exports a clean, selectable-text PDF — no signup.";

/** Stable JSON-LD @ids so the brand resolves to one entity sitewide. */
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Brand logo + default social card (real assets in public/). */
export const LOGO_URL = `${SITE_URL}/icon-512.png`;
export const DEFAULT_OG_IMAGE = "/og/default.png";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

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
