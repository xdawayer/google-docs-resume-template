/**
 * Post-build canonical correctness (E5). Every indexable dist page must
 * self-canonical to SITE_URL + its own trailing-slash path. noindex pages and
 * redirect stubs are skipped.
 */
import { readFileSync } from "node:fs";
import fg from "fast-glob";
import * as cheerio from "cheerio";
import { SITE_URL } from "../src/lib/site";

function pathFromDist(file: string): string {
  // dist/google-docs-resume-template/index.html -> /google-docs-resume-template/
  const rel = file.replace(/^dist/, "").replace(/index\.html$/, "");
  return rel.endsWith("/") ? rel : `${rel}/`;
}

function main(): void {
  const files = fg.sync("dist/**/*.html");
  const errors: string[] = [];
  for (const file of files) {
    const $ = cheerio.load(readFileSync(file, "utf8"));
    const robots = $('meta[name="robots"]').attr("content") ?? "";
    if (robots.includes("noindex")) continue;
    const canonical = $('link[rel="canonical"]').attr("href");
    if (!canonical) continue; // redirect stub / no canonical → skip
    const expected = `${SITE_URL}${pathFromDist(file)}`;
    if (canonical !== expected) errors.push(`${file}: canonical "${canonical}" != "${expected}"`);
  }
  if (errors.length) {
    console.error(`\n✗ check-canonical: ${errors.length} mismatch(es):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`✓ check-canonical: ${files.length} page(s), all self-canonical`);
}

main();
