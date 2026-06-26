import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { templateSchema } from "./content/schema";

// Templates are Markdown + YAML frontmatter (Decision #1): each detail page
// needs unique long-form prose in the body, which JSON can't carry.
const templates = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/templates" }),
  schema: templateSchema,
});

export const collections = { templates };
