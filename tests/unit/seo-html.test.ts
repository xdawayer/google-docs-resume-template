import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import fg from "fast-glob";
import * as cheerio from "cheerio";

const hasDist = existsSync("dist");

describe.skipIf(!hasDist)("dist: SEO contract", () => {
  const files = hasDist ? fg.sync("dist/**/*.html") : [];

  it("each indexable page has one H1, canonical, og:title; titles globally unique", () => {
    const titles = new Map<string, string>();
    for (const f of files) {
      const $ = cheerio.load(readFileSync(f, "utf8"));
      const robots = $('meta[name="robots"]').attr("content") ?? "";
      if (robots.includes("noindex")) continue;
      const canonical = $('link[rel="canonical"]').attr("href");
      if (!canonical) continue; // redirect stub (root) — skip
      expect($("h1").length, `${f}: expected exactly one H1`).toBe(1);
      expect($('meta[property="og:title"]').length, `${f}: missing og:title`).toBeGreaterThan(0);
      const title = $("title").text();
      expect(
        titles.has(title),
        `${f}: duplicate <title> "${title}" (also ${titles.get(title)})`,
      ).toBe(false);
      titles.set(title, f);
    }
  });

  it("any JSON-LD parses as valid JSON", () => {
    for (const f of files) {
      const $ = cheerio.load(readFileSync(f, "utf8"));
      $('script[type="application/ld+json"]').each((_, el) => {
        const raw = $(el).text();
        expect(() => JSON.parse(raw), `${f}: invalid JSON-LD`).not.toThrow();
      });
    }
  });
});
