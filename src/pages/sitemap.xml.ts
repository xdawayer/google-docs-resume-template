import type { APIRoute } from "astro";
import { SITE_URL } from "@lib/site";

// /sitemap.xml — conventional alias for the sitemap entrypoint. @astrojs/sitemap
// emits the index as sitemap-index.xml (and the URL set as sitemap-0.xml), so a
// bare /sitemap.xml would 404. A Cloudflare Pages `_redirects` 200-rewrite to the
// static .xml is NOT honored, so we emit a real static file here instead: an
// identical sitemapindex pointing at the same sitemap-0.xml. This keeps
// sitemap-0.xml as the single generated source of truth (no URL list to drift)
// while making /sitemap.xml resolvable — e.g. for Search Console submission.
export const GET: APIRoute = () => {
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    `<sitemap><loc>${SITE_URL}/sitemap-0.xml</loc></sitemap>` +
    `</sitemapindex>`;
  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
};
