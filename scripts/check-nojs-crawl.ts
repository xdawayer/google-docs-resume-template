/**
 * Post-build no-JS crawl gate (E4/D4). The hub's RAW HTML must contain every
 * published template's card AND an internal <a> to its detail page — proving the
 * grid is server-rendered and crawlable with JS off (the island only enhances).
 * With zero published templates this passes trivially; it bites once content lands.
 */
import { readFileSync, existsSync } from "node:fs";
import * as cheerio from "cheerio";
import { templatePath } from "../src/lib/routes";

interface RouteEntry {
  path: string;
  type: string;
}

const HUB = "dist/google-docs-resume-template/index.html";
const MANIFEST = "src/generated/route-manifest.json";

function main(): void {
  if (!existsSync(HUB)) {
    console.error(`✗ check-nojs-crawl: hub not built at ${HUB}`);
    process.exit(1);
  }
  const $ = cheerio.load(readFileSync(HUB, "utf8"));
  const errors: string[] = [];

  // grid container must be server-rendered
  if ($("#templateGrid").length === 0) errors.push("hub missing #templateGrid in raw HTML");

  const routes: RouteEntry[] = existsSync(MANIFEST)
    ? (JSON.parse(readFileSync(MANIFEST, "utf8")) as RouteEntry[])
    : [];
  const detailSlugs = routes
    .filter((r) => r.type === "detail")
    .map((r) => r.path.split("/").filter(Boolean).pop() ?? "");

  const cards = $(".template-card").length;
  if (cards !== detailSlugs.length) {
    errors.push(
      `hub renders ${cards} cards but manifest has ${detailSlugs.length} published detail pages`,
    );
  }
  for (const slug of detailSlugs) {
    if ($(`a[href="${templatePath(slug)}"]`).length === 0) {
      errors.push(`hub missing internal link to ${templatePath(slug)} (not crawlable without JS)`);
    }
  }
  // no card may link straight to a Google Docs URL (must go through /go)
  if ($('.template-card a[href*="docs.google.com"]').length > 0) {
    errors.push("a card links directly to docs.google.com (must route through /go/{slug})");
  }

  if (errors.length) {
    console.error(`\n✗ check-nojs-crawl: ${errors.length} issue(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(
    `✓ check-nojs-crawl: hub crawlable, ${cards} card(s) in raw HTML, no direct Google links`,
  );
}

main();
