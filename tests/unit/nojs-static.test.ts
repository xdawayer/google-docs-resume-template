import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import * as cheerio from "cheerio";

// Parses the built dist/ (E4/D4). Skips if no build is present (run `pnpm build`
// first; CI and `pnpm verify` always build before test).
const HUB = "dist/google-docs-resume-template/index.html";
const hasDist = existsSync(HUB);

describe.skipIf(!hasDist)("dist: no-JS / static HTML contract", () => {
  it("hub server-renders #templateGrid", () => {
    const $ = cheerio.load(readFileSync(HUB, "utf8"));
    expect($("#templateGrid").length).toBe(1);
  });

  it("no card links directly to docs.google.com (must route through /go)", () => {
    const $ = cheerio.load(readFileSync(HUB, "utf8"));
    expect($('.template-card a[href*="docs.google.com"]').length).toBe(0);
  });

  it("every rendered card has an internal detail link (crawlable without JS)", () => {
    const $ = cheerio.load(readFileSync(HUB, "utf8"));
    $(".template-card").each((_, el) => {
      const hasInternal = $(el).find('a[href^="/google-docs-resume-template/"]').length > 0;
      expect(hasInternal).toBe(true);
    });
  });

  it("404 is noindex", () => {
    if (!existsSync("dist/404.html")) return;
    const $ = cheerio.load(readFileSync("dist/404.html", "utf8"));
    expect($('meta[name="robots"]').attr("content") ?? "").toContain("noindex");
  });
});
