// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

import svelte from "@astrojs/svelte";

// Single source of truth for the production origin. No trailing slash, no www.
const SITE_URL = process.env.SITE_URL ?? "https://googledocsresumetemplate.com";

// Decision #9: "/" 301-redirects to the hub; the hub IS the collection page.
// Decision: trailingSlash 'always' + directory build format are pinned and
// every canonical/sitemap/test assumes them.
export default defineConfig({
  site: SITE_URL,
  output: "static",
  trailingSlash: "always",
  build: { format: "directory" },
  // Dev-server redirect; production redirect is also emitted to public/_redirects
  // (Cloudflare) so the 301 holds at the edge, not just in dev.
  redirects: {
    "/": "/google-docs-resume-template/",
  },
  integrations: [
    sitemap({
      // /go/* is a redirect surface (noindex) and 404 must never be in the map.
      filter: (page) => !page.includes("/go/") && !page.includes("/404"),
    }),
    svelte(),
  ],
  vite: {
    build: {
      // Never inline assets — we want stable hashed files + accurate byte budgets.
      assetsInlineLimit: 0,
    },
  },
});
