import type { APIRoute } from "astro";
import { SITE_URL } from "@lib/site";

// Dynamic robots (E11-core + GEO). /go/* is a redirect surface — keep it out of
// the index. We explicitly WELCOME the major AI/answer-engine crawlers so the
// content is eligible to be cited in AI answers (Generative Engine Optimization);
// they inherit the same /go/ disallow as everyone else via the catch-all rules.
const AI_AGENTS = [
  "GPTBot", // OpenAI training
  "OAI-SearchBot", // ChatGPT search
  "ChatGPT-User", // ChatGPT browsing
  "ClaudeBot", // Anthropic
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot", // Perplexity
  "Perplexity-User",
  "Google-Extended", // Gemini / Vertex grounding
  "Applebot-Extended", // Apple Intelligence
  "Amazonbot",
  "Bytespider",
  "CCBot", // Common Crawl (feeds many LLMs)
  "cohere-ai",
  "Meta-ExternalAgent",
  "DuckAssistBot",
];

export const GET: APIRoute = () => {
  const aiStanzas = AI_AGENTS.map((ua) => `User-agent: ${ua}\nAllow: /\nDisallow: /go/`).join(
    "\n\n",
  );
  const body = [
    "# Everyone (search + AI crawlers): full access except the redirect surface.",
    "User-agent: *",
    "Allow: /",
    "Disallow: /go/",
    "",
    "# Explicitly welcome AI / answer-engine crawlers (GEO).",
    aiStanzas,
    "",
    `Sitemap: ${SITE_URL}/sitemap-index.xml`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
