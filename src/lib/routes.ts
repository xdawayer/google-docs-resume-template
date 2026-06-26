import { BASE } from "./site";

/** Route helpers + the role-page cap (T3). Pure. */
export const ROLE_CAP = 5;

export function templatePath(slug: string): string {
  return `${BASE}/${slug}/`;
}
export function categoryPath(category: string): string {
  return `${BASE}/category/${category}/`;
}
export function rolePath(role: string): string {
  return `${BASE}/role/${role}/`;
}
export function hubPath(): string {
  return `${BASE}/`;
}

export interface RoleCandidate {
  role: string;
  trafficPotential: number;
}

/**
 * T3 guard: at most ROLE_CAP role pages, each with >=500 traffic potential.
 * Throws at build time if violated so thin role pages can't ship.
 */
export function assertRoleCap(candidates: RoleCandidate[]): void {
  if (candidates.length > ROLE_CAP) {
    throw new Error(`role pages: ${candidates.length} > cap ${ROLE_CAP} (T3 — keep it lean)`);
  }
  for (const c of candidates) {
    if (c.trafficPotential < 500) {
      throw new Error(`role "${c.role}" has trafficPotential ${c.trafficPotential} < 500 (T3 — verify demand)`);
    }
  }
}
