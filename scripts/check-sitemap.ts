/**
 * Post-build sitemap sanity (E11-core). Asserts a sitemap exists, includes the
 * hub, and excludes the /go redirect surface and 404. (Full indexable-set diff
 * hardens in M6.)
 */
import { readFileSync } from "node:fs";
import fg from "fast-glob";

function main(): void {
  const indexes = fg.sync("dist/sitemap*.xml");
  if (indexes.length === 0) {
    console.error("✗ check-sitemap: no sitemap*.xml in dist");
    process.exit(1);
  }
  const xml = indexes.map((f) => readFileSync(f, "utf8")).join("\n");
  const errors: string[] = [];
  if (xml.includes("/go/")) errors.push("sitemap contains /go/ redirect URLs (must be excluded)");
  if (xml.includes("/404")) errors.push("sitemap contains /404");
  if (!xml.includes("/google-docs-resume-template/")) errors.push("sitemap missing the hub URL");
  if (errors.length) {
    console.error(`\n✗ check-sitemap: ${errors.length} issue(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`✓ check-sitemap: ${indexes.length} file(s), hub present, /go + /404 excluded`);
}

main();
