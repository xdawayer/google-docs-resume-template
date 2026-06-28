import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRawTemplates } from "../../scripts/_shared";

// Locks the M7-7a contract: `*.draft.md` scaffolds (written by
// scripts/new-template.mjs) are excluded from the shared template enumeration,
// so unfinished drafts never reach validate-content / gen-seo / gen-go-map /
// check-assets. Mirrors the negated glob in src/content.config.ts.
const FIXTURES = resolve(dirname(fileURLToPath(import.meta.url)), "../fixtures/draft-exclusion");

describe("loadRawTemplates draft exclusion", () => {
  it("includes .md files but skips .draft.md scaffolds", () => {
    const slugs = loadRawTemplates(FIXTURES).map((t) => t.fileSlug);
    expect(slugs).toContain("keep");
    expect(slugs).not.toContain("skip.draft");
    expect(slugs).not.toContain("skip");
  });

  it("returns only the non-draft file", () => {
    expect(loadRawTemplates(FIXTURES)).toHaveLength(1);
  });
});
