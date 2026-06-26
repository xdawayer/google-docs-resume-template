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

/** Load every template .md as raw frontmatter + body (no schema applied yet). */
export function loadRawTemplates(dir: string = TEMPLATES_DIR): RawTemplate[] {
  const files = fg.sync("**/*.md", { cwd: dir, absolute: true }).sort();
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
