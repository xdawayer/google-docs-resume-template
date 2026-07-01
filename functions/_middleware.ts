// Cloudflare Pages root middleware — canonical host guard (Path B 任务 G ①).
//
// Problem it fixes: www.googledocsresumetemplate.com served pages with HTTP 200
// instead of 301-ing to the apex, so every page was reachable under two
// hostnames (duplicate-content risk; canonical tags mitigated it but a clean
// 301 saves crawl budget and keeps www out of the index entirely).
//
// Why here and not in public/_redirects: Cloudflare Pages `_redirects` is
// path-based — the www and apex domains hit the SAME rules file, so it cannot
// tell the hostnames apart. A root middleware runs before any static asset or
// other function and is the only in-repo place to normalize the host.
//
// Lives outside src/ — built by Cloudflare, not by Astro / tsc, so it uses a
// minimal structural context type (matching functions/[code].ts).

interface MiddlewareContext {
  request: Request;
  next: () => Promise<Response>;
}

// The one true origin host. Keep in sync with SITE_URL in src/lib/site.ts.
const CANONICAL_HOST = "googledocsresumetemplate.com";

/**
 * Returns the 301 target when `rawUrl` is on the `www.` host, else null.
 * Only the hostname changes — path, query and protocol are preserved.
 * Apex, *.pages.dev preview deploys and localhost pass through untouched so
 * preview/dev environments keep working.
 */
export function canonicalHostRedirect(rawUrl: string): string | null {
  const url = new URL(rawUrl);
  if (url.hostname !== `www.${CANONICAL_HOST}`) return null;
  url.hostname = CANONICAL_HOST;
  return url.toString();
}

export const onRequest = async (ctx: MiddlewareContext): Promise<Response> => {
  const target = canonicalHostRedirect(ctx.request.url);
  if (target) return Response.redirect(target, 301);
  return ctx.next();
};
