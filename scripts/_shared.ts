import fg from "fast-glob";
import matter from "gray-matter";
import { readFileSync } from "node:fs";
import { basename } from "node:path";

export const TEMPLATES_DIR = "src/content/templates";

export interface RawTemplate {
  /** filename without .md — must match frontmatter `slug` */
  fileSlug: string;
  filepath: string;
  relpath: string;
  data: Record<string, unknown>;
  body: string;
}

/**
 * Load every template .md as raw frontmatter + body (no schema applied yet).
 *
 * `*.draft.md` files are scaffolded by `scripts/new-template.mjs` and are
 * EXCLUDED by default so unfinished templates never reach the offline gates.
 * This is the single enumeration point shared by validate-content / gen-seo /
 * gen-go-map / check-assets, so the exclusion is consistent across the whole
 * build path. It mirrors the negated pattern in `src/content.config.ts`.
 *
 * `includeDrafts` is used only by the release-readiness gate (e2e-gate), which
 * needs to SEE drafts in order to report them as not-yet-ready.
 */
export function loadRawTemplates(
  dir: string = TEMPLATES_DIR,
  opts: { includeDrafts?: boolean } = {},
): RawTemplate[] {
  const ignore = opts.includeDrafts ? [] : ["**/*.draft.md"];
  const files = fg.sync("**/*.md", { cwd: dir, absolute: true, ignore }).sort();
  return files.map((filepath) => {
    const parsed = matter(readFileSync(filepath, "utf8"));
    return {
      fileSlug: basename(filepath, ".md"),
      filepath,
      relpath: `${dir}/${basename(filepath)}`,
      data: parsed.data as Record<string, unknown>,
      body: parsed.content,
    };
  });
}
