import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { templatePath, hubPath } from "@lib/routes";
import { absoluteUrl, BRAND, BRAND_DESCRIPTION, SITE_URL } from "@lib/site";
import type { Template } from "@/content/schema";

type Entry = CollectionEntry<"templates">;

// llms.txt (GEO) — a compact, link-first map of the site for AI answer engines,
// following the llmstxt.org convention. Generated from the SAME published
// collection the site renders, so it never drifts from what's live.
export const GET: APIRoute = async () => {
  const published = (
    await getCollection("templates", ({ data }: Entry) => data.status === "published")
  ).sort((a: Entry, b: Entry) =>
    (a.data as Template).name.localeCompare((b.data as Template).name),
  );

  const lines = (e: Entry) => {
    const t = e.data as Template;
    return `- [${t.name} resume template](${absoluteUrl(templatePath(t.slug))}): ${t.seo.metaDescription}`;
  };

  const body = [
    `# ${BRAND}`,
    "",
    `> ${BRAND_DESCRIPTION}`,
    "",
    "Every template is free, needs no signup, and exports a selectable-text PDF that applicant tracking systems (ATS) can read. Templates are either copied straight into Google Docs or built in a private, in-browser editor (no data leaves the device).",
    "",
    "## Key pages",
    "",
    `- [Template directory](${absoluteUrl(hubPath())}): Browse all free Google Docs resume templates, filter by style or role.`,
    `- [Resume builder](${SITE_URL}/resume-builder/): Free, in-browser editor — fill in your details, pick a template, download an ATS-ready PDF. No signup.`,
    "",
    "## Resume templates",
    "",
    ...published.map(lines),
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
