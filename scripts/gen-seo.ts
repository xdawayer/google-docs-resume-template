/**
 * Emit the route manifest + SEO report from published templates (E11-core/T6).
 * Offline, runs in prebuild. The manifest is the single source the sitemap
 * cross-check (check-sitemap) and the no-JS crawl check read.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { templateSchema } from "../src/content/schema";
import { loadRawTemplates } from "./_shared";
import { assertSlugIntegrity } from "../src/lib/seo-rules";
import { templatePath, categoryPath, rolePath, hubPath } from "../src/lib/routes";

interface RouteEntry {
  path: string;
  type: "hub" | "detail" | "category" | "role";
  indexable: boolean;
}

const OUT_DIR = "src/generated";

function main(): void {
  const raws = loadRawTemplates();
  const published = raws
    .map((r) => templateSchema.safeParse(r.data))
    .filter((res): res is Extract<typeof res, { success: true }> => res.success)
    .map((res) => res.data)
    .filter((t) => t.status === "published");

  assertSlugIntegrity(published.map((t) => t.slug));

  const categories = [...new Set(published.flatMap((t) => t.category))];
  const roles = [...new Set(published.flatMap((t) => t.roles))].filter((r) => r !== "general");

  const routes: RouteEntry[] = [
    { path: hubPath(), type: "hub", indexable: true },
    ...published.map((t): RouteEntry => ({ path: templatePath(t.slug), type: "detail", indexable: true })),
    // listing pages default to noindex until they carry unique content (E5)
    ...categories.map((c): RouteEntry => ({ path: categoryPath(c), type: "category", indexable: false })),
    ...roles.map((r): RouteEntry => ({ path: rolePath(r), type: "role", indexable: false })),
  ];

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(`${OUT_DIR}/route-manifest.json`, JSON.stringify(routes, null, 2) + "\n");
  writeFileSync(
    `${OUT_DIR}/seo-report.json`,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        published: published.length,
        indexableRoutes: routes.filter((r) => r.indexable).length,
        categories: categories.length,
        roles: roles.length,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`✓ gen-seo: ${routes.length} routes (${routes.filter((r) => r.indexable).length} indexable)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
