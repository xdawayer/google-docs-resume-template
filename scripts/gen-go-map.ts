/**
 * Generate functions/_data/go-map.json from published templates + link health.
 * Runs in prebuild (offline) so the edge function always ships a current map.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { templateSchema } from "../src/content/schema";
import { loadRawTemplates } from "./_shared";
import { loadHealthMap } from "../src/lib/health";
import { buildGoMap, type TemplateLite } from "../src/lib/go-map";

const OUT = "functions/_data/go-map.json";

function main(): void {
  const raws = loadRawTemplates();
  const templates: TemplateLite[] = [];
  for (const r of raws) {
    const res = templateSchema.safeParse(r.data);
    if (!res.success) continue; // validate-content reports schema errors
    templates.push({ slug: res.data.slug, copyUrl: res.data.copyUrl, status: res.data.status });
  }
  const map = buildGoMap(templates, loadHealthMap());
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(map, null, 2) + "\n");
  console.log(`✓ gen-go-map: ${Object.keys(map).length} published redirect(s) → ${OUT}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
