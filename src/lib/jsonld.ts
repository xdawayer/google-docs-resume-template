/**
 * JSON-LD builders (D11/E11). Pure. `serializeJsonLd` escapes `<` so a value can
 * never break out of the <script> tag. ItemList numberOfItems is derived from the
 * SAME array the cards render from (D11: keep schema in sync with the page).
 */
export function serializeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export interface ListItem {
  name: string;
  url: string;
}

export function itemListSchema(items: ListItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: it.url,
    })),
  };
}

export function breadcrumbSchema(crumbs: ListItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

export interface CreativeWorkInput {
  name: string;
  url: string;
  description: string;
  image?: string;
  dateModified?: string;
}

// No aggregateRating / no numeric score (T2): trust is a checklist, not a number.
export function creativeWorkSchema(t: CreativeWorkInput) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: t.name,
    url: t.url,
    description: t.description,
    ...(t.image ? { image: t.image } : {}),
    ...(t.dateModified ? { dateModified: t.dateModified } : {}),
    isAccessibleForFree: true,
  };
}

export interface FaqEntry {
  q: string;
  a: string;
}

export function faqSchema(faq: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
