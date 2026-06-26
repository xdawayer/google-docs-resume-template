import type { APIRoute } from "astro";
import { SITE_URL } from "@lib/site";

// Dynamic robots (E11-core). /go/* is a redirect surface — keep it out of the index.
export const GET: APIRoute = () =>
  new Response(`User-agent: *\nDisallow: /go/\nSitemap: ${SITE_URL}/sitemap-index.xml\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
