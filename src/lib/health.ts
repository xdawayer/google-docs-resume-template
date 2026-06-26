import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Copy-link health (D2/E1). The scheduled monitor (scripts/check-links.ts)
 * writes data/copy_link_health.json OFF the deploy path; the build reads it so a
 * known-dead Doc renders a degraded CTA instead of a live link to a dead page.
 */
export type LinkHealth = "available" | "unavailable" | "checking" | "unverified";

export interface HealthRecord {
  status: LinkHealth;
  lastCheckedAt?: string;
  consecutiveFailures?: number;
  reason?: string;
}

export type HealthMap = Record<string, HealthRecord>;

export const HEALTH_PATH = "data/copy_link_health.json";

export function loadHealthMap(path: string = HEALTH_PATH): HealthMap {
  const abs = resolve(process.cwd(), path);
  if (!existsSync(abs)) return {};
  try {
    return JSON.parse(readFileSync(abs, "utf8")) as HealthMap;
  } catch {
    return {};
  }
}

export function getHealth(map: HealthMap, slug: string): LinkHealth {
  return map[slug]?.status ?? "unverified";
}

/** Build-time guard — a placeholder copy URL must never ship (E3 backstop). */
export function assertNoPlaceholder(copyUrl: string): void {
  if (copyUrl.includes("REPLACE_WITH_")) {
    throw new Error(`placeholder copyUrl shipped: ${copyUrl}`);
  }
}

/**
 * CTA state for a template. Decision: a primary "Copy in Google Docs" CTA renders
 * ONLY when the latest health check says `available` — never on unverified
 * (don't render a healthy CTA without a passing check). Otherwise degrade to the
 * Word download if present, else a disabled "being updated" state.
 */
export type CtaState = "copy" | "word" | "disabled";

export function ctaState(status: LinkHealth, hasWordFallback: boolean): CtaState {
  if (status === "available") return "copy";
  return hasWordFallback ? "word" : "disabled";
}
