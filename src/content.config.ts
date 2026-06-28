import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { templateSchema } from "./content/schema";

// Templates are Markdown + YAML frontmatter (Decision #1): each detail page
// needs unique long-form prose in the body, which JSON can't carry.
//
// `*.draft.md` files (scaffolded by scripts/new-template.mjs) are excluded via
// the negated pattern until a human authors the Google Doc and promotes the
// file by renaming `.draft.md` -> `.md`. Mirrors the ignore in scripts/_shared.ts.
const templates = defineCollection({
  loader: glob({ pattern: ["**/*.md", "!**/*.draft.md"], base: "./src/content/templates" }),
  schema: templateSchema,
});

export const collections = { templates };
