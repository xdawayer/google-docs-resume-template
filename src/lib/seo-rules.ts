/**
 * SEO guardrails (E5). Pure + unit-tested. Enforces the canonical graph rules:
 *   - reserved-word + duplicate slug integrity,
 *   - a listing (category/role) page is indexable ONLY when it carries enough
 *     unique content to not be a doorway/near-duplicate page.
 */
const RESERVED = new Set(["category", "role", "go", "og", "api", "robots.txt", "sitemap", "404"]);

export function assertSlugIntegrity(slugs: string[]): void {
  const seen = new Set<string>();
  for (const s of slugs) {
    if (RESERVED.has(s)) throw new Error(`slug "${s}" collides with a reserved route`);
    if (seen.has(s)) throw new Error(`duplicate slug "${s}"`);
    seen.add(s);
  }
}

export interface ListingIndexInput {
  optedIn: boolean;
  itemCount: number;
  introChars: number;
  faqCount: number;
}

/**
 * A listing page is indexable only if it was explicitly opted in AND has unique
 * substance: >=6 items, a >=600-char unique intro, and >=3 FAQs. Otherwise it
 * renders `noindex,follow` so thin facets don't become doorway pages.
 */
export function isListingIndexable(i: ListingIndexInput): boolean {
  return i.optedIn && i.itemCount >= 6 && i.introChars >= 600 && i.faqCount >= 3;
}

export function robotsContent(indexable: boolean): string {
  return indexable ? "index,follow" : "noindex,follow";
}
