/**
 * Shared shape + builder for the /go redirect map (E2). Pure so it's unit-tested
 * without fs. The edge function (functions/go/[slug].ts) consumes the generated
 * functions/_data/go-map.json; scripts/gen-go-map.ts writes it.
 */
import type { LinkHealth, HealthMap } from "./health";
import { getHealth } from "./health";

export interface GoEntry {
  /** real Google Docs /copy URL */
  copyUrl: string;
  /** latest known health; the edge function degrades unavailable to the detail page */
  status: LinkHealth;
}

export type GoMap = Record<string, GoEntry>;

export interface TemplateLite {
  slug: string;
  /** undefined for builder templates (no Doc copy) — they get no /go entry */
  copyUrl?: string;
  status: "draft" | "published";
}

/**
 * Build the go-map from templates + health. Rules:
 *  - placeholder copy URLs are dropped (never redirect to a placeholder),
 *  - only published templates get a /go entry (drafts aren't linkable),
 *  - health is stamped so the edge function can degrade at request time.
 */
export function buildGoMap(templates: TemplateLite[], health: HealthMap): GoMap {
  const map: GoMap = {};
  for (const t of templates) {
    if (t.status !== "published") continue;
    if (!t.copyUrl || t.copyUrl.includes("REPLACE_WITH_")) continue;
    map[t.slug] = { copyUrl: t.copyUrl, status: getHealth(health, t.slug) };
  }
  return map;
}
